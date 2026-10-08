import { Download, Eye, FileText, Paperclip, Pencil, Send, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmDialog, ErrorBox, Notice, StatusBadge } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor } from '../../lib/money';
import type { HistoryItem, Receipt, Transaction } from '../../lib/types';
import { useResource } from '../../lib/useResource';

const ACTION_LABELS: Record<string, string> = { created: 'Created', edited: 'Edited', submitted: 'Submitted for approval', voided: 'Voided', receipt_added: 'Receipt added' };
const EDITABLE = ['draft', 'pending_approval'];
const fmtTime = (iso: string) => new Date(iso).toLocaleString();

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4"><dt className="w-40 shrink-0 text-sm font-semibold text-ink-muted">{label}</dt><dd className="min-w-0 break-words text-sm text-ink">{children}</dd></div>;
}

export function TransactionDetailPage() {
  const { id = '' } = useParams();
  const cfg = useAppConfig();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const detail = useResource<{ transaction: Transaction; receipts: Receipt[] }>(`/transactions/${id}`);
  const history = useResource<{ history: HistoryItem[] }>(`/transactions/${id}/history`);
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const notice = (location.state as { notice?: string } | null)?.notice;

  if (detail.loading && !detail.data) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading transaction…</p>;
  if (detail.error) return <div className="space-y-4"><ErrorBox error={detail.error.status === 404 ? 'Transaction not found.' : detail.error} onRetry={detail.reload} /><Link to="/transactions" className="btn-ghost">Back to transactions</Link></div>;
  if (!detail.data) return null;

  const { transaction: t, receipts } = detail.data;
  const money = (n: number) => formatMinor(n, cfg.currency);
  const typeLabel = cfg.transactionTypes.find((x) => x.value === t.type)?.label ?? t.type;
  const isOwner = t.createdBy?.id === user?.id;
  const canChange = user?.role === 'admin' || isOwner; // UX only; the server enforces
  const canEdit = canChange && EDITABLE.includes(t.status);
  const canSubmit = canChange && t.status === 'draft';
  const canVoid = user?.role === 'admin' && t.status !== 'voided';
  const canAttach = canChange && t.status !== 'voided' && receipts.length < cfg.receipts.maxPerTransaction;

  const refresh = () => { detail.reload(); history.reload(); };
  const fail = (e: unknown) => setError(e instanceof ApiError ? (e.code === 'VERSION_CONFLICT' ? 'This transaction was changed by someone else. The page has been reloaded — please try again.' : e.message) : 'Something went wrong');

  async function submitForApproval() {
    setBusy(true); setError(null);
    try { await api(`/transactions/${t.id}/submit`, { method: 'POST', body: { expectedVersion: t.version } }); refresh(); } catch (e) { fail(e); refresh(); } finally { setBusy(false); }
  }
  async function doVoid() {
    setBusy(true); setError(null);
    try { await api(`/transactions/${t.id}/void`, { method: 'POST', body: { expectedVersion: t.version, reason: reason.trim() } }); setVoiding(false); setReason(''); refresh(); } catch (e) { fail(e); setVoiding(false); refresh(); } finally { setBusy(false); }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploadMsg(null); setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!cfg.receipts.allowedExtensions.includes(ext)) return setError(`Receipts must be ${cfg.receipts.allowedExtensions.join(', ').toUpperCase()} files.`);
    if (file.size > cfg.receipts.maxBytes) return setError(`That file is too large (maximum ${Math.round(cfg.receipts.maxBytes / 1024 / 1024)} MB).`);
    const fd = new FormData(); fd.append('file', file);
    setBusy(true);
    try {
      const res = await fetch(`/api/transactions/${t.id}/receipts`, { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: { message?: string } }; throw new Error(b.error?.message ?? 'Upload failed'); }
      setUploadMsg(`Uploaded ${file.name}`); refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {notice && <Notice>{notice}</Notice>}
      {uploadMsg && <Notice>{uploadMsg}</Notice>}
      {error && <ErrorBox error={error} />}

      <section className="card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs text-ink-muted">{t.txnNumber} · {typeLabel}</p>
            <h2 className="mt-1 break-words text-xl font-extrabold text-cb-navy">{t.description}</h2>
            <div className="mt-2"><StatusBadge status={t.status} /></div>
          </div>
          <p className={`text-2xl font-extrabold tabular-nums text-cb-navy ${t.status === 'voided' ? 'text-ink-faint line-through' : ''}`}>{money(t.amountMinor)}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {canEdit && <Link to={`/transactions/${t.id}/edit`} className="btn-primary"><Pencil className="h-4 w-4" aria-hidden />Edit</Link>}
          {canSubmit && <button className="btn border border-cb-blue text-cb-blue hover:bg-cb-blue/5" disabled={busy} onClick={() => void submitForApproval()}><Send className="h-4 w-4" aria-hidden />Submit for approval</button>}
          {canVoid && <button className="btn border border-danger text-danger hover:bg-danger-soft" disabled={busy} onClick={() => setVoiding(true)}>Void transaction</button>}
          <button className="btn-ghost" onClick={() => navigate('/transactions')}>Back to list</button>
        </div>
        {t.status === 'voided' && t.void && (
          <p className="mt-4 rounded-xl bg-surface-alt p-3 text-sm"><strong>Voided</strong> by {t.void.voidedBy?.name ?? 'unknown'} on {fmtTime(t.void.voidedAt)}. Reason: {t.void.reason}</p>
        )}
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="det-h">
        <h3 id="det-h" className="mb-1 text-base font-extrabold text-cb-navy">Details</h3>
        <dl className="divide-y divide-surface-line">
          <Row label="Date">{t.transactionDate}</Row>
          <Row label="Category">{t.category?.name ?? '—'}</Row>
          <Row label="Paid by">{t.paidBy?.name ?? '—'}</Row>
          {t.counterparty && <Row label="Received by">{t.counterparty.name}</Row>}
          {t.method && <Row label="Payment method">{t.method}</Row>}
          <Row label="Notes">{t.notes ?? '—'}</Row>
          <Row label="Created">{t.createdBy?.name} · {fmtTime(t.createdAt)}</Row>
          <Row label="Last updated">{t.updatedBy?.name} · {fmtTime(t.updatedAt)} (v{t.version})</Row>
        </dl>
      </section>

      {t.split && (
        <section className="card p-5 sm:p-6" aria-labelledby="split-h">
          <h3 id="split-h" className="text-base font-extrabold text-cb-navy">Split <span className="ml-1 text-sm font-semibold capitalize text-ink-muted">({t.split.method})</span></h3>
          <p className="mb-3 mt-1 text-xs text-ink-muted">Each founder's responsibility for this transaction only. Overall balances and settlements arrive in a later phase.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-muted"><tr><th scope="col" className="py-2 text-left">Founder</th><th scope="col" className="py-2 text-left">Definition</th><th scope="col" className="py-2 text-right">Responsible for</th></tr></thead>
              <tbody className="divide-y divide-surface-line">
                {t.split.entries.map((e) => (
                  <tr key={e.founderId}>
                    <td className="py-2.5 font-semibold">{e.founderName}</td>
                    <td className="py-2.5 text-ink-muted">{e.percent != null ? `${e.percent}%` : e.shares != null ? `${e.shares} share${e.shares === 1 ? '' : 's'}` : e.amountMinor != null ? money(e.amountMinor) : 'Equal'}{e.note ? ` — ${e.note}` : ''}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums">{money(e.allocatedMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card p-5 sm:p-6" aria-labelledby="rec-h">
        <div className="flex items-center justify-between gap-3">
          <h3 id="rec-h" className="flex items-center gap-2 text-base font-extrabold text-cb-navy"><Paperclip className="h-4 w-4" aria-hidden />Receipts ({receipts.length})</h3>
          {canAttach && (
            <>
              <input ref={fileInput} id="receipt-upload" type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => void upload(e.target.files?.[0])} />
              <label htmlFor="receipt-upload" className="btn-ghost cursor-pointer border border-surface-line"><Upload className="h-4 w-4" aria-hidden />Upload receipt</label>
            </>
          )}
        </div>
        {receipts.length === 0 ? <p className="mt-3 text-sm text-ink-muted">No receipts attached.</p> : (
          <ul className="mt-3 divide-y divide-surface-line">
            {receipts.map((r) => {
              const base = `/api/transactions/${t.id}/receipts/${r.id}/file`;
              return (
                <li key={r.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  {r.mimeType.startsWith('image/') ? <img src={base} alt={`Receipt ${r.fileName}`} className="h-16 w-16 rounded-lg border border-surface-line object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-alt text-cb-blue"><FileText className="h-7 w-7" aria-hidden /></span>}
                  <div className="min-w-0 flex-1 text-sm"><p className="truncate font-semibold">{r.fileName}</p><p className="text-xs text-ink-muted">{(r.sizeBytes / 1024).toFixed(0)} KB · {r.uploadedBy.name} · {fmtTime(r.uploadedAt)}</p></div>
                  <div className="flex gap-2">
                    <a href={base} target="_blank" rel="noopener noreferrer" className="btn-ghost !min-h-10 border border-surface-line"><Eye className="h-4 w-4" aria-hidden />View</a>
                    <a href={`${base}?download=1`} className="btn-ghost !min-h-10 border border-surface-line"><Download className="h-4 w-4" aria-hidden />Download</a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="hist-h">
        <h3 id="hist-h" className="mb-3 text-base font-extrabold text-cb-navy">History</h3>
        {history.data ? (
          <ol className="space-y-2 text-sm">
            {[...history.data.history].reverse().map((h) => (
              <li key={h.id} className="flex flex-wrap gap-x-2"><span className="font-semibold">{ACTION_LABELS[h.action] ?? h.action}</span><span className="text-ink-muted">by {h.actor.name} · {fmtTime(h.at)} · v{h.version}{h.reason ? ` · ${h.reason}` : ''}</span></li>
            ))}
          </ol>
        ) : <p className="text-sm text-ink-muted">Loading history…</p>}
      </section>

      {voiding && (
        <ConfirmDialog title="Void this transaction?" confirmLabel="Void transaction" danger busy={busy} disabled={reason.trim().length < 5} onConfirm={() => void doVoid()} onCancel={() => setVoiding(false)}>
          <p>The transaction will stay in the ledger marked as <strong>voided</strong> and can no longer be edited. This cannot be undone.</p>
          <label htmlFor="void-reason" className="mb-1 mt-4 block font-semibold text-cb-navy">Reason (required)</label>
          <textarea id="void-reason" className="field min-h-20 py-2" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </ConfirmDialog>
      )}
    </div>
  );
}
