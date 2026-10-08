/**
 * Founder-finance calculation engine (Phase 3) — the SINGLE source of truth for fair share, paid,
 * net position, outstanding balances and settlement recommendations.
 *
 * Pure: no I/O, no clock, no floating point. Input is stored transaction + founder data; output is a
 * typed, reproducible result. The frontend only displays it. Every rule, and whether it comes from the
 * PDF or is an implementation assumption, is documented in docs/PHASE-3-CALCULATION-SPEC.md.
 */
import { recommendSettlements, type SettlementRecommendation } from './settlementAlgorithm';
import { allocateByWeights } from './splits';
import type { TransactionStatus, TransactionType } from './transactionRules';

/** Only approved transactions are official (PDF §11; spec C-2). */
export const OFFICIAL_STATUSES: readonly TransactionStatus[] = ['approved'];

export interface CalcFounder { id: string; name: string; active: boolean }

export interface CalcTransaction {
  id: string;
  txnNumber?: string;
  type: TransactionType;
  status: TransactionStatus;
  amountMinor: number;
  paidByFounderId?: string | null;
  counterpartyFounderId?: string | null;
  /** Stored, already-resolved split (domain/splits.ts). Never re-resolved here. */
  split?: { entries: ReadonlyArray<{ founderId: string; allocatedMinor: number }> } | null;
}

export type PositionAction = 'receive' | 'pay' | 'settled';
export type SettlementStatus = 'settled' | 'partially_settled' | 'open';

export interface FounderFinancialPosition {
  founderId: string;
  founderName: string;
  active: boolean;
  expensePaidMinor: number;
  refundReceivedMinor: number;
  reimbursedMinor: number;
  /** expensePaid − refundReceived − reimbursed ("Paid") */
  paidMinor: number;
  /** Capital put in by the founder. Tracked separately; never part of paid / fair share / net (spec C-6). */
  contributionMinor: number;
  /** Approved loan principal. Repayment is not modelled (Phase 3 limitation). */
  loanOutstandingMinor: number;
  fairShareMinor: number;
  /** paid − fairShare. Formula INFERRED FROM THE PDF's §9 example. Includes the business-funded effect (see below). */
  grossNetPositionMinor: number;
  /**
   * This founder's share of amounts paid from business funds (reimbursements). It is NOT owed to any founder
   * and is never settled between founders. Zero when there are no reimbursements.
   */
  businessFundedShareMinor: number;
  /** grossNet + businessFundedShare — what the founders owe EACH OTHER before settlements. Sums to 0 across founders. */
  founderBalanceMinor: number;
  settledPaidMinor: number;
  settledReceivedMinor: number;
  /** founderBalance + settledPaid − settledReceived (signed). Positive = should receive from founders, negative = should pay founders. */
  outstandingMinor: number;
  outstandingReceivableMinor: number;
  outstandingPayableMinor: number;
  /** Amount by which settlements moved this founder past zero (they paid / received more than was due). 0 when none. */
  overSettledMinor: number;
  action: PositionAction;
  settlementStatus: SettlementStatus;
}

export type EffectKind =
  | 'expense_paid' | 'expense_share' | 'refund_received' | 'refund_share' | 'reimbursement_received'
  | 'contribution' | 'loan' | 'settlement_paid' | 'settlement_received';

/** One traceable contribution of one official transaction to one founder's figures. */
export interface LedgerEffect { founderId: string; transactionId: string; kind: EffectKind; amountMinor: number }

export interface CalcWarning {
  code: string;
  /** `warning` = needs attention; `info` = diagnostic only (e.g. an "Other" transaction that is not calculated). */
  level: 'warning' | 'info';
  transactionId: string | null;
  founderId?: string | null;
  message: string;
}

export type ReconciliationStatus = 'PASS' | 'PASS_WITH_EXTERNAL' | 'REVIEW' | 'FAIL';

export interface ReconciliationCheck { code: string; ok: boolean; detail: string }

export interface Reconciliation {
  /**
   * PASS               — founder balances reconcile, nothing external, no warnings.
   * PASS_WITH_EXTERNAL — founder balances reconcile; an external (business-funded) amount exists and is explained.
   * REVIEW             — arithmetic reconciles, but warnings (invalid records, over-settlement, refund/reimbursement anomalies) need attention.
   * FAIL               — an arithmetic invariant is violated (should never happen; indicates a bug).
   */
  status: ReconciliationStatus;
  explanation: string;
  checks: ReconciliationCheck[];

  totalPaidMinor: number;
  totalFairShareMinor: number;
  /** Σ (paid − fairShare). Equals −externalMinor: the ONLY reason it is not 0 is business-funded reimbursements. */
  sumGrossNetPositionMinor: number;
  /** Paid from business funds (valid approved reimbursements). External: never owed to / by a founder, never settled between founders. */
  externalMinor: number;
  /** Σ founderBalance. Always 0 (founder-to-founder obligations are zero-sum). */
  founderBalanceSumMinor: number;

  /** Founder-to-founder receivable / payable after settlements (equal when reconciled). */
  totalReceivableMinor: number;
  totalPayableMinor: number;
  recommendedTotalMinor: number;
  unresolvedPayableMinor: number;
  unresolvedReceivableMinor: number;
  /** True when founder receivables equal founder payables. Independent of any external amount. */
  isBalanced: boolean;
}

export interface CalculationResult {
  founders: FounderFinancialPosition[];
  recommendations: SettlementRecommendation[];
  effects: LedgerEffect[];
  reconciliation: Reconciliation;
  included: Record<string, number>;
  excluded: { byStatus: Record<string, number>; unclassifiedOther: number; invalid: number };
  warnings: CalcWarning[];
}

const isPositiveMoney = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0;
const isNonNegativeMoney = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

function add(a: number, b: number): number {
  const s = a + b;
  if (!Number.isSafeInteger(s)) throw new RangeError('Monetary total exceeds the safe integer range');
  return s;
}

interface Acc {
  expensePaid: number; refundReceived: number; reimbursed: number; contribution: number; loan: number;
  expenseShare: number; refundShare: number; settledPaid: number; settledReceived: number;
}
const emptyAcc = (): Acc => ({ expensePaid: 0, refundReceived: 0, reimbursed: 0, contribution: 0, loan: 0, expenseShare: 0, refundShare: 0, settledPaid: 0, settledReceived: 0 });

export function calculate(input: { founders: readonly CalcFounder[]; transactions: readonly CalcTransaction[] }): CalculationResult {
  const known = new Map(input.founders.map((f) => [f.id, f]));
  const acc = new Map(input.founders.map((f) => [f.id, emptyAcc()]));
  const effects: LedgerEffect[] = [];
  const warnings: CalcWarning[] = [];
  const included: Record<string, number> = {};
  const excluded = { byStatus: {} as Record<string, number>, unclassifiedOther: 0, invalid: 0 };

  const reject = (t: CalcTransaction, code: string, message: string) => {
    excluded.invalid += 1;
    warnings.push({ code, level: 'warning', transactionId: t.id, message });
  };

  for (const t of input.transactions) {
    if (!OFFICIAL_STATUSES.includes(t.status)) {
      excluded.byStatus[t.status] = (excluded.byStatus[t.status] ?? 0) + 1;
      continue;
    }
    if (t.type === 'other') {
      // Diagnostic only: counted so it is visible, but its amount is NEVER added to any figure (spec: "Other" has no accounting meaning in the PDF).
      excluded.unclassifiedOther += 1;
      warnings.push({ code: 'OTHER_NOT_CALCULATED', level: 'info', transactionId: t.id, message: 'An "Other" transaction is not included in any calculation' });
      continue;
    }
    if (!isPositiveMoney(t.amountMinor)) { reject(t, 'INVALID_AMOUNT', 'Amount must be a positive whole number of minor units'); continue; }

    const payer = t.paidByFounderId ? t.paidByFounderId : undefined;
    if (!payer || !known.has(payer)) { reject(t, 'UNKNOWN_FOUNDER', `${t.type} needs a known paid-by founder`); continue; }

    // Collect this transaction's effects first; commit only if the whole transaction is valid.
    const fx: LedgerEffect[] = [];
    const push = (founderId: string, kind: EffectKind, amountMinor: number) => fx.push({ founderId, transactionId: t.id, kind, amountMinor });

    if (t.type === 'business_expense' || t.type === 'refund') {
      const entries = t.split?.entries ?? [];
      if (entries.length === 0) { reject(t, 'MISSING_SPLIT', `${t.type} has no stored split`); continue; }
      let sum = 0;
      let bad: string | null = null;
      const seen = new Set<string>();
      for (const e of entries) {
        if (!known.has(e.founderId)) bad = 'split references an unknown founder';
        else if (!isNonNegativeMoney(e.allocatedMinor)) bad = 'split contains an invalid allocation';
        else if (seen.has(e.founderId)) bad = 'split lists a founder twice';
        else { seen.add(e.founderId); sum = add(sum, e.allocatedMinor); }
        if (bad) break;
      }
      if (!bad && sum !== t.amountMinor) bad = `split allocations (${sum}) do not add up to the amount (${t.amountMinor})`;
      if (bad) { reject(t, 'INVALID_SPLIT', bad); continue; }
      if (t.type === 'business_expense') {
        push(payer, 'expense_paid', t.amountMinor);
        for (const e of entries) if (e.allocatedMinor > 0) push(e.founderId, 'expense_share', e.allocatedMinor);
      } else {
        push(payer, 'refund_received', t.amountMinor);
        for (const e of entries) if (e.allocatedMinor > 0) push(e.founderId, 'refund_share', e.allocatedMinor);
      }
    } else if (t.type === 'founder_contribution') {
      push(payer, 'contribution', t.amountMinor);
    } else if (t.type === 'founder_loan') {
      push(payer, 'loan', t.amountMinor);
    } else if (t.type === 'reimbursement') {
      push(payer, 'reimbursement_received', t.amountMinor);
    } else if (t.type === 'settlement') {
      const receiver = t.counterpartyFounderId ?? undefined;
      if (!receiver || !known.has(receiver)) { reject(t, 'UNKNOWN_FOUNDER', 'settlement needs a known receiving founder'); continue; }
      if (receiver === payer) { reject(t, 'SAME_FOUNDER', 'settlement payer and receiver must differ'); continue; }
      push(payer, 'settlement_paid', t.amountMinor);
      push(receiver, 'settlement_received', t.amountMinor);
    } else {
      reject(t, 'UNSUPPORTED_TYPE', `unsupported type ${String(t.type)}`);
      continue;
    }

    included[t.type] = (included[t.type] ?? 0) + 1;
    for (const e of fx) {
      effects.push(e);
      const a = acc.get(e.founderId)!;
      switch (e.kind) {
        case 'expense_paid': a.expensePaid = add(a.expensePaid, e.amountMinor); break;
        case 'expense_share': a.expenseShare = add(a.expenseShare, e.amountMinor); break;
        case 'refund_received': a.refundReceived = add(a.refundReceived, e.amountMinor); break;
        case 'refund_share': a.refundShare = add(a.refundShare, e.amountMinor); break;
        case 'reimbursement_received': a.reimbursed = add(a.reimbursed, e.amountMinor); break;
        case 'contribution': a.contribution = add(a.contribution, e.amountMinor); break;
        case 'loan': a.loan = add(a.loan, e.amountMinor); break;
        case 'settlement_paid': a.settledPaid = add(a.settledPaid, e.amountMinor); break;
        case 'settlement_received': a.settledReceived = add(a.settledReceived, e.amountMinor); break;
      }
    }
  }

  // ---- Layer 1: what each founder paid and is responsible for (PDF §9: net = paid − fair share, inferred from the example).
  const base = input.founders.map((f) => {
    const a = acc.get(f.id)!;
    const paid = a.expensePaid - a.refundReceived - a.reimbursed;
    const fair = a.expenseShare - a.refundShare;
    return { f, a, paid, fair, gross: paid - fair };
  });

  // ---- Layer 2: split out the business-funded (external) amount so founder-to-founder balances stay zero-sum.
  // Reimbursements come from business money, not from another founder, so founders owe nothing TO EACH OTHER for them.
  // The business-funded total R is attributed to founders in proportion to their fair share (largest-remainder rounding,
  // same helper as Phase 2). Fallbacks: no positive fair shares -> attribute to the reimbursed founders themselves.
  // IMPLEMENTATION ASSUMPTION — see docs/PHASE-3-CALCULATION-SPEC.md §6.
  const externalTotal = base.reduce((s2, b) => add(s2, b.a.reimbursed), 0);
  const externalShare = new Map<string, number>(base.map((b) => [b.f.id, 0]));
  if (externalTotal > 0) {
    let weighted = base.filter((b) => b.fair > 0).map((b) => ({ id: b.f.id, w: b.fair }));
    if (weighted.length === 0) weighted = base.filter((b) => b.a.reimbursed > 0).map((b) => ({ id: b.f.id, w: b.a.reimbursed }));
    const parts = allocateByWeights(externalTotal, weighted.map((x) => x.w));
    weighted.forEach((x, i) => externalShare.set(x.id, parts[i] ?? 0));
  }

  const founders: FounderFinancialPosition[] = base.map(({ f, a, paid, fair, gross }) => {
    const share = externalShare.get(f.id) ?? 0;
    const founderBalance = gross + share;
    const outstanding = founderBalance + a.settledPaid - a.settledReceived;
    const activity = a.settledPaid + a.settledReceived > 0;
    // Over-settlement: settlements pushed the founder past zero (paid or received more than was due).
    const overSettled = founderBalance > 0 && outstanding < 0 ? -outstanding : founderBalance < 0 && outstanding > 0 ? outstanding : founderBalance === 0 ? Math.abs(outstanding) : 0;
    return {
      founderId: f.id, founderName: f.name, active: f.active,
      expensePaidMinor: a.expensePaid, refundReceivedMinor: a.refundReceived, reimbursedMinor: a.reimbursed,
      paidMinor: paid, contributionMinor: a.contribution, loanOutstandingMinor: a.loan,
      fairShareMinor: fair, grossNetPositionMinor: gross,
      businessFundedShareMinor: share, founderBalanceMinor: founderBalance,
      settledPaidMinor: a.settledPaid, settledReceivedMinor: a.settledReceived,
      outstandingMinor: outstanding,
      outstandingReceivableMinor: Math.max(outstanding, 0),
      outstandingPayableMinor: Math.max(-outstanding, 0),
      overSettledMinor: overSettled,
      action: outstanding > 0 ? 'receive' : outstanding < 0 ? 'pay' : 'settled',
      settlementStatus: outstanding === 0 ? 'settled' : activity ? 'partially_settled' : 'open',
    } satisfies FounderFinancialPosition;
  });

  // ---- Diagnostics that do not exclude anything (the records are structurally valid, but the data looks inconsistent).
  const sumEffects = (kind: EffectKind) => effects.reduce((s2, e) => (e.kind === kind ? add(s2, e.amountMinor) : s2), 0);
  const totalExpense = sumEffects('expense_paid');
  const totalRefund = sumEffects('refund_received');
  if (totalRefund > totalExpense) warnings.push({ code: 'REFUNDS_EXCEED_EXPENSES', level: 'warning', transactionId: null, message: 'Approved refunds are larger than approved expenses' });
  if (externalTotal > 0 && externalTotal > totalExpense - totalRefund) warnings.push({ code: 'REIMBURSEMENTS_EXCEED_EXPENSES', level: 'warning', transactionId: null, message: 'Approved reimbursements are larger than the expenses they could cover' });
  for (const p of founders) {
    if (p.fairShareMinor < 0) warnings.push({ code: 'NEGATIVE_FAIR_SHARE', level: 'warning', transactionId: null, founderId: p.founderId, message: `${p.founderName}'s refunds exceed their share of expenses` });
    if (p.reimbursedMinor > p.expensePaidMinor) warnings.push({ code: 'REIMBURSED_MORE_THAN_PAID', level: 'warning', transactionId: null, founderId: p.founderId, message: `${p.founderName} was reimbursed more than the expenses recorded as paid by them` });
    if (p.overSettledMinor > 0) warnings.push({ code: 'OVER_SETTLED', level: 'warning', transactionId: null, founderId: p.founderId, message: `Settlements moved ${p.founderName} past zero (they paid or received more than was due)` });
  }

  const rec = recommendSettlements(founders.map((p) => ({ founderId: p.founderId, outstandingMinor: p.outstandingMinor })));
  const sum = (f: (p: FounderFinancialPosition) => number) => founders.reduce((s2, p) => add(s2, f(p)), 0);
  const recommendedTotal = rec.recommendations.reduce((s2, r) => add(s2, r.amountMinor), 0);

  const totalPaid = sum((p) => p.paidMinor);
  const totalFair = sum((p) => p.fairShareMinor);
  const sumGross = sum((p) => p.grossNetPositionMinor);
  const founderBalanceSum = sum((p) => p.founderBalanceMinor);
  const totalReceivable = sum((p) => p.outstandingReceivableMinor);
  const totalPayable = sum((p) => p.outstandingPayableMinor);
  const check = (code: string, ok: boolean, detail: string): ReconciliationCheck => ({ code, ok, detail });
  const checks: ReconciliationCheck[] = [
    check('FOUNDER_BALANCES_ZERO_SUM', founderBalanceSum === 0, 'Founder-to-founder balances add up to zero'),
    check('SETTLEMENTS_ZERO_SUM', sum((p) => p.settledPaidMinor) === sum((p) => p.settledReceivedMinor), 'Money settled out equals money settled in'),
    check('RECEIVABLE_EQUALS_PAYABLE', totalReceivable === totalPayable, 'Founder receivables equal founder payables'),
    check('EXTERNAL_RECONCILES', sumGross === -externalTotal, 'Paid − fair share across founders equals minus the business-funded amount'),
    check('FAIR_SHARE_RECONCILES', totalFair === totalExpense - totalRefund, 'Fair shares add up to expenses minus refunds'),
    check('PAID_RECONCILES', totalPaid === totalExpense - totalRefund - externalTotal, 'Paid adds up to expenses minus refunds minus business-funded amounts'),
    check('RECOMMENDATIONS_CLEAR_BALANCES', recommendedTotal === totalPayable && rec.unresolvedPayableMinor === 0 && rec.unresolvedReceivableMinor === 0, 'Recommended payments clear every founder balance exactly'),
  ];
  const failed = checks.filter((c) => !c.ok);
  const needsReview = warnings.some((w) => w.level === 'warning');
  const status: ReconciliationStatus = failed.length > 0 ? 'FAIL' : needsReview ? 'REVIEW' : externalTotal > 0 ? 'PASS_WITH_EXTERNAL' : 'PASS';
  const explanation =
    status === 'FAIL' ? `Internal check failed: ${failed.map((c) => c.code).join(', ')}`
    : status === 'REVIEW' ? 'Balances reconcile, but some records or settlements need attention (see warnings)'
    : status === 'PASS_WITH_EXTERNAL' ? 'Balances reconcile. Part of the expenses was paid from business funds (reimbursements); that amount is shown separately and is not owed between founders'
    : 'Balances reconcile';

  return {
    founders,
    recommendations: rec.recommendations,
    effects,
    reconciliation: {
      status, explanation, checks,
      totalPaidMinor: totalPaid, totalFairShareMinor: totalFair, sumGrossNetPositionMinor: sumGross,
      externalMinor: externalTotal, founderBalanceSumMinor: founderBalanceSum,
      totalReceivableMinor: totalReceivable, totalPayableMinor: totalPayable,
      recommendedTotalMinor: recommendedTotal,
      unresolvedPayableMinor: rec.unresolvedPayableMinor, unresolvedReceivableMinor: rec.unresolvedReceivableMinor,
      isBalanced: totalReceivable === totalPayable,
    },
    included,
    excluded,
    warnings,
  };
}
