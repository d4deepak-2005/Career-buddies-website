import { AlertCircle, Check, Paperclip } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { ApiError } from '../lib/api';
import type { TransactionStatus } from '../lib/types';

const STATUS: Record<TransactionStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-surface-alt text-ink-muted ring-1 ring-surface-line' },
  pending_approval: { label: 'Pending approval', cls: 'bg-cb-blue/10 text-cb-blue' },
  approved: { label: 'Approved', cls: 'bg-cb-green/10 text-cb-green-dark' },
  rejected: { label: 'Rejected', cls: 'bg-danger-soft text-danger' },
  voided: { label: 'Voided', cls: 'bg-ink/10 text-ink-muted line-through' },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const s = STATUS[status];
  return <span className={`badge whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}

export function ReceiptIndicator({ count }: { count: number }) {
  return count > 0 ? (
    <span className="inline-flex items-center gap-1 text-cb-green-dark" title={`${count} receipt${count > 1 ? 's' : ''}`}>
      <Paperclip className="h-4 w-4" aria-hidden /><span className="text-xs font-semibold">{count}</span><span className="sr-only">receipts attached</span>
    </span>
  ) : <span className="text-xs text-ink-faint" aria-label="No receipt">—</span>;
}

export function ErrorBox({ error, onRetry }: { error: ApiError | string; onRetry?: () => void }) {
  const msg = typeof error === 'string' ? error : error.message;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{msg}{onRetry && <> <button className="underline" onClick={onRetry}>Retry</button></>}</span>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div role="status" className="flex items-center gap-2 rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark"><Check className="h-4 w-4" aria-hidden />{children}</div>;
}

export function FieldError({ message }: { message?: string | undefined }) {
  return message ? <p className="mt-1 text-xs font-medium text-danger" role="alert">{message}</p> : null;
}

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-cb-navy">
      {children}{hint && <span className="ml-1.5 text-xs font-normal text-ink-faint">{hint}</span>}
    </label>
  );
}

/** Accessible modal confirmation, used before void/reversal. */
export function ConfirmDialog({ title, children, confirmLabel, danger, busy, disabled, onConfirm, onCancel }: {
  title: string; children: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; disabled?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('textarea, input, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cb-navy-deep/60 p-4 sm:items-center" role="presentation">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="card w-full max-w-md p-6 shadow-pop">
        <h2 id="confirm-title" className="text-lg font-extrabold text-cb-navy">{title}</h2>
        <div className="mt-3 text-sm text-ink-muted">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={`btn text-white ${danger ? 'bg-danger hover:opacity-90' : 'bg-cb-blue hover:bg-cb-navy'}`} onClick={onConfirm} disabled={busy || disabled}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function detailsByPath(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (err instanceof ApiError && Array.isArray(err.details)) {
    for (const d of err.details as Array<{ path?: string; message?: string }>) {
      if (d.message) out[d.path ?? ''] ??= d.message;
    }
  }
  return out;
}
