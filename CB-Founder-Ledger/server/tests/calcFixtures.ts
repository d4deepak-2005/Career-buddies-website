import { calculate, type CalcFounder, type CalcTransaction } from '../src/domain/calculationEngine';
import { resolveSplit, type SplitInput } from '../src/domain/splits';
import type { TransactionStatus, TransactionType } from '../src/domain/transactionRules';

export const A: CalcFounder = { id: 'A', name: 'Asha', active: true };
export const B: CalcFounder = { id: 'B', name: 'Bilal', active: true };
export const C: CalcFounder = { id: 'C', name: 'Chen', active: true };
export const D: CalcFounder = { id: 'D', name: 'Dev', active: true };
export const three = [A, B, C];

let seq = 0;
const nextId = () => `t${++seq}`;

/** A transaction whose stored split was produced by the real Phase 2 resolver. */
export function withSplit(split: SplitInput, amountMinor: number) {
  const r = resolveSplit(split, amountMinor);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return { entries: r.entries.map((e) => ({ founderId: e.founderId, allocatedMinor: e.allocatedMinor })) };
}
export const equal = (ids: string[]): SplitInput => ({ method: 'equal', entries: ids.map((founderId) => ({ founderId })) });

export function tx(type: TransactionType, amountMinor: number, over: Partial<CalcTransaction> = {}): CalcTransaction {
  return { id: nextId(), type, status: 'approved' as TransactionStatus, amountMinor, ...over };
}
export function expense(amountMinor: number, paidBy: string, split: SplitInput, over: Partial<CalcTransaction> = {}) {
  return tx('business_expense', amountMinor, { paidByFounderId: paidBy, split: withSplit(split, amountMinor), ...over });
}
export function refund(amountMinor: number, receivedBy: string, split: SplitInput, over: Partial<CalcTransaction> = {}) {
  return tx('refund', amountMinor, { paidByFounderId: receivedBy, split: withSplit(split, amountMinor), ...over });
}
/** Option C: a reimbursement is linked to exactly one expense (`expenseId`) and paid to the founder who paid it. */
export const reimbursement = (amountMinor: number, to: string, expenseId: string | null, over: Partial<CalcTransaction> = {}) =>
  tx('reimbursement', amountMinor, { paidByFounderId: to, reimbursesTransactionId: expenseId, ...over });
export const contribution = (amountMinor: number, by: string, over: Partial<CalcTransaction> = {}) => tx('founder_contribution', amountMinor, { paidByFounderId: by, ...over });
export const loan = (amountMinor: number, by: string, over: Partial<CalcTransaction> = {}) => tx('founder_loan', amountMinor, { paidByFounderId: by, ...over });
export const settlement = (amountMinor: number, payer: string, receiver: string, over: Partial<CalcTransaction> = {}) => tx('settlement', amountMinor, { paidByFounderId: payer, counterpartyFounderId: receiver, ...over });

export const run = (founders: CalcFounder[], transactions: CalcTransaction[]) => calculate({ founders, transactions });
export const pos = (r: ReturnType<typeof run>, id: string) => r.founders.find((f) => f.founderId === id)!;

/** Small deterministic PRNG so property tests are reproducible. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
