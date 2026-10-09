import { Download, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ErrorBox, StatusBadge } from '../../components/ui';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor, formatSignedMinor } from '../../lib/money';
import type { Category, Founder, ReportSummary } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { CategoryDonut, MonthlyLines } from '../dashboard/charts';
import { PRESETS, detectPreset, presetRange } from '../dashboard/periods';

const EXPORTS = [
  ['summary', 'Summary'], ['transactions', 'Transactions'], ['monthly', 'Monthly'], ['categories', 'Categories'], ['founders', 'Founders'], ['settlements', 'Settlements'],
] as const;
const fmtDate = (d: string | null) => d ?? '—';

/** Read-only view of GET /api/reports/summary. Same calculation as the dashboard, so the two always reconcile. */
export function ReportsPage() {
  const cfg = useAppConfig();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const qs = new URLSearchParams();
  for (const k of ['from', 'to', 'founderId', 'categoryId', 'type']) if (get(k)) qs.set(k, get(k));
  const query = qs.toString();
  const res = useResource<ReportSummary>(`/reports/summary${query ? `?${query}` : ''}`);
  const foundersRes = useResource<{ founders: Founder[] }>('/founders');
  const catsRes = useResource<{ categories: Category[] }>('/categories');
  const set = (patch: Record<string, string>) => { const n = new URLSearchParams(params); for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); } setParams(n, { replace: true }); };
  const m = (n: number) => formatMinor(n, cfg.currency);
  const preset = detectPreset(get('from'), get('to'));
  const filtered = [...qs].length > 0;
  const typeLabel = (v: string) => cfg.transactionTypes.find((t) => t.value === v)?.label ?? v;
  const d = res.data;
  const period = d && (d.filters.from || d.filters.to) ? `${fmtDate(d.filters.from)} to ${fmtDate(d.filters.to)}` : 'all time';

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="card p-4 sm:p-5" aria-label="Report filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-semibold text-ink-muted">Period
            <select className="field mt-1" value={preset} onChange={(e) => { const r = presetRange(e.target.value as never); set({ from: r?.from ?? '', to: r?.to ?? '' }); }}>
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}{preset === 'custom' && <option value="custom">Custom range</option>}
            </select>
          </label>
          <label className="block text-xs font-semibold text-ink-muted">From<input type="date" className="field mt-1" value={get('from')} max={get('to') || undefined} onChange={(e) => set({ from: e.target.value })} /></label>
          <label className="block text-xs font-semibold text-ink-muted">To<input type="date" className="field mt-1" value={get('to')} min={get('from') || undefined} onChange={(e) => set({ to: e.target.value })} /></label>
          <label className="block text-xs font-semibold text-ink-muted">Transaction type
            <select className="field mt-1" value={get('type')} onChange={(e) => set({ type: e.target.value })}><option value="">All types</option>{cfg.transactionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          </label>
          <label className="block text-xs font-semibold text-ink-muted">Founder
            <select className="field mt-1" value={get('founderId')} onChange={(e) => set({ founderId: e.target.value })} disabled={!foundersRes.data}><option value="">All founders</option>{foundersRes.data?.founders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          </label>
          <label className="block text-xs font-semibold text-ink-muted">Category
            <select className="field mt-1" value={get('categoryId')} onChange={(e) => set({ categoryId: e.target.value })} disabled={!catsRes.data}><option value="">All categories</option>{catsRes.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-2"><button type="button" className="btn-ghost w-full border border-surface-line sm:w-auto" disabled={!filtered} onClick={() => setParams(new URLSearchParams(), { replace: true })}><RotateCcw className="h-4 w-4" aria-hidden />Reset filters</button></div>
        </div>
      </section>

      {res.loading && !d && <p role="status" className="py-10 text-center text-sm text-ink-muted">Preparing report…</p>}
      {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}

      {d && (
        <div className={`space-y-5 ${res.loading ? 'opacity-60' : ''}`} aria-busy={res.loading}>
          <p className="text-xs text-ink-muted" data-testid="report-scope">Report for <strong>{period}</strong> in {d.currency.code}. Amounts are totals of approved transactions; balances are cumulative to the end date. Annual spend uses financial years starting in month {d.fiscalYearStartMonth}.</p>

          <section aria-labelledby="exp-h" className="card p-4 sm:p-5">
            <h2 id="exp-h" className="text-base font-extrabold text-cb-navy">Export (CSV, opens in Excel)</h2>
            <p className="mb-3 text-xs text-ink-muted">Exports use the filters above. Amounts are plain decimals, so they re-add exactly.</p>
            <div className="flex flex-wrap gap-2">
              {EXPORTS.map(([kind, label]) => (
                <a key={kind} className="btn-ghost !min-h-10 border border-surface-line !px-3" href={`/api/reports/export?kind=${kind}${query ? `&${query}` : ''}`} download><Download className="h-4 w-4" aria-hidden />{label}</a>
              ))}
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Report totals">
            {([
              ['Total expenses', d.totals.totalExpensesMinor], ['Reimbursed by the business', d.totals.reimbursedByBusinessMinor], ['Founder-funded expenses', d.totals.founderFundedExpensesMinor], ['Refunds', d.totals.refundsMinor],
              ['Founder capital', d.totals.founderCapitalMinor], ['Founder loans', d.totals.loansMinor], ['Total investment', d.totals.totalInvestmentMinor], ['Settled in period', d.totals.settledMinor],
            ] as const).map(([label, v]) => <div key={label} className="card min-w-0 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums text-cb-navy">{m(v)}</dd></div>)}
            <div className="card min-w-0 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Net business position</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums text-cb-navy">{formatSignedMinor(d.totals.netBusinessPositionMinor, cfg.currency)}</dd></div>
            <div className="card min-w-0 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Outstanding settlements</dt><dd className="mt-1 break-words text-xl font-extrabold tabular-nums text-cb-navy">{m(d.totals.outstandingSettlementsMinor)}</dd></div>
          </dl>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card min-w-0 p-5" aria-labelledby="mon-h"><h2 id="mon-h" className="mb-3 text-base font-extrabold text-cb-navy">Monthly spend and investment</h2>{d.monthly.length === 0 ? <p className="rounded-xl bg-surface-alt px-4 py-6 text-center text-sm text-ink-muted">No monthly activity in this period.</p> : <MonthlyLines rows={d.monthly} currency={cfg.currency} />}</section>
            <section className="card min-w-0 p-5" aria-labelledby="cat-h"><h2 id="cat-h" className="mb-3 text-base font-extrabold text-cb-navy">Expense categories</h2>{d.categories.length === 0 ? <p className="rounded-xl bg-surface-alt px-4 py-6 text-center text-sm text-ink-muted">No expenses in this period.</p> : <CategoryDonut rows={d.categories} currency={cfg.currency} />}</section>
          </div>

          <section className="card min-w-0 p-5" aria-labelledby="ann-h">
            <h2 id="ann-h" className="mb-3 text-base font-extrabold text-cb-navy">Annual spend</h2>
            {d.annual.length === 0 ? <p className="text-sm text-ink-muted">No data for this period.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Annual spend by financial year</caption>
                <thead className="text-xs uppercase tracking-wide text-ink-muted"><tr><th scope="col" className="py-2 text-left">Financial year</th><th scope="col" className="py-2 text-right">Expenses</th><th scope="col" className="py-2 text-right">Investment</th></tr></thead>
                <tbody className="divide-y divide-surface-line">{d.annual.map((a) => <tr key={a.fiscalYear}><th scope="row" className="py-2 text-left font-semibold">{a.fiscalYear}</th><td className="py-2 text-right tabular-nums">{m(a.expensesMinor)}</td><td className="py-2 text-right tabular-nums">{m(a.investmentMinor)}</td></tr>)}</tbody></table></div>
            )}
          </section>

          <section className="card min-w-0 p-5" aria-labelledby="fo-h">
            <h2 id="fo-h" className="mb-1 text-base font-extrabold text-cb-navy">Founder summaries</h2>
            <p className="mb-3 text-xs text-ink-muted">Contributions, expenses paid, reimbursements and allocated shares are for the period. Fair share and net position are cumulative to the end date.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-sm"><caption className="sr-only">Founder summaries</caption>
                <thead className="text-xs uppercase tracking-wide text-ink-muted"><tr>{['Founder', 'Capital', 'Loans', 'Expenses paid', 'Reimbursed by business', 'Founder-funded', 'Allocated share', 'Net position'].map((h, i) => <th key={h} scope="col" className={`py-2 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-surface-line">
                  {d.founders.map((f) => (
                    <tr key={f.founderId}>
                      <th scope="row" className="py-2 text-left font-semibold">{f.name}{f.role ? <span className="block text-xs font-normal text-ink-muted">{f.role}</span> : null}</th>
                      <td className="py-2 text-right tabular-nums">{m(f.contributionMinor ?? 0)}</td><td className="py-2 text-right tabular-nums">{m(f.loanMinor ?? 0)}</td><td className="py-2 text-right tabular-nums">{m(f.expensePaidMinor ?? 0)}</td>
                      <td className="py-2 text-right tabular-nums">{m(f.reimbursedMinor ?? 0)}</td><td className="py-2 text-right tabular-nums">{m(f.founderFundedMinor ?? 0)}</td><td className="py-2 text-right tabular-nums">{m(f.allocatedShareMinor ?? 0)}</td>
                      <td className={`py-2 text-right font-bold tabular-nums ${f.netPositionMinor > 0 ? 'text-cb-green-dark' : f.netPositionMinor < 0 ? 'text-danger' : ''}`}>{formatSignedMinor(f.netPositionMinor, cfg.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card min-w-0 p-5" aria-labelledby="cnt-h">
              <h2 id="cnt-h" className="mb-3 text-base font-extrabold text-cb-navy">Transaction counts and approvals</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(d.counts.byStatus).map(([s, n]) => <div key={s} className="flex items-center justify-between rounded-xl bg-surface-alt px-3 py-2"><dt><StatusBadge status={s as never} /></dt><dd className="font-bold tabular-nums">{n}</dd></div>)}
                {Object.keys(d.counts.byStatus).length === 0 && <p className="col-span-2 text-ink-muted">No transactions in this period.</p>}
              </dl>
              <p className="mt-3 text-sm text-ink-muted"><strong className="text-cb-navy">{d.pendingApprovals.count}</strong> transaction{d.pendingApprovals.count === 1 ? ' is' : 's are'} waiting for approval (all periods).</p>
              <ul className="mt-3 flex flex-wrap gap-2 text-xs">{Object.entries(d.counts.byType).map(([t, n]) => <li key={t} className="badge bg-cb-blue/10 text-cb-blue">{typeLabel(t)}: {n}</li>)}</ul>
            </section>
            <section className="card min-w-0 p-5" aria-labelledby="sh-h">
              <h2 id="sh-h" className="mb-3 text-base font-extrabold text-cb-navy">Settlement history</h2>
              {d.settlements.length === 0 ? <p className="text-sm text-ink-muted">No settlements in this period.</p> : (
                <ul className="divide-y divide-surface-line text-sm">{d.settlements.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="min-w-0 break-words">{s.date} · <strong>{s.payer}</strong> → <strong>{s.receiver}</strong>{s.method ? ` · ${s.method}` : ''}</span><span className="flex items-center gap-2"><StatusBadge status={s.status} /><span className="font-bold tabular-nums">{m(s.amountMinor)}</span></span></li>)}</ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
