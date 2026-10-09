import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, PlusCircle, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { TransactionModal } from './TransactionModal';
import { ErrorBox, ReceiptIndicator, StatusBadge } from '../../components/ui';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor } from '../../lib/money';
import type { Category, Founder, Transaction, TransactionList } from '../../lib/types';
import { useResource } from '../../lib/useResource';

const FILTER_KEYS = ['type', 'status', 'categoryId', 'paidByFounderId', 'dateFrom', 'dateTo', 'hasReceipt'] as const;
const STATUS_LABELS: Record<string, string> = { draft: 'Draft', pending_approval: 'Pending approval', approved: 'Approved', rejected: 'Rejected', voided: 'Voided' };

function SortHeader({ field, label, sort, order, onSort, align = 'left' }: { field: string; label: string; sort: string; order: string; onSort: (f: string) => void; align?: 'left' | 'right' }) {
  const active = sort === field;
  return (
    <th scope="col" aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-4 py-3 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button className={`inline-flex items-center gap-1 ${active ? 'text-cb-navy' : ''}`} onClick={() => onSort(field)}>
        {label}{active && (order === 'asc' ? <ArrowUp className="h-3.5 w-3.5" aria-hidden /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden />)}
      </button>
    </th>
  );
}

export function TransactionsPage({ addOpen = false }: { addOpen?: boolean }) {
  const cfg = useAppConfig();
  const location = useLocation();
  const savedNotice = (location.state as { notice?: string } | null)?.notice;
  const [params, setParams] = useSearchParams();
  const founders = useResource<{ founders: Founder[] }>('/founders');
  const categories = useResource<{ categories: Category[] }>('/categories');

  const sort = params.get('sort') ?? 'transactionDate';
  const order = params.get('order') ?? 'desc';
  const page = Number(params.get('page') ?? '1') || 1;
  const [search, setSearch] = useState(params.get('search') ?? '');

  const set = (changes: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) (v ? next.set(k, v) : next.delete(k));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => { if ((params.get('search') ?? '') !== search.trim()) set({ search: search.trim() || null }); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const qs = new URLSearchParams(params);
  qs.set('sort', sort); qs.set('order', order); qs.set('page', String(page));
  const list = useResource<TransactionList>(`/transactions?${qs.toString()}`);
  const { reload } = list;
  const savedAt = (location.state as { saved?: number } | null)?.saved;
  useEffect(() => { if (savedAt) reload(); }, [savedAt, reload]);

  const onSort = (field: string) => set({ sort: field, order: sort === field && order === 'desc' ? 'asc' : 'desc' });
  const hasFilters = FILTER_KEYS.some((k) => params.get(k)) || !!params.get('search');
  const clear = () => { setSearch(''); setParams(new URLSearchParams(), { replace: true }); };
  const data = list.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const money = (t: Transaction) => <span className={t.status === 'voided' ? 'text-ink-faint line-through' : ''}>{formatMinor(t.amountMinor, cfg.currency)}</span>;
  const typeLabel = (v: string) => cfg.transactionTypes.find((t) => t.value === v)?.label ?? v;

  const select = 'field !min-h-10 !py-0';
  return (
    <div className="space-y-4">
      {addOpen && <TransactionModal />}
      {savedNotice && <p role="status" className="rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{savedNotice}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">Every recorded transaction. Voided entries stay visible for the audit trail.</p>
        <Link to="/transactions/new" className="btn-primary"><PlusCircle className="h-4 w-4" aria-hidden />Add transaction</Link>
      </div>

      <div role="tablist" aria-label="Status quick filter" className="flex gap-1 overflow-x-auto border-b border-surface-line">
        {([['', 'All'], ['pending_approval', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as const).map(([v, label]) => {
          const on = (params.get('status') ?? '') === v;
          return <button key={label} type="button" role="tab" aria-selected={on} onClick={() => set({ status: v || null })} className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold ${on ? 'border-cb-blue text-cb-blue' : 'border-transparent text-ink-muted hover:text-cb-navy'}`}>{label}</button>;
        })}
      </div>

      <section aria-label="Filters" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
        <div className="relative sm:col-span-2">
          <label htmlFor="f-search" className="sr-only">Search transactions</label>
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-ink-faint" aria-hidden />
          <input id="f-search" type="search" className="field !min-h-10 !pl-10" placeholder="Search description, notes or TXN number" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-type" className="sr-only">Type</label>
          <select id="f-type" className={select} value={params.get('type') ?? ''} onChange={(e) => set({ type: e.target.value || null })}>
            <option value="">All types</option>
            {cfg.transactionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="sr-only">Status</label>
          <select id="f-status" className={select} value={params.get('status') ?? ''} onChange={(e) => set({ status: e.target.value || null })}>
            <option value="">All statuses</option>
            {cfg.transactionStatuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-cat" className="sr-only">Category</label>
          <select id="f-cat" className={select} value={params.get('categoryId') ?? ''} onChange={(e) => set({ categoryId: e.target.value || null })}>
            <option value="">All categories</option>
            {categories.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactive)'}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-founder" className="sr-only">Paid by</label>
          <select id="f-founder" className={select} value={params.get('paidByFounderId') ?? ''} onChange={(e) => set({ paidByFounderId: e.target.value || null })}>
            <option value="">Any founder</option>
            {founders.data?.founders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-receipt" className="sr-only">Receipt</label>
          <select id="f-receipt" className={select} value={params.get('hasReceipt') ?? ''} onChange={(e) => set({ hasReceipt: e.target.value || null })}>
            <option value="">Receipt: any</option>
            <option value="true">With receipt</option>
            <option value="false">No receipt</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="f-from" className="sr-only">From date</label>
          <input id="f-from" type="date" className={`${select} min-w-0 flex-1`} value={params.get('dateFrom') ?? ''} onChange={(e) => set({ dateFrom: e.target.value || null })} />
          <span className="text-ink-faint" aria-hidden>–</span>
          <label htmlFor="f-to" className="sr-only">To date</label>
          <input id="f-to" type="date" className={`${select} min-w-0 flex-1`} value={params.get('dateTo') ?? ''} onChange={(e) => set({ dateTo: e.target.value || null })} />
        </div>
        {hasFilters && <button className="btn-ghost !min-h-10 justify-self-start" onClick={clear}><X className="h-4 w-4" aria-hidden />Clear filters</button>}
      </section>

      {list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
      {list.loading && !data && <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading transactions…</p>}

      {data && data.items.length === 0 && (
        <div className="card px-6 py-14 text-center">
          <p className="font-bold text-cb-navy">{hasFilters ? 'No transactions match these filters' : 'No transactions yet'}</p>
          <p className="mt-1 text-sm text-ink-muted">{hasFilters ? 'Try removing a filter or searching for something else.' : 'Add the first transaction to start the ledger.'}</p>
          {!hasFilters && <Link to="/transactions/new" className="btn-primary mt-5">Add transaction</Link>}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          {/* Desktop / tablet table */}
          <div className="card relative hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Transactions</caption>
              <thead className="border-b border-surface-line bg-surface-alt text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <SortHeader field="txnNumber" label="ID" sort={sort} order={order} onSort={onSort} />
                  <SortHeader field="transactionDate" label="Date" sort={sort} order={order} onSort={onSort} />
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Description</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Type</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Category</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Paid by</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                  <SortHeader field="amountMinor" label="Amount" sort={sort} order={order} onSort={onSort} align="right" />
                  <th scope="col" className="px-4 py-3 text-center font-semibold">Receipt</th>
                  <SortHeader field="createdAt" label="Created" sort={sort} order={order} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-line">
                {data.items.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-alt/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-muted">{t.txnNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3">{t.transactionDate}</td>
                    <td className="max-w-[16rem] truncate px-4 py-3 font-semibold"><Link className="text-cb-navy hover:underline" to={`/transactions/${t.id}`}>{t.description}</Link></td>
                    <td className="whitespace-nowrap px-4 py-3">{typeLabel(t.type)}</td>
                    <td className="px-4 py-3">{t.category?.name ?? <span className="text-ink-faint">—</span>}</td>
                    <td className="px-4 py-3">{t.paidBy?.name ?? <span className="text-ink-faint">—</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{money(t)}</td>
                    <td className="px-4 py-3 text-center"><ReceiptIndicator count={t.receiptCount} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{t.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden" aria-label="Transactions">
            {data.items.map((t) => (
              <li key={t.id} className="card p-4">
                <Link to={`/transactions/${t.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-bold text-cb-navy">{t.description}</p>
                    <p className="whitespace-nowrap font-bold tabular-nums">{money(t)}</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{t.txnNumber} · {t.transactionDate} · {typeLabel(t.type)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={t.status} />
                    {t.category && <span className="badge bg-surface-alt text-ink-muted">{t.category.name}</span>}
                    {t.paidBy && <span className="text-ink-muted">Paid by {t.paidBy.name}</span>}
                    <ReceiptIndicator count={t.receiptCount} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-ink-muted">
            <span>{data.total} transaction{data.total === 1 ? '' : 's'} · page {data.page} of {totalPages}</span>
            <div className="flex gap-2">
              <button className="btn-ghost !min-h-10" disabled={page <= 1} onClick={() => set({ page: String(page - 1) }, true)}><ChevronLeft className="h-4 w-4" aria-hidden />Prev</button>
              <button className="btn-ghost !min-h-10" disabled={page >= totalPages} onClick={() => set({ page: String(page + 1) }, true)}>Next<ChevronRight className="h-4 w-4" aria-hidden /></button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
