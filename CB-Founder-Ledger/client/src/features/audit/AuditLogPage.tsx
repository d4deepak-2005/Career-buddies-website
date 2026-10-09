import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ErrorBox } from '../../components/ui';
import type { AuditResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';

const ENTITY_TYPES = ['transaction', 'settings', 'founder', 'category', 'user', 'recurring', 'auth'];
const fmt = (iso: string) => new Date(iso).toLocaleString();

function Delta({ before, after }: { before: unknown; after: unknown }) {
  if (before == null && after == null) return null;
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer font-semibold text-cb-blue">View values</summary>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <div><p className="font-semibold text-ink-muted">Before</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-alt p-2">{JSON.stringify(before, null, 2) ?? '—'}</pre></div>
        <div><p className="font-semibold text-ink-muted">After</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-alt p-2">{JSON.stringify(after, null, 2) ?? '—'}</pre></div>
      </div>
    </details>
  );
}

/** Admin-only, read-only view of the append-only audit trail. */
export function AuditLogPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), pageSize: '25' });
  if (entityType) qs.set('entityType', entityType);
  if (/^[A-Z_]{3,60}$/.test(action)) qs.set('action', action);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const res = useResource<AuditResponse>(`/audit-log?${qs.toString()}`);
  const d = res.data;
  const totalPages = d ? Math.max(Math.ceil(d.total / d.pageSize), 1) : 1;
  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <p className="flex items-start gap-2 text-sm text-ink-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cb-green-dark" aria-hidden />Append-only record of important actions. Events cannot be edited or deleted, and credentials are never stored in them.</p>
      <section className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Audit filters">
        <label className="block text-xs font-semibold text-ink-muted">Record type<select className="field mt-1" value={entityType} onChange={(e) => reset(() => setEntityType(e.target.value))}><option value="">All</option>{ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
        <label className="block text-xs font-semibold text-ink-muted">Action<input className="field mt-1" placeholder="e.g. TRANSACTION_APPROVED" value={action} onChange={(e) => reset(() => setAction(e.target.value.toUpperCase().replace(/[^A-Z_]/g, '')))} /></label>
        <label className="block text-xs font-semibold text-ink-muted">From<input type="date" className="field mt-1" value={from} onChange={(e) => reset(() => setFrom(e.target.value))} /></label>
        <label className="block text-xs font-semibold text-ink-muted">To<input type="date" className="field mt-1" value={to} onChange={(e) => reset(() => setTo(e.target.value))} /></label>
      </section>
      {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}
      {res.loading && !d && <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading audit log…</p>}
      {d && d.items.length === 0 && <div className="card px-6 py-12 text-center text-sm text-ink-muted">No audit events match these filters.</div>}
      {d && d.items.length > 0 && (
        <ul className="space-y-2" aria-label="Audit events">
          {d.items.map((e) => (
            <li key={e.id} className="card min-w-0 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0"><p className="break-words font-semibold text-cb-navy">{e.summary}</p><p className="text-xs text-ink-muted"><span className="badge mr-1 bg-cb-blue/10 text-cb-blue">{e.action}</span>{e.entityType}{e.entityId ? ` · ${e.entityId}` : ''}</p></div>
                <p className="text-right text-xs text-ink-muted"><span className="block">{fmt(e.at)}</span><span className="block break-all">{e.actor}</span></p>
              </div>
              {e.reason && <p className="mt-1 text-sm">Reason: “{e.reason}”</p>}
              <Delta before={e.before} after={e.after} />
            </li>
          ))}
        </ul>
      )}
      {d && d.total > d.pageSize && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-ink-muted"><span>{d.total} events · page {d.page} of {totalPages}</span>
          <div className="flex gap-2"><button className="btn-ghost !min-h-10" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" aria-hidden />Prev</button><button className="btn-ghost !min-h-10" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4" aria-hidden /></button></div></nav>
      )}
    </div>
  );
}
