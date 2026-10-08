/**
 * Founder-finance calculation engine (Phase 3) — the SINGLE source of truth for fair share, paid,
 * net position, outstanding balances and settlement recommendations.
 *
 * Pure: no I/O, no clock, no floating point. Input is stored transaction + founder data; output is a
 * typed, reproducible result. The frontend only displays it. Every rule, and whether it comes from the
 * PDF or is an implementation assumption, is documented in docs/PHASE-3-CALCULATION-SPEC.md.
 */
import { recommendSettlements, type SettlementRecommendation } from './settlementAlgorithm';
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
  /** expensePaid − refundReceived − reimbursed */
  paidMinor: number;
  contributionMinor: number;
  loanOutstandingMinor: number;
  fairShareMinor: number;
  /** paid − fairShare (PDF §9) */
  grossNetPositionMinor: number;
  settledPaidMinor: number;
  settledReceivedMinor: number;
  /** grossNet + settledPaid − settledReceived (signed) */
  outstandingMinor: number;
  outstandingReceivableMinor: number;
  outstandingPayableMinor: number;
  action: PositionAction;
  settlementStatus: SettlementStatus;
}

export type EffectKind =
  | 'expense_paid' | 'expense_share' | 'refund_received' | 'refund_share' | 'reimbursement_received'
  | 'contribution' | 'loan' | 'settlement_paid' | 'settlement_received';

/** One traceable contribution of one official transaction to one founder's figures. */
export interface LedgerEffect { founderId: string; transactionId: string; kind: EffectKind; amountMinor: number }

export interface CalcWarning { code: string; transactionId: string; message: string }

export interface Reconciliation {
  totalPaidMinor: number;
  totalFairShareMinor: number;
  /** Σ grossNet. 0 unless reimbursements exist (they are business-funded, spec C-4); then equals −Σ reimbursed. */
  unallocatedMinor: number;
  totalReceivableMinor: number;
  totalPayableMinor: number;
  recommendedTotalMinor: number;
  unresolvedPayableMinor: number;
  unresolvedReceivableMinor: number;
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
    warnings.push({ code, transactionId: t.id, message });
  };

  for (const t of input.transactions) {
    if (!OFFICIAL_STATUSES.includes(t.status)) {
      excluded.byStatus[t.status] = (excluded.byStatus[t.status] ?? 0) + 1;
      continue;
    }
    if (t.type === 'other') { excluded.unclassifiedOther += 1; continue; }
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

  const founders: FounderFinancialPosition[] = input.founders.map((f) => {
    const a = acc.get(f.id)!;
    const paid = a.expensePaid - a.refundReceived - a.reimbursed;
    const fair = a.expenseShare - a.refundShare;
    const gross = paid - fair;
    const outstanding = gross + a.settledPaid - a.settledReceived;
    const activity = a.settledPaid + a.settledReceived > 0;
    return {
      founderId: f.id, founderName: f.name, active: f.active,
      expensePaidMinor: a.expensePaid, refundReceivedMinor: a.refundReceived, reimbursedMinor: a.reimbursed,
      paidMinor: paid, contributionMinor: a.contribution, loanOutstandingMinor: a.loan,
      fairShareMinor: fair, grossNetPositionMinor: gross,
      settledPaidMinor: a.settledPaid, settledReceivedMinor: a.settledReceived,
      outstandingMinor: outstanding,
      outstandingReceivableMinor: Math.max(outstanding, 0),
      outstandingPayableMinor: Math.max(-outstanding, 0),
      action: outstanding > 0 ? 'receive' : outstanding < 0 ? 'pay' : 'settled',
      settlementStatus: outstanding === 0 ? 'settled' : activity ? 'partially_settled' : 'open',
    };
  });

  const rec = recommendSettlements(founders.map((p) => ({ founderId: p.founderId, outstandingMinor: p.outstandingMinor })));
  const sum = (f: (p: FounderFinancialPosition) => number) => founders.reduce((s, p) => add(s, f(p)), 0);
  const recommendedTotal = rec.recommendations.reduce((s, r) => add(s, r.amountMinor), 0);
  const unallocated = sum((p) => p.grossNetPositionMinor);

  return {
    founders,
    recommendations: rec.recommendations,
    effects,
    reconciliation: {
      totalPaidMinor: sum((p) => p.paidMinor),
      totalFairShareMinor: sum((p) => p.fairShareMinor),
      unallocatedMinor: unallocated,
      totalReceivableMinor: sum((p) => p.outstandingReceivableMinor),
      totalPayableMinor: sum((p) => p.outstandingPayableMinor),
      recommendedTotalMinor: recommendedTotal,
      unresolvedPayableMinor: rec.unresolvedPayableMinor,
      unresolvedReceivableMinor: rec.unresolvedReceivableMinor,
      isBalanced: sum((p) => p.outstandingMinor) === 0,
    },
    included,
    excluded,
    warnings,
  };
}
