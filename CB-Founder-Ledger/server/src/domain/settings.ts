/**
 * Application settings: defaults, validation and the read-only policy description.
 *
 * Only settings that have a real effect are exposed. Accounting rules (Option C reimbursement, rounding,
 * net position, settlement algorithm) are NOT settings: changing them would silently rewrite past results, so
 * they are published read-only under `policy` and can only change through a reviewed code/migration change.
 */
import { z } from 'zod';

export const LOCALES = ['en-IN', 'en-US', 'en-GB'] as const;
export const PERIOD_PRESETS = ['all', 'this_month', 'last_month', 'last_3_months', 'this_year'] as const;

export interface AppSettingsValues {
  business: { displayName: string; shortName: string; organisationName: string };
  branding: { logoKey: string | null; logoMime: string | null; logoVersion: number; logoAlt: string; logoSha256: string | null };
  regional: { locale: (typeof LOCALES)[number]; timeZone: string };
  dashboard: { defaultPeriod: (typeof PERIOD_PRESETS)[number]; recentTransactionsCount: number; upcomingRecurringCount: number };
  approvals: { allowSelfApproval: boolean; requireRejectionReason: boolean };
  settlements: { paymentMethods: string[] };
  recurring: { reminderDaysAhead: number };
  reports: { fiscalYearStartMonth: number };
}

export const SETTINGS_DEFAULTS: AppSettingsValues = {
  business: { displayName: 'CareerBuddies Founder Ledger', shortName: 'CB Founder Ledger', organisationName: 'CareerBuddies' },
  branding: { logoKey: null, logoMime: null, logoVersion: 0, logoAlt: 'CareerBuddies logo', logoSha256: null },
  // timeZone decides what "today" means for due/overdue states. IMPLEMENTATION ASSUMPTION: India, configurable.
  regional: { locale: 'en-IN', timeZone: 'Asia/Kolkata' },
  dashboard: { defaultPeriod: 'all', recentTransactionsCount: 10, upcomingRecurringCount: 5 },
  // Product Plan §11: "Authorized founders can Approve, Reject". Self-approval is not addressed by the plan:
  // IMPLEMENTATION ASSUMPTION — allowed by default (a three-founder company starts with one admin), switchable.
  approvals: { allowSelfApproval: true, requireRejectionReason: false },
  settlements: { paymentMethods: ['UPI', 'Bank transfer', 'Cash', 'Cheque'] },
  recurring: { reminderDaysAhead: 7 },
  // IMPLEMENTATION ASSUMPTION: April–March (Indian financial year) for the "annual spend" grouping; configurable.
  reports: { fiscalYearStartMonth: 4 },
};

const text = (min: number, max: number) => z.string().trim().min(min).max(max).refine((v) => !/[<>\u0000-\u001f]/.test(v), 'Contains characters that are not allowed');

export const settingsPatchSchema = z.object({
  expectedVersion: z.number().int().min(1),
  reason: z.string().trim().max(500).optional(),
  business: z.object({ displayName: text(2, 80), shortName: text(2, 40), organisationName: text(2, 80) }).partial().strict().optional(),
  branding: z.object({ logoAlt: text(2, 120) }).partial().strict().optional(),
  regional: z.object({ locale: z.enum(LOCALES), timeZone: z.string().trim().min(3).max(60).refine((tz) => { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } }, 'Unknown time zone') }).partial().strict().optional(),
  dashboard: z.object({
    defaultPeriod: z.enum(PERIOD_PRESETS),
    recentTransactionsCount: z.number().int().min(5).max(20),
    upcomingRecurringCount: z.number().int().min(3).max(10),
  }).partial().strict().optional(),
  approvals: z.object({ allowSelfApproval: z.boolean(), requireRejectionReason: z.boolean() }).partial().strict().optional(),
  settlements: z.object({ paymentMethods: z.array(text(1, 50)).min(1).max(12) }).partial().strict().optional(),
  recurring: z.object({ reminderDaysAhead: z.number().int().min(1).max(60) }).partial().strict().optional(),
  reports: z.object({ fiscalYearStartMonth: z.number().int().min(1).max(12) }).partial().strict().optional(),
}).strict().refine((v) => Object.keys(v).some((k) => !['expectedVersion', 'reason'].includes(k)), 'Provide at least one setting to change');
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;

/** Stored values merged over the defaults, so a newly added setting needs no migration. */
export function mergeSettings(stored: Partial<{ [K in keyof AppSettingsValues]: Partial<AppSettingsValues[K]> }> | null | undefined): AppSettingsValues {
  const out = structuredClone(SETTINGS_DEFAULTS) as unknown as Record<string, Record<string, unknown>>;
  for (const [section, vals] of Object.entries(stored ?? {})) {
    if (!out[section] || typeof vals !== 'object' || vals === null) continue;
    for (const [k, v] of Object.entries(vals)) if (k in out[section]!) out[section]![k] = v;
  }
  return out as unknown as AppSettingsValues;
}

/** What is intentionally NOT editable, shown read-only in Settings (Option C etc.). */
export const POLICY = {
  reimbursement: {
    label: 'Reimbursement rules (approved Option C)',
    rules: [
      'A reimbursement must link to exactly one approved business expense (reimbursesTransactionId) with one payer.',
      'The reimbursed portion is borne by the business; founders share only expense − active linked reimbursements, split by the stored split.',
      'Total active reimbursements can never exceed the expense; an expense with active reimbursements cannot be voided.',
      'Voiding a reimbursement restores the founder-funded amount. Nothing is deleted.',
    ],
  },
  calculation: {
    label: 'Calculation and reporting',
    rules: [
      'All amounts are whole minor units (paise); no floating point. Shares use largest-remainder rounding (earliest entry first).',
      'Net position = Paid − Fair share. Only approved transactions count; pending, rejected and voided never do.',
      'Settlement suggestions are the simplest path from the engine; a suggestion is not a payment until a settlement is recorded and approved.',
      'Changing these rules would rewrite past results, so they are not settings; they change only through an audited migration.',
    ],
  },
} as const;
