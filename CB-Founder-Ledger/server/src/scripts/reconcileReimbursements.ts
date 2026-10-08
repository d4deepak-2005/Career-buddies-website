/**
 * Compares each expense's reserved-capacity counter (`reimbursedMinor`) with the sum of its ACTIVE linked
 * reimbursements (draft / pending / approved). Report-only by default; `--fix` rewrites drifted counters.
 * A drift can only come from a process crash between the two writes of a reimbursement create/void. The
 * calculation engine never reads the counter, so a drift cannot change any financial figure.
 */
import 'dotenv/config';
import { getEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { Transaction } from '../models/Transaction';
import { ACTIVE_REIMBURSEMENT_STATUSES } from '../modules/transactions/reimbursements';

export interface Drift { expenseId: string; txnNumber: string; counter: number; actual: number }

export async function findDrift(): Promise<Drift[]> {
  const sums = await Transaction.collection
    .aggregate<{ _id: unknown; total: number }>([
      { $match: { type: 'reimbursement', status: { $in: [...ACTIVE_REIMBURSEMENT_STATUSES] }, reimbursesTransactionId: { $ne: null } } },
      { $group: { _id: '$reimbursesTransactionId', total: { $sum: '$amountMinor' } } },
    ])
    .toArray();
  const actual = new Map(sums.map((s) => [String(s._id), s.total]));
  const expenses = await Transaction.collection.find({ type: 'business_expense' }, { projection: { txnNumber: 1, reimbursedMinor: 1 } }).toArray();
  const out: Drift[] = [];
  for (const e of expenses) {
    const counter = (e['reimbursedMinor'] as number | undefined) ?? 0;
    const real = actual.get(String(e._id)) ?? 0;
    if (counter !== real) out.push({ expenseId: String(e._id), txnNumber: String(e['txnNumber']), counter, actual: real });
  }
  return out;
}

export async function fixDrift(drift: Drift[]): Promise<void> {
  for (const d of drift) await Transaction.collection.updateOne({ _id: new (await import('mongoose')).Types.ObjectId(d.expenseId) }, { $set: { reimbursedMinor: d.actual } });
}

async function main() {
  await connectDb(getEnv().MONGO_URI);
  const drift = await findDrift();
  if (drift.length === 0) console.log('No drift: every expense counter matches its active reimbursements.');
  for (const d of drift) console.log(`${d.txnNumber}: counter ${d.counter}, actual ${d.actual}`);
  if (drift.length > 0 && process.argv.includes('--fix')) { await fixDrift(drift); console.log(`Fixed ${drift.length} counter(s).`); }
  else if (drift.length > 0) console.log('Re-run with --fix to repair.');
  await disconnectDb();
}

if (require.main === module) {
  main().catch((err: unknown) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
}
