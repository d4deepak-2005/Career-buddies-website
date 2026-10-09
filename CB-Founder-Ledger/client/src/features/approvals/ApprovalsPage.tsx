import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, StatusBadge } from '../../components/ui';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor } from '../../lib/money';
import type { ApprovalsResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { DecisionControls } from './DecisionControls';

const TABS = [
  { id: 'pending_approval', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
] as const;
const fmtTime = (iso: string) => new Date(iso).toLocaleString();

export function ApprovalsPage() {
  const cfg = useAppConfig();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('pending_approval');
  const [page, setPage] = useState(1);
  const res = useResource<ApprovalsResponse>(`/approvals?status=${tab}&page=${page}&pageSize=15`);
  const money = (n: number) => formatMinor(n, cfg.currency);
  const typeLabel = (v: string) => cfg.transactionTypes.find((t) => t.value === v)?.label ?? v;
  const data = res.data;
  const totalPages = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <p className="text-sm text-ink-muted">Pending transactions do not count in any figure until someone approves them. Every decision records who decided, when, and an optional comment.</p>
      <div role="tablist" aria-label="Approval status" className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-card">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} id={`tab-${t.id}`} aria-controls="approvals-panel"
            className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition ${tab === t.id ? 'bg-cb-navy text-white' : 'text-ink-muted hover:bg-surface-alt'}`}
            onClick={() => { setTab(t.id); setPage(1); }}>
            {t.label}{data ? <span className={`ml-2 badge ${tab === t.id ? 'bg-white/20 text-white' : 'bg-surface-alt text-ink-muted'}`}>{data.counts[t.id]}</span> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="approvals-panel" aria-labelledby={`tab-${tab}`} className="space-y-3">
        {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}
        {res.loading && !data && <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading approvals…</p>}
        {data && data.items.length === 0 && (
          <div className="card px-6 py-14 text-center">
            <ClipboardCheck className="mx-auto h-8 w-8 text-cb-green" aria-hidden />
            <p className="mt-2 font-bold text-cb-navy">{tab === 'pending_approval' ? 'Nothing is waiting for approval' : `No ${tab} transactions yet`}</p>
            <p className="mt-1 text-sm text-ink-muted">{tab === 'pending_approval' ? 'New transactions will appear here until they are approved or rejected.' : 'They will be listed here with who decided and when.'}</p>
          </div>
        )}
        {data && data.items.length > 0 && (
          <ul className="space-y-3" aria-label={`${TABS.find((t) => t.id === tab)!.label} transactions`}>
            {data.items.map((t) => (
              <li key={t.id} className="card min-w-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/transactions/${t.id}`} className="break-words font-bold text-cb-navy hover:underline">{t.description}</Link>
                    <p className="mt-0.5 text-xs text-ink-muted">{t.txnNumber} · {t.transactionDate} · {typeLabel(t.type)}{t.category ? ` · ${t.category.name}` : ''}{t.paidBy ? ` · paid by ${t.paidBy.name}` : ''}</p>
                    <p className="mt-1 text-xs text-ink-muted">Requested by <strong>{t.createdBy?.name ?? 'unknown'}</strong> on {fmtTime(t.createdAt)}</p>
                  </div>
                  <div className="text-right"><p className="text-lg font-extrabold tabular-nums text-cb-navy">{money(t.amountMinor)}</p><StatusBadge status={t.status} /></div>
                </div>
                {t.decision && (
                  <p className="mt-3 rounded-xl bg-surface-alt px-3 py-2 text-sm">
                    <strong>{t.decision.outcome === 'approved' ? 'Approved' : 'Rejected'}</strong> by {t.decision.by?.name ?? 'unknown'} on {fmtTime(t.decision.at)}
                    {t.decision.comment ? <> — “{t.decision.comment}”</> : null}
                  </p>
                )}
                {t.status === 'pending_approval' && <div className="mt-3 flex flex-wrap gap-2"><DecisionControls tx={t} onDone={res.reload} compact /></div>}
              </li>
            ))}
          </ul>
        )}
        {data && data.total > data.pageSize && (
          <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-ink-muted">
            <span>Page {data.page} of {totalPages}</span>
            <div className="flex gap-2">
              <button className="btn-ghost !min-h-10" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" aria-hidden />Prev</button>
              <button className="btn-ghost !min-h-10" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4" aria-hidden /></button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
