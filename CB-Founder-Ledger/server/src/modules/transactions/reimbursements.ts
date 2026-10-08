/**
 * Option C — expense-linked reimbursement (product decision).
 *
 * A reimbursement is linked to exactly ONE approved business expense (`reimbursesTransactionId`) and must be paid
 * to the founder who paid that expense. The reimbursed portion is business-borne. The cumulative amount of active
 * (draft / pending / approved) reimbursements can never exceed the expense: capacity is RESERVED atomically on the
 * expense (`reimbursedMinor`), so two concurrent requests cannot both pass. The calculation engine never reads that
 * counter — it recomputes from the linked reimbursements.
 */
import { Types, trusted } from 'mongoose';
import { AppError } from '../../lib/errors';
import { Transaction, type TransactionDoc } from '../../models/Transaction';

/** Statuses whose reimbursements hold capacity on their expense. */
export const ACTIVE_REIMBURSEMENT_STATUSES = ['draft', 'pending_approval', 'approved'] as const;
export const isActiveReimbursementStatus = (s: string) => (ACTIVE_REIMBURSEMENT_STATUSES as readonly string[]).includes(s);

type Issue = { path: string; message: string; code?: string };
type Lean = TransactionDoc & { _id: Types.ObjectId };

/** Server-side checks on the linked expense. (The cap is enforced atomically by `reserveCapacity`.) */
export async function checkReimbursementTarget(content: { reimbursesTransactionId?: string | undefined; paidByFounderId?: string | undefined }): Promise<Issue[]> {
  const targetId = content.reimbursesTransactionId;
  if (!targetId) return []; // "link is required" is reported by the type rules
  const path = 'reimbursesTransactionId';
  const target = await Transaction.findById(targetId).select('type status paidByFounderId amountMinor').lean<Lean>();
  if (!target) return [{ path, code: 'UNKNOWN_TARGET', message: 'The linked expense does not exist' }];
  if (target.type !== 'business_expense') return [{ path, code: 'TARGET_NOT_EXPENSE', message: 'A reimbursement can only be linked to a Business Expense' }];
  if (target.status !== 'approved') return [{ path, code: 'TARGET_NOT_APPROVED', message: 'Only an approved expense can be reimbursed' }];
  if (!target.paidByFounderId) return [{ path, code: 'TARGET_NO_PAYER', message: 'The linked expense has no paying founder' }];
  if (content.paidByFounderId && String(target.paidByFounderId) !== content.paidByFounderId) {
    return [{ path: 'paidByFounderId', code: 'PAYER_MISMATCH', message: 'The reimbursed founder must be the founder who paid the linked expense' }];
  }
  return [];
}

/** Atomically reserve `amount` of the expense's capacity. False if the expense is not approved or the cap would be exceeded. */
export async function reserveCapacity(expenseId: string, amount: number): Promise<boolean> {
  // Raw driver on purpose: a single conditional update is what makes the cap race-free.
  const r = await Transaction.collection.updateOne(
    {
      _id: new Types.ObjectId(expenseId),
      type: 'business_expense',
      status: 'approved',
      $expr: { $lte: [{ $add: [{ $ifNull: ['$reimbursedMinor', 0] }, amount] }, '$amountMinor'] },
    },
    { $inc: { reimbursedMinor: amount } },
  );
  return r.modifiedCount === 1;
}

/** Give reserved capacity back (reimbursement voided, edited down/away, or a failed write was rolled back). */
export async function releaseCapacity(expenseId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  await Transaction.collection.updateOne({ _id: new Types.ObjectId(expenseId), reimbursedMinor: { $gte: amount } }, { $inc: { reimbursedMinor: -amount } });
}

/** 400 explaining the cap, with the amount that is still available. */
export async function capacityError(expenseId: string): Promise<AppError> {
  const e = await Transaction.findById(expenseId).select('amountMinor reimbursedMinor status').lean<Lean>();
  const remainingMinor = e ? Math.max(e.amountMinor - (e.reimbursedMinor ?? 0), 0) : 0;
  const message = e && e.status !== 'approved'
    ? 'Only an approved expense can be reimbursed'
    : 'This reimbursement would take the total reimbursed above the expense amount';
  return new AppError(400, 'REIMBURSEMENT_EXCEEDS_EXPENSE', message, [{ path: 'amountMinor', code: 'REIMBURSEMENT_EXCEEDS_EXPENSE', message, remainingMinor }]);
}

/** The capacity a reimbursement currently holds (draft / pending / approved reimbursements only). */
export function heldBy(tx: { type: string; status: string; reimbursesTransactionId?: unknown; amountMinor: number }): { expenseId: string; amount: number } | null {
  if (tx.type !== 'reimbursement' || !tx.reimbursesTransactionId || !isActiveReimbursementStatus(tx.status)) return null;
  return { expenseId: String(tx.reimbursesTransactionId), amount: tx.amountMinor };
}

export async function activeLinkedReimbursements(expenseId: string) {
  return Transaction.find({ reimbursesTransactionId: expenseId, status: trusted({ $in: ACTIVE_REIMBURSEMENT_STATUSES }) })
    .select('txnNumber amountMinor status transactionDate')
    .sort({ transactionDate: 1, _id: 1 })
    .lean<Lean[]>();
}

export function hasLinkedError(rows: Lean[]): AppError {
  return new AppError(409, 'HAS_LINKED_REIMBURSEMENTS', 'This expense has active reimbursements. Void the linked reimbursement(s) first, then void the expense.',
    rows.map((r) => ({ id: String(r._id), txnNumber: r.txnNumber, amountMinor: r.amountMinor, status: r.status })));
}

/** Approved expenses paid by a founder that still have reimbursable capacity (for the reimbursement picker). */
export async function listReimbursableExpenses(paidByFounderId: string, forReimbursementId?: string) {
  let ownExpenseId: string | undefined;
  let ownAmount = 0;
  if (forReimbursementId) {
    const own = await Transaction.findById(forReimbursementId).select('type status reimbursesTransactionId amountMinor').lean<Lean>();
    const held = own ? heldBy(own) : null;
    if (held) { ownExpenseId = held.expenseId; ownAmount = held.amount; }
  }
  const rows = await Transaction.find({ type: 'business_expense', status: 'approved', paidByFounderId })
    .select('txnNumber description transactionDate amountMinor reimbursedMinor')
    .sort({ transactionDate: -1, _id: -1 })
    .limit(100)
    .lean<Lean[]>();
  return rows
    .map((r) => {
      const reimbursedMinor = Math.max((r.reimbursedMinor ?? 0) - (String(r._id) === ownExpenseId ? ownAmount : 0), 0);
      return { id: String(r._id), txnNumber: r.txnNumber, description: r.description, transactionDate: r.transactionDate.toISOString().slice(0, 10), amountMinor: r.amountMinor, reimbursedMinor, remainingMinor: r.amountMinor - reimbursedMinor };
    })
    .filter((r) => r.remainingMinor > 0);
}
