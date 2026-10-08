import { Check, Paperclip, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, FieldError, Label, detailsByPath } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useAppConfig } from '../../lib/AppConfigContext';
import { minorToInput, parseMajorToMinor } from '../../lib/money';
import type { Category, Founder, Transaction, TransactionType } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { SplitEditor, buildSplitPayload, emptySplit, type PreviewState, type SplitFormState } from './SplitEditor';

const pad = (n: number) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function FounderPicker({ id, label, value, onChange, founders, allowNone, error }: { id: string; label: string; value: string; onChange: (v: string) => void; founders: Founder[]; allowNone: boolean; error?: string | undefined }) {
  return (
    <div>
      <Label htmlFor={id} hint={allowNone ? '(optional)' : undefined}>{label}</Label>
      <div id={id} role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {founders.map((f) => {
          const on = value === f.id;
          return (
            <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(on && allowNone ? '' : f.id)}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${on ? 'border-cb-navy bg-cb-navy text-white shadow-card' : 'border-surface-line bg-white text-cb-navy hover:border-cb-blue'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${on ? 'bg-white/20' : 'bg-cb-blue/10 text-cb-blue'}`}>{f.name.slice(0, 1).toUpperCase()}</span>
              {f.name}{on && <Check className="h-4 w-4" aria-hidden />}
            </button>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

export function TransactionForm({ existing }: { existing?: Transaction }) {
  const cfg = useAppConfig();
  const { user } = useAuth();
  const navigate = useNavigate();
  const units = cfg.currency.minorUnits;
  const foundersRes = useResource<{ founders: Founder[] }>('/founders');
  const categoriesRes = useResource<{ categories: Category[] }>('/categories');
  const founders = useMemo(() => foundersRes.data?.founders.filter((f) => f.active || existing?.paidBy?.id === f.id || existing?.counterparty?.id === f.id || existing?.split?.entries.some((e) => e.founderId === f.id)) ?? [], [foundersRes.data, existing]);
  const categories = useMemo(() => categoriesRes.data?.categories.filter((c) => c.active || existing?.category?.id === c.id) ?? [], [categoriesRes.data, existing]);

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'business_expense');
  const [amount, setAmount] = useState(existing ? minorToInput(existing.amountMinor, units) : '');
  const [date, setDate] = useState(existing?.transactionDate ?? today());
  const [description, setDescription] = useState(existing?.description ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [method, setMethod] = useState(existing?.method ?? '');
  const [categoryId, setCategoryId] = useState(existing?.category?.id ?? '');
  const [paidBy, setPaidBy] = useState(existing?.paidBy?.id ?? '');
  const [counterparty, setCounterparty] = useState(existing?.counterparty?.id ?? '');
  const [useSplit, setUseSplit] = useState(!!existing?.split);
  const [split, setSplit] = useState<SplitFormState>({ method: 'equal', rows: {} });
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ loading: false, errors: [], entries: [] });
  const fileInput = useRef<HTMLInputElement>(null);
  const initialised = useRef(false);

  const rules = cfg.transactionTypes.find((t) => t.value === type)!.rules;
  const splitVisible = rules.split === 'required' || (rules.split === 'optional' && useSplit);

  // Initialise split rows + default paid-by once founders arrive.
  useEffect(() => {
    if (initialised.current || founders.length === 0) return;
    initialised.current = true;
    if (existing?.split) {
      const rows = emptySplit(founders, false).rows;
      for (const e of existing.split.entries) {
        rows[e.founderId] = { on: true, value: e.percent != null ? String(e.percent) : e.shares != null ? String(e.shares) : e.amountMinor != null ? minorToInput(e.amountMinor, units) : '', note: e.note ?? '' };
      }
      setSplit({ method: existing.split.method, rows });
    } else {
      setSplit(emptySplit(founders, true));
      if (!existing) setPaidBy(founders.find((f) => f.userId === user?.id)?.id ?? '');
    }
  }, [founders, existing, units, user?.id]);

  const amountMinor = parseMajorToMinor(amount, units);
  const built = useMemo(() => (splitVisible ? buildSplitPayload(split, founders, units) : null), [splitVisible, split, founders, units]);
  const splitHint = built && 'hint' in built ? built.hint : amount.trim() && amountMinor === null ? null : !amount.trim() ? 'Enter the amount to see the split.' : null;
  const previewKey = built && 'payload' in built && amountMinor ? JSON.stringify({ amountMinor, split: built.payload }) : null;

  // Live split preview: the server resolves the definition, so rules live in one place.
  useEffect(() => {
    if (!previewKey) { setPreview({ loading: false, errors: [], entries: [] }); return; }
    let stale = false;
    setPreview((p) => ({ ...p, loading: true }));
    const t = setTimeout(() => {
      api<{ entries: PreviewState['entries'] }>('/transactions/split-preview', { method: 'POST', body: JSON.parse(previewKey) as unknown })
        .then((r) => !stale && setPreview({ loading: false, errors: [], entries: r.entries }))
        .catch((e: unknown) => {
          if (stale) return;
          const msgs = e instanceof ApiError && Array.isArray(e.details) ? [...new Set((e.details as Array<{ message: string }>).map((d) => d.message))] : [e instanceof Error ? e.message : 'Could not check the split'];
          setPreview({ loading: false, errors: msgs, entries: [] });
        });
    }, 250);
    return () => { stale = true; clearTimeout(t); };
  }, [previewKey]);

  const serverErrors = detailsByPath(error);
  const local = {
    amount: amountMinor === null || amountMinor < 1 ? 'Enter a valid amount greater than 0, e.g. 1500 or 1500.50' : undefined,
    description: description.trim() ? undefined : 'Add a short description',
    date: date ? undefined : 'Choose a date',
    category: rules.category === 'required' && !categoryId ? 'Choose a category' : undefined,
    paidBy: rules.paidBy === 'required' && !paidBy ? 'Choose who paid' : undefined,
    counterparty: rules.counterparty === 'required' && !counterparty ? 'Choose who received the money' : undefined,
    notes: rules.notes === 'required' && !notes.trim() ? 'Notes are required for this type' : undefined,
  };
  const show = (k: keyof typeof local, serverKey: string) => (touched ? local[k] : undefined) ?? serverErrors[serverKey];
  const hasLocalError = Object.values(local).some(Boolean) || (splitVisible && (!!splitHint || preview.errors.length > 0));

  async function submit(e: FormEvent | null, status: 'draft' | 'pending_approval') {
    e?.preventDefault();
    setTouched(true);
    setError(null);
    if (hasLocalError || amountMinor === null || !built && splitVisible) return;
    const content: Record<string, unknown> = { type, amountMinor, transactionDate: date, description: description.trim() };
    const optional = { notes: notes.trim() || undefined, method: rules.method === 'forbidden' ? undefined : method.trim() || undefined, categoryId: categoryId || undefined, paidByFounderId: paidBy || undefined, counterpartyFounderId: rules.counterparty === 'forbidden' ? undefined : counterparty || undefined, split: splitVisible && built && 'payload' in built ? built.payload : undefined };
    setBusy(true);
    try {
      let saved: Transaction;
      if (existing) {
        const patch: Record<string, unknown> = { ...content, expectedVersion: existing.version };
        for (const [k, v] of Object.entries(optional)) patch[k] = v ?? null;
        saved = (await api<{ transaction: Transaction }>(`/transactions/${existing.id}`, { method: 'PATCH', body: patch })).transaction;
      } else {
        for (const [k, v] of Object.entries(optional)) if (v !== undefined) content[k] = v;
        saved = (await api<{ transaction: Transaction }>('/transactions', { method: 'POST', body: { ...content, status } })).transaction;
      }
      let notice = existing ? 'Changes saved.' : status === 'draft' ? 'Saved as draft.' : 'Transaction submitted for approval.';
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`/api/transactions/${saved.id}/receipts`, { method: 'POST', body: fd, credentials: 'include' });
        if (!res.ok) notice += ' The receipt could not be uploaded — you can retry from the transaction page.';
      }
      navigate(`/transactions/${saved.id}`, { state: { notice } });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'NETWORK', 'Could not reach the server'));
    } finally {
      setBusy(false);
    }
  }

  const onFile = (f: File | undefined) => {
    if (!f) return setFile(null);
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!cfg.receipts.allowedExtensions.includes(ext)) { setError(new ApiError(0, 'CLIENT', `Receipts must be ${cfg.receipts.allowedExtensions.join(', ').toUpperCase()} files.`)); return; }
    if (f.size > cfg.receipts.maxBytes) { setError(new ApiError(0, 'CLIENT', `That file is too large (maximum ${Math.round(cfg.receipts.maxBytes / 1024 / 1024)} MB).`)); return; }
    setError(null); setFile(f);
  };

  if (foundersRes.loading || categoriesRes.loading) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading form…</p>;
  if (foundersRes.error || categoriesRes.error) return <ErrorBox error={(foundersRes.error ?? categoriesRes.error)!} />;
  if (founders.length === 0) return <div className="card p-8 text-center"><p className="font-bold text-cb-navy">No founders yet</p><p className="mt-1 text-sm text-ink-muted">An admin needs to add founder profiles before transactions can be recorded.</p></div>;

  const conflict = error?.code === 'VERSION_CONFLICT';
  const summary = error && !conflict && Array.isArray(error.details) ? [...new Set((error.details as Array<{ message: string }>).map((d) => d.message))] : [];

  return (
    <form onSubmit={(e) => void submit(e, 'pending_approval')} noValidate className="mx-auto max-w-3xl space-y-6" aria-label={existing ? 'Edit transaction' : 'Add transaction'}>
      {error && (
        <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <p className="font-semibold">{conflict ? 'This transaction was changed by someone else.' : error.message}</p>
          {conflict && <p className="mt-1">Reload the page to see the latest version, then re-apply your changes.</p>}
          {summary.length > 0 && <ul className="mt-1 list-disc pl-5">{summary.map((m) => <li key={m}>{m}</li>)}</ul>}
        </div>
      )}

      <section className="card space-y-5 p-5 sm:p-6">
        <div>
          <Label htmlFor="type">What kind of transaction is this?</Label>
          <div id="type" role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cfg.transactionTypes.map((t) => (
              <button key={t.value} type="button" role="radio" aria-checked={type === t.value} onClick={() => setType(t.value)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${type === t.value ? 'border-cb-navy bg-cb-navy text-white shadow-card' : 'border-surface-line bg-white text-cb-navy hover:border-cb-blue'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="amount">Amount ({cfg.currency.code})</Label>
            <input id="amount" inputMode="decimal" autoComplete="off" className="field text-lg font-bold tabular-nums" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!show('amount', 'amountMinor')} />
            <FieldError message={show('amount', 'amountMinor')} />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <input id="date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
            <FieldError message={show('date', 'transactionDate')} />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <input id="description" className="field" maxLength={200} placeholder="e.g. Annual cloud hosting" value={description} onChange={(e) => setDescription(e.target.value)} />
          <FieldError message={show('description', 'description')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category" hint={rules.category === 'required' ? undefined : '(optional)'}>Category</Label>
            <select id="category" className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{categories.length ? 'Select a category' : 'No categories yet'}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <FieldError message={show('category', 'categoryId')} />
            {rules.category === 'required' && categories.length === 0 && <p className="mt-1 text-xs text-ink-muted">An admin can add categories in Settings.</p>}
          </div>
          <div>
            <Label htmlFor="notes" hint={rules.notes === 'required' ? undefined : '(optional)'}>Notes</Label>
            <input id="notes" className="field" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <FieldError message={show('notes', 'notes')} />
          </div>
        </div>

        {rules.method !== 'forbidden' && (
          <div>
            <Label htmlFor="method" hint="(optional)">Payment method</Label>
            <input id="method" className="field" maxLength={50} placeholder="e.g. UPI, bank transfer, cash" value={method} onChange={(e) => setMethod(e.target.value)} />
          </div>
        )}

        <FounderPicker id="paidBy" label={type === 'refund' ? 'Which founder received the refund?' : type === 'settlement' ? 'Who paid?' : type === 'reimbursement' ? 'Who is being reimbursed?' : type === 'founder_contribution' || type === 'founder_loan' ? 'Which founder put the money in?' : 'Paid by'} value={paidBy} onChange={setPaidBy} founders={founders} allowNone={rules.paidBy !== 'required'} error={show('paidBy', 'paidByFounderId')} />
        {rules.counterparty !== 'forbidden' && <FounderPicker id="counterparty" label="Who received the money?" value={counterparty} onChange={setCounterparty} founders={founders.filter((f) => f.id !== paidBy)} allowNone={rules.counterparty !== 'required'} error={show('counterparty', 'counterpartyFounderId')} />}
      </section>

      {rules.split !== 'forbidden' && (
        <section className="card space-y-4 p-5 sm:p-6">
          {rules.split === 'optional' && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-cb-navy">
              <input type="checkbox" className="h-5 w-5 accent-cb-blue" checked={useSplit} onChange={(e) => setUseSplit(e.target.checked)} />Split this between founders
            </label>
          )}
          {splitVisible && <SplitEditor founders={founders.filter((f) => f.active || split.rows[f.id]?.on)} state={split} onChange={setSplit} preview={preview} currency={cfg.currency} hint={splitHint} />}
          {existing && splitVisible && <p className="text-xs text-ink-muted">Percentage, shares and equal splits adjust automatically when the amount changes. Exact and custom amounts must be re-entered to match the new amount.</p>}
        </section>
      )}

      {!existing && (
        <section className="card p-5 sm:p-6">
          <Label htmlFor="receipt" hint="(optional — PDF, JPG or PNG)">Receipt</Label>
          <input ref={fileInput} id="receipt" type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => onFile(e.target.files?.[0])} />
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface-alt px-4 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-cb-green-dark" aria-hidden /><span className="truncate font-semibold">{file.name}</span></span>
              <button type="button" className="btn-ghost !min-h-9 !px-2" aria-label="Remove file" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}><X className="h-4 w-4" aria-hidden /></button>
            </div>
          ) : <button type="button" className="btn-ghost border border-dashed border-surface-line" onClick={() => fileInput.current?.click()}><Paperclip className="h-4 w-4" aria-hidden />Attach a receipt</button>}
        </section>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-surface-line bg-white/95 p-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <button type="button" className="btn-ghost" onClick={() => navigate(existing ? `/transactions/${existing.id}` : '/transactions')} disabled={busy}>Cancel</button>
        {!existing && <button type="button" className="btn border border-cb-blue text-cb-blue hover:bg-cb-blue/5" disabled={busy} onClick={() => void submit(null, 'draft')}>Save as draft</button>}
        <button type="submit" className="btn-primary" disabled={busy || conflict}>{busy ? 'Saving…' : existing ? 'Save changes' : 'Submit for approval'}</button>
      </div>
    </form>
  );
}
