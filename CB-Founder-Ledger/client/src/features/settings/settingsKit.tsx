import { Check } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ErrorBox } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useAppConfig, useReloadConfig } from '../../lib/AppConfigContext';
import { useDirtyGuard } from '../../lib/dirty';
import type { AppSettings, SettingsResponse } from '../../lib/types';

export type SectionKey = 'business' | 'regional' | 'dashboard' | 'approvals' | 'settlements' | 'recurring' | 'reports';
type Patch = Partial<Record<SectionKey, Record<string, unknown>>> & { branding?: Record<string, unknown> };

/**
 * Shared behaviour of every settings form: dirty tracking (unsaved-change guard), Save / Cancel, server validation messages,
 * optimistic-concurrency conflicts, success feedback, and reloading the central configuration so the change shows everywhere.
 */
export function useSettingsForm<T>(initial: T, toPatch: (v: T) => Patch) {
  const settings = useAppConfig().settings;
  const reload = useReloadConfig();
  const [value, setValue] = useState<T>(initial);
  const [base, setBase] = useState<T>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(base);
  useDirtyGuard(dirty);
  // After a save (or an external change) the new persisted values become the baseline.
  const initialKey = JSON.stringify(initial);
  useEffect(() => { setValue(initial); setBase(initial); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [initialKey]);

  async function save() {
    setBusy(true); setError(null); setSaved(false);
    try {
      await api<SettingsResponse>('/settings', { method: 'PATCH', body: { expectedVersion: settings.version, ...toPatch(value) } });
      setBase(value); setSaved(true); reload();
    } catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, 'NETWORK', 'Could not reach the server')); } finally { setBusy(false); }
  }
  const cancel = () => { setValue(base); setError(null); setSaved(false); };
  return { value, setValue: (v: T) => { setSaved(false); setValue(v); }, dirty, busy, error, saved, save, cancel };
}

export function SettingsCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card min-w-0 p-5 sm:p-6" aria-label={title}>
      <h2 className="text-lg font-extrabold text-cb-navy">{title}</h2>
      {description && <p className="mb-4 mt-1 text-sm text-ink-muted">{description}</p>}
      {children}
    </section>
  );
}

export function FormActions({ form, label = 'Save changes' }: { form: { dirty: boolean; busy: boolean; error: ApiError | null; saved: boolean; save: () => void; cancel: () => void }; label?: string }) {
  const conflict = form.error?.code === 'VERSION_CONFLICT';
  return (
    <div className="mt-5 space-y-3">
      {form.error && (
        <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {conflict ? 'These settings were changed by someone else. Reload the page to see the latest values, then try again.' : form.error.message}
          {!conflict && Array.isArray(form.error.details) && <ul className="mt-1 list-disc pl-5">{(form.error.details as Array<{ path?: string; message: string }>).map((d, i) => <li key={i}>{d.message}</li>)}</ul>}
        </div>
      )}
      {form.saved && !form.dirty && <p role="status" className="flex items-center gap-2 rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark"><Check className="h-4 w-4" aria-hidden />Saved. The change is now applied everywhere.</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-ghost" onClick={form.cancel} disabled={!form.dirty || form.busy}>Cancel</button>
        <button type="button" className="btn-primary" onClick={form.save} disabled={!form.dirty || form.busy}>{form.busy ? 'Saving…' : label}</button>
      </div>
      {form.dirty && <p className="text-right text-xs text-ink-muted">You have unsaved changes.</p>}
    </div>
  );
}

export function ReadOnlyNote({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-surface-line bg-surface-tint px-4 py-3 text-sm text-ink-muted">{children}</div>;
}

export function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input id={id} type="checkbox" role="switch" className="mt-1 h-5 w-5 shrink-0 accent-cb-blue" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0"><span className="block text-sm font-semibold text-cb-navy">{label}</span>{hint && <span className="block text-xs text-ink-muted">{hint}</span>}</span>
    </label>
  );
}

export type { AppSettings };
export { ErrorBox };
