import { ArrowRight, CalendarClock, ClipboardCheck, Landmark, PiggyBank, PlusCircle, ReceiptText, RotateCcw, Scale, Wallet, BarChart3, Handshake } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar, ErrorBox, StatusBadge } from '../../components/ui';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor, formatSignedMinor } from '../../lib/money';
import type { Category, DashboardResponse, Founder, TransactionType } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { ActionBadge } from '../financials/parts';
import { RecordPaymentButton } from '../financials/SettlementActions';
import { CategoryDonut, ContributionBars, MonthlyLines } from './charts';
import { PRESETS, detectPreset, presetRange } from './periods';

const TYPE_LABEL: Record<TransactionType, string> = {
  business_expense: 'Business expense', founder_contribution: 'Contribution', founder_loan: 'Founder loan', reimbursement: 'Reimbursement', settlement: 'Settlement', refund: 'Refund', other: 'Other',
};

/** Dashboard = a READ-ONLY view of GET /api/dashboard. Nothing here calculates a financial figure. */
export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const cfg = useAppConfig();
  // No explicit period in the URL → the default period from Settings ("period=all" is the explicit All-time choice).
  const explicit = params.get('from') || params.get('to') || params.get('period') === 'all';
  const defRange = !explicit ? presetRange(cfg.settings.dashboard.defaultPeriod) : null;
  const from = params.get('from') ?? defRange?.from ?? '', to = params.get('to') ?? defRange?.to ?? '', founderId = params.get('founderId') ?? '', categoryId = params.get('categoryId') ?? '';
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  if (founderId) qs.set('founderId', founderId);
  if (categoryId) qs.set('categoryId', categoryId);
  const dash = useResource<DashboardResponse>(`/dashboard${[...qs].length ? `?${qs.toString()}` : ''}`);
  const foundersRes = useResource<{ founders: Founder[] }>('/founders');
  const categoriesRes = useResource<{ categories: Category[] }>('/categories');

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    setParams(next, { replace: true });
  };
  const preset = detectPreset(from, to);
  const filtered = !!(from || to || founderId || categoryId);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="card p-4 sm:p-5" aria-label="Filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block text-xs font-semibold text-ink-muted lg:col-span-1">Period
            <select className="field mt-1" value={preset} onChange={(e) => { const r = presetRange(e.target.value as never); set({ from: r?.from ?? '', to: r?.to ?? '', period: r ? '' : 'all' }); }}>
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              {preset === 'custom' && <option value="custom">Custom range</option>}
            </select>
          </label>
          <label className="block text-xs font-semibold text-ink-muted">From
            <input type="date" className="field mt-1" value={from} max={to || undefined} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label className="block text-xs font-semibold text-ink-muted">To
            <input type="date" className="field mt-1" value={to} min={from || undefined} onChange={(e) => set({ to: e.target.value })} />
          </label>
          <label className="block text-xs font-semibold text-ink-muted">Founder
            <select className="field mt-1" value={founderId} onChange={(e) => set({ founderId: e.target.value })} disabled={!foundersRes.data}>
              <option value="">All founders</option>
              {foundersRes.data?.founders.map((f) => <option key={f.id} value={f.id}>{f.name}{f.active ? '' : ' (inactive)'}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-ink-muted">Category
            <select className="field mt-1" value={categoryId} onChange={(e) => set({ categoryId: e.target.value })} disabled={!categoriesRes.data}>
              <option value="">All categories</option>
              {categoriesRes.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactive)'}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" className="btn-ghost w-full border border-surface-line" disabled={!filtered} onClick={() => setParams(new URLSearchParams(), { replace: true })}><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>
          </div>
        </div>
      </section>

      {dash.loading && !dash.data && <DashboardSkeleton />}
      {dash.error && <ErrorBox error={dash.error} onRetry={dash.reload} />}
      {dash.data && <DashboardBody d={dash.data} busy={dash.loading} onSettled={(msg) => { setNotice(msg); dash.reload(); }} />}
      {notice && <p role="status" className="rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{notice}</p>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse bg-surface-alt" />)}</div>
      <div className="grid gap-5 lg:grid-cols-2"><div className="card h-64 animate-pulse bg-surface-alt" /><div className="card h-64 animate-pulse bg-surface-alt" /></div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}

function Kpi({ label, value, hint, icon: Icon, tone, href }: { label: string; value: string; hint?: string; icon: typeof Wallet; tone?: 'pay'; href?: string }) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted"><Icon className="h-4 w-4 shrink-0 text-cb-blue" aria-hidden /><span className="min-w-0 break-words">{label}</span></div>
      <p className={`mt-2 break-words text-xl font-extrabold tabular-nums sm:text-2xl ${tone === 'pay' ? 'text-danger' : 'text-cb-navy'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </>
  );
  return href ? <Link to={href} className="card block min-w-0 p-4 transition hover:border-cb-blue">{body}</Link> : <div className="card min-w-0 p-4">{body}</div>;
}

function Panel({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="card min-w-0 p-5" aria-labelledby={id}>
      <h2 id={id} className="text-base font-extrabold text-cb-navy">{title}</h2>
      {note && <p className="mb-3 mt-0.5 text-xs text-ink-muted">{note}</p>}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="rounded-xl bg-surface-alt px-4 py-6 text-center text-sm text-ink-muted">{children}</p>;

function DashboardBody({ d, busy, onSettled }: { d: DashboardResponse; busy: boolean; onSettled: (msg: string) => void }) {
  const cfg = useAppConfig();
  const m = (n: number) => formatMinor(n, cfg.currency);
  const period = d.filters.from || d.filters.to ? `${d.filters.from ?? 'the beginning'} to ${d.filters.to ?? 'today'}` : 'all time';
  const noActivity = d.counts.matchingTransactions === 0;
  const k = d.kpis;

  return (
    <div className={`space-y-5 transition-opacity ${busy ? 'opacity-60' : ''}`} aria-busy={busy}>
      <p className="text-xs text-ink-muted" data-testid="scope-note">
        Showing <strong>{period}</strong>. Totals cover approved transactions in this period. Founder balances and outstanding settlements are cumulative up to {d.filters.to ?? 'today'} and are not narrowed by the category filter.
        {d.filters.categoryId && ' Category filter on: only transactions in that category are counted in the period totals.'}
        {d.counts.notCountedYet > 0 && ` ${d.counts.notCountedYet} transaction${d.counts.notCountedYet === 1 ? ' is' : 's are'} not counted yet (awaiting approval).`}
      </p>
      {d.reconciliation.status !== 'PASS' && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {d.reconciliation.status === 'FAIL' ? 'An internal check failed — figures may be wrong.' : `${d.warnings} record${d.warnings === 1 ? ' needs' : 's need'} attention.`} <Link to="/founders" className="underline">Review in Founders</Link>
        </p>
      )}

      <section aria-label="Key figures" className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Total business expenses" value={m(k.totalBusinessExpensesMinor)} hint={k.reimbursedByBusinessMinor > 0 ? `${m(k.reimbursedByBusinessMinor)} reimbursed by the business` : 'Approved expenses'} icon={Wallet} />
          <Kpi label="Founder contributions" value={m(k.founderCapitalMinor)} hint={k.loansMinor > 0 ? `plus ${m(k.loansMinor)} in founder loans` : 'Capital contributed by founders'} icon={PiggyBank} />
          <Kpi label="Net business position" value={formatSignedMinor(k.netBusinessPositionMinor, cfg.currency)} hint="Contributions + loans − (expenses − refunds)" icon={Scale} tone={k.netBusinessPositionMinor < 0 ? 'pay' : undefined} />
          <Kpi label="Pending approvals" value={String(d.pendingApprovals.count)} hint={d.pendingApprovals.count > 0 ? 'Waiting for a decision' : 'Nothing waiting'} icon={ClipboardCheck} href="/approvals" />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4" aria-label="More figures">
          {[['Total investment', k.totalInvestmentMinor], ['Outstanding settlements', k.outstandingSettlementsMinor], ['Founder capital', k.founderCapitalMinor], ['Founder loans', k.loansMinor], ['Reimbursed by the business', k.reimbursedByBusinessMinor], ['Refunds received', k.refundsMinor], ['Settled in period', k.settledMinor]].map(([label, v]) => (
            <div key={label as string} className="min-w-0 rounded-xl border border-surface-line bg-white px-3 py-2"><dt className="break-words text-xs text-ink-muted">{label as string}</dt><dd className="break-words font-bold tabular-nums text-cb-navy">{m(v as number)}</dd></div>
          ))}
        </dl>
        <nav aria-label="Shortcuts" className="flex flex-wrap gap-2">
          {([['/transactions/new', 'Add transaction', PlusCircle], ['/approvals', 'Approvals', ClipboardCheck], ['/settlements', 'Settlements', Handshake], ['/recurring', 'Recurring payments', CalendarClock], ['/reports', 'Reports', BarChart3], ['/founders', 'Founders', Landmark]] as const).map(([to, label, Icon]) => (
            <Link key={to} to={to} className="btn-ghost !min-h-10 border border-surface-line !px-3 text-sm"><Icon className="h-4 w-4 text-cb-blue" aria-hidden />{label}</Link>
          ))}
        </nav>
      </section>

      {noActivity && <Empty>No transactions match this period and filters. Try a wider period, or <Link to="/transactions/new" className="font-semibold text-cb-blue underline">add a transaction</Link>.</Empty>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel id="chart-contrib" title="Founder contribution" note="Capital and loans put in during the period">
          {d.charts.contributionByFounder.length === 0 ? <Empty>No contributions in this period.</Empty> : <ContributionBars rows={d.charts.contributionByFounder} currency={cfg.currency} />}
        </Panel>
        <Panel id="chart-cat" title="Expenses by category" note="Approved business expenses in the period">
          {d.charts.expenseByCategory.length === 0 ? <Empty>No expenses in this period.</Empty> : <CategoryDonut rows={d.charts.expenseByCategory} currency={cfg.currency} />}
        </Panel>
      </div>
      <Panel id="chart-monthly" title="Monthly expenses and investment" note="Per calendar month in the period">
        {d.charts.monthly.length === 0 ? <Empty>No monthly activity in this period.</Empty> : <MonthlyLines rows={d.charts.monthly} currency={cfg.currency} />}
      </Panel>

      <section aria-labelledby="founders-h">
        <h2 id="founders-h" className="mb-2 text-base font-extrabold text-cb-navy">Founder positions</h2>
        {d.founders.length === 0 ? <Empty>No founders yet. An admin can add founder profiles in Settings.</Empty> : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Founder cards">
            {d.founders.map((f) => (
              <li key={f.founderId} className="card min-w-0 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={f.name} photoUrl={f.photoUrl} size="md" />
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-extrabold leading-tight text-cb-navy"><Link className="hover:underline" to={`/founders/${f.founderId}`}>{f.name}</Link>{!f.active && <span className="badge ml-2 bg-surface-alt text-ink-muted">inactive</span>}</h3>
                      {f.role && <p className="text-xs text-ink-muted">{f.role}</p>}
                    </div>
                  </div>
                  <ActionBadge action={f.action} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div className="min-w-0"><dt className="text-xs text-ink-muted">Invested</dt><dd className="break-words font-bold tabular-nums">{m(f.investedMinor)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-ink-muted">Fair share</dt><dd className="break-words font-bold tabular-nums">{m(f.fairShareMinor)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-ink-muted">Net position</dt><dd className={`break-words font-bold tabular-nums ${f.netPositionMinor > 0 ? 'text-cb-green-dark' : f.netPositionMinor < 0 ? 'text-danger' : ''}`}>{formatSignedMinor(f.netPositionMinor, cfg.currency)}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-ink-muted">{f.action === 'pay' ? 'To pay' : f.action === 'receive' ? 'To receive' : 'Outstanding'}</dt><dd className="break-words font-bold tabular-nums">{m(Math.abs(f.outstandingMinor))}</dd></div>
                </dl>
                {f.reimbursedMinor > 0 && <p className="mt-2 text-xs text-ink-muted">{m(f.reimbursedMinor)} of their expenses reimbursed by the business</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Panel id="upcoming-h" title="Upcoming recurring payments" note="Scheduled obligations, not confirmed expenses. Record a payment from Recurring when it is paid.">
        {d.upcomingRecurring.items.length === 0 ? <Empty>No active recurring payments. <Link to="/recurring" className="font-semibold text-cb-blue underline">Add one</Link>.</Empty> : (
          <ul className="divide-y divide-surface-line" aria-label="Upcoming recurring payments">
            {d.upcomingRecurring.items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0"><p className="break-words font-semibold text-cb-navy">{it.provider}</p><p className="text-xs text-ink-muted">Due {it.nextDueDate} · {it.frequency}</p></div>
                <div className="flex items-center gap-2">{it.dueState === 'overdue' && <span className="badge bg-danger-soft text-danger">Overdue</span>}{it.dueState === 'due_soon' && <span className="badge bg-cb-blue/10 text-cb-blue">Due soon</span>}<span className="font-bold tabular-nums">{m(it.amountMinor)}</span></div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-muted">Monthly commitment: <strong className="tabular-nums text-cb-navy">{m(d.upcomingRecurring.summary.monthlyCommitmentMinor)}</strong> across {d.upcomingRecurring.summary.activeCount} active payment{d.upcomingRecurring.summary.activeCount === 1 ? '' : 's'}. <Link to="/recurring" className="font-semibold text-cb-blue underline">Manage</Link></p>
      </Panel>

      <Panel id="settle-h" title="Settlement summary" note="Recommended payments from the settlement engine. Recording a payment creates a Settlement transaction that needs approval.">
        {d.settlement.recommendations.length === 0 ? (
          <p className="rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{d.founders.length === 0 ? 'No founders yet.' : 'No payments needed between founders.'}</p>
        ) : (
          <ol className="space-y-2" aria-label="Recommended payments">
            {d.settlement.recommendations.map((r, i) => (
              <li key={`${r.payer.id}-${r.receiver.id}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-surface-line p-3">
                <span className="break-words font-semibold text-danger">{r.payer.name}</span><span className="text-xs text-ink-muted">pays</span><ArrowRight className="h-4 w-4 text-ink-faint" aria-hidden />
                <span className="break-words font-semibold text-cb-green-dark">{r.receiver.name}</span>
                <span className="ml-auto font-extrabold tabular-nums text-cb-navy">{m(r.amountMinor)}</span>
                <RecordPaymentButton label="Settle" payer={r.payer} receiver={r.receiver} suggestedMinor={r.amountMinor} onDone={onSettled} />
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-ink-muted"><Link to="/settlements" className="font-semibold text-cb-blue underline">Open settlements</Link></p>
      </Panel>

      <Panel id="recent-h" title="Recent transactions" note="Newest first. Pending or draft entries are shown but not counted until approved.">
        {d.recent.length === 0 ? <Empty>No transactions to show.</Empty> : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-ink-muted"><tr><th className="py-2 pr-3">Date</th><th className="pr-3">Transaction</th><th className="pr-3">Category</th><th className="pr-3">Founder</th><th className="pr-3">Status</th><th className="text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-surface-line">
                  {d.recent.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap py-2 pr-3 tabular-nums">{t.date}</td>
                      <td className="max-w-[16rem] pr-3"><Link to={`/transactions/${t.id}`} className="block break-words font-semibold text-cb-navy hover:underline">{t.description}</Link><span className="text-xs text-ink-muted">{t.txnNumber} · {TYPE_LABEL[t.type]}</span></td>
                      <td className="max-w-[10rem] break-words pr-3">{t.category?.name ?? '—'}</td>
                      <td className="max-w-[10rem] break-words pr-3">{t.paidBy?.name ?? '—'}{t.counterparty ? ` → ${t.counterparty.name}` : ''}</td>
                      <td className="pr-3"><StatusBadge status={t.status} /></td>
                      <td className="whitespace-nowrap text-right font-bold tabular-nums">{m(t.amountMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 md:hidden" aria-label="Recent transactions">
              {d.recent.map((t) => (
                <li key={t.id} className="rounded-xl border border-surface-line p-3 text-sm">
                  <div className="flex items-start justify-between gap-3"><Link to={`/transactions/${t.id}`} className="min-w-0 break-words font-semibold text-cb-navy">{t.description}</Link><span className="shrink-0 font-bold tabular-nums">{m(t.amountMinor)}</span></div>
                  <p className="mt-1 break-words text-xs text-ink-muted">{t.date} · {TYPE_LABEL[t.type]}{t.category ? ` · ${t.category.name}` : ''}{t.paidBy ? ` · ${t.paidBy.name}` : ''}{t.counterparty ? ` → ${t.counterparty.name}` : ''}</p>
                  <div className="mt-1"><StatusBadge status={t.status} /></div>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-3 flex items-center gap-1 text-xs"><ReceiptText className="h-3.5 w-3.5 text-ink-faint" aria-hidden /><Link to="/transactions" className="font-semibold text-cb-blue underline">View all {d.counts.matchingTransactions} transaction{d.counts.matchingTransactions === 1 ? '' : 's'}</Link></p>
      </Panel>
    </div>
  );
}
