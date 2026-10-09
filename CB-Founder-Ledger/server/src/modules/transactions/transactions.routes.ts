import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate, requireRole } from '../../middleware/auth';
import { writeRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { receiptsRouter } from '../receipts/receipts.routes';
import { activeLinkedReimbursements, listReimbursableExpenses } from './reimbursements';
import {
  contentSchema, createSchema, decisionBodySchema, idParams, listQuerySchema, patchSchema, previewSchema, reimbursableQuerySchema, versionOnlySchema, voidBodySchema,
  type TransactionContent,
} from './transactions.schemas';
import * as svc from './transactions.service';

export const transactionsRouter = Router();
transactionsRouter.use(authenticate);

const limitWrites: RequestHandler = (() => {
  let limiter: RequestHandler | undefined;
  return (req, res, next) => (limiter ??= writeRateLimiter())(req, res, next);
})();

const parseContent = (v: unknown): TransactionContent => {
  const r = contentSchema.safeParse(v);
  if (!r.success) throw new AppError(400, 'VALIDATION_ERROR', 'Transaction validation failed', r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  return r.data;
};

async function one(id: string) {
  const [tx] = await svc.hydrate([await svc.loadOr404(id)]);
  return tx;
}

transactionsRouter.get('/', validate(listQuerySchema, 'query'), asyncHandler(async (req, res) => {
  res.json(await svc.listTransactions(req.query as unknown as z.infer<typeof listQuerySchema>));
}));

// Live split preview for the form: validates and resolves a split definition without saving anything.
transactionsRouter.post('/split-preview', validate(previewSchema), asyncHandler(async (req, res) => {
  res.json(await svc.previewSplit(req.body as z.infer<typeof previewSchema>));
}));

// Option C: eligible expenses (approved, paid by this founder, still reimbursable) for the reimbursement picker.
transactionsRouter.get('/reimbursable-expenses', validate(reimbursableQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof reimbursableQuerySchema>;
  res.json({ expenses: await listReimbursableExpenses(q.paidByFounderId, q.forReimbursementId) });
}));

transactionsRouter.post('/', limitWrites, validate(createSchema), asyncHandler(async (req, res) => {
  const { status, clientRequestId, ...content } = req.body as z.infer<typeof createSchema>;
  const tx = await svc.createTransaction(content, status, req.auth!, { clientRequestId });
  res.status(tx.replayed ? 200 : 201).json({ transaction: await one(String(tx._id)), ...(tx.replayed ? { replayed: true } : {}) });
}));

transactionsRouter.get('/:id', validate(idParams, 'params'), asyncHandler(async (req, res) => {
  const transaction = await one((req.params as { id: string }).id);
  const linked = transaction!.type === 'business_expense'
    ? (await activeLinkedReimbursements(transaction!.id)).map((r) => ({ id: String(r._id), txnNumber: r.txnNumber, amountMinor: r.amountMinor, status: r.status, transactionDate: r.transactionDate.toISOString().slice(0, 10) }))
    : [];
  res.json({ transaction, receipts: await svc.receiptsFor(transaction!.id), linkedReimbursements: linked });
}));

transactionsRouter.get('/:id/split', validate(idParams, 'params'), asyncHandler(async (req, res) => {
  const tx = await one((req.params as { id: string }).id);
  res.json({ transactionId: tx!.id, amountMinor: tx!.amountMinor, split: tx!.split });
}));

transactionsRouter.get('/:id/history', validate(idParams, 'params'), asyncHandler(async (req, res) => {
  res.json({ history: await svc.listHistory((req.params as { id: string }).id) });
}));

transactionsRouter.patch('/:id', limitWrites, validate(idParams, 'params'), validate(patchSchema), asyncHandler(async (req, res) => {
  const tx = await svc.updateTransaction((req.params as { id: string }).id, req.body as z.infer<typeof patchSchema>, req.auth!, parseContent);
  res.json({ transaction: await one(String(tx._id)) });
}));

transactionsRouter.post('/:id/submit', limitWrites, validate(idParams, 'params'), validate(versionOnlySchema), asyncHandler(async (req, res) => {
  const tx = await svc.submitTransaction((req.params as { id: string }).id, (req.body as z.infer<typeof versionOnlySchema>).expectedVersion, req.auth!);
  res.json({ transaction: await one(String(tx._id)) });
}));

// Approval workflow (Product Plan §11): any signed-in founder/admin may decide; self-approval follows Settings → Approval rules.
transactionsRouter.post('/:id/approve', limitWrites, validate(idParams, 'params'), validate(decisionBodySchema), asyncHandler(async (req, res) => {
  const b = req.body as z.infer<typeof decisionBodySchema>;
  const tx = await svc.decideTransaction((req.params as { id: string }).id, b.expectedVersion, 'approved', b.comment, req.auth!);
  res.json({ transaction: await one(String(tx._id)) });
}));
transactionsRouter.post('/:id/reject', limitWrites, validate(idParams, 'params'), validate(decisionBodySchema), asyncHandler(async (req, res) => {
  const b = req.body as z.infer<typeof decisionBodySchema>;
  const tx = await svc.decideTransaction((req.params as { id: string }).id, b.expectedVersion, 'rejected', b.comment, req.auth!);
  res.json({ transaction: await one(String(tx._id)) });
}));

// Reversal is admin-only and never deletes: the record stays, flagged voided, with reason and actor.
transactionsRouter.post('/:id/void', limitWrites, requireRole('admin'), validate(idParams, 'params'), validate(voidBodySchema), asyncHandler(async (req, res) => {
  const b = req.body as z.infer<typeof voidBodySchema>;
  const tx = await svc.voidTransaction((req.params as { id: string }).id, b.expectedVersion, b.reason, req.auth!);
  res.json({ transaction: await one(String(tx._id)) });
}));

transactionsRouter.delete('/:id', (_req, res) => {
  res.setHeader('Allow', 'GET, PATCH');
  res.status(405).json({ error: { code: 'HARD_DELETE_DISABLED', message: 'Transactions cannot be deleted. Use void to reverse a transaction.' } });
});

transactionsRouter.use('/:id/receipts', receiptsRouter);
