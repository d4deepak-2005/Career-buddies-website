import { AlarmClock, CalendarClock, Pause, Play, Plus, Receipt, Repeat, XCircle } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog, ErrorBox, FieldError, Label, detailsByPath } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useAppConfig } from '../../lib/AppConfigContext';
import { useDirtyGuard } from '../../lib/dirty';
import { formatMinor, minorToInput, parseMajorToMinor } from '../../lib/money';
import type { Category, Founder, Frequency, RecurringItem, RecurringResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';

const FREQ_LABEL: Record<Frequency, string> = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };
const DUE: Record<string, { label: string; cls: string }> = {
  overdue: { label: 'Overdue', cls: 'bg-danger-soft text-danger' },
  due_soon: { label: 'Due soon', cls: 'bg-cb-blue/10 text-cb-blue' },
  upcoming: { label: 'Upcoming', cls: 'bg-surface-alt text-ink-muted ring-1 ring-surface-line' },
};
const STATUS: Record<string, string> = { active: 'bg-cb-green/10 text-cb-green-dark', paused: 'bg-surface-alt text-ink-muted ring-1 ring-surface-line', cancelled: 'bg-ink/10 text-ink-muted line-through' };

interface FormState { provider: string; description: string; amount: string; frequency: Frequency; nextDueDate: string; paidBy: string; categoryId: string; split: Set<string>; notes: string }
const blank = (founders: Founder[]): FormState => ({ provider: '', description: '', amount: '', frequency: 'monthly', nextDueDate: '', paidBy: '', categoryId: '', split: new Set(founders.filter((f) => f.active).map((f) => f.id)), notes: '' });

function RecurringForm({ initial, editing, founders, categories, minorUnits, onSaved, onCancel }: {
  initial: FormState; editing: RecurringItem | null; founders: Founder[]; categories: Category[]; minorUnits: number; onSaved: () => void; onCancel: () => void;
}) {
  const [f, setF] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const dirty = JSON.stringify({ ...f, split: [...f.split].sort() }) !== JSON.stringify({ ...initial, split: [...initial.split].sort() });
  useDirtyGuard(dirty);
  const amountMinor = parseMajorToMinor(f.amount, minorUnits);
  const server = detailsByPath(error);
  const local = {
    provider: f.provider.trim() ? undefined : 'Enter the service or provider',
    amount: amountMinor === null || amountMinor < 1 ? 'Enter a valid amount greater than 0' : undefined,
    nextDueDate: /^\d{4}-\d{2}-\d{2}$/.test(f.nextDueDate) ? undefined : 'Choose the next due date',
    paidBy: f.paidBy ? undefined : 'Choose who pays',
    categoryId: f.categoryId ? undefined : 'Choose a category',
    split: f.split.size > 0 ? undefined : 'Select at least one founder to share the cost',
  };
  const show = (k: keyof typeof local, key: string) => (touched ? local[k] : undefined) ?? server[key];
  const activeFounders = founders.filter((x) => x.active || x.id === f.paidBy || f.split.has(x.id));

  async function submit(e: FormEvent) {
    e.preventDefault(); setTouched(true); setError(null);
    if (Object.values(local).some(Boolean) || amountMinor === null) return;
    setBusy(true);
    const body = { provider: f.provider.trim(), ...(f.description.trim() ? { description: f.description.trim() } : {}), amountMinor, frequency: f.frequency, nextDueDate: f.nextDueDate, paidByFounderId: f.paidBy, categoryId: f.categoryId, splitFounderIds: [...f.split], ...(f.notes.trim() ? { notes: f.notes.trim() } : {}) };
    try {
      if (editing) await api(`/recurring/${editing.id}`, { method: 'PATCH', body: { ...body, expectedVersion: editing.version } });
      else await api('/recurring', { method: 'POST', body });
      onSaved();
    } catch (err) { setError(err instanceof ApiError ? err : new ApiError(0, 'NETWORK', 'Could not reach the server')); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="card space-y-4 p-5 sm:p-6" aria-label={editing ? 'Edit recurring payment' : 'Add recurring payment'}>
      <h2 className="text-lg font-extrabold text-cb-navy">{editing ? `Edit ${editing.provider}` : 'Add recurring payment'}</h2>
      {editing && <p className="rounded-xl bg-cb-blue/5 px-4 py-3 text-sm text-cb-navy">Changing the amount affects future payments only. Transactions already recorded keep their original amount.</p>}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error.code === 'VERSION_CONFLICT' ? 'This was changed by someone else. Reload and try again.' : error.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="r-provider">Service / provider</Label><input id="r-provider" className="field" maxLength={120} value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /><FieldError message={show('provider', 'provider')} /></div>
        <div><Label htmlFor="r-desc" hint="(optional)">Description</Label><input id="r-desc" className="field" maxLength={200} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><Label htmlFor="r-amount">Amount</Label><input id="r-amount" inputMode="decimal" className="field font-bold tabular-nums" placeholder="0.00" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /><FieldError message={show('amount', 'amountMinor')} /></div>
        <div><Label htmlFor="r-freq">Frequency</Label><select id="r-freq" className="field" value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value as Frequency })}>{(Object.keys(FREQ_LABEL) as Frequency[]).map((k) => <option key={k} value={k}>{FREQ_LABEL[k]}</option>)}</select></div>
        <div><Label htmlFor="r-due">Next due date</Label><input id="r-due" type="date" className="field" value={f.nextDueDate} onChange={(e) => setF({ ...f, nextDueDate: e.target.value })} /><FieldError message={show('nextDueDate', 'nextDueDate')} /></div>
        <div><Label htmlFor="r-cat">Category</Label><select id="r-cat" className="field" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}><option value="">Select a category</option>{categories.filter((c) => c.active || c.id === f.categoryId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><FieldError message={show('categoryId', 'categoryId')} /></div>
        <div className="sm:col-span-2"><Label htmlFor="r-paid">Paid by</Label><select id="r-paid" className="field" value={f.paidBy} onChange={(e) => setF({ ...f, paidBy: e.target.value })}><option value="">Select a founder</option>{activeFounders.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><FieldError message={show('paidBy', 'paidByFounderId')} /></div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-cb-navy">Cost is shared equally by</legend>
        <div className="flex flex-wrap gap-2">
          {activeFounders.map((x) => (
            <label key={x.id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${f.split.has(x.id) ? 'border-cb-navy bg-cb-navy text-white' : 'border-surface-line bg-white text-cb-navy'}`}>
              <input type="checkbox" className="sr-only" checked={f.split.has(x.id)} onChange={(e) => { const s = new Set(f.split); if (e.target.checked) s.add(x.id); else s.delete(x.id); setF({ ...f, split: s }); }} />{x.name}
            </label>
          ))}
        </div>
        <FieldError message={show('split', 'splitFounderIds')} />
      </fieldset>
      <div><Label htmlFor="r-notes" hint="(optional)">Notes</Label><input id="r-notes" className="field" maxLength={500} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add recurring payment'}</button>
      </div>
    </form>
  );
}

export function RecurringPage() {
  const cfg = useAppConfig();
  const res = useResource<RecurringResponse>('/recurring');
  const foundersRes = useResource<{ founders: Founder[] }>('/founders');
  const catsRes = useResource<{ categories: Category[] }>('/categories');
  const [form, setForm] = useState<{ editing: RecurringItem | null } | null>(null);
  const [action, setAction] = useState<{ kind: 'record' | 'cancel'; item: RecurringItem } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const money = (n: number) => formatMinor(n, cfg.currency);
  const founders = foundersRes.data?.founders ?? [];

  const initial = useMemo(() => {
    const it = form?.editing;
    if (!it) return blank(founders);
    return { provider: it.provider, description: it.description ?? '', amount: minorToInput(it.amountMinor, cfg.currency.minorUnits), frequency: it.frequency, nextDueDate: it.nextDueDate, paidBy: it.paidBy.id, categoryId: it.category.id, split: new Set(it.splitFounders.map((x) => x.id)), notes: it.notes ?? '' } satisfies FormState;
  }, [form, founders, cfg.currency.minorUnits]);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); if (ok) setNotice(ok); res.reload(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong'); res.reload(); } finally { setBusy(false); setAction(null); }
  }
  const post = (it: RecurringItem, verb: 'pause' | 'resume' | 'cancel') => run(() => api(`/recurring/${it.id}/${verb}`, { method: 'POST', body: { expectedVersion: it.version } }), `${it.provider} ${verb === 'pause' ? 'paused' : verb === 'resume' ? 'resumed' : 'cancelled'}.`);

  if (res.loading && !res.data) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading recurring payments…</p>;
  if (res.error && !res.data) return <ErrorBox error={res.error} onRetry={res.reload} />;
  const data = res.data;
  if (!data) return null;
  const s = data.summary;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-ink-muted">A recurring payment is a <strong>scheduled obligation</strong>, not an expense. Nothing is recorded just because a due date arrives: you record each payment yourself, and it then waits for approval like any other expense.</p>
        {!form && <button className="btn-primary" onClick={() => setForm({ editing: null })}><Plus className="h-4 w-4" aria-hidden />Add recurring payment</button>}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Recurring summary">
        {[
          ['Monthly commitment', money(s.monthlyCommitmentMinor), `${s.activeCount} active`, Repeat],
          ['Overdue', String(s.overdueCount), 'need attention', AlarmClock],
          ['Due soon', String(s.dueSoonCount), `within ${data.reminderDaysAhead} days`, CalendarClock],
          ['Paused', String(s.pausedCount), 'not counted in the commitment', Pause],
        ].map(([label, value, hint, Icon]) => {
          const I = Icon as typeof Repeat;
          return <div key={label as string} className="card min-w-0 p-4"><dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted"><I className="h-4 w-4 text-cb-blue" aria-hidden />{label as string}</dt><dd className="mt-2 break-words text-2xl font-extrabold tabular-nums text-cb-navy">{value as string}</dd><p className="text-xs text-ink-muted">{hint as string}</p></div>;
        })}
      </dl>

      {notice && <p role="status" className="rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{notice}</p>}
      {error && <ErrorBox error={error} />}

      {form && foundersRes.data && catsRes.data && (
        <RecurringForm key={form.editing?.id ?? 'new'} initial={initial} editing={form.editing} founders={founders} categories={catsRes.data.categories} minorUnits={cfg.currency.minorUnits}
          onSaved={() => { setForm(null); setNotice(form.editing ? 'Changes saved.' : 'Recurring payment added.'); res.reload(); }} onCancel={() => setForm(null)} />
      )}

      {data.items.length === 0 && !form && (
        <div className="card px-6 py-14 text-center"><Repeat className="mx-auto h-8 w-8 text-cb-blue" aria-hidden /><p className="mt-2 font-bold text-cb-navy">No recurring payments yet</p><p className="mt-1 text-sm text-ink-muted">Add subscriptions and regular bills to see what is due next.</p></div>
      )}

      {data.items.length > 0 && (
        <ul className="space-y-3" aria-label="Recurring payments">
          {data.items.map((it) => (
            <li key={it.id} className="card min-w-0 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-extrabold text-cb-navy">{it.provider}{it.description ? <span className="font-medium text-ink-muted"> — {it.description}</span> : null}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">{FREQ_LABEL[it.frequency]} · {it.category.name} · paid by {it.paidBy.name} · shared by {it.splitFounders.map((x) => x.name).join(', ')}</p>
                </div>
                <div className="text-right"><p className="text-lg font-extrabold tabular-nums text-cb-navy">{money(it.amountMinor)}</p><p className="text-xs text-ink-muted">per {it.frequency === 'monthly' ? 'month' : it.frequency === 'quarterly' ? 'quarter' : 'year'}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className={`badge capitalize ${STATUS[it.status]}`}>{it.status}</span>
                {it.dueState && <span className={`badge ${DUE[it.dueState]!.cls}`}>{DUE[it.dueState]!.label}</span>}
                <span className="text-ink-muted">Next due <strong className="tabular-nums text-ink">{it.nextDueDate}</strong></span>
              </div>
              {it.status !== 'cancelled' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {it.status === 'active' && <button className="btn-primary !min-h-9 !px-3" disabled={busy} onClick={() => setAction({ kind: 'record', item: it })}><Receipt className="h-4 w-4" aria-hidden />Record payment</button>}
                  <button className="btn-ghost !min-h-9 border border-surface-line !px-3" disabled={busy} onClick={() => setForm({ editing: it })}>Edit</button>
                  {it.status === 'active' ? <button className="btn-ghost !min-h-9 border border-surface-line !px-3" disabled={busy} onClick={() => void post(it, 'pause')}><Pause className="h-4 w-4" aria-hidden />Pause</button>
                    : <button className="btn-ghost !min-h-9 border border-surface-line !px-3" disabled={busy} onClick={() => void post(it, 'resume')}><Play className="h-4 w-4" aria-hidden />Resume</button>}
                  <button className="btn-ghost !min-h-9 border border-danger/40 !px-3 text-danger" disabled={busy} onClick={() => setAction({ kind: 'cancel', item: it })}><XCircle className="h-4 w-4" aria-hidden />Cancel</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {action?.kind === 'record' && (
        <ConfirmDialog title={`Record payment for ${action.item.provider}?`} confirmLabel="Record payment" busy={busy} onCancel={() => setAction(null)}
          onConfirm={() => void run(async () => { await api(`/recurring/${action.item.id}/record`, { method: 'POST', body: { dueDate: action.item.nextDueDate } }); }, `Recorded ${action.item.provider} (due ${action.item.nextDueDate}) as a pending expense. It counts once it is approved.`)}>
          <p>This creates a <strong>pending</strong> expense of {money(action.item.amountMinor)} for the payment due on <strong>{action.item.nextDueDate}</strong> and moves the schedule to the next due date. It is not a confirmed expense until it is approved (see <Link to="/approvals" className="underline">Approvals</Link>).</p>
        </ConfirmDialog>
      )}
      {action?.kind === 'cancel' && (
        <ConfirmDialog title={`Cancel ${action.item.provider}?`} confirmLabel="Cancel recurring payment" danger busy={busy} onCancel={() => setAction(null)} onConfirm={() => void post(action.item, 'cancel')}>
          <p>The schedule stops and can no longer be edited or resumed. Transactions already recorded stay exactly as they are.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
