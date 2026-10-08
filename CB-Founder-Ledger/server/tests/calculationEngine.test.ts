import { describe, expect, it } from 'vitest';
import { calculate } from '../src/domain/calculationEngine';
import { A, B, C, D, contribution, equal, expense, loan, pos, refund, reimbursement, run, settlement, three, tx, withSplit } from './calcFixtures';

const shares = (r: ReturnType<typeof run>) => three.map((f) => pos(r, f.id).fairShareMinor);

describe('fair share from stored splits (items 1-6)', () => {
  it('1. three-founder equal expense: 30,000 -> 10,000 each (plan §20)', () => {
    const r = run(three, [expense(3_000_000, 'A', equal(['A', 'B', 'C']))]);
    expect(shares(r)).toEqual([1_000_000, 1_000_000, 1_000_000]);
  });
  it('2. unequal percentage split 50/30/20', () => {
    const r = run(three, [expense(1_000_000, 'A', { method: 'percentage', entries: [{ founderId: 'A', percent: 50 }, { founderId: 'B', percent: 30 }, { founderId: 'C', percent: 20 }] })]);
    expect(shares(r)).toEqual([500_000, 300_000, 200_000]);
  });
  it('3. exact split', () => {
    const r = run(three, [expense(1_000, 'B', { method: 'exact', entries: [{ founderId: 'A', amountMinor: 100 }, { founderId: 'B', amountMinor: 250 }, { founderId: 'C', amountMinor: 650 }] })]);
    expect(shares(r)).toEqual([100, 250, 650]);
  });
  it('4. shares split 2:1:1', () => {
    const r = run(three, [expense(1_000, 'A', { method: 'shares', entries: [{ founderId: 'A', shares: 2 }, { founderId: 'B', shares: 1 }, { founderId: 'C', shares: 1 }] })]);
    expect(shares(r)).toEqual([500, 250, 250]);
  });
  it('5. custom split including a founder with zero responsibility', () => {
    const r = run(three, [expense(900, 'C', { method: 'custom', entries: [{ founderId: 'A', amountMinor: 900 }, { founderId: 'B', amountMinor: 0 }] })]);
    expect(shares(r)).toEqual([900, 0, 0]);
  });
  it('6. amount change recalculates fair share (30,000 -> 45,000 = 15,000 each)', () => {
    const before = run(three, [expense(3_000_000, 'A', equal(['A', 'B', 'C']))]);
    const after = run(three, [expense(4_500_000, 'A', equal(['A', 'B', 'C']))]);
    expect(shares(before)).toEqual([1_000_000, 1_000_000, 1_000_000]);
    expect(shares(after)).toEqual([1_500_000, 1_500_000, 1_500_000]);
  });
});

describe('paid, net position, action (items 7-11)', () => {
  const r = run(three, [expense(3_000_000, 'A', equal(['A', 'B', 'C']))]);
  it('7. paid = amount of expenses the founder paid', () => {
    expect([pos(r, 'A').paidMinor, pos(r, 'B').paidMinor, pos(r, 'C').paidMinor]).toEqual([3_000_000, 0, 0]);
  });
  it('8. net position = paid − fair share', () => {
    expect([pos(r, 'A').grossNetPositionMinor, pos(r, 'B').grossNetPositionMinor, pos(r, 'C').grossNetPositionMinor]).toEqual([2_000_000, -1_000_000, -1_000_000]);
  });
  it('9. positive net -> receive', () => {
    expect(pos(r, 'A')).toMatchObject({ action: 'receive', outstandingReceivableMinor: 2_000_000, outstandingPayableMinor: 0 });
  });
  it('10. negative net -> pay', () => {
    expect(pos(r, 'B')).toMatchObject({ action: 'pay', outstandingPayableMinor: 1_000_000, outstandingReceivableMinor: 0 });
  });
  it('11. zero net -> settled / no action', () => {
    const z = run(three, [expense(3_000, 'A', equal(['A'])), expense(3_000, 'B', equal(['B']))]);
    expect(pos(z, 'A')).toMatchObject({ grossNetPositionMinor: 0, action: 'settled', settlementStatus: 'settled' });
    expect(run(three, []).founders.every((f) => f.action === 'settled')).toBe(true); // no data
  });
});

describe('contribution, loan, reimbursement, refund (items 12-15)', () => {
  it('12. contribution is a separate metric and never enters fair share, paid or net', () => {
    const r = run(three, [contribution(5_000_000, 'B')]);
    expect(pos(r, 'B')).toMatchObject({ contributionMinor: 5_000_000, fairShareMinor: 0, paidMinor: 0, grossNetPositionMinor: 0, action: 'settled' });
  });
  it('13. loan principal is a separate metric and never enters fair share, paid or net', () => {
    const r = run(three, [loan(2_000_000, 'C')]);
    expect(pos(r, 'C')).toMatchObject({ loanOutstandingMinor: 2_000_000, fairShareMinor: 0, paidMinor: 0, grossNetPositionMinor: 0 });
    expect(r.reconciliation.unallocatedMinor).toBe(0);
  });
  it('14. reimbursement does not double-count the expense (fair share unchanged, paid offset once)', () => {
    const exp = expense(3_000, 'A', equal(['A', 'B', 'C']));
    const base = run(three, [exp]);
    const reimb = run(three, [exp, reimbursement(3_000, 'A')]);
    expect(shares(reimb)).toEqual(shares(base)); // not counted as a second expense
    expect(pos(reimb, 'A')).toMatchObject({ expensePaidMinor: 3_000, reimbursedMinor: 3_000, paidMinor: 0 });
    expect(reimb.reconciliation.totalFairShareMinor).toBe(3_000); // 3,000 once, not 6,000
    // reimbursement is business-funded: founders together sit at −3,000 and that is reported, not hidden
    expect(reimb.reconciliation.unallocatedMinor).toBe(-3_000);
    const partial = run(three, [exp, reimbursement(1_000, 'A')]);
    expect(pos(partial, 'A').paidMinor).toBe(2_000);
    expect(partial.reconciliation.totalFairShareMinor).toBe(3_000);
  });
  it('15. refund reduces the expense it returns (paid and fair share), staying zero-sum', () => {
    const exp = expense(3_000, 'A', equal(['A', 'B', 'C']));
    const r = run(three, [exp, refund(3_000, 'A', equal(['A', 'B', 'C']))]);
    for (const f of three) expect(pos(r, f.id)).toMatchObject({ paidMinor: 0, fairShareMinor: 0, grossNetPositionMinor: 0, action: 'settled' });
    const partial = run(three, [exp, refund(900, 'A', equal(['A', 'B', 'C']))]);
    expect(shares(partial)).toEqual([700, 700, 700]);
    expect(pos(partial, 'A').paidMinor).toBe(2_100);
    expect(partial.reconciliation.unallocatedMinor).toBe(0);
    expect(partial.reconciliation.totalFairShareMinor).toBe(2_100);
  });
  it('15b. a refund with no stored split is excluded with a warning, never guessed', () => {
    const r = run(three, [expense(3_000, 'A', equal(['A', 'B', 'C'])), tx('refund', 900, { paidByFounderId: 'A' })]);
    expect(r.excluded.invalid).toBe(1);
    expect(r.warnings[0]).toMatchObject({ code: 'MISSING_SPLIT' });
    expect(shares(r)).toEqual([1_000, 1_000, 1_000]);
  });
});

describe('official-record rules (items 16-18)', () => {
  const e = (status: Parameters<typeof tx>[2] extends infer P ? P extends { status?: infer S } ? S : never : never) => expense(3_000, 'A', equal(['A', 'B', 'C']), { status });
  it('16. voided transactions are excluded', () => {
    const r = run(three, [e('voided')]);
    expect(r.reconciliation.totalFairShareMinor).toBe(0);
    expect(r.excluded.byStatus['voided']).toBe(1);
  });
  it('17. rejected transactions are excluded (PDF §11)', () => {
    const r = run(three, [e('rejected')]);
    expect(pos(r, 'A').paidMinor).toBe(0);
    expect(r.excluded.byStatus['rejected']).toBe(1);
  });
  it('18. draft and pending transactions are not official', () => {
    const r = run(three, [e('draft'), e('pending_approval'), contribution(10, 'A', { status: 'pending_approval' })]);
    expect(r.reconciliation.totalFairShareMinor).toBe(0);
    expect(pos(r, 'A').contributionMinor).toBe(0);
    expect(r.excluded.byStatus).toEqual({ draft: 1, pending_approval: 2 });
  });
  it('approved -> voided later removes the effect (reflects current state)', () => {
    const live = expense(3_000, 'A', equal(['A', 'B', 'C']));
    expect(run(three, [live]).reconciliation.totalFairShareMinor).toBe(3_000);
    expect(run(three, [{ ...live, status: 'voided' }]).reconciliation.totalFairShareMinor).toBe(0);
  });
  it('"other" is excluded and counted, not interpreted', () => {
    const r = run(three, [tx('other', 5_000, { paidByFounderId: 'A' })]);
    expect(r.excluded.unclassifiedOther).toBe(1);
    expect(r.reconciliation.totalPaidMinor).toBe(0);
  });
});

describe('settlements (items 19-20, 31-33)', () => {
  const exp = expense(3_000_000, 'A', equal(['A', 'B', 'C'])); // B and C each owe 1,000,000 to A
  it('19. a settlement reduces the outstanding amount', () => {
    const r = run(three, [exp, settlement(400_000, 'B', 'A')]);
    expect(pos(r, 'B')).toMatchObject({ grossNetPositionMinor: -1_000_000, settledPaidMinor: 400_000, outstandingMinor: -600_000, outstandingPayableMinor: 600_000 });
    expect(pos(r, 'A')).toMatchObject({ settledReceivedMinor: 400_000, outstandingMinor: 1_600_000 });
  });
  it('20. a settlement is not a business expense (paid / fair share / contribution untouched)', () => {
    const r = run(three, [exp, settlement(400_000, 'B', 'A')]);
    expect(pos(r, 'B')).toMatchObject({ paidMinor: 0, fairShareMinor: 1_000_000, contributionMinor: 0, expensePaidMinor: 0 });
    expect(r.reconciliation.totalFairShareMinor).toBe(3_000_000);
    expect(r.reconciliation.totalPaidMinor).toBe(3_000_000);
    expect(r.included['settlement']).toBe(1);
  });
  it('31. multiple settlements accumulate', () => {
    const r = run(three, [exp, settlement(300_000, 'B', 'A'), settlement(200_000, 'B', 'A'), settlement(1_000_000, 'C', 'A')]);
    expect(pos(r, 'B').outstandingMinor).toBe(-500_000);
    expect(pos(r, 'C').outstandingMinor).toBe(0);
    expect(pos(r, 'A').outstandingMinor).toBe(2_000_000 - 1_500_000);
  });
  it('32. fully settled founder', () => {
    const r = run(three, [exp, settlement(1_000_000, 'B', 'A')]);
    expect(pos(r, 'B')).toMatchObject({ outstandingMinor: 0, action: 'settled', settlementStatus: 'settled' });
  });
  it('33. partially settled founder', () => {
    const r = run(three, [exp, settlement(1, 'B', 'A')]);
    expect(pos(r, 'B')).toMatchObject({ settlementStatus: 'partially_settled', action: 'pay', outstandingPayableMinor: 999_999 });
    expect(pos(r, 'C').settlementStatus).toBe('open');
  });
  it('over-settlement flips the sign instead of being hidden', () => {
    const r = run(three, [exp, settlement(1_500_000, 'B', 'A')]);
    expect(pos(r, 'B')).toMatchObject({ outstandingMinor: 500_000, action: 'receive' });
  });
  it('a pending or voided settlement does not count', () => {
    const r = run(three, [exp, settlement(1_000_000, 'B', 'A', { status: 'pending_approval' }), settlement(1_000_000, 'C', 'A', { status: 'voided' })]);
    expect(pos(r, 'B').outstandingMinor).toBe(-1_000_000);
    expect(pos(r, 'C').outstandingMinor).toBe(-1_000_000);
  });
  it('settlement with identical or unknown founders is excluded with a warning', () => {
    const r = run(three, [exp, settlement(5, 'B', 'B'), settlement(5, 'B', 'ZZZ')]);
    expect(r.warnings.map((w) => w.code).sort()).toEqual(['SAME_FOUNDER', 'UNKNOWN_FOUNDER']);
    expect(pos(r, 'B').settledPaidMinor).toBe(0);
  });
});

describe('recommendations from the engine (items 21-23)', () => {
  it('21-23. recommendations clear every position, create and lose no money', () => {
    const r = run(three, [expense(3_000_000, 'A', equal(['A', 'B', 'C']))]);
    expect(r.recommendations).toEqual([
      { payerFounderId: 'B', receiverFounderId: 'A', amountMinor: 1_000_000 },
      { payerFounderId: 'C', receiverFounderId: 'A', amountMinor: 1_000_000 },
    ]);
    expect(r.reconciliation).toMatchObject({ totalPayableMinor: 2_000_000, totalReceivableMinor: 2_000_000, recommendedTotalMinor: 2_000_000, unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0, isBalanced: true });
  });
  it('applying the recommendations as settlements leaves everyone settled', () => {
    const base = [expense(1_000_001, 'A', equal(['A', 'B', 'C'])), expense(777, 'C', equal(['A', 'B']))];
    const first = run(three, base);
    const paid = first.recommendations.map((x) => settlement(x.amountMinor, x.payerFounderId, x.receiverFounderId));
    const after = run(three, [...base, ...paid]);
    expect(after.founders.every((f) => f.outstandingMinor === 0)).toBe(true);
    expect(after.recommendations).toEqual([]);
  });
  it('business-funded reimbursement leaves an unresolved amount instead of inventing a receiver', () => {
    const r = run(three, [expense(3_000, 'A', equal(['A', 'B', 'C'])), reimbursement(3_000, 'A')]);
    expect(r.recommendations).toEqual([]);
    expect(r.reconciliation).toMatchObject({ unallocatedMinor: -3_000, unresolvedPayableMinor: 3_000, unresolvedReceivableMinor: 0, isBalanced: false });
  });
});

describe('rounding (item 24)', () => {
  it.each([[1], [2], [10], [100], [101], [99_999]])('amount %i split 3 ways reconciles exactly', (amount) => {
    const r = run(three, [expense(amount, 'A', equal(['A', 'B', 'C']))]);
    expect(r.reconciliation.totalFairShareMinor).toBe(amount);
    expect(r.reconciliation.unallocatedMinor).toBe(0);
    expect(shares(r).reduce((a, b) => a + b, 0)).toBe(amount);
  });
  it('4 founders and percentage fractions reconcile', () => {
    const four = [A, B, C, D];
    const r = run(four, [
      expense(1_001, 'D', equal(['A', 'B', 'C', 'D'])),
      expense(10_000, 'A', { method: 'percentage', entries: [{ founderId: 'A', percent: 33.33 }, { founderId: 'B', percent: 33.33 }, { founderId: 'C', percent: 33.34 }] }),
      expense(7, 'B', { method: 'shares', entries: [{ founderId: 'A', shares: 3 }, { founderId: 'B', shares: 3 }, { founderId: 'C', shares: 1 }] }),
    ]);
    expect(r.reconciliation.totalFairShareMinor).toBe(1_001 + 10_000 + 7);
    expect(r.reconciliation.totalPaidMinor).toBe(1_001 + 10_000 + 7);
    expect(r.reconciliation.unallocatedMinor).toBe(0);
  });
});

describe('founder counts, breadth, freshness (items 25-30, 34-36)', () => {
  it('25. two founders', () => {
    const r = run([A, B], [expense(1_001, 'A', equal(['A', 'B']))]);
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([501, 500]);
    expect(r.recommendations).toEqual([{ payerFounderId: 'B', receiverFounderId: 'A', amountMinor: 500 }]);
  });
  it('26. three founders', () => {
    expect(run(three, [expense(100, 'B', equal(['A', 'B', 'C']))]).recommendations).toHaveLength(2);
  });
  it('27. four founders', () => {
    const r = run([A, B, C, D], [expense(4_000, 'A', equal(['A', 'B', 'C', 'D']))]);
    expect(r.recommendations.map((x) => x.amountMinor)).toEqual([1_000, 1_000, 1_000]);
    expect(r.reconciliation.isBalanced).toBe(true);
  });
  it('28-30. multiple expenses, categories and dates aggregate; neither category nor date changes the result', () => {
    const mk = (cat: string, date: string) => ({ categoryId: cat, transactionDate: date } as Record<string, unknown>);
    const e1 = { ...expense(1_000, 'A', equal(['A', 'B', 'C'])), ...mk('c1', '2026-01-01') };
    const e2 = { ...expense(2_000, 'B', equal(['A', 'B', 'C'])), ...mk('c2', '2026-02-15') };
    const e3 = { ...expense(500, 'C', equal(['A', 'B'])), ...mk('c3', '2025-12-31') };
    const r = run(three, [e1, e2, e3]);
    expect(r.reconciliation).toMatchObject({ totalPaidMinor: 3_500, totalFairShareMinor: 3_500, unallocatedMinor: 0 });
    expect(pos(r, 'A').paidMinor).toBe(1_000);
    expect(pos(r, 'B').paidMinor).toBe(2_000);
    expect(pos(r, 'A').fairShareMinor).toBe(334 + 667 + 250) // remainder units go to the earliest entries (Phase 2 rule);
    expect(run(three, [e3, e1, e2]).founders).toEqual(r.founders); // order independent
  });
  it('34. current data is always reflected: change one record, results change', () => {
    const e = expense(3_000, 'A', equal(['A', 'B', 'C']));
    const r1 = run(three, [e]);
    const r2 = run(three, [{ ...e, amountMinor: 6_000, split: withSplit(equal(['A', 'B', 'C']), 6_000) }]);
    expect(pos(r1, 'A').grossNetPositionMinor).toBe(2_000);
    expect(pos(r2, 'A').grossNetPositionMinor).toBe(4_000);
    expect(calculate({ founders: three, transactions: [e] })).toEqual(r1); // pure: same input, same output
  });
  it('35. large integer amounts stay exact; overflow is refused, not rounded', () => {
    const big = 900_000_000_000;
    const r = run(three, [expense(big, 'A', equal(['A', 'B', 'C'])), expense(big + 1, 'B', equal(['A', 'B', 'C']))]);
    expect(r.reconciliation.totalPaidMinor).toBe(big * 2 + 1);
    expect(r.reconciliation.unallocatedMinor).toBe(0);
    const huge = Number.MAX_SAFE_INTEGER - 5;
    const mk = (id: string) => ({ id, type: 'founder_contribution' as const, status: 'approved' as const, amountMinor: huge, paidByFounderId: 'A' });
    expect(() => run(three, [mk('x'), mk('y')])).toThrow(RangeError);
  });
  it('36. zero, negative, fractional, unsafe and missing values are rejected with warnings', () => {
    const bad = [0, -5, 10.5, Number.NaN, Number.MAX_SAFE_INTEGER + 2].map((amountMinor) => tx('founder_contribution', amountMinor, { paidByFounderId: 'A' }));
    const r = run(three, [...bad, tx('founder_contribution', 100), tx('founder_contribution', 100, { paidByFounderId: 'GHOST' })]);
    expect(r.excluded.invalid).toBe(7);
    expect(r.warnings.filter((w) => w.code === 'INVALID_AMOUNT')).toHaveLength(5);
    expect(pos(r, 'A').contributionMinor).toBe(0);
  });
  it('rejects splits that do not add up, unknown or duplicate founders', () => {
    const e = expense(1_000, 'A', equal(['A', 'B']));
    const broken = (entries: Array<{ founderId: string; allocatedMinor: number }>) => ({ ...e, id: `b${entries.length}${entries[0]?.founderId}`, split: { entries } });
    const r = run(three, [
      broken([{ founderId: 'A', allocatedMinor: 400 }, { founderId: 'B', allocatedMinor: 500 }]),
      broken([{ founderId: 'A', allocatedMinor: 500 }, { founderId: 'NOPE', allocatedMinor: 500 }]),
      broken([{ founderId: 'A', allocatedMinor: 500 }, { founderId: 'A', allocatedMinor: 500 }]),
      broken([{ founderId: 'A', allocatedMinor: -1 }, { founderId: 'B', allocatedMinor: 1_001 }]),
    ]);
    expect(r.excluded.invalid).toBe(4);
    expect(r.reconciliation.totalFairShareMinor).toBe(0);
  });
  it('paid-by who is not a founder profile is excluded with a warning (nothing half-applied)', () => {
    const r = run(three, [expense(1_000, 'GHOST', equal(['A', 'B']))]);
    expect(r.excluded.invalid).toBe(1);
    expect(r.reconciliation.totalFairShareMinor).toBe(0); // the split side was not applied either
  });
  it('inactive founders keep their balances', () => {
    const r = run([A, { ...B, active: false }], [expense(100, 'A', equal(['A', 'B']))]);
    expect(pos(r, 'B')).toMatchObject({ active: false, outstandingMinor: -50 });
  });
  it('ledger effects trace every figure back to a transaction', () => {
    const e = expense(100, 'A', equal(['A', 'B']));
    const r = run(three, [e]);
    expect(r.effects.filter((x) => x.transactionId === e.id).map((x) => `${x.founderId}:${x.kind}:${x.amountMinor}`).sort()).toEqual(['A:expense_paid:100', 'A:expense_share:50', 'B:expense_share:50']);
  });
});
