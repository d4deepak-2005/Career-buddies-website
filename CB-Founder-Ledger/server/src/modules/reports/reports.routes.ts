import { Router } from 'express';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { buildDashboard, type DashTx } from '../../domain/dashboard';
import { groupByFiscalYear, minorToDecimal, toCsv } from '../../domain/reports';
import { TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS } from '../../domain/transactionRules';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Category } from '../../models/Category';
import { dashboardQuery } from '../dashboard/dashboard.routes';
import { loadCalculation } from '../financials/financials.service';
import { loadSettings } from '../settings/settings.service';

/** Reports reuse the dashboard's period/founder/category filters and add a transaction-type filter (Product Plan §13). */
const reportQuery = dashboardQuery.safeExtend({ type: z.enum(TRANSACTION_TYPES).optional() });
const exportQuery = dashboardQuery.safeExtend({
  type: z.enum(TRANSACTION_TYPES).optional(),
  kind: z.enum(['transactions', 'summary', 'founders', 'categories', 'monthly', 'settlements']),
});

async function build(q: z.infer<typeof reportQuery>) {
  const [l, categories, settings] = await Promise.all([loadCalculation(q.to ? { asOf: q.to } : {}), Category.find().select('name').lean(), loadSettings()]);
  if (q.founderId && !l.names.has(q.founderId)) throw AppError.notFound('Founder not found');
  const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
  if (q.categoryId && !categoryNames.has(q.categoryId)) throw AppError.notFound('Category not found');
  const txs: DashTx[] = l.stored.map((t) => ({
    id: String(t._id), txnNumber: t.txnNumber, type: t.type, status: t.status, amountMinor: t.amountMinor, description: t.description,
    date: t.transactionDate.toISOString().slice(0, 10),
    paidByFounderId: t.paidByFounderId ? String(t.paidByFounderId) : null,
    counterpartyFounderId: t.counterpartyFounderId ? String(t.counterpartyFounderId) : null,
    categoryId: t.categoryId ? String(t.categoryId) : null,
  }));
  const filters = { from: q.from, to: q.to, founderId: q.founderId, categoryId: q.categoryId, type: q.type };
  // Same function as the dashboard: reports and dashboard cannot disagree.
  const d = buildDashboard({ result: l.result, txs, founderNames: l.names, categoryNames, founderMeta: l.founderMeta, filters, recentLimit: 100000 });
  const startMonth = settings.values.reports.fiscalYearStartMonth;
  const settlementRows = l.stored.filter((t) => t.type === 'settlement').map((t) => ({
    id: String(t._id), txnNumber: t.txnNumber, date: t.transactionDate.toISOString().slice(0, 10), status: t.status, amountMinor: t.amountMinor,
    payer: t.paidByFounderId ? (l.names.get(String(t.paidByFounderId)) ?? 'Unknown') : null, receiver: t.counterpartyFounderId ? (l.names.get(String(t.counterpartyFounderId)) ?? 'Unknown') : null, method: t.method ?? null,
  })).filter((r) => (!q.from || r.date >= q.from) && (!q.to || r.date <= q.to)).sort((a, b) => b.date.localeCompare(a.date) || b.txnNumber.localeCompare(a.txnNumber));
  return { l, d, settings, startMonth, settlementRows, categoryNames };
}

export const reportsRouter = Router();
reportsRouter.use(authenticate);

reportsRouter.get('/summary', validate(reportQuery, 'query'), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof reportQuery>;
  const { l, d, startMonth, settlementRows } = await build(q);
  const k = d.kpis;
  res.json({
    calculatedAt: l.calculatedAt,
    currency: { code: getEnv().CURRENCY_CODE, minorUnits: getEnv().CURRENCY_MINOR_UNITS },
    filters: { from: q.from ?? null, to: q.to ?? null, founderId: q.founderId ?? null, categoryId: q.categoryId ?? null, type: q.type ?? null },
    fiscalYearStartMonth: startMonth,
    totals: {
      totalExpensesMinor: k.totalBusinessExpensesMinor, reimbursedByBusinessMinor: k.reimbursedByBusinessMinor, founderFundedExpensesMinor: k.founderFundedExpensesMinor,
      refundsMinor: k.refundsMinor, founderCapitalMinor: k.founderCapitalMinor, loansMinor: k.loansMinor, totalInvestmentMinor: k.totalInvestmentMinor, settledMinor: k.settledMinor,
      netBusinessPositionMinor: k.netBusinessPositionMinor, outstandingSettlementsMinor: k.outstandingSettlementsMinor,
    },
    monthly: d.charts.monthly,
    annual: groupByFiscalYear(d.charts.monthly, startMonth, ['expensesMinor', 'investmentMinor']),
    categories: d.charts.expenseByCategory,
    founders: d.founders.map((f) => ({ ...f, ...(d.founderPeriod.find((p) => p.founderId === f.founderId) ?? {}) })),
    settlements: settlementRows,
    counts: d.counts, pendingApprovals: d.pendingApprovals,
    reconciliation: d.reconciliation,
  });
}));

reportsRouter.get('/export', validate(exportQuery, 'query'), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof exportQuery>;
  const { d, settlementRows } = await build(q);
  const mu = getEnv().CURRENCY_MINOR_UNITS;
  const money = (n: number) => minorToDecimal(n, mu);
  let columns: string[]; let rows: unknown[][];
  switch (q.kind) {
    case 'transactions':
      columns = ['Date', 'Number', 'Type', 'Description', 'Category', 'Paid by', 'Counterparty', `Amount (${getEnv().CURRENCY_CODE})`, 'Status', 'Counted in totals'];
      rows = d.recent.map((t) => [t.date, t.txnNumber, TRANSACTION_TYPE_LABELS[t.type], t.description, t.category?.name ?? '', t.paidBy?.name ?? '', t.counterparty?.name ?? '', money(t.amountMinor), t.status, t.counted ? 'yes' : 'no']);
      break;
    case 'monthly':
      columns = ['Month', 'Expenses', 'Investment'];
      rows = d.charts.monthly.map((m) => [m.month, money(m.expensesMinor), money(m.investmentMinor)]);
      break;
    case 'categories':
      columns = ['Category', 'Expenses', 'Share %'];
      rows = d.charts.expenseByCategory.map((c) => [c.name, money(c.amountMinor), (c.shareBp / 100).toFixed(2)]);
      break;
    case 'founders':
      columns = ['Founder', 'Role', 'Capital contribution', 'Loans', 'Expenses paid', 'Reimbursed by business', 'Founder-funded expenses', 'Allocated expense share', 'Fair share (cumulative)', 'Net position (cumulative)'];
      rows = d.founders.map((f) => { const p = d.founderPeriod.find((x) => x.founderId === f.founderId); return [f.name, f.role ?? '', money(p?.contributionMinor ?? 0), money(p?.loanMinor ?? 0), money(p?.expensePaidMinor ?? 0), money(p?.reimbursedMinor ?? 0), money(p?.founderFundedMinor ?? 0), money(p?.allocatedShareMinor ?? 0), money(f.fairShareMinor), money(f.netPositionMinor)]; });
      break;
    case 'settlements':
      columns = ['Date', 'Number', 'From', 'To', 'Amount', 'Method', 'Status'];
      rows = settlementRows.map((s) => [s.date, s.txnNumber, s.payer ?? '', s.receiver ?? '', money(s.amountMinor), s.method ?? '', s.status]);
      break;
    default: {
      const k = d.kpis;
      columns = ['Metric', 'Amount'];
      rows = [['Total business expenses', money(k.totalBusinessExpensesMinor)], ['Reimbursed by the business', money(k.reimbursedByBusinessMinor)], ['Founder-funded expenses', money(k.founderFundedExpensesMinor)], ['Refunds', money(k.refundsMinor)],
        ['Founder capital', money(k.founderCapitalMinor)], ['Founder loans', money(k.loansMinor)], ['Total investment', money(k.totalInvestmentMinor)], ['Settled in period', money(k.settledMinor)],
        ['Net business position', money(k.netBusinessPositionMinor)], ['Outstanding settlements (cumulative)', money(k.outstandingSettlementsMinor)]];
    }
  }
  const name = `founder-ledger-${q.kind}${q.from ? `-from-${q.from}` : ''}${q.to ? `-to-${q.to}` : ''}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(toCsv(columns, rows));
}));
