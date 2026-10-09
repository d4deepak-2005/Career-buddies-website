import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { isRealDate } from '../../domain/recurrence';
import { Transaction } from '../../models/Transaction';
import { AppError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { amountMinor, objectIdString } from '../transactions/transactions.schemas';
import * as svc from '../transactions/transactions.service';
import { loadCalculation } from './financials.service';

const dateString = z.string().refine(isRealDate, 'Enter a valid date (YYYY-MM-DD)');

export const recordSchema = z.object({
  payerFounderId: objectIdString,
  receiverFounderId: objectIdString,
  amountMinor,
  transactionDate: dateString,
  method: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
  clientRequestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
}).strict();

/**
 * Guided "record a settlement payment". A suggestion is NOT a payment: this creates a PENDING settlement transaction that
 * only counts once it is approved (the confirmation). Guard rails (the generic Add Transaction form stays flexible and the
 * engine flags any over-settlement it produces):
 *  - payer and receiver differ (also enforced by the transaction rules);
 *  - the amount cannot exceed what the payer still owes / the receiver is still due, after counting settlements already awaiting approval;
 *  - an identical pending settlement (same payer, receiver, amount, date) is rejected as a duplicate.
 */
export function mountRecordSettlement(router: Router): void {
  router.post('/record', authenticate, validate(recordSchema), asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof recordSchema>;
    if (b.payerFounderId === b.receiverFounderId) throw new AppError(400, 'VALIDATION_ERROR', 'Payer and receiver must be different founders', [{ path: 'receiverFounderId', message: 'Choose a different receiving founder' }]);
    const l = await loadCalculation();
    const pending = l.stored.filter((t) => t.type === 'settlement' && (t.status === 'draft' || t.status === 'pending_approval'));
    const dup = pending.find((t) => String(t.paidByFounderId) === b.payerFounderId && String(t.counterpartyFounderId) === b.receiverFounderId && t.amountMinor === b.amountMinor && t.transactionDate.toISOString().slice(0, 10) === b.transactionDate);
    const isReplay = !!b.clientRequestId && !!(await Transaction.exists({ createdBy: req.auth!.id, clientRequestId: b.clientRequestId }));
    if (isReplay) {
      const prior = await Transaction.findOne({ createdBy: req.auth!.id, clientRequestId: b.clientRequestId }).lean();
      const [h] = await svc.hydrate([prior as never]);
      res.status(200).json({ transaction: h, replayed: true });
      return;
    }
    if (dup) throw new AppError(409, 'DUPLICATE_SETTLEMENT', `An identical settlement (${dup.txnNumber}) is already awaiting approval`, { existingId: String(dup._id) });
    const payer = l.result.founders.find((f) => f.founderId === b.payerFounderId);
    const receiver = l.result.founders.find((f) => f.founderId === b.receiverFounderId);
    if (!payer || !receiver) throw new AppError(400, 'VALIDATION_ERROR', 'Founder does not exist', [{ path: 'payerFounderId', message: 'Unknown founder' }]);
    const pendingOut = pending.filter((t) => String(t.paidByFounderId) === b.payerFounderId).reduce((s, t) => s + t.amountMinor, 0);
    const pendingIn = pending.filter((t) => String(t.counterpartyFounderId) === b.receiverFounderId).reduce((s, t) => s + t.amountMinor, 0);
    const remainingMinor = Math.min(Math.max(payer.outstandingPayableMinor - pendingOut, 0), Math.max(receiver.outstandingReceivableMinor - pendingIn, 0));
    if (b.amountMinor > remainingMinor) {
      throw new AppError(400, 'EXCEEDS_OUTSTANDING', remainingMinor === 0
        ? 'There is nothing left to settle between these founders (counting settlements already awaiting approval)'
        : 'This payment is larger than the amount still owed', [{ path: 'amountMinor', code: 'EXCEEDS_OUTSTANDING', message: 'Amount is larger than the amount still owed', remainingMinor }]);
    }
    const tx = await svc.createTransaction({
      type: 'settlement', amountMinor: b.amountMinor, transactionDate: b.transactionDate, description: `Settlement: ${payer.founderName} pays ${receiver.founderName}`,
      paidByFounderId: b.payerFounderId, counterpartyFounderId: b.receiverFounderId, ...(b.method ? { method: b.method } : {}), ...(b.notes ? { notes: b.notes } : {}),
    }, 'pending_approval', req.auth!, { clientRequestId: b.clientRequestId });
    const [hydrated] = await svc.hydrate([await svc.loadOr404(String(tx._id))]);
    res.status(tx.replayed ? 200 : 201).json({ transaction: hydrated, ...(tx.replayed ? { replayed: true } : {}) });
  }));
}
