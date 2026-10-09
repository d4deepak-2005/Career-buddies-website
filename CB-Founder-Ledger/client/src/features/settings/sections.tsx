import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { FieldError, Label, detailsByPath } from '../../components/ui';
import { ApiError, api, apiUpload } from '../../lib/api';
import { useAppConfig, useReloadConfig } from '../../lib/AppConfigContext';
import type { SettingsResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { FormActions, ReadOnlyNote, SettingsCard, Toggle, useSettingsForm } from './settingsKit';

export function BusinessSection() {
  const s = useAppConfig().settings.business;
  const f = useSettingsForm({ displayName: s.displayName, shortName: s.shortName, organisationName: s.organisationName }, (v) => ({ business: v }));
  const server = detailsByPath(f.error);
  const bad = (v: string) => v.trim().length < 2;
  return (
    <SettingsCard title="Business profile" description="The product name appears in the sidebar, the login page and the browser tab. It is a display name only: it never changes any record or calculation.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="b-name">Display name</Label><input id="b-name" className="field" maxLength={80} value={f.value.displayName} onChange={(e) => f.setValue({ ...f.value, displayName: e.target.value })} aria-invalid={bad(f.value.displayName)} /><FieldError message={bad(f.value.displayName) ? 'Enter at least 2 characters' : server['business.displayName']} /></div>
        <div><Label htmlFor="b-short">Short name</Label><input id="b-short" className="field" maxLength={40} value={f.value.shortName} onChange={(e) => f.setValue({ ...f.value, shortName: e.target.value })} /><FieldError message={bad(f.value.shortName) ? 'Enter at least 2 characters' : undefined} /></div>
        <div><Label htmlFor="b-org">Organisation</Label><input id="b-org" className="field" maxLength={80} value={f.value.organisationName} onChange={(e) => f.setValue({ ...f.value, organisationName: e.target.value })} /><FieldError message={bad(f.value.organisationName) ? 'Enter at least 2 characters' : undefined} /></div>
      </div>
      <FormActions form={{ ...f, save: () => { if (!bad(f.value.displayName) && !bad(f.value.shortName) && !bad(f.value.organisationName)) void f.save(); } }} />
    </SettingsCard>
  );
}

export function BrandingSection() {
  const cfg = useAppConfig();
  const reload = useReloadConfig();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const alt = useSettingsForm({ logoAlt: cfg.settings.branding.logoAlt }, (v) => ({ branding: v }));

  async function onFile(f: File | undefined) {
    if (!f) return;
    setMsg(null);
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) { setMsg({ ok: false, text: 'The logo must be a PNG, JPG or WebP image.' }); return; }
    if (f.size > cfg.imageMaxBytes) { setMsg({ ok: false, text: `That file is too large (maximum ${Math.round((cfg.imageMaxBytes / 1024 / 1024) * 10) / 10} MB).` }); return; }
    setBusy(true);
    try { await apiUpload('/branding/logo', f, 'PUT'); setMsg({ ok: true, text: 'Logo updated everywhere.' }); reload(); } catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Upload failed' }); } finally { setBusy(false); if (file.current) file.current.value = ''; }
  }
  async function reset() {
    setBusy(true); setMsg(null);
    try { await api('/branding/logo', { method: 'DELETE' }); setMsg({ ok: true, text: 'The default CareerBuddies logo is back.' }); reload(); } catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Could not reset' }); } finally { setBusy(false); }
  }
  return (
    <SettingsCard title="Branding and logo" description="One logo is used on the login page, the sidebar and everywhere else. The official CareerBuddies logo stays until you replace it.">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-surface-line bg-white p-4"><BrandLogo className="h-24" /></div>
        <div className="space-y-2">
          <input ref={file} id="logo-file" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={busy} onClick={() => file.current?.click()}><ImagePlus className="h-4 w-4" aria-hidden />Upload new logo</button>
            {cfg.settings.branding.hasCustomLogo && <button className="btn-ghost border border-surface-line" disabled={busy} onClick={() => void reset()}><Trash2 className="h-4 w-4" aria-hidden />Use the default logo</button>}
          </div>
          <p className="text-xs text-ink-muted">PNG, JPG or WebP, up to {Math.round((cfg.imageMaxBytes / 1024 / 1024) * 10) / 10} MB. {cfg.settings.branding.hasCustomLogo ? 'A custom logo is in use.' : 'The default logo is in use.'}</p>
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-cb-green/10 text-cb-green-dark' : 'bg-danger-soft text-danger'}`}>{msg.text}</p>}
        </div>
      </div>
      <div className="mt-5 max-w-md"><Label htmlFor="logo-alt">Logo description (for screen readers)</Label><input id="logo-alt" className="field" maxLength={120} value={alt.value.logoAlt} onChange={(e) => alt.setValue({ logoAlt: e.target.value })} /></div>
      <FormActions form={alt} />
    </SettingsCard>
  );
}

const LOCALES = [['en-IN', 'English (India) — ₹1,00,000.00'], ['en-US', 'English (US) — ₹100,000.00'], ['en-GB', 'English (UK) — ₹100,000.00']] as const;
const ZONES = ['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];

export function RegionalSection() {
  const cfg = useAppConfig();
  const r = cfg.settings.regional;
  const f = useSettingsForm({ locale: r.locale, timeZone: r.timeZone }, (v) => ({ regional: v }));
  const zones = ZONES.includes(f.value.timeZone) ? ZONES : [f.value.timeZone, ...ZONES];
  return (
    <SettingsCard title="Currency and regional formatting" description="How amounts and dates are displayed. Stored amounts are never affected.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="cur">Currency</Label><input id="cur" className="field bg-surface-alt" readOnly value={`${cfg.currency.code} (${cfg.currency.minorUnits} decimal places)`} /><p className="mt-1 text-xs text-ink-muted">Fixed by the deployment: changing the currency would re-label every stored amount.</p></div>
        <div><Label htmlFor="loc">Number format</Label><select id="loc" className="field" value={f.value.locale} onChange={(e) => f.setValue({ ...f.value, locale: e.target.value })}>{LOCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="sm:col-span-2"><Label htmlFor="tz">Time zone (decides what “today” is for due and overdue dates)</Label><select id="tz" className="field" value={f.value.timeZone} onChange={(e) => f.setValue({ ...f.value, timeZone: e.target.value })}>{zones.map((z) => <option key={z} value={z}>{z}</option>)}</select></div>
      </div>
      <FormActions form={f} />
    </SettingsCard>
  );
}

export function ApprovalsSection() {
  const a = useAppConfig().settings.approvals;
  const f = useSettingsForm({ allowSelfApproval: a.allowSelfApproval, requireRejectionReason: a.requireRejectionReason }, (v) => ({ approvals: v }));
  return (
    <SettingsCard title="Approval rules" description="Who may decide a pending transaction. Only approved transactions count in balances, reports and settlements.">
      <Toggle id="ap-self" label="Allow people to approve or reject their own transactions" hint="Turn off to require a second person (four-eyes). Admins are bound by the same rule." checked={f.value.allowSelfApproval} onChange={(v) => f.setValue({ ...f.value, allowSelfApproval: v })} />
      <Toggle id="ap-reason" label="Require a reason when rejecting" hint="The comment must be at least 3 characters." checked={f.value.requireRejectionReason} onChange={(v) => f.setValue({ ...f.value, requireRejectionReason: v })} />
      <FormActions form={f} />
    </SettingsCard>
  );
}

export function PolicySection({ which }: { which: 'reimbursement' | 'calculation' }) {
  const res = useResource<SettingsResponse>('/settings');
  const block = res.data?.policy[which];
  return (
    <SettingsCard title={which === 'reimbursement' ? 'Reimbursement rules' : 'Calculation rules'} description="Accounting policy is fixed, not a preference: changing it would silently rewrite past results. It can only change through a reviewed, audited migration.">
      <ReadOnlyNote>Read only. {which === 'reimbursement' ? 'Approved policy: Option C — expense-linked reimbursement.' : 'These rules apply to every figure on every screen.'}</ReadOnlyNote>
      {res.loading && !block && <p role="status" className="mt-3 text-sm text-ink-muted">Loading…</p>}
      {block && <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-ink" aria-label={block.label}>{block.rules.map((r) => <li key={r}>{r}</li>)}</ul>}
    </SettingsCard>
  );
}

export function SettlementsSection() {
  const s = useAppConfig().settings.settlements;
  const f = useSettingsForm({ paymentMethods: s.paymentMethods }, (v) => ({ settlements: v }));
  const [draft, setDraft] = useState('');
  const methods = f.value.paymentMethods;
  const add = () => { const t = draft.trim(); if (t && !methods.some((m) => m.toLowerCase() === t.toLowerCase()) && methods.length < 12) { f.setValue({ paymentMethods: [...methods, t] }); setDraft(''); } };
  return (
    <SettingsCard title="Settlement preferences" description="The payment methods offered when a settlement payment is recorded. Suggested settlements are always calculated by the engine; they are not a payment until confirmed.">
      <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
        {methods.map((m) => <li key={m} className="flex items-center gap-1 rounded-full bg-cb-blue/10 py-1 pl-3 pr-1 text-sm font-semibold text-cb-blue">{m}<button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-cb-blue/10 disabled:opacity-40" aria-label={`Remove ${m}`} disabled={methods.length <= 1} onClick={() => f.setValue({ paymentMethods: methods.filter((x) => x !== m) })}>×</button></li>)}
      </ul>
      <div className="mt-3 flex max-w-md gap-2"><label htmlFor="pm-new" className="sr-only">New payment method</label><input id="pm-new" className="field" maxLength={50} placeholder="e.g. NEFT" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} /><button className="btn-ghost border border-surface-line" onClick={add} disabled={!draft.trim()}>Add</button></div>
      <FormActions form={f} />
    </SettingsCard>
  );
}

export function RecurringSection() {
  const r = useAppConfig().settings.recurring;
  const f = useSettingsForm({ reminderDaysAhead: String(r.reminderDaysAhead) }, (v) => ({ recurring: { reminderDaysAhead: Number(v.reminderDaysAhead) } }));
  const n = Number(f.value.reminderDaysAhead);
  const bad = !Number.isInteger(n) || n < 1 || n > 60;
  return (
    <SettingsCard title="Recurring payment preferences" description="A payment is flagged “due soon” this many days before its due date and “overdue” the day after. Nothing is ever recorded automatically.">
      <div className="max-w-xs"><Label htmlFor="rd">Remind me this many days ahead</Label><input id="rd" inputMode="numeric" className="field" value={f.value.reminderDaysAhead} onChange={(e) => f.setValue({ reminderDaysAhead: e.target.value.replace(/\D/g, '') })} aria-invalid={bad} /><FieldError message={bad ? 'Enter a whole number from 1 to 60' : undefined} /></div>
      <FormActions form={{ ...f, save: () => { if (!bad) void f.save(); } }} />
    </SettingsCard>
  );
}

const PERIODS = [['all', 'All time'], ['this_month', 'This month'], ['last_month', 'Last month'], ['last_3_months', 'Last 3 months'], ['this_year', 'This year']] as const;
export function DashboardSection() {
  const d = useAppConfig().settings.dashboard;
  const f = useSettingsForm({ defaultPeriod: d.defaultPeriod, recentTransactionsCount: String(d.recentTransactionsCount), upcomingRecurringCount: String(d.upcomingRecurringCount) },
    (v) => ({ dashboard: { defaultPeriod: v.defaultPeriod, recentTransactionsCount: Number(v.recentTransactionsCount), upcomingRecurringCount: Number(v.upcomingRecurringCount) } }));
  const rc = Number(f.value.recentTransactionsCount), uc = Number(f.value.upcomingRecurringCount);
  const bad = !(rc >= 5 && rc <= 20) || !(uc >= 3 && uc <= 10);
  return (
    <SettingsCard title="Dashboard display" description="What the dashboard shows when it opens.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label htmlFor="dd-period">Default period</Label><select id="dd-period" className="field" value={f.value.defaultPeriod} onChange={(e) => f.setValue({ ...f.value, defaultPeriod: e.target.value as typeof d.defaultPeriod })}>{PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><Label htmlFor="dd-recent">Recent transactions (5–20)</Label><input id="dd-recent" inputMode="numeric" className="field" value={f.value.recentTransactionsCount} onChange={(e) => f.setValue({ ...f.value, recentTransactionsCount: e.target.value.replace(/\D/g, '') })} /><FieldError message={rc >= 5 && rc <= 20 ? undefined : 'Enter a number from 5 to 20'} /></div>
        <div><Label htmlFor="dd-up">Upcoming payments (3–10)</Label><input id="dd-up" inputMode="numeric" className="field" value={f.value.upcomingRecurringCount} onChange={(e) => f.setValue({ ...f.value, upcomingRecurringCount: e.target.value.replace(/\D/g, '') })} /><FieldError message={uc >= 3 && uc <= 10 ? undefined : 'Enter a number from 3 to 10'} /></div>
      </div>
      <FormActions form={{ ...f, save: () => { if (!bad) void f.save(); } }} />
    </SettingsCard>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function ReportingSection() {
  const r = useAppConfig().settings.reports;
  const f = useSettingsForm({ fiscalYearStartMonth: String(r.fiscalYearStartMonth) }, (v) => ({ reports: { fiscalYearStartMonth: Number(v.fiscalYearStartMonth) } }));
  return (
    <>
      <SettingsCard title="Financial calculation and reporting" description="How reports group annual spend. Changing it re-groups the report view only; no transaction or balance changes.">
        <div className="max-w-xs"><Label htmlFor="fy">Financial year starts in</Label><select id="fy" className="field" value={f.value.fiscalYearStartMonth} onChange={(e) => f.setValue({ fiscalYearStartMonth: e.target.value })}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></div>
        <FormActions form={f} />
      </SettingsCard>
      <PolicySection which="calculation" />
    </>
  );
}
