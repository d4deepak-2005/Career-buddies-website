import { Check } from 'lucide-react';
import { formatMinor, parseMajorToMinor, type CurrencyConfig } from '../../lib/money';
import type { Founder, SplitMethod } from '../../lib/types';

export interface SplitRow { on: boolean; value: string; note: string }
export interface SplitFormState { method: SplitMethod; rows: Record<string, SplitRow> }
export interface PreviewState { loading: boolean; errors: string[]; entries: Array<{ founderId: string; founderName: string; allocatedMinor: number }> }

const METHODS: Array<{ value: SplitMethod; label: string; help: string }> = [
  { value: 'equal', label: 'Equal', help: 'Everyone selected pays the same share.' },
  { value: 'percentage', label: 'Percentage', help: 'Set a percent per founder. Must add up to 100%.' },
  { value: 'exact', label: 'Exact amount', help: 'Set a fixed amount per founder. Must add up to the transaction amount.' },
  { value: 'shares', label: 'Shares', help: 'Weighted shares, for example 2 : 1 : 1.' },
  { value: 'custom', label: 'Custom', help: "Define each founder's responsibility yourself. A founder can be set to 0." },
];

export function emptySplit(founders: Founder[], selectAll: boolean): SplitFormState {
  return { method: 'equal', rows: Object.fromEntries(founders.map((f) => [f.id, { on: selectAll, value: '', note: '' }])) };
}

/** Turn the form state into the API's split definition. Returns a hint instead when the form is incomplete. */
export function buildSplitPayload(state: SplitFormState, order: Founder[], minorUnits: number): { payload: unknown } | { hint: string } {
  const selected = order.filter((f) => state.rows[f.id]?.on);
  if (selected.length === 0) return { hint: 'Select at least one founder.' };
  const entries: Array<Record<string, unknown>> = [];
  for (const f of selected) {
    const row = state.rows[f.id]!;
    const e: Record<string, unknown> = { founderId: f.id };
    if (state.method === 'percentage' || state.method === 'shares') {
      const n = Number(row.value);
      if (!row.value.trim() || !Number.isFinite(n)) return { hint: `Enter ${state.method === 'shares' ? 'shares' : 'a percentage'} for ${f.name}.` };
      e[state.method === 'shares' ? 'shares' : 'percent'] = n;
    } else if (state.method === 'exact' || state.method === 'custom') {
      const m = parseMajorToMinor(row.value, minorUnits);
      if (m === null) return { hint: `Enter an amount for ${f.name}.` };
      e['amountMinor'] = m;
      if (state.method === 'custom' && row.note.trim()) e['note'] = row.note.trim();
    }
    entries.push(e);
  }
  return { payload: { method: state.method, entries } };
}

export function SplitEditor({ founders, state, onChange, preview, currency, hint }: {
  founders: Founder[]; state: SplitFormState; onChange: (s: SplitFormState) => void; preview: PreviewState; currency: CurrencyConfig; hint: string | null;
}) {
  const setRow = (id: string, patch: Partial<SplitRow>) => onChange({ ...state, rows: { ...state.rows, [id]: { ...(state.rows[id] ?? { on: false, value: '', note: '' }), ...patch } } });
  const setMethod = (method: SplitMethod) => onChange({ method, rows: Object.fromEntries(Object.entries(state.rows).map(([k, r]) => [k, { ...r, value: '', note: '' }])) });
  const current = METHODS.find((m) => m.value === state.method)!;
  const unit = state.method === 'percentage' ? '%' : state.method === 'shares' ? 'shares' : state.method === 'equal' ? '' : currency.code;
  const allocated = new Map(preview.entries.map((e) => [e.founderId, e.allocatedMinor]));

  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-semibold text-cb-navy">How is this expense split?</legend>

      <div role="radiogroup" aria-label="Split method" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {METHODS.map((m) => (
          <button key={m.value} type="button" role="radio" aria-checked={state.method === m.value} onClick={() => setMethod(m.value)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition ${state.method === m.value ? 'border-cb-navy bg-cb-navy text-white shadow-card' : 'border-surface-line bg-white text-cb-navy hover:border-cb-blue'}`}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-muted">{current.help}</p>

      <ul className="space-y-2" aria-label="Founders in this split">
        {founders.map((f) => {
          const row = state.rows[f.id] ?? { on: false, value: '', note: '' };
          return (
            <li key={f.id} className={`rounded-xl border p-3 transition ${row.on ? 'border-cb-blue bg-cb-blue/5' : 'border-surface-line bg-white'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" role="checkbox" aria-checked={row.on} aria-label={`Include ${f.name}`} onClick={() => setRow(f.id, { on: !row.on })}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${row.on ? 'border-cb-blue bg-cb-blue text-white' : 'border-surface-line bg-white'}`}>
                  {row.on && <Check className="h-4 w-4" aria-hidden />}
                </button>
                <span className="min-w-0 flex-1 font-semibold text-cb-navy">{f.name}</span>
                {row.on && state.method !== 'equal' && (
                  <div className="flex items-center gap-2">
                    <label htmlFor={`split-${f.id}`} className="sr-only">{state.method === 'shares' ? 'Shares' : state.method === 'percentage' ? 'Percent' : 'Amount'} for {f.name}</label>
                    <input id={`split-${f.id}`} inputMode="decimal" className="field !min-h-10 w-28 text-right" value={row.value} onChange={(e) => setRow(f.id, { value: e.target.value })} placeholder="0" />
                    <span className="w-12 text-xs text-ink-muted">{unit}</span>
                  </div>
                )}
                {row.on && allocated.has(f.id) && (
                  <span className="ml-auto min-w-24 text-right text-sm font-bold tabular-nums text-cb-green-dark" aria-label={`${f.name} pays`}>{formatMinor(allocated.get(f.id) ?? 0, currency)}</span>
                )}
              </div>
              {row.on && state.method === 'custom' && (
                <div className="mt-2 pl-10">
                  <label htmlFor={`note-${f.id}`} className="sr-only">Note for {f.name}</label>
                  <input id={`note-${f.id}`} className="field !min-h-9 text-xs" placeholder="Optional note, e.g. only founder who used this" maxLength={200} value={row.note} onChange={(e) => setRow(f.id, { note: e.target.value })} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="min-h-6 text-sm">
        {hint ? <p className="text-ink-muted">{hint}</p>
          : preview.errors.length > 0 ? <ul className="space-y-1 text-danger">{preview.errors.map((e) => <li key={e} role="alert" className="font-medium">{e}</li>)}</ul>
          : preview.loading ? <p className="text-ink-muted">Checking split…</p>
          : preview.entries.length > 0 ? <p className="font-semibold text-cb-green-dark">Split is valid. Amounts shown are each founder's responsibility for this transaction.</p> : null}
      </div>
    </fieldset>
  );
}
