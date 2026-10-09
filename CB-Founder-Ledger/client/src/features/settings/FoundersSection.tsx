import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Avatar, ErrorBox, Label } from '../../components/ui';
import { ApiError, api, apiUpload } from '../../lib/api';
import { useAppConfig } from '../../lib/AppConfigContext';
import { useDirtyGuard } from '../../lib/dirty';
import type { Founder } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { SettingsCard } from './settingsKit';

function FounderRow({ f, index, count, busy, onMove, run }: {
  f: Founder; index: number; count: number; busy: boolean; onMove: (dir: -1 | 1) => void; run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const cfg = useAppConfig();
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(f.name);
  const [role, setRole] = useState(f.role ?? '');
  const [fileError, setFileError] = useState<string | null>(null);
  const dirty = name !== f.name || role !== (f.role ?? '');
  useDirtyGuard(dirty);
  const invalid = name.trim().length < 1;

  async function onFile(file0: File | undefined) {
    if (!file0) return;
    setFileError(null);
    const ext = file0.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) { setFileError('Use a PNG, JPG or WebP image.'); return; }
    if (file0.size > cfg.imageMaxBytes) { setFileError(`Too large (maximum ${Math.round((cfg.imageMaxBytes / 1024 / 1024) * 10) / 10} MB).`); return; }
    await run(() => apiUpload(`/founders/${f.id}/photo`, file0, 'PUT'));
    if (file.current) file.current.value = '';
  }

  return (
    <li className="min-w-0 rounded-2xl border border-surface-line p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          <Avatar name={f.name} photoUrl={f.photoUrl} size="xl" />
          <input ref={file} id={`photo-${f.id}`} type="file" className="sr-only" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(e) => void onFile(e.target.files?.[0])} />
          <div className="flex gap-1">
            <button className="btn-ghost !min-h-9 border border-surface-line !px-2 text-xs" disabled={busy} onClick={() => file.current?.click()} aria-label={`Upload photograph for ${f.name}`}><ImagePlus className="h-4 w-4" aria-hidden />Photo</button>
            {f.hasPhoto && <button className="btn-ghost !min-h-9 border border-surface-line !px-2" disabled={busy} onClick={() => void run(() => api(`/founders/${f.id}/photo`, { method: 'DELETE' }))} aria-label={`Remove photograph of ${f.name}`}><Trash2 className="h-4 w-4" aria-hidden /></button>}
          </div>
          {fileError && <p role="alert" className="max-w-[9rem] text-center text-xs font-medium text-danger">{fileError}</p>}
        </div>
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <div><Label htmlFor={`fn-${f.id}`}>Display name</Label><input id={`fn-${f.id}`} className="field" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={invalid} /></div>
          <div><Label htmlFor={`fr-${f.id}`}>Role</Label><input id={`fr-${f.id}`} className="field" maxLength={60} placeholder="e.g. Co-founder" value={role} onChange={(e) => setRole(e.target.value)} /></div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button className="btn-primary !min-h-9 !px-3" disabled={busy || !dirty || invalid} onClick={() => void run(async () => { await api(`/founders/${f.id}`, { method: 'PATCH', body: { name: name.trim(), role: role.trim() } }); })}>Save</button>
            <button className="btn-ghost !min-h-9 border border-surface-line !px-3" disabled={!dirty || busy} onClick={() => { setName(f.name); setRole(f.role ?? ''); }}>Cancel</button>
            <label className="ml-auto flex min-h-9 cursor-pointer items-center gap-2 text-sm font-semibold text-cb-navy"><input type="checkbox" role="switch" className="h-5 w-5 accent-cb-blue" checked={f.active} disabled={busy} onChange={(e) => void run(() => api(`/founders/${f.id}`, { method: 'PATCH', body: { active: e.target.checked } }))} />Active</label>
            <div className="flex gap-1" role="group" aria-label={`Order for ${f.name}`}>
              <button className="btn-ghost !min-h-9 border border-surface-line !px-2" disabled={busy || index === 0} onClick={() => onMove(-1)} aria-label={`Move ${f.name} up`}><ArrowUp className="h-4 w-4" aria-hidden /></button>
              <button className="btn-ghost !min-h-9 border border-surface-line !px-2" disabled={busy || index === count - 1} onClick={() => onMove(1)} aria-label={`Move ${f.name} down`}><ArrowDown className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
          <p className="text-xs text-ink-muted sm:col-span-2">Position {index + 1}. Renaming or reordering never changes any transaction or balance; transactions refer to the founder, not the name.</p>
        </div>
      </div>
    </li>
  );
}

export function FoundersSection() {
  const res = useResource<{ founders: Founder[] }>('/founders');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  useDirtyGuard(!!(name || role));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); setNotice('Saved. Every screen uses the new details and order.'); res.reload(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong'); } finally { setBusy(false); }
  }
  const list = res.data?.founders ?? [];
  const move = (i: number, dir: -1 | 1) => {
    const ids = list.map((f) => f.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void run(() => api('/founders/order', { method: 'PUT', body: { ids } }));
  };
  const add = (e: FormEvent) => { e.preventDefault(); void run(async () => { await api('/founders', { method: 'POST', body: { name: name.trim(), ...(role.trim() ? { role: role.trim() } : {}) } }); setName(''); setRole(''); }); };

  return (
    <SettingsCard title="Founders" description="Names, roles, photographs and the order in which founders are listed everywhere. Founders are deactivated, never deleted, so history stays intact.">
      {res.loading && !res.data && <p role="status" className="text-sm text-ink-muted">Loading…</p>}
      {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}
      {error && <div className="mb-3"><ErrorBox error={error} /></div>}
      {notice && <p role="status" className="mb-3 rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{notice}</p>}
      {list.length > 0 && <ul className="space-y-3" aria-label="Founders">
        {list.map((f, i) => <FounderRow key={`${f.id}-${f.name}-${f.role}-${f.photoUrl}`} f={f} index={i} count={list.length} busy={busy} onMove={(d) => move(i, d)} run={run} />)}
      </ul>}
      <form onSubmit={add} className="mt-5 grid gap-3 border-t border-surface-line pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end" aria-label="Add founder">
        <div><Label htmlFor="nf-name">New founder name</Label><input id="nf-name" className="field" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label htmlFor="nf-role" hint="(optional)">Role</Label><input id="nf-role" className="field" maxLength={60} value={role} onChange={(e) => setRole(e.target.value)} /></div>
        <button type="submit" className="btn-primary" disabled={busy || !name.trim()}><Plus className="h-4 w-4" aria-hidden />Add founder</button>
      </form>
    </SettingsCard>
  );
}
