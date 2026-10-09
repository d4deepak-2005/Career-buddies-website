import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ErrorBox, Label } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useDirtyGuard } from '../../lib/dirty';
import type { Category } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { SettingsCard } from './settingsKit';

function CategoryRow({ c, index, count, busy, move, run }: { c: Category; index: number; count: number; busy: boolean; move: (d: -1 | 1) => void; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [name, setName] = useState(c.name);
  const dirty = name.trim() !== c.name;
  useDirtyGuard(dirty);
  return (
    <li className="flex flex-wrap items-center gap-2 py-3">
      <div className="min-w-0 flex-1 basis-48">
        <label htmlFor={`cn-${c.id}`} className="sr-only">Category name</label>
        <input id={`cn-${c.id}`} className="field !min-h-10" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <p className="mt-1 text-xs text-ink-muted">{c.isDevSeed && <span className="badge mr-1 bg-cb-blue/10 text-cb-blue">dev seed</span>}{!c.active && <span className="badge mr-1 bg-surface-alt text-ink-muted">inactive</span>}{c.description}</p>
      </div>
      {dirty && <button className="btn-primary !min-h-9 !px-3" disabled={busy || !name.trim()} onClick={() => void run(() => api(`/categories/${c.id}`, { method: 'PATCH', body: { name: name.trim() } }))}>Save</button>}
      <button className="btn-ghost !min-h-9 border border-surface-line !px-2" disabled={busy || index === 0} onClick={() => move(-1)} aria-label={`Move ${c.name} up`}><ArrowUp className="h-4 w-4" aria-hidden /></button>
      <button className="btn-ghost !min-h-9 border border-surface-line !px-2" disabled={busy || index === count - 1} onClick={() => move(1)} aria-label={`Move ${c.name} down`}><ArrowDown className="h-4 w-4" aria-hidden /></button>
      <button className="btn-ghost !min-h-9 border border-surface-line !px-3" disabled={busy} onClick={() => void run(() => api(`/categories/${c.id}`, { method: 'PATCH', body: { active: !c.active } }))}>{c.active ? 'Deactivate' : 'Activate'}</button>
    </li>
  );
}

export function CategoriesSection() {
  const res = useResource<{ categories: Category[] }>('/categories');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDirtyGuard(!!(name || description));
  const list = res.data?.categories ?? [];

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); setNotice('Saved. Transaction forms and filters use the new list.'); res.reload(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong'); } finally { setBusy(false); }
  }
  const move = (i: number, dir: -1 | 1) => { const ids = list.map((c) => c.id); const j = i + dir; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j]!, ids[i]!]; void run(() => api('/categories/order', { method: 'PUT', body: { ids } })); };
  const add = (e: FormEvent) => { e.preventDefault(); void run(async () => { await api('/categories', { method: 'POST', body: { name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}) } }); setName(''); setDescription(''); }); };

  return (
    <SettingsCard title="Expense categories" description="Transactions must use one of these. Deactivating or renaming a category keeps every existing transaction linked to it; only new entries are affected.">
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" aria-label="Add category">
        <div><Label htmlFor="cat-name">Name</Label><input id="cat-name" className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label htmlFor="cat-desc" hint="(optional)">Description</Label><input id="cat-desc" className="field" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <button type="submit" className="btn-primary" disabled={busy || !name.trim()}><Plus className="h-4 w-4" aria-hidden />Add</button>
      </form>
      {error && <div className="mt-3"><ErrorBox error={error} /></div>}
      {notice && <p role="status" className="mt-3 rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{notice}</p>}
      {res.loading && !res.data && <p className="mt-4 text-sm text-ink-muted" role="status">Loading…</p>}
      {res.error && <div className="mt-4"><ErrorBox error={res.error} onRetry={res.reload} /></div>}
      {res.data && list.length === 0 && <p className="mt-4 rounded-xl bg-surface-alt p-4 text-sm text-ink-muted">No categories yet. Add the first one above.</p>}
      {list.length > 0 && <ul className="mt-4 divide-y divide-surface-line" aria-label="Categories">{list.map((c, i) => <CategoryRow key={`${c.id}-${c.name}-${c.active}`} c={c} index={i} count={list.length} busy={busy} move={(d) => move(i, d)} run={run} />)}</ul>}
    </SettingsCard>
  );
}
