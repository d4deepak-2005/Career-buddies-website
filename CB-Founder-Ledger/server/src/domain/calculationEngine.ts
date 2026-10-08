/**
 * Founder-finance calculation engine (Phase 3) — the SINGLE source of truth for fair share, paid,
 * net position, outstanding balances and settlement recommendations.
 *
 * Pure: no I/O, no clock, no floating point. Input is stored transaction + founder data; output is a
 * typed, reproducible result. The frontend only displays it. Every rule, and whether it comes from the
 * PDF or is an implementation assumption, is documented in docs/PHASE-3-CALCULATION-SPEC.md.
 *
 * Reimbursement policy (Option C, product decision): a reimbursement is linked to ONE expense and the
 * reimbursed portion is BUSINESS-BORNE — it is not recoverable from founders. For each expense:
 *   founderFunded = amount − Σ valid linked reimbursements
 * and each founder's responsibility is the expense's stored split scaled to `founderFunded`
 * (largest-remainder rounding, the Phase 2 helper). Net positions therefore always sum to exactly 0.
 */
import { recommendSettlements, type SettlementRecommendation } from './settlementAlgorithm';
import { allocateByWeights } from './splits';
import type { TransactionStatus, TransactionType } from './transactionRules';

/** Only approved transactions are official (PDF §11; spec IA-2). */
export const OFFICIAL_STATUSES: readonly TransactionStatus[] = ['approved'];

export interface CalcFounder { id: string; name: string; active: boolean }

export interface CalcTransaction {
  id: string;
  txnNumber?: string;
  /** ISO date (YYYY-MM-DD). Only used to order competing reimbursements deterministically. */
  transactionDate?: string;
  type: TransactionType;
  status: TransactionStatus;
  amountMinor: number;
  paidByFounderId?: string | null;
  counterpartyFounderId?: string | null;
  /** Reimbursement only: the expense it reimburses. */
  reimbursesTransactionId?: string | null;
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
  /** Money this founder received back from the business for expenses they paid personally (linked reimbursements). */
  reimbursedMinor: number;
  /** expensePaid − refundReceived − reimbursed ("Paid") */
  paidMinor: number;
  /** Capital put in by the founder. Tracked separately; never part of paid / fair share / net. */
  contributionMinor: number;
  /** Approved loan principal. Repayment is not modelled (Phase 3 limitation). */
  loanOutstandingMinor: number;
  /** Share of the FOUNDER-FUNDED part of expenses (expenses − business-borne reimbursements − refunds). */
  fairShareMinor: number;
  /**
   * Net position = paid − fairShare (INFERRED FROM THE PDF's §9 example, not an explicit PDF formula).
   * Zero-sum across founders. (The name keeps the earlier "gross" prefix for API stability; there is no longer a
   * separate "net of external amount" figure.)
   */
  grossNetPositionMinor: number;
  settledPaidMinor: number;
  settledReceivedMinor: number;
  /** net + settledPaid − settledReceived (signed). Positive = should receive from founders, negative = should pay founders. */
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

export type ReconciliationStatus = 'PASS' | 'REVIEW' | 'FAIL';

export interface ReconciliationCheck { code: string; ok: boolean; detail: string }

export interface Reconciliation {
  /**
   * PASS   — every check reconciles and there are no warnings.
   * REVIEW — arithmetic reconciles, but warnings (invalid records, over-settlement, refund anomalies) need attention.
   * FAIL   — an arithmetic invariant is violated (should never happen; indicates a bug).
   */
  status: ReconciliationStatus;
  explanation: string;
  checks: ReconciliationCheck[];

  totalPaidMinor: number;
  totalFairShareMinor: number;
  /** Σ (paid − fairShare). Always 0. */
  sumGrossNetPositionMinor: number;
  /** Informational: Σ valid linked reimbursements. Paid by the business; NOT recoverable from founders; not a balance. */
  businessBorneMinor: number;

  /** Founder receivables / payables after settlements (equal when reconciled). */
  totalReceivableMinor: number;
  totalPayableMinor: number;
  recommendedTotalMinor: number;
  unresolvedPayableMinor: number;
  unresolvedReceivableMinor: number;
  isBalanced: boolean;
}

/** Per-expense view of the reimbursement policy: founderFunded = amount − reimbursed. */
export interface ExpenseBreakdown {
  expenseId: string;
  paidByFounderId: string;
  amountMinor: number;
  reimbursedMinor: number;
  founderFundedMinor: number;
}

export interface CalculationResult {
  founders: FounderFinancialPosition[];
  recommendations: SettlementRecommendation[];
  effects: LedgerEffect[];
  expenses: ExpenseBreakdown[];
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

interface ValidExpense { t: CalcTransaction; payer: string; entries: ReadonlyArray<{ founderId: string; allocatedMinor: number }>; reimbursed: number }

const compareReimbursements = (a: CalcTransaction, b: CalcTransaction) =>
  (a.transactionDate ?? '').localeCompare(b.transactionDate ?? '') || (a.txnNumber ?? '').localeCompare(b.txnNumber ?? '') || a.id.localeCompare(b.id);

export function calculate(input: { founders: readonly CalcFounder[]; transactions: readonly CalcTransaction[] }): CalculationResult {
  const known = new Map(input.founders.map((f) => [f.id, f]));
  const acc = new Map(input.founders.map((f) => [f.id, emptyAcc()]));
  const effects: LedgerEffect[] = [];
  const warnings: CalcWarning[] = [];
  const included: Record<string, number> = {};
  const excluded = { byStatus: {} as Record<string, number>, unclassifiedOther: 0, invalid: 0 };
  const byId = new Map(input.transactions.map((t) => [t.id, t]));

  const reject = (t: CalcTransaction, code: string, message: string) => {
    excluded.invalid += 1;
    warnings.push({ code, level: 'warning', transactionId: t.id, message });
  };

  const validExpenses = new Map<string, ValidExpense>();
  const pendingReimbursements: Array<{ t: CalcTransaction; payer: string }> = [];

  // ---- Pass 1: validate every official transaction. Expenses and reimbursements are applied in pass 2 (they depend on each other).
  for (const t of input.transactions) {
    if (!OFFICIAL_STATUSES.includes(t.status)) {
      excluded.byStatus[t.status] = (excluded.byStatus[t.status] ?? 0) + 1;
      continue;
    }
    if (t.type === 'other') {
      // Diagnostic only: counted so it is visible, but its amount is NEVER added to any figure (the PDF gives "Other" no accounting meaning).
      excluded.unclassifiedOther += 1;
      warnings.push({ code: 'OTHER_NOT_CALCULATED', level: 'info', transactionId: t.id, message: 'An "Other" transaction is not included in any calculation' });
      continue;
    }
    if (!isPositiveMoney(t.amountMinor)) { reject(t, 'INVALID_AMOUNT', 'Amount must be a positive whole number of minor units'); continue; }

    const payer = t.paidByFounderId ? t.paidByFounderId : undefined;
    if (!payer || !known.has(payer)) { reject(t, 'UNKNOWN_FOUNDER', `${t.type} needs a known paid-by founder`); continue; }

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
        validExpenses.set(t.id, { t, payer, entries, reimbursed: 0 }); // applied in pass 2
        included[t.type] = (included[t.type] ?? 0) + 1;
        continue;
      }
      push(payer, 'refund_received', t.amountMinor);
      for (const e of entries) if (e.allocatedMinor > 0) push(e.founderId, 'refund_share', e.allocatedMinor);
    } else if (t.type === 'founder_contribution') {
      push(payer, 'contribution', t.amountMinor);
    } else if (t.type === 'founder_loan') {
      push(payer, 'loan', t.amountMinor);
    } else if (t.type === 'reimbursement') {
      pendingReimbursements.push({ t, payer }); // validated against its expense in pass 2
      continue;
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
    effects.push(...fx);
  }

  // ---- Pass 2a: link each reimbursement to its expense. Never guess: anything that does not link cleanly is excluded with a warning.
  const reimbEffects: LedgerEffect[] = [];
  for (const { t, payer } of [...pendingReimbursements].sort((a, b) => compareReimbursements(a.t, b.t))) {
    const targetId = t.reimbursesTransactionId ?? undefined;
    if (!targetId) { reject(t, 'REIMBURSEMENT_NOT_LINKED', 'A reimbursement must be linked to the expense it reimburses'); continue; }
    const target = byId.get(targetId);
    if (!target) { reject(t, 'REIMBURSEMENT_TARGET_MISSING', 'The linked expense does not exist'); continue; }
    if (target.type !== 'business_expense') { reject(t, 'REIMBURSEMENT_TARGET_INVALID', 'A reimbursement can only be linked to a business expense'); continue; }
    if (!OFFICIAL_STATUSES.includes(target.status)) { reject(t, 'REIMBURSEMENT_TARGET_NOT_OFFICIAL', 'The linked expense is not approved (or has been voided), so there is nothing to reimburse'); continue; }
    const exp = validExpenses.get(targetId);
    if (!exp) { reject(t, 'REIMBURSEMENT_TARGET_INVALID', 'The linked expense is invalid and is excluded from the calculation'); continue; }
    if (exp.payer !== payer) { reject(t, 'REIMBURSEMENT_PAYER_MISMATCH', 'The reimbursed founder must be the founder who paid the expense'); continue; }
    if (exp.reimbursed + t.amountMinor > exp.t.amountMinor) {
      reject(t, 'REIMBURSEMENT_EXCEEDS_EXPENSE', 'Reimbursements for this expense would exceed the expense amount');
      continue;
    }
    exp.reimbursed = add(exp.reimbursed, t.amountMinor);
    included['reimbursement'] = (included['reimbursement'] ?? 0) + 1;
    reimbEffects.push({ founderId: payer, transactionId: t.id, kind: 'reimbursement_received', amountMinor: t.amountMinor });
  }

  // ---- Pass 2b: apply each expense. Founder-funded = amount − Σ reimbursements, shared by the stored split (largest remainder).
  const breakdown: ExpenseBreakdown[] = [];
  let businessBorne = 0;
  for (const exp of validExpenses.values()) {
    const { t, payer, entries } = exp;
    const founderFunded = t.amountMinor - exp.reimbursed;
    businessBorne = add(businessBorne, exp.reimbursed);
    breakdown.push({ expenseId: t.id, paidByFounderId: payer, amountMinor: t.amountMinor, reimbursedMinor: exp.reimbursed, founderFundedMinor: founderFunded });
    effects.push({ founderId: payer, transactionId: t.id, kind: 'expense_paid', amountMinor: t.amountMinor });
    const sharing = entries.filter((e) => e.allocatedMinor > 0);
    const shares = exp.reimbursed === 0
      ? sharing.map((e) => e.allocatedMinor)
      : founderFunded > 0 ? allocateByWeights(founderFunded, sharing.map((e) => e.allocatedMinor)) : sharing.map(() => 0);
    sharing.forEach((e, i) => { if ((shares[i] ?? 0) > 0) effects.push({ founderId: e.founderId, transactionId: t.id, kind: 'expense_share', amountMinor: shares[i]! }); });
  }
  effects.push(...reimbEffects);

  for (const e of effects) {
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

  // ---- Founder positions. Net position = paid − fair share (INFERRED FROM PDF EXAMPLE).
  const founders: FounderFinancialPosition[] = input.founders.map((f) => {
    const a = acc.get(f.id)!;
    const paid = a.expensePaid - a.refundReceived - a.reimbursed;
    const fair = a.expenseShare - a.refundShare;
    const net = paid - fair;
    const outstanding = net + a.settledPaid - a.settledReceived;
    const activity = a.settledPaid + a.settledReceived > 0;
    // Over-settlement: settlements pushed the founder past zero (paid or received more than was due).
    const overSettled = net > 0 && outstanding < 0 ? -outstanding : net < 0 && outstanding > 0 ? outstanding : net === 0 ? Math.abs(outstanding) : 0;
    return {
      founderId: f.id, founderName: f.name, active: f.active,
      expensePaidMinor: a.expensePaid, refundReceivedMinor: a.refundReceived, reimbursedMinor: a.reimbursed,
      paidMinor: paid, contributionMinor: a.contribution, loanOutstandingMinor: a.loan,
      fairShareMinor: fair, grossNetPositionMinor: net,
      settledPaidMinor: a.settledPaid, settledReceivedMinor: a.settledReceived,
      outstandingMinor: outstanding,
      outstandingReceivableMinor: Math.max(outstanding, 0),
      outstandingPayableMinor: Math.max(-outstanding, 0),
      overSettledMinor: overSettled,
      action: outstanding > 0 ? 'receive' : outstanding < 0 ? 'pay' : 'settled',
      settlementStatus: outstanding === 0 ? 'settled' : activity ? 'partially_settled' : 'open',
    } satisfies FounderFinancialPosition;
  });

  // ---- Diagnostics that do not exclude anything (the records are valid, but the data looks inconsistent).
  const sumEffects = (kind: EffectKind) => effects.reduce((s, e) => (e.kind === kind ? add(s, e.amountMinor) : s), 0);
  const totalExpense = sumEffects('expense_paid');
  const totalRefund = sumEffects('refund_received');
  if (totalRefund > totalExpense) warnings.push({ code: 'REFUNDS_EXCEED_EXPENSES', level: 'warning', transactionId: null, message: 'Approved refunds are larger than approved expenses' });
  for (const p of founders) {
    if (p.fairShareMinor < 0) warnings.push({ code: 'NEGATIVE_FAIR_SHARE', level: 'warning', transactionId: null, founderId: p.founderId, message: `${p.founderName}'s refunds exceed their share of expenses` });
    if (p.overSettledMinor > 0) warnings.push({ code: 'OVER_SETTLED', level: 'warning', transactionId: null, founderId: p.founderId, message: `Settlements moved ${p.founderName} past zero (they paid or received more than was due)` });
  }

  const rec = recommendSettlements(founders.map((p) => ({ founderId: p.founderId, outstandingMinor: p.outstandingMinor })));
  const sum = (f: (p: FounderFinancialPosition) => number) => founders.reduce((s, p) => add(s, f(p)), 0);
  const recommendedTotal = rec.recommendations.reduce((s, r) => add(s, r.amountMinor), 0);

  const totalPaid = sum((p) => p.paidMinor);
  const totalFair = sum((p) => p.fairShareMinor);
  const sumNet = sum((p) => p.grossNetPositionMinor);
  const totalReceivable = sum((p) => p.outstandingReceivableMinor);
  const totalPayable = sum((p) => p.outstandingPayableMinor);
  const check = (code: string, ok: boolean, detail: string): ReconciliationCheck => ({ code, ok, detail });
  const checks: ReconciliationCheck[] = [
    check('NET_POSITIONS_ZERO_SUM', sumNet === 0, 'Founder net positions (paid − fair share) add up to zero'),
    check('SETTLEMENTS_ZERO_SUM', sum((p) => p.settledPaidMinor) === sum((p) => p.settledReceivedMinor), 'Money settled out equals money settled in'),
    check('RECEIVABLE_EQUALS_PAYABLE', totalReceivable === totalPayable, 'Founder receivables equal founder payables'),
    check('FAIR_SHARE_RECONCILES', totalFair === totalExpense - businessBorne - totalRefund, 'Fair shares add up to expenses minus business-borne reimbursements minus refunds'),
    check('PAID_RECONCILES', totalPaid === totalExpense - totalRefund - businessBorne, 'Paid adds up to expenses minus refunds minus business-borne reimbursements'),
    check('REIMBURSEMENTS_WITHIN_EXPENSES', breakdown.every((b) => b.reimbursedMinor <= b.amountMinor && b.founderFundedMinor >= 0), 'No expense is reimbursed for more than its amount'),
    check('RECOMMENDATIONS_CLEAR_BALANCES', recommendedTotal === totalPayable && rec.unresolvedPayableMinor === 0 && rec.unresolvedReceivableMinor === 0, 'Recommended payments clear every founder balance exactly'),
  ];
  const failed = checks.filter((c) => !c.ok);
  const needsReview = warnings.some((w) => w.level === 'warning');
  const status: ReconciliationStatus = failed.length > 0 ? 'FAIL' : needsReview ? 'REVIEW' : 'PASS';
  const explanation =
    status === 'FAIL' ? `Internal check failed: ${failed.map((c) => c.code).join(', ')}`
    : status === 'REVIEW' ? 'Balances reconcile, but some records or settlements need attention (see warnings)'
    : businessBorne > 0 ? 'Balances reconcile. Part of some expenses was reimbursed by the business; that portion is not recoverable from founders'
    : 'Balances reconcile';

  return {
    founders,
    recommendations: rec.recommendations,
    effects,
    expenses: breakdown,
    reconciliation: {
      status, explanation, checks,
      totalPaidMinor: totalPaid, totalFairShareMinor: totalFair, sumGrossNetPositionMinor: sumNet,
      businessBorneMinor: businessBorne,
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
