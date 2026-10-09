import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, FieldError, Label, detailsByPath } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useDirtyGuard } from '../../lib/dirty';
import { useResource } from '../../lib/useResource';
import { SettingsCard } from './settingsKit';

interface UserRow { id: string; email: string; name: string; role: 'admin' | 'founder'; status: 'active' | 'disabled'; lastLoginAt: string | null }

export function UsersSection() {
  const { user: me } = useAuth();
  const res = useResource<{ users: UserRow[] }>('/users');
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'founder' as 'admin' | 'founder' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useDirtyGuard(!!(form.email || form.name || form.password));
  const server = detailsByPath(error);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); setNotice(ok); res.reload(); } catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, 'NETWORK', 'Could not reach the server')); } finally { setBusy(false); }
  }
  const add = (e: FormEvent) => { e.preventDefault(); void run(async () => { await api('/users', { method: 'POST', body: { email: form.email.trim(), name: form.name.trim(), password: form.password, role: form.role } }); setForm({ email: '', name: '', password: '', role: 'founder' }); }, 'User created. Share the password privately; it is not shown again.'); };

  return (
    <SettingsCard title="User access and permissions" description="Admins manage settings, founders and users and may void transactions. Founders can record transactions, approve or reject, and view every figure. Changing a role or disabling an account signs that person out immediately.">
      {error && <div className="mb-3"><ErrorBox error={error.message} /></div>}
      {notice && <p role="status" className="mb-3 rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{notice}</p>}
      {res.loading && !res.data && <p role="status" className="text-sm text-ink-muted">Loading…</p>}
      {res.error && <ErrorBox error={res.error} onRetry={res.reload} />}
      {res.data && (
        <ul className="divide-y divide-surface-line" aria-label="Users">
          {res.data.users.map((u) => {
            const self = u.id === me?.id;
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1 basis-56"><p className="break-words font-semibold text-cb-navy">{u.name}{self && <span className="badge ml-2 bg-cb-blue/10 text-cb-blue">you</span>}</p><p className="break-all text-xs text-ink-muted">{u.email}{u.lastLoginAt ? ` · last sign-in ${new Date(u.lastLoginAt).toLocaleDateString()}` : ' · never signed in'}</p></div>
                <label className="text-xs font-semibold text-ink-muted">Role
                  <select className="field !min-h-10 mt-1" value={u.role} disabled={busy || self} onChange={(e) => void run(() => api(`/users/${u.id}`, { method: 'PATCH', body: { role: e.target.value } }), `${u.name} is now ${e.target.value === 'admin' ? 'an admin' : 'a founder'}.`)}><option value="founder">Founder</option><option value="admin">Admin</option></select>
                </label>
                <button className={`btn-ghost !min-h-10 border !px-3 ${u.status === 'active' ? 'border-danger/40 text-danger' : 'border-surface-line'}`} disabled={busy || self} onClick={() => void run(() => api(`/users/${u.id}`, { method: 'PATCH', body: { status: u.status === 'active' ? 'disabled' : 'active' } }), `${u.name} ${u.status === 'active' ? 'disabled' : 'enabled'}.`)}>{u.status === 'active' ? 'Disable' : 'Enable'}</button>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={add} className="mt-5 grid gap-3 border-t border-surface-line pt-5 sm:grid-cols-2" aria-label="Add user">
        <div><Label htmlFor="u-email">Email</Label><input id="u-email" type="email" className="field" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><FieldError message={server['email']} /></div>
        <div><Label htmlFor="u-name">Name</Label><input id="u-name" className="field" autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label htmlFor="u-pass" hint="(12+ characters)">Temporary password</Label><input id="u-pass" type="password" className="field" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><FieldError message={server['password']} /></div>
        <div><Label htmlFor="u-role">Role</Label><select id="u-role" className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'founder' })}><option value="founder">Founder</option><option value="admin">Admin</option></select></div>
        <div className="sm:col-span-2"><button type="submit" className="btn-primary" disabled={busy || !form.email || !form.name || form.password.length < 12}><UserPlus className="h-4 w-4" aria-hidden />Add user</button></div>
      </form>
    </SettingsCard>
  );
}
