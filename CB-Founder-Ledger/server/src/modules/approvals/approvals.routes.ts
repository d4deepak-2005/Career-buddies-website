import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Transaction } from '../../models/Transaction';
import * as svc from '../transactions/transactions.service';

const querySchema = z.object({
  status: z.enum(['pending_approval', 'approved', 'rejected']).default('pending_approval'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const approvalsRouter = Router();
approvalsRouter.use(authenticate);

/** Approvals inbox: the three tabs with their counts. Decisions themselves use POST /api/transactions/:id/approve|reject. */
approvalsRouter.get('/', validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof querySchema>;
  const [list, grouped] = await Promise.all([
    svc.listTransactions({ status: q.status, sort: 'createdAt', order: q.status === 'pending_approval' ? 'asc' : 'desc', page: q.page, pageSize: q.pageSize }),
    Transaction.aggregate<{ _id: string; n: number }>([{ $match: { status: { $in: ['pending_approval', 'approved', 'rejected'] } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const n = (s: string) => grouped.find((g) => g._id === s)?.n ?? 0;
  res.json({ ...list, counts: { pending_approval: n('pending_approval'), approved: n('approved'), rejected: n('rejected') } });
}));
