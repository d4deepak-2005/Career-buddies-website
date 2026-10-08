/**
 * Phase 3 accounting review. Every expected number below is worked out by hand in the comments.
 * Labels refer to docs/PHASE-3-CALCULATION-SPEC.md.
 */
import { describe, expect, it } from 'vitest';
import { contribution, equal, expense, loan, pos, refund, reimbursement, run, settlement, three, tx, withSplit } from './calcFixtures';

const e3000 = () => expense(3_000, 'A', equal(['A', 'B', 'C'])); // A paid 3,000; each founder responsible for 1,000
const rec = (r: ReturnType<typeof run>) => r.recommendations.map((x) => `${x.payerFounderId}->${x.receiverFounderId}:${x.amountMinor}`);
const balances = (r: ReturnType<typeof run>) => r.founders.map((f) => f.outstandingMinor);
const codes = (r: ReturnType<typeof run>, level?: 'warning' | 'info') => r.warnings.filter((w) => !level || w.level === level).map((w) => w.code).sort();

describe('1-2. business expenses: equal and uneven', () => {
  it('equal: A paid 3,000, each responsible for 1,000 -> B and C each pay A 1,000', () => {
    const r = run(three, [e3000()]);
    expect(r.founders.map((f) => [f.paidMinor, f.fairShareMinor, f.grossNetPositionMinor])).toEqual([[3_000, 1_000, 2_000], [0, 1_000, -1_000], [0, 1_000, -1_000]]);
    expect(rec(r)).toEqual(['B->A:1000', 'C->A:1000']);
    expect(r.reconciliation).toMatchObject({ status: 'PASS', businessBorneMinor: 0, sumGrossNetPositionMinor: 0 });
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

describe('5, 12. reimbursement (Option C): linked to ONE expense; the reimbursed part is business-borne', () => {
  // All amounts are minor units. e3000(): A paid 3,000 and each of A, B, C is responsible for 1,000.
  it('Scenario A — 1,000 reimbursed against a 3,000 expense: only 2,000 is founder-funded, shared by the stored split', () => {
    const exp = e3000();
    const r = run(three, [exp, reimbursement(1_000, 'A', exp.id)]);
    // founder-funded 2,000 over weights 1000:1000:1000 -> 667 / 667 / 666 (largest remainder; first entries take the odd units)
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([667, 667, 666]);
    expect(r.founders.map((f) => f.paidMinor)).toEqual([2_000, 0, 0]);                 // A paid 3,000 and got 1,000 back
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([1_333, -667, -666]); // net = paid − fair share
    expect(r.founders.reduce((a, f) => a + f.grossNetPositionMinor, 0)).toBe(0);        // zero-sum, no exception
    expect(rec(r)).toEqual(['B->A:667', 'C->A:666']);
    expect(r.reconciliation).toMatchObject({ status: 'PASS', businessBorneMinor: 1_000, sumGrossNetPositionMinor: 0, isBalanced: true, unresolvedPayableMinor: 0 });
    expect(r.reconciliation.explanation).toMatch(/reimbursed by the business.*not recoverable from founders/);
  });
  it('Scenario B — the full 3,000 reimbursed: the expense is entirely business-borne, nobody owes anything', () => {
    const exp = e3000();
    const r = run(three, [exp, reimbursement(3_000, 'A', exp.id)]);
    expect(r.founders.map((f) => [f.paidMinor, f.fairShareMinor, f.grossNetPositionMinor, f.action])).toEqual([[0, 0, 0, 'settled'], [0, 0, 0, 'settled'], [0, 0, 0, 'settled']]);
    expect(r.recommendations).toEqual([]);
    expect(r.reconciliation).toMatchObject({ businessBorneMinor: 3_000, totalFairShareMinor: 0, status: 'PASS' });
    expect(r.expenses).toEqual([{ expenseId: exp.id, paidByFounderId: 'A', amountMinor: 3_000, reimbursedMinor: 3_000, founderFundedMinor: 0 }]);
  });
  it('Scenario C1 — E1 (A) and E2 (B) both equal 3-way; 1,000 reimbursed against E1 only', () => {
    const e1 = expense(3_000, 'A', equal(['A', 'B', 'C'])), e2 = expense(3_000, 'B', equal(['A', 'B', 'C']));
    const r = run(three, [e1, e2, reimbursement(1_000, 'A', e1.id)]);
    // E1 founder-funded 2,000 -> 667/667/666 ; E2 untouched 1,000 each -> fair 1,667 / 1,667 / 1,666
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([1_667, 1_667, 1_666]);
    expect(r.founders.map((f) => f.paidMinor)).toEqual([2_000, 3_000, 0]);
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([333, 1_333, -1_666]);
    expect(rec(r)).toEqual(['C->B:1333', 'C->A:333']);
    expect(r.expenses.map((x) => [x.expenseId === e1.id ? 'E1' : 'E2', x.reimbursedMinor, x.founderFundedMinor])).toEqual([['E1', 1_000, 2_000], ['E2', 0, 3_000]]);
  });
  it('Scenario C2 — E1 is A\'s own cost only: the reimbursement benefits only the founder who bore E1 (multiple expenses, different splits)', () => {
    const e1 = expense(3_000, 'A', equal(['A'])), e2 = expense(3_000, 'B', equal(['A', 'B', 'C']));
    const r = run(three, [e1, e2, reimbursement(1_000, 'A', e1.id)]);
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([3_000, 1_000, 1_000]); // A: 2,000 (E1 founder-funded) + 1,000 (E2)
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([-1_000, 2_000, -1_000]);
    expect(rec(r)).toEqual(['A->B:1000', 'C->B:1000']);
    expect(r.founders.reduce((a, f) => a + f.grossNetPositionMinor, 0)).toBe(0);
  });
  it('uneven split: the stored 50/30/20 allocations are the weights (10,000 by A, 2,000 reimbursed)', () => {
    const exp = expense(10_000, 'A', { method: 'percentage', entries: [{ founderId: 'A', percent: 50 }, { founderId: 'B', percent: 30 }, { founderId: 'C', percent: 20 }] });
    const r = run(three, [exp, reimbursement(2_000, 'A', exp.id)]);
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([4_000, 2_400, 1_600]); // 8,000 founder-funded at 50/30/20
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([4_000, -2_400, -1_600]);
  });
  it('multiple partial reimbursements for one expense are summed and allocated once (1,000 + 500)', () => {
    const exp = e3000();
    const r = run(three, [exp, reimbursement(1_000, 'A', exp.id, { transactionDate: '2026-05-01' }), reimbursement(500, 'A', exp.id, { transactionDate: '2026-05-02' })]);
    expect(r.expenses[0]).toMatchObject({ reimbursedMinor: 1_500, founderFundedMinor: 1_500 });
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([500, 500, 500]);
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([1_000, -500, -500]);
    expect(r.included['reimbursement']).toBe(2);
  });
  it('cumulative cap: a reimbursement that would push the total over the expense is excluded, deterministically (date order, input order irrelevant)', () => {
    const exp = e3000();
    const first = reimbursement(2_000, 'A', exp.id, { transactionDate: '2026-05-01' });
    const second = reimbursement(1_500, 'A', exp.id, { transactionDate: '2026-05-02' });
    for (const order of [[exp, first, second], [second, exp, first], [first, second, exp]]) {
      const r = run(three, order);
      expect(r.expenses[0]).toMatchObject({ reimbursedMinor: 2_000, founderFundedMinor: 1_000 });
      expect(codes(r, 'warning')).toEqual(['REIMBURSEMENT_EXCEEDS_EXPENSE']);
      expect(r.warnings[0]?.transactionId).toBe(second.id);
      expect(r.founders.map((f) => f.fairShareMinor)).toEqual([334, 333, 333]);
      expect(r.reconciliation.status).toBe('REVIEW');
    }
  });
  it('a single reimbursement larger than the expense is excluded (never clamped)', () => {
    const exp = e3000();
    const r = run(three, [exp, reimbursement(3_500, 'A', exp.id)]);
    expect(codes(r, 'warning')).toEqual(['REIMBURSEMENT_EXCEEDS_EXPENSE']);
    expect(r.expenses[0]?.reimbursedMinor).toBe(0);
    expect(r.founders.map((f) => f.grossNetPositionMinor)).toEqual([2_000, -1_000, -1_000]); // as if absent
  });
  it('a voided reimbursement restores the founder-funded amount (and recommendations recalculate)', () => {
    const exp = e3000(); const rb = reimbursement(1_000, 'A', exp.id);
    expect(rec(run(three, [exp, rb]))).toEqual(['B->A:667', 'C->A:666']);
    const voided = run(three, [exp, { ...rb, status: 'voided' }]);
    expect(voided.founders.map((f) => f.fairShareMinor)).toEqual([1_000, 1_000, 1_000]);
    expect(rec(voided)).toEqual(['B->A:1000', 'C->A:1000']);
    expect(voided.reconciliation.businessBorneMinor).toBe(0);
  });
  it('19. invalid / missing / deleted targets are excluded with a named warning, never guessed', () => {
    const exp = e3000();
    const pendingExpense = { ...expense(3_000, 'A', equal(['A', 'B', 'C'])), status: 'pending_approval' as const };
    const voidedExpense = { ...expense(3_000, 'A', equal(['A', 'B', 'C'])), status: 'voided' as const };
    const refundTx = refund(300, 'A', equal(['A', 'B']));
    const badSplit = { ...expense(3_000, 'A', equal(['A', 'B', 'C'])), split: { entries: [{ founderId: 'A', allocatedMinor: 1 }] } };
    const cases: Array<[string, ReturnType<typeof reimbursement>, string]> = [
      ['not linked', reimbursement(100, 'A', null), 'REIMBURSEMENT_NOT_LINKED'],
      ['target does not exist (e.g. deleted outside the app)', reimbursement(100, 'A', 'ghost-id'), 'REIMBURSEMENT_TARGET_MISSING'],
      ['target is not an expense', reimbursement(100, 'A', refundTx.id), 'REIMBURSEMENT_TARGET_INVALID'],
      ['target not approved (pending)', reimbursement(100, 'A', pendingExpense.id), 'REIMBURSEMENT_TARGET_NOT_OFFICIAL'],
      ['target voided', reimbursement(100, 'A', voidedExpense.id), 'REIMBURSEMENT_TARGET_NOT_OFFICIAL'],
      ['target itself invalid', reimbursement(100, 'A', badSplit.id), 'REIMBURSEMENT_TARGET_INVALID'],
      ['payer is not the expense payer', reimbursement(100, 'B', exp.id), 'REIMBURSEMENT_PAYER_MISMATCH'],
    ];
    for (const [label, rb, code] of cases) {
      const r = run(three, [exp, pendingExpense, voidedExpense, refundTx, badSplit, rb]);
      expect(r.warnings.filter((w) => w.transactionId === rb.id).map((w) => w.code), label).toEqual([code]);
      expect(r.expenses.find((x) => x.expenseId === exp.id)?.reimbursedMinor, label).toBe(0); // nothing was applied
      expect(r.reconciliation.checks.every((c) => c.ok), label).toBe(true);
    }
  });
  it('a reimbursement never counts as a second expense or a founder payment', () => {
    const exp = e3000();
    const r = run(three, [exp, reimbursement(3_000, 'A', exp.id)]);
    expect(r.included).toMatchObject({ business_expense: 1, reimbursement: 1 });
    expect(r.founders.map((f) => f.settledPaidMinor + f.settledReceivedMinor)).toEqual([0, 0, 0]);
    expect(r.reconciliation.totalPaidMinor + r.reconciliation.totalFairShareMinor).toBe(0);
  });
  it('founders who are not in the split never gain a share of the reduced expense', () => {
    const exp = expense(3_000, 'A', equal(['A', 'B']));
    const r = run(three, [exp, reimbursement(1_000, 'A', exp.id)]);
    expect(r.founders.map((f) => f.fairShareMinor)).toEqual([1_000, 1_000, 0]); // 2,000 over A and B
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
    expect(r.reconciliation.sumGrossNetPositionMinor).toBe(0); // still zero-sum: nothing was clamped
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
  it('22-24. settlement after a reimbursement: partial, then full; business-borne amount is unaffected', () => {
    const exp = e3000(); const rb = reimbursement(1_000, 'A', exp.id);
    const partial = run(three, [exp, rb, settlement(300, 'B', 'A')]);
    expect(pos(partial, 'B')).toMatchObject({ outstandingMinor: -367, settledPaidMinor: 300, settlementStatus: 'partially_settled' }); // owed 667
    expect(rec(partial)).toEqual(['C->A:666', 'B->A:367']); // largest debtor first
    const full = run(three, [exp, rb, settlement(667, 'B', 'A'), settlement(666, 'C', 'A')]);
    expect(full.founders.every((f) => f.outstandingMinor === 0 && f.action === 'settled')).toBe(true);
    expect(full.recommendations).toEqual([]);
    expect(full.reconciliation).toMatchObject({ status: 'PASS', businessBorneMinor: 1_000 });
    expect(full.reconciliation.totalFairShareMinor).toBe(2_000); // settlements are not expenses
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
    const baseTx = e3000();
    const base = run(three, [baseTx]);
    const noise = (['voided', 'pending_approval', 'draft', 'rejected'] as const).flatMap((status) => [
      { ...e3000(), status }, { ...settlement(1_000, 'B', 'A'), status }, { ...reimbursement(1_000, 'A', baseTx.id), status }, { ...refund(300, 'A', equal(['A', 'B'])), status }, { ...contribution(5, 'A'), status },
    ]);
    const r = run(three, [baseTx, ...noise]);
    expect(r.excluded.byStatus).toEqual({ voided: 5, pending_approval: 5, draft: 5, rejected: 5 });
    expect(r.founders).toEqual(base.founders);
    expect(r.reconciliation.businessBorneMinor).toBe(0);
    expect(r.reconciliation.status).toBe('PASS');
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
    const ex = e3000();
    const r = run(three, [ex, reimbursement(1_000, 'A', ex.id)]);
    const rc = r.reconciliation;
    expect(rc.checks.map((c) => c.code)).toEqual(['NET_POSITIONS_ZERO_SUM', 'SETTLEMENTS_ZERO_SUM', 'RECEIVABLE_EQUALS_PAYABLE', 'FAIR_SHARE_RECONCILES', 'PAID_RECONCILES', 'REIMBURSEMENTS_WITHIN_EXPENSES', 'RECOMMENDATIONS_CLEAR_BALANCES']);
    expect(rc.checks.every((c) => c.ok && c.detail.length > 10)).toBe(true);
    expect(rc).toMatchObject({ sumGrossNetPositionMinor: 0, businessBorneMinor: 1_000, totalReceivableMinor: 1_333, totalPayableMinor: 1_333, recommendedTotalMinor: 1_333 });
  });
  it('empty data is a clean PASS', () => {
    expect(run(three, []).reconciliation).toMatchObject({ status: 'PASS', businessBorneMinor: 0, isBalanced: true });
  });
});
