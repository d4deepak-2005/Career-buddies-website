/**
 * Phase 4 — dashboard aggregation. PURE: no I/O. It never recalculates accounting rules; it only
 *  (a) selects which already-calculated engine results fall inside the requested period/filters and
 *  (b) sums them. The engine (calculationEngine.ts) stays the single source of truth for every figure.
 *
 * Semantics (Product Plan §6 gives the widget list but not these definitions — UI/implementation decisions, see the spec):
 *  - Balances (founder cards, outstanding settlements, recommendations) are CUMULATIVE up to `to` (the caller feeds the engine only
 *    transactions dated ≤ `to`). They are never narrowed by the category filter.
 *  - Flow figures (KPIs, charts, recent list) cover transactionDate in [from, to] and only official (engine-counted) transactions.
 *  - Founder filter: a transaction matches when the founder is its payer or its counterparty.
 *  - Category filter: only transactions carrying that category are counted.
 */
import type { CalculationResult, LedgerEffect } from './calculationEngine';
import type { TransactionStatus, TransactionType } from './transactionRules';

export interface DashTx {
  id: string; txnNumber: string; type: TransactionType; status: TransactionStatus; amountMinor: number; description: string;
  date: string; // YYYY-MM-DD
  paidByFounderId: string | null; counterpartyFounderId: string | null; categoryId: string | null;
}
export interface DashFilters { from?: string | undefined; to?: string | undefined; founderId?: string | undefined; categoryId?: string | undefined; type?: TransactionType | undefined }
export interface DashInput {
  result: CalculationResult;
  txs: DashTx[];
  founderNames: Map<string, string>;
  categoryNames: Map<string, string>;
  filters: DashFilters;
  recentLimit?: number;
  founderMeta?: Map<string, { role: string | null; photoUrl: string | null }>;
}

const MAX_MONTHS = 60;
const countBy = (rows: DashTx[], key: (t: DashTx) => string) => rows.reduce<Record<string, number>>((m, t) => { m[key(t)] = (m[key(t)] ?? 0) + 1; return m; }, {});
const MAX_SLICES = 7;

function monthsBetween(first: string, last: string): string[] {
  const out: string[] = [];
  let [y, m] = first.split('-').map(Number) as [number, number];
  const [ly, lm] = last.split('-').map(Number) as [number, number];
  while ((y < ly || (y === ly && m <= lm)) && out.length < MAX_MONTHS) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function buildDashboard({ result, txs, founderNames, categoryNames, filters, recentLimit = 10, founderMeta }: DashInput) {
  const { from, to, founderId, categoryId } = filters;
  const inPeriod = (t: DashTx) => (!from || t.date >= from) && (!to || t.date <= to);
  const matches = (t: DashTx) =>
    inPeriod(t) &&
    (!founderId || t.paidByFounderId === founderId || t.counterpartyFounderId === founderId) &&
    (!categoryId || t.categoryId === categoryId) &&
    (!filters.type || t.type === filters.type);
  const byId = new Map(txs.map((t) => [t.id, t]));

  // ---- period flows from the engine's official results
  let expensesMinor = 0, businessBorneMinor = 0, refundsMinor = 0, contributionsMinor = 0, loansMinor = 0, settledMinor = 0;
  const monthly = new Map<string, { expensesMinor: number; investmentMinor: number }>();
  const touch = (date: string) => { const k = date.slice(0, 7); const v = monthly.get(k) ?? { expensesMinor: 0, investmentMinor: 0 }; monthly.set(k, v); return v; };
  const catTotals = new Map<string, number>();
  const contribByFounder = new Map<string, { contributionMinor: number; loanMinor: number }>();
  // Per-founder period flows straight from the engine's effects (expense shares, amounts paid, reimbursements received).
  const periodByFounder = new Map<string, { expenseShareMinor: number; refundShareMinor: number; expensePaidMinor: number; reimbursementReceivedMinor: number }>();
  const pf = (id: string) => { const v = periodByFounder.get(id) ?? { expenseShareMinor: 0, refundShareMinor: 0, expensePaidMinor: 0, reimbursementReceivedMinor: 0 }; periodByFounder.set(id, v); return v; };

  for (const e of result.expenses) {
    const t = byId.get(e.expenseId);
    if (!t || !matches(t)) continue;
    expensesMinor += e.amountMinor;
    businessBorneMinor += e.reimbursedMinor;
    touch(t.date).expensesMinor += e.amountMinor;
    const key = t.categoryId ?? '';
    catTotals.set(key, (catTotals.get(key) ?? 0) + e.amountMinor);
  }
  const eff = (fx: LedgerEffect) => {
    const t = byId.get(fx.transactionId);
    if (!t || !matches(t)) return;
    if (fx.kind === 'expense_share') pf(fx.founderId).expenseShareMinor += fx.amountMinor;
    else if (fx.kind === 'refund_share') pf(fx.founderId).refundShareMinor += fx.amountMinor;
    else if (fx.kind === 'expense_paid') pf(fx.founderId).expensePaidMinor += fx.amountMinor;
    else if (fx.kind === 'reimbursement_received') pf(fx.founderId).reimbursementReceivedMinor += fx.amountMinor;
    if (fx.kind === 'refund_received') refundsMinor += fx.amountMinor;
    else if (fx.kind === 'settlement_paid') settledMinor += fx.amountMinor;
    else if (fx.kind === 'contribution' || fx.kind === 'loan') {
      if (fx.kind === 'contribution') contributionsMinor += fx.amountMinor; else loansMinor += fx.amountMinor;
      touch(t.date).investmentMinor += fx.amountMinor;
      const c = contribByFounder.get(fx.founderId) ?? { contributionMinor: 0, loanMinor: 0 };
      if (fx.kind === 'contribution') c.contributionMinor += fx.amountMinor; else c.loanMinor += fx.amountMinor;
      contribByFounder.set(fx.founderId, c);
    }
  };
  result.effects.forEach(eff);

  // ---- charts
  const months = [...monthly.keys()].sort();
  const monthlySeries = months.length === 0 ? [] : monthsBetween(months[0]!, months[months.length - 1]!).map((m) => ({ month: m, ...(monthly.get(m) ?? { expensesMinor: 0, investmentMinor: 0 }) }));
  const ranked = [...catTotals.entries()]
    .map(([id, amountMinor]) => ({ categoryId: id || null, name: id ? (categoryNames.get(id) ?? 'Unknown category') : 'Uncategorised', amountMinor, other: false }))
    .sort((a, b) => b.amountMinor - a.amountMinor || a.name.localeCompare(b.name));
  // A donut stays readable with at most MAX_SLICES slices: the long tail is merged HERE, so the browser never sums amounts.
  const slices = ranked.length <= MAX_SLICES ? ranked : [
    ...ranked.slice(0, MAX_SLICES - 1),
    { categoryId: null, name: 'Other categories', amountMinor: ranked.slice(MAX_SLICES - 1).reduce((s, c) => s + c.amountMinor, 0), other: true },
  ];
  const sliceTotal = slices.reduce((s, c) => s + c.amountMinor, 0);
  /** shareBp = share of the period's expenses in basis points (display-only helper for chart geometry and labels). */
  const expenseByCategory = slices.map((c) => ({ ...c, shareBp: sliceTotal > 0 ? Math.round((c.amountMinor * 10_000) / sliceTotal) : 0 }));
  const contributionByFounder = result.founders
    .filter((f) => !founderId || f.founderId === founderId)
    .map((f) => ({ founderId: f.founderId, name: f.founderName, ...(contribByFounder.get(f.founderId) ?? { contributionMinor: 0, loanMinor: 0 }) }))
    .filter((f) => f.contributionMinor > 0 || f.loanMinor > 0);

  // ---- founder cards: engine positions (cumulative to `to`), never recalculated here
  const founders = result.founders
    .filter((f) => !founderId || f.founderId === founderId)
    .map((f) => ({
      founderId: f.founderId, name: f.founderName, active: f.active, role: founderMeta?.get(f.founderId)?.role ?? null, photoUrl: founderMeta?.get(f.founderId)?.photoUrl ?? null,
      contributionMinor: f.contributionMinor, loanOutstandingMinor: f.loanOutstandingMinor,
      investedMinor: f.contributionMinor + f.loanOutstandingMinor, // presentation of two engine fields (Product Plan "Invested")
      paidMinor: f.paidMinor, fairShareMinor: f.fairShareMinor, netPositionMinor: f.grossNetPositionMinor,
      outstandingMinor: f.outstandingMinor, action: f.action, reimbursedMinor: f.reimbursedMinor,
    }));

  const nameOf = (id: string | null) => (id ? { id, name: founderNames.get(id) ?? 'Unknown' } : null);
  const recommendations = result.recommendations
    .filter((r) => !founderId || r.payerFounderId === founderId || r.receiverFounderId === founderId)
    .map((r) => ({ payer: nameOf(r.payerFounderId)!, receiver: nameOf(r.receiverFounderId)!, amountMinor: r.amountMinor }));

  const counted = new Set(result.effects.map((e) => e.transactionId));
  const recentPool = txs.filter(matches).sort((a, b) => (a.date === b.date ? b.txnNumber.localeCompare(a.txnNumber) : b.date.localeCompare(a.date)));
  const recent = recentPool.slice(0, recentLimit).map((t) => ({
    id: t.id, txnNumber: t.txnNumber, date: t.date, type: t.type, status: t.status, description: t.description, amountMinor: t.amountMinor,
    category: t.categoryId ? { id: t.categoryId, name: categoryNames.get(t.categoryId) ?? 'Unknown category' } : null,
    paidBy: nameOf(t.paidByFounderId), counterparty: nameOf(t.counterpartyFounderId), counted: counted.has(t.id),
  }));

  const r = result.reconciliation;
  return {
    kpis: {
      /** Interpretation (Product Plan does not define it): money founders put in = contributions + loan principal. */
      totalInvestmentMinor: contributionsMinor + loansMinor,
      /** Interpretation: capital contributions only (loans excluded: they are expected to be repaid, PDF §7). */
      founderCapitalMinor: contributionsMinor,
      loansMinor,
      totalBusinessExpensesMinor: expensesMinor,
      reimbursedByBusinessMinor: businessBorneMinor,
      founderFundedExpensesMinor: expensesMinor - businessBorneMinor,
      refundsMinor,
      settledMinor,
      /** Cumulative to `to`; all founders; not narrowed by founder/category filters. */
      outstandingSettlementsMinor: r.totalPayableMinor,
      /**
       * Net business position = money founders put in (capital + loans) − net business expenses (expenses − refunds), for the period.
       * IMPLEMENTATION ASSUMPTION: the Product Plan names no such KPI formula. Reimbursed amounts are inside expenses (already paid out).
       */
      netBusinessPositionMinor: contributionsMinor + loansMinor - (expensesMinor - refundsMinor),
    },
    founders,
    charts: { contributionByFounder, expenseByCategory, monthly: monthlySeries },
    /** Period flows per founder (founder-funded = expensePaid − reimbursementReceived). */
    founderPeriod: result.founders.filter((f) => !founderId || f.founderId === founderId).map((f) => {
      const p = periodByFounder.get(f.founderId) ?? { expenseShareMinor: 0, refundShareMinor: 0, expensePaidMinor: 0, reimbursementReceivedMinor: 0 };
      const c = contribByFounder.get(f.founderId) ?? { contributionMinor: 0, loanMinor: 0 };
      return { founderId: f.founderId, name: f.founderName, contributionMinor: c.contributionMinor, loanMinor: c.loanMinor, expensePaidMinor: p.expensePaidMinor, reimbursedMinor: p.reimbursementReceivedMinor,
        founderFundedMinor: p.expensePaidMinor - p.reimbursementReceivedMinor, expenseShareMinor: p.expenseShareMinor, refundShareMinor: p.refundShareMinor, allocatedShareMinor: p.expenseShareMinor - p.refundShareMinor };
    }),
    settlement: { recommendations, unresolvedMinor: r.unresolvedPayableMinor + r.unresolvedReceivableMinor },
    recent,
    counts: {
      /** Every status, restricted to the period and filters (the work queue below is NOT period-filtered). */
      byStatus: countBy(recentPool, (t) => t.status),
      byType: countBy(recentPool, (t) => t.type),
      matchingTransactions: recentPool.length,
      notCountedYet: recentPool.filter((t) => !counted.has(t.id) && (t.status === 'draft' || t.status === 'pending_approval')).length,
    },
    reconciliation: { status: r.status, isBalanced: r.isBalanced, sumNetPositionMinor: r.sumGrossNetPositionMinor, businessBorneMinor: r.businessBorneMinor },
    /** The approval work queue: all pending transactions, regardless of the selected period or filters. */
    pendingApprovals: { count: txs.filter((t) => t.status === 'pending_approval').length },
    warnings: result.warnings.filter((w) => w.level === 'warning').length,
  };
}
