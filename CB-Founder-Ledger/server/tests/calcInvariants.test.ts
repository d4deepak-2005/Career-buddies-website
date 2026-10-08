import { describe, expect, it } from 'vitest';
import { calculate, type CalcTransaction } from '../src/domain/calculationEngine';
import type { SplitInput } from '../src/domain/splits';
import { A, B, C, D, contribution, expense, loan, refund, reimbursement, rng, settlement, tx } from './calcFixtures';

const FOUNDERS = [A, B, C, D];
const IDS = FOUNDERS.map((f) => f.id);

function scenario(seed: number, opts: { reimbursements: boolean }) {
  const rand = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]!;
  const money = () => 1 + Math.floor(rand() * 5_000_000);
  const subset = () => { const s = IDS.filter(() => rand() < 0.6); return s.length ? s : [pick(IDS)]; };
  const split = (): SplitInput => {
    const ids = subset(); const m = pick(['equal', 'shares', 'percentage']);
    if (m === 'equal') return { method: 'equal', entries: ids.map((founderId) => ({ founderId })) };
    if (m === 'shares') return { method: 'shares', entries: ids.map((founderId) => ({ founderId, shares: 1 + Math.floor(rand() * 5) })) };
    const pcts = ids.map(() => 1 + Math.floor(rand() * 40)); const total = pcts.reduce((a, b) => a + b, 0);
    const scaled = pcts.map((p) => Math.floor((p / total) * 10000)); scaled[0] = scaled[0]! + (10000 - scaled.reduce((a, b) => a + b, 0));
    return { method: 'percentage', entries: ids.map((founderId, i) => ({ founderId, percent: scaled[i]! / 100 })) };
  };
  const txs: CalcTransaction[] = [];
  for (let i = 0, n = 4 + Math.floor(rand() * 14); i < n; i++) {
    const kind = pick(['expense', 'expense', 'expense', 'refund', 'contribution', 'loan', 'settlement', ...(opts.reimbursements ? ['reimb'] : [])]);
    const who = pick(IDS);
    if (kind === 'expense') txs.push(expense(money(), who, split()));
    else if (kind === 'refund') txs.push(refund(money(), who, split()));
    else if (kind === 'contribution') txs.push(contribution(money(), who));
    else if (kind === 'loan') txs.push(loan(money(), who));
    else if (kind === 'reimb') txs.push(reimbursement(money(), who));
    else { const to = pick(IDS.filter((x) => x !== who)); txs.push(settlement(money(), who, to)); }
  }
  return txs;
}

describe('accounting invariants over 600 random scenarios (4 founders, all transaction types)', () => {
  it('A. sum of net positions = 0 without reimbursements; = −Σ reimbursed with them (documented exception)', () => {
    for (let s = 1; s <= 300; s++) {
      const txs = scenario(s, { reimbursements: false });
      const r = calculate({ founders: FOUNDERS, transactions: txs });
      expect(r.founders.reduce((a, f) => a + f.grossNetPositionMinor, 0), `seed ${s}`).toBe(0);
      expect(r.founders.reduce((a, f) => a + f.outstandingMinor, 0)).toBe(0);
      expect(r.reconciliation.isBalanced).toBe(true);
    }
    for (let s = 1001; s <= 1300; s++) {
      const r = calculate({ founders: FOUNDERS, transactions: scenario(s, { reimbursements: true }) });
      expect(r.founders.reduce((a, f) => a + f.grossNetPositionMinor, 0) + r.founders.reduce((a, f) => a + f.reimbursedMinor, 0), `seed ${s}`).toBe(0);
    }
  });

  it('B-D. payable = receivable when balanced; recommendations never exceed payer/receiver positions; no money created or lost', () => {
    for (let s = 1; s <= 300; s++) {
      const r = calculate({ founders: FOUNDERS, transactions: scenario(s, { reimbursements: false }) });
      expect(r.reconciliation.totalPayableMinor, `seed ${s}`).toBe(r.reconciliation.totalReceivableMinor);
      expect(r.reconciliation.recommendedTotalMinor).toBe(r.reconciliation.totalPayableMinor);
      const out = new Map<string, number>(), inn = new Map<string, number>();
      for (const t of r.recommendations) { out.set(t.payerFounderId, (out.get(t.payerFounderId) ?? 0) + t.amountMinor); inn.set(t.receiverFounderId, (inn.get(t.receiverFounderId) ?? 0) + t.amountMinor); }
      for (const f of r.founders) {
        expect(out.get(f.founderId) ?? 0).toBeLessThanOrEqual(f.outstandingPayableMinor);
        expect(inn.get(f.founderId) ?? 0).toBeLessThanOrEqual(f.outstandingReceivableMinor);
        expect(f.outstandingMinor + (out.get(f.founderId) ?? 0) - (inn.get(f.founderId) ?? 0)).toBe(0);
      }
    }
  });

  it('E. every expense/refund fair-share allocation reconciles to its transaction amount', () => {
    for (let s = 1; s <= 100; s++) {
      const txs = scenario(s, { reimbursements: true });
      const r = calculate({ founders: FOUNDERS, transactions: txs });
      for (const t of txs.filter((x) => x.type === 'business_expense' || x.type === 'refund')) {
        const kind = t.type === 'business_expense' ? 'expense_share' : 'refund_share';
        expect(r.effects.filter((e) => e.transactionId === t.id && e.kind === kind).reduce((a, e) => a + e.amountMinor, 0), `seed ${s} ${t.id}`).toBe(t.amountMinor);
      }
    }
  });

  it('F. voided / rejected / pending / draft copies of any transaction change nothing', () => {
    for (let s = 1; s <= 100; s++) {
      const txs = scenario(s, { reimbursements: true });
      const base = calculate({ founders: FOUNDERS, transactions: txs });
      const noise = txs.flatMap((t, i) => (['voided', 'rejected', 'pending_approval', 'draft'] as const).map((status) => ({ ...t, id: `${t.id}-${status}-${i}`, status })));
      const noisy = calculate({ founders: FOUNDERS, transactions: [...noise, ...txs] });
      expect(noisy.founders, `seed ${s}`).toEqual(base.founders);
      expect(noisy.recommendations).toEqual(base.recommendations);
      expect(noisy.reconciliation).toEqual(base.reconciliation);
    }
  });

  it('applying the recommendations as official settlements always fully settles a balanced ledger', () => {
    for (let s = 1; s <= 100; s++) {
      const txs = scenario(s, { reimbursements: false });
      const first = calculate({ founders: FOUNDERS, transactions: txs });
      const paid = first.recommendations.map((x) => settlement(x.amountMinor, x.payerFounderId, x.receiverFounderId));
      const after = calculate({ founders: FOUNDERS, transactions: [...txs, ...paid] });
      expect(after.founders.every((f) => f.outstandingMinor === 0), `seed ${s}`).toBe(true);
      expect(after.recommendations).toEqual([]);
    }
  });

  it('results do not depend on transaction order, and "other" never changes anything', () => {
    for (let s = 1; s <= 50; s++) {
      const txs = scenario(s, { reimbursements: true });
      const a = calculate({ founders: FOUNDERS, transactions: txs });
      const b = calculate({ founders: FOUNDERS, transactions: [...txs].reverse() });
      const c = calculate({ founders: FOUNDERS, transactions: [...txs, tx('other', 123_456, { paidByFounderId: 'A' })] });
      expect(b.founders).toEqual(a.founders);
      expect(c.founders).toEqual(a.founders);
    }
  });
});
