import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ErrorBox, Label } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import type { Category } from '../../lib/types';
import { useResource } from '../../lib/useResource';

/** Admin-only (enforced by the API). Phase 2 scope: controlled categories. Other settings come later. */
export function SettingsPage() {
  const res = useResource<{ categories: Category[] }>('/categories');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError(null);
    try { await fn(); res.reload(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong'); } finally { setBusy(false); }
  }
  const add = (e: FormEvent) => { e.preventDefault(); void run(async () => { await api('/categories', { method: 'POST', body: { name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}) } }); setName(''); setDescription(''); }); };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-cb-navy">Categories</h2>
        <p className="mt-1 text-sm text-ink-muted">Transactions must use one of these. Deactivating a category hides it for new transactions but keeps existing ones intact.</p>

        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" aria-label="Add category">
          <div><Label htmlFor="cat-name">Name</Label><input id="cat-name" className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="cat-desc" hint="(optional)">Description</Label><input id="cat-desc" className="field" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}><Plus className="h-4 w-4" aria-hidden />Add</button>
        </form>
        {error && <div className="mt-3"><ErrorBox error={error} /></div>}

        {res.loading && !res.data && <p className="mt-4 text-sm text-ink-muted" role="status">Loading…</p>}
        {res.error && <div className="mt-4"><ErrorBox error={res.error} onRetry={res.reload} /></div>}
        {res.data && res.data.categories.length === 0 && <p className="mt-4 rounded-xl bg-surface-alt p-4 text-sm text-ink-muted">No categories yet. Add the first one above.</p>}
        {res.data && res.data.categories.length > 0 && (
          <ul className="mt-4 divide-y divide-surface-line">
            {res.data.categories.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-cb-navy">{c.name} {c.isDevSeed && <span className="badge ml-1 bg-cb-blue/10 text-cb-blue" title="Inserted by the development seed script">dev seed</span>}{!c.active && <span className="badge ml-1 bg-surface-alt text-ink-muted">inactive</span>}</p>
                  {c.description && <p className="text-xs text-ink-muted">{c.description}</p>}
                </div>
                <button className="btn-ghost !min-h-10 border border-surface-line" disabled={busy} onClick={() => void run(() => api(`/categories/${c.id}`, { method: 'PATCH', body: { active: !c.active } }))}>{c.active ? 'Deactivate' : 'Activate'}</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
