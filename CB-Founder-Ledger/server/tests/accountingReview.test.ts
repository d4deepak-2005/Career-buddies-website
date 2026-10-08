/**
 * Phase 3 accounting review. Every expected number below is worked out by hand in the comments.
 * Labels refer to docs/PHASE-3-CALCULATION-SPEC.md.
 */
import { describe, expect, it } from 'vitest';
import { A, B, C, contribution, equal, expense, loan, pos, refund, reimbursement, run, settlement, three, tx, withSplit } from './calcFixtures';

const e3000 = () => expense(3_000, 'A', equal(['A', 'B', 'C'])); // A paid 3,000; each founder responsible for 1,000
const rec = (r: ReturnType<typeof run>) => r.recommendations.map((x) => `${x.payerFounderId}->${x.receiverFounderId}:${x.amountMinor}`);
const balances = (r: ReturnType<typeof run>) => r.founders.map((f) => f.outstandingMinor);
const codes = (r: ReturnType<typeof run>, level?: 'warning' | 'info') => r.warnings.filter((w) => !level || w.level === level).map((w) => w.code).sort();

describe('1-2. business expenses: equal and uneven', () => {
  it('equal: A paid 3,000, each responsible for 1,000 -> B and C each pay A 1,000', () => {
    const r = run(three, [e3000()]);
    expect(r.founders.map((f) => [f.paidMinor, f.fairShareMinor, f.grossNetPositionMinor])).toEqual([[3_000, 1_000, 2_000], [0, 1_000, -1_000], [0, 1_000, -1_000]]);
    expect(rec(r)).toEqual(['B->A:1000', 'C->A:1000']);
    expect(r.reconciliation).toMatchObject({ status: 'PASS', externalMinor: 0, sumGrossNetPositionMinor: 0, founderBalanceSumMinor: 0 });
  });
  it('uneven 50/30/20 of 10,000 paid by A: A +5,000, B −3,000, C −2,000', () => {
    const r = run(three, [expense(10_000, 'A', { method: 'percentage', entries: [{ founderId: 'A', percent: 50 }, { founderId: 'B', percent: 30 }, { founderId: 'C', percent: 20 }] })]);
    expect(balances(r)).toEqual([5_000, -3_000, -2_000]);
    expect(rec(r)).toEqual(['B->A:3000', 'C->A:2000']);
  });
});

describe('3-4. contribution and loan stay out of the expense settlement', () => {
  it('contribution: separate metric; recommendations identical with and without it', () => {
    const base = run(three, [e3000()]);
    const withCap = run(three, [e3000(), contribution(9_999_999, 'B'), contribution(1, 'C')]);
    expect(pos(withCap, 'B')).toMatchObject({ contributionMinor: 9_999_999, paidMinor: 0, fairShareMinor: 1_000 });
    expect(withCap.founders.map((f) => [f.paidMinor, f.fairShareMinor, f.outstandingMinor])).toEqual(base.founders.map((f) => [f.paidMinor, f.fairShareMinor, f.outstandingMinor]));
    expect(rec(withCap)).toEqual(rec(base));
    expect(withCap.reconciliation.totalPaidMinor).toBe(3_000); // capital is not "paid" for an expense
  });
  it('loan: principal is its own metric; never in paid, fair share, net or settlement', () => {
    const base = run(three, [e3000()]);
    const withLoan = run(three, [e3000(), loan(5_000_000, 'A'), loan(7, 'B')]);
    expect(pos(withLoan, 'A')).toMatchObject({ loanOutstandingMinor: 5_000_000, paidMinor: 3_000, fairShareMinor: 1_000 });
    expect(pos(withLoan, 'B').loanOutstandingMinor).toBe(7);
    expect(rec(withLoan)).toEqual(rec(base));
    expect(withLoan.reconciliation.totalPaidMinor).toBe(3_000);
    expect(withLoan.reconciliation.totalFairShareMinor).toBe(3_000);
  });
  it('a loan or contribution alone creates no obligation between founders', () => {
    const r = run(three, [loan(100, 'A'), contribution(100, 'B')]);
    expect(r.recommendations).toEqual([]);
    expect(r.founders.every((f) => f.action === 'settled')).toBe(true);
    expect(r.reconciliation.status).toBe('PASS');
  });
});

describe('5, 12. reimbursement: external amount is separate from founder-to-founder balances', () => {
  it('full reimbursement: nothing is owed between founders; 3,000 is external', () => {
    const r = run(three, [e3000(), reimbursement(3_000, 'A')]);
    // Net position (paid − fair share) is still reported honestly: A 0−1,000, B −1,000, C −1,000 ...
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([-1_000, -1_000, -1_000]);
    // ... but each founder's share of the business-funded 3,000 is 1,000, so founder-to-founder balances are zero.
    expect(r.founders.map((f) => f.businessFundedShareMinor)).toEqual([1_000, 1_000, 1_000]);
    expect(r.founders.map((f) => f.founderBalanceMinor)).toEqual([0, 0, 0]);
    expect(r.founders.every((f) => f.action === 'settled')).toBe(true);
    expect(r.recommendations).toEqual([]);
    expect(r.reconciliation).toMatchObject({ status: 'PASS_WITH_EXTERNAL', externalMinor: 3_000, sumGrossNetPositionMinor: -3_000, founderBalanceSumMinor: 0, isBalanced: true });
    expect(r.reconciliation.explanation).toMatch(/business funds/);
  });
  it('partial reimbursement: the arbitrary tie-break flaw is gone — B and C are treated identically', () => {
    // A paid 3,000, business reimbursed A 1,000 -> founders funded 2,000 between them; each is responsible for 2,000/3.
    // external 1,000 split by fair share 1,000:1,000:1,000 = 334 / 333 / 333 (largest remainder, first entry gets the odd unit)
    const r = run(three, [e3000(), reimbursement(1_000, 'A')]);
    expect(r.founders.map((f) => f.businessFundedShareMinor)).toEqual([334, 333, 333]);
    expect(r.founders.map((f) => f.founderBalanceMinor)).toEqual([1_334, -667, -667]); // A paid 2,000 − 666.67 ; B, C each owe 667 (rounded)
    expect(rec(r)).toEqual(['B->A:667', 'C->A:667']);
    expect(r.reconciliation).toMatchObject({ status: 'PASS_WITH_EXTERNAL', externalMinor: 1_000, founderBalanceSumMinor: 0, unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0 });
    // swapping the order of the two symmetric founders gives the same amounts
    const swapped = run([A, C, B], [e3000(), reimbursement(1_000, 'A')]);
    expect(swapped.founders.map((f) => [f.founderId, f.founderBalanceMinor]).sort()).toEqual(r.founders.map((f) => [f.founderId, f.founderBalanceMinor]).sort());
  });
  it('uneven split: the external amount follows each founder\'s fair share (50/30/20)', () => {
    // 1,000 paid by A (fair 500/300/200); business reimburses A 100 -> external 50 / 30 / 20
    const r = run(three, [expense(1_000, 'A', { method: 'percentage', entries: [{ founderId: 'A', percent: 50 }, { founderId: 'B', percent: 30 }, { founderId: 'C', percent: 20 }] }), reimbursement(100, 'A')]);
    expect(r.founders.map((f) => f.businessFundedShareMinor)).toEqual([50, 30, 20]);
    expect(balances(r)).toEqual([450, -270, -180]); // = fair share of the 900 the founders actually funded
  });
  it('the external amount is never part of a recommendation', () => {
    const r = run(three, [e3000(), expense(900, 'B', equal(['A', 'B', 'C'])), reimbursement(1_500, 'A')]);
    const payable = r.founders.reduce((s, f) => s + f.outstandingPayableMinor, 0);
    expect(r.reconciliation.recommendedTotalMinor).toBe(payable); // recommendations clear founder balances exactly...
    expect(r.reconciliation.recommendedTotalMinor).toBeLessThan(r.reconciliation.recommendedTotalMinor + r.reconciliation.externalMinor); // ...and say nothing about the external 1,500
    expect(r.reconciliation.externalMinor).toBe(1_500);
    expect(r.reconciliation.founderBalanceSumMinor).toBe(0);
    expect(r.reconciliation.checks.every((c) => c.ok)).toBe(true);
  });
  it('the reimbursement never counts as a second expense or as a founder payment', () => {
    const base = run(three, [e3000()]);
    const r = run(three, [e3000(), reimbursement(3_000, 'A')]);
    expect(r.reconciliation.totalFairShareMinor).toBe(base.reconciliation.totalFairShareMinor);
    expect(r.founders.map((f) => f.settledPaidMinor + f.settledReceivedMinor)).toEqual([0, 0, 0]);
    expect(r.included['reimbursement']).toBe(1);
  });
  it('reimbursing a founder who paid nothing is flagged, but cannot break zero-sum', () => {
    const r = run(three, [reimbursement(500, 'A')]); // no expenses at all
    expect(pos(r, 'A')).toMatchObject({ paidMinor: -500, businessFundedShareMinor: 500, founderBalanceMinor: 0 });
    expect(codes(r, 'warning')).toEqual(['REIMBURSED_MORE_THAN_PAID', 'REIMBURSEMENTS_EXCEED_EXPENSES']);
    expect(r.reconciliation).toMatchObject({ status: 'REVIEW', founderBalanceSumMinor: 0 });
    expect(r.recommendations).toEqual([]);
  });
  it('a reimbursement for the wrong amount is visible, not hidden (excess over paid)', () => {
    const r = run(three, [e3000(), reimbursement(3_500, 'A')]);
    expect(codes(r, 'warning')).toContain('REIMBURSED_MORE_THAN_PAID');
    expect(r.reconciliation.founderBalanceSumMinor).toBe(0);
  });
});

describe('6. refund', () => {
  it('partial refund received by the payer: original expense untouched, refund separately visible', () => {
    // expense 3,000 by A; vendor refunds 900 to A, shared equally -> fair 700 each, A paid 2,100
    const exp = e3000(); const ref = refund(900, 'A', equal(['A', 'B', 'C']));
    const r = run(three, [exp, ref]);
    expect(r.founders.map((f) => [f.paidMinor, f.fairShareMinor])).toEqual([[2_100, 700], [0, 700], [0, 700]]);
    expect(balances(r)).toEqual([1_400, -700, -700]);
    // the original expense keeps its own effects; the refund has separate ones
    expect(r.effects.filter((e) => e.transactionId === exp.id).map((e) => e.kind).sort()).toEqual(['expense_paid', 'expense_share', 'expense_share', 'expense_share']);
    expect(r.effects.filter((e) => e.transactionId === ref.id).map((e) => e.kind).sort()).toEqual(['refund_received', 'refund_share', 'refund_share', 'refund_share']);
    expect(r.reconciliation.status).toBe('PASS');
  });
  it('full refund cancels the expense exactly; nobody owes anything', () => {
    const r = run(three, [e3000(), refund(3_000, 'A', equal(['A', 'B', 'C']))]);
    expect(r.founders.every((f) => f.paidMinor === 0 && f.fairShareMinor === 0 && f.action === 'settled')).toBe(true);
  });
  it('refund received by a DIFFERENT founder than the payer: that founder holds money owed back', () => {
    // A paid 3,000; the vendor refunded 3,000 to B's card. B must hand it to A.
    const r = run(three, [e3000(), refund(3_000, 'B', equal(['A', 'B', 'C']))]);
    expect(r.founders.map((f) => [f.paidMinor, f.fairShareMinor])).toEqual([[3_000, 0], [-3_000, 0], [0, 0]]);
    expect(rec(r)).toEqual(['B->A:3000']);
    expect(r.reconciliation.status).toBe('PASS'); // negative "paid" is legitimate here: B holds cash
  });
  it('refund split differently from the expense stays mathematically consistent', () => {
    const r = run(three, [e3000(), refund(600, 'A', { method: 'exact', entries: [{ founderId: 'B', amountMinor: 600 }] })]);
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([1_000, 400, 1_000]);
    expect(r.founders.map((f) => f.grossNetPositionMinor).reduce((a, b) => a + b, 0)).toBe(0);
    expect(r.reconciliation.checks.every((c) => c.ok)).toBe(true);
  });
  it('a refund larger than the founder\'s share is FLAGGED (negative fair share), never silently clamped', () => {
    const r = run(three, [expense(1_000, 'A', equal(['A'])), refund(2_000, 'A', equal(['A', 'B']))]);
    expect(pos(r, 'B').fairShareMinor).toBe(-1_000);
    expect(codes(r, 'warning')).toEqual(['NEGATIVE_FAIR_SHARE', 'REFUNDS_EXCEED_EXPENSES']);
    expect(r.warnings.find((w) => w.code === 'NEGATIVE_FAIR_SHARE')?.founderId).toBe('B');
    expect(r.reconciliation.status).toBe('REVIEW');
    expect(r.reconciliation.founderBalanceSumMinor).toBe(0); // still zero-sum: nothing was clamped
  });
  it('a refund without payee or split is excluded with a warning', () => {
    const r = run(three, [e3000(), tx('refund', 500, { paidByFounderId: 'A' }), tx('refund', 500, { split: withSplit(equal(['A']), 500) })]);
    expect(codes(r, 'warning')).toEqual(['MISSING_SPLIT', 'UNKNOWN_FOUNDER']);
    expect(r.reconciliation.totalFairShareMinor).toBe(3_000);
  });
});

describe('7-11. settlements', () => {
  it('partial: reduces both positions, changes neither paid nor fair share, creates and destroys no money', () => {
    const before = run(three, [e3000()]);
    const r = run(three, [e3000(), settlement(400, 'B', 'A')]);
    expect(balances(r)).toEqual([1_600, -600, -1_000]);
    expect(pos(r, 'B')).toMatchObject({ paidMinor: 0, fairShareMinor: 1_000, settledPaidMinor: 400, outstandingPayableMinor: 600, settlementStatus: 'partially_settled' });
    expect(pos(r, 'A')).toMatchObject({ settledReceivedMinor: 400, outstandingReceivableMinor: 1_600 });
    expect(r.reconciliation.totalFairShareMinor).toBe(before.reconciliation.totalFairShareMinor); // not an expense
    expect(r.reconciliation.totalPaidMinor).toBe(before.reconciliation.totalPaidMinor);
    expect(balances(r).reduce((a, b) => a + b, 0)).toBe(0); // neither created nor destroyed
    expect(r.reconciliation.checks.find((c) => c.code === 'SETTLEMENTS_ZERO_SUM')?.ok).toBe(true);
    expect(r.reconciliation.status).toBe('PASS');
  });
  it('multiple settlements accumulate; applying the recommendations reaches exactly zero', () => {
    const r = run(three, [e3000(), settlement(300, 'B', 'A'), settlement(200, 'B', 'A')]);
    expect(pos(r, 'B').outstandingMinor).toBe(-500);
    const full = run(three, [e3000(), settlement(300, 'B', 'A'), settlement(700, 'B', 'A'), settlement(1_000, 'C', 'A')]);
    expect(full.founders.every((f) => f.outstandingMinor === 0 && f.action === 'settled')).toBe(true);
    expect(full.recommendations).toEqual([]);
    expect(full.reconciliation.status).toBe('PASS');
  });
  it('settlements also work for the founder-to-founder balance of a reimbursed scenario', () => {
    const base = [e3000(), reimbursement(1_000, 'A')];
    const r = run(three, [...base, settlement(667, 'B', 'A')]);
    expect(pos(r, 'B')).toMatchObject({ outstandingMinor: 0, action: 'settled' });
    expect(rec(r)).toEqual(['C->A:667']);
    expect(r.reconciliation.externalMinor).toBe(1_000); // unchanged by settlements
  });
  it('over-settlement is explicit: flagged per founder, reconciliation says REVIEW, nothing hidden', () => {
    const r = run(three, [e3000(), settlement(1_500, 'B', 'A')]); // B owed 1,000 but paid 1,500
    expect(pos(r, 'B')).toMatchObject({ outstandingMinor: 500, overSettledMinor: 500, action: 'receive' });
    expect(pos(r, 'A')).toMatchObject({ outstandingMinor: 500, overSettledMinor: 0 }); // A is still owed, just less
    expect(codes(r, 'warning')).toEqual(['OVER_SETTLED']);
    expect(r.warnings[0]).toMatchObject({ founderId: 'B', level: 'warning' });
    expect(r.reconciliation.status).toBe('REVIEW');
    expect(balances(r).reduce((a, b) => a + b, 0)).toBe(0); // still zero-sum
    expect(rec(r)).toEqual(['C->A:500', 'C->B:500']);
  });
  it('a founder who owed nothing and paid anyway is over-settled too', () => {
    const r = run(three, [settlement(100, 'A', 'B')]); // no expenses at all
    expect(pos(r, 'A')).toMatchObject({ outstandingMinor: 100, overSettledMinor: 100 });
    expect(pos(r, 'B')).toMatchObject({ outstandingMinor: -100, overSettledMinor: 100 });
    expect(codes(r, 'warning')).toEqual(['OVER_SETTLED', 'OVER_SETTLED']);
  });
  it('a settlement can never become an expense or raise a fair share', () => {
    const r = run(three, [settlement(5_000, 'B', 'A'), settlement(1, 'C', 'B')]);
    expect(r.founders.every((f) => f.fairShareMinor === 0 && f.paidMinor === 0 && f.expensePaidMinor === 0)).toBe(true);
    expect(r.reconciliation.totalFairShareMinor).toBe(0);
    expect(r.reconciliation.totalPaidMinor).toBe(0);
  });
});

describe('13-17. what is excluded', () => {
  it('13. an invalid approved transaction is excluded and reported, never repaired', () => {
    const bad = { ...e3000(), id: 'bad', split: { entries: [{ founderId: 'A', allocatedMinor: 1_000 }, { founderId: 'B', allocatedMinor: 1_000 }] } }; // sums to 2,000 not 3,000
    const r = run(three, [bad]);
    expect(r.excluded.invalid).toBe(1);
    expect(r.warnings).toEqual([expect.objectContaining({ code: 'INVALID_SPLIT', transactionId: 'bad', level: 'warning' })]);
    expect(r.reconciliation.totalFairShareMinor).toBe(0);
    expect(r.reconciliation.status).toBe('REVIEW');
  });
  it('14. "Other" is a diagnostic only: counted in diagnostics, never in any total', () => {
    const base = run(three, [e3000()]);
    const r = run(three, [e3000(), tx('other', 9_999_999, { paidByFounderId: 'A', split: withSplit(equal(['A', 'B']), 9_999_999) })]);
    expect(r.excluded.unclassifiedOther).toBe(1);
    expect(r.warnings).toEqual([expect.objectContaining({ code: 'OTHER_NOT_CALCULATED', level: 'info' })]);
    expect(r.founders).toEqual(base.founders);
    expect(r.reconciliation.totalPaidMinor).toBe(3_000);
    expect(r.reconciliation.totalFairShareMinor).toBe(3_000);
    expect(r.included['other']).toBeUndefined();
    expect(r.effects.every((e) => e.amountMinor <= 3_000)).toBe(true); // no effect carries the huge "Other" amount
    expect(r.reconciliation.status).toBe('PASS'); // info does not trigger REVIEW
  });
  it('15-17. voided, pending (and draft), rejected change nothing', () => {
    const base = run(three, [e3000()]);
    const noise = (['voided', 'pending_approval', 'draft', 'rejected'] as const).flatMap((status) => [
      { ...e3000(), status }, { ...settlement(1_000, 'B', 'A'), status }, { ...reimbursement(1_000, 'A'), status }, { ...refund(300, 'A', equal(['A', 'B'])), status }, { ...contribution(5, 'A'), status },
    ]);
    const r = run(three, [e3000(), ...noise]);
    expect(r.excluded.byStatus).toEqual({ voided: 5, pending_approval: 5, draft: 5, rejected: 5 });
    expect(r.founders).toEqual(run(three, [{ ...e3000(), id: r.effects[0]!.transactionId }]).founders);
    expect(r.reconciliation.externalMinor).toBe(0);
    expect(base.reconciliation.status).toBe('PASS');
  });
});

describe('18-20. changes are reflected', () => {
  it('18. amount change: 3,000 -> 6,000 doubles every share and the recommendations', () => {
    expect(rec(run(three, [e3000()]))).toEqual(['B->A:1000', 'C->A:1000']);
    expect(rec(run(three, [expense(6_000, 'A', equal(['A', 'B', 'C']))]))).toEqual(['B->A:2000', 'C->A:2000']);
  });
  it('19. split change: same amount, different split -> different positions', () => {
    const eq = run(three, [expense(1_000, 'A', equal(['A', 'B', 'C']))]);
    const pc = run(three, [expense(1_000, 'A', { method: 'percentage', entries: [{ founderId: 'A', percent: 20 }, { founderId: 'B', percent: 30 }, { founderId: 'C', percent: 50 }] })]);
    expect(balances(eq)).toEqual([666, -333, -333]); // 1,000 / 3 = 334, 333, 333
    expect(balances(pc)).toEqual([800, -300, -500]);
    expect(rec(pc)).toEqual(['C->A:500', 'B->A:300']);
  });
  it('20. recommendations follow every change: settle, then raise the amount, then void', () => {
    const exp = e3000();
    const set = settlement(1_000, 'B', 'A');
    expect(rec(run(three, [exp, set]))).toEqual(['C->A:1000']);
    // raised to 6,000: each owes 2,000; B already paid 1,000 -> B owes 1,000, C owes 2,000, A is owed 3,000
    const raised = { ...exp, amountMinor: 6_000, split: withSplit(equal(['A', 'B', 'C']), 6_000) };
    expect(rec(run(three, [raised, set]))).toEqual(['C->A:2000', 'B->A:1000']);
    // expense voided: only B's 1,000 settlement remains -> B paid with nothing owed (flagged), A now "owes" it back
    const voided = run(three, [{ ...raised, status: 'voided' }, set]);
    expect(rec(voided)).toEqual(['A->B:1000']);
    expect(codes(voided, 'warning')).toEqual(['OVER_SETTLED', 'OVER_SETTLED']);
  });
});

describe('reconciliation output', () => {
  it('lists every check with a plain-language detail and keeps the sections distinct', () => {
    const r = run(three, [e3000(), reimbursement(1_000, 'A')]);
    const rc = r.reconciliation;
    expect(rc.checks.map((c) => c.code)).toEqual(['FOUNDER_BALANCES_ZERO_SUM', 'SETTLEMENTS_ZERO_SUM', 'RECEIVABLE_EQUALS_PAYABLE', 'EXTERNAL_RECONCILES', 'FAIR_SHARE_RECONCILES', 'PAID_RECONCILES', 'RECOMMENDATIONS_CLEAR_BALANCES']);
    expect(rc.checks.every((c) => c.ok && c.detail.length > 10)).toBe(true);
    expect(rc).toMatchObject({ sumGrossNetPositionMinor: -1_000, externalMinor: 1_000, founderBalanceSumMinor: 0, totalReceivableMinor: 1_334, totalPayableMinor: 1_334, recommendedTotalMinor: 1_334 });
  });
  it('empty data is a clean PASS', () => {
    expect(run(three, []).reconciliation).toMatchObject({ status: 'PASS', externalMinor: 0, isBalanced: true });
  });
});
