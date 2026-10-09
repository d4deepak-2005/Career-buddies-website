import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DashboardResponse } from '../../lib/types';
import { categoriesFixture, founderUser, foundersFixture, mockFetch, renderApp } from '../../test/utils';
import { detectPreset, presetRange } from './periods';

const me = { 'GET /auth/me': { status: 200, body: { user: founderUser } } };
const zeroKpis = { netBusinessPositionMinor: 0, totalInvestmentMinor: 0, founderCapitalMinor: 0, loansMinor: 0, totalBusinessExpensesMinor: 0, reimbursedByBusinessMinor: 0, founderFundedExpensesMinor: 0, refundsMinor: 0, settledMinor: 0, outstandingSettlementsMinor: 0 };
const card = (id: string, name: string, over: Partial<DashboardResponse['founders'][number]> = {}): DashboardResponse['founders'][number] => ({ founderId: id, name, active: true, role: null, photoUrl: null, contributionMinor: 0, loanOutstandingMinor: 0, investedMinor: 0, paidMinor: 0, fairShareMinor: 0, netPositionMinor: 0, outstandingMinor: 0, action: 'settled' as const, reimbursedMinor: 0, ...over });
const empty: DashboardResponse = {
  calculatedAt: 'x', currency: { code: 'INR', minorUnits: 2 }, filters: { from: null, to: null, founderId: null, categoryId: null }, kpis: zeroKpis,
  founders: [], charts: { contributionByFounder: [], expenseByCategory: [], monthly: [] }, settlement: { recommendations: [], unresolvedMinor: 0 }, recent: [],
  counts: { matchingTransactions: 0, notCountedYet: 0, byStatus: {}, byType: {} }, pendingApprovals: { count: 0 }, founderPeriod: [],
  upcomingRecurring: { items: [], summary: { activeCount: 0, pausedCount: 0, monthlyCommitmentMinor: 0, overdueCount: 0, dueSoonCount: 0 }, today: '2026-05-10' }, reconciliation: { status: 'PASS', isBalanced: true, sumNetPositionMinor: 0, businessBorneMinor: 0 }, warnings: 0,
};
// Deliberately NOT internally consistent (investment ≠ capital + loans): the UI must show exactly what the server says.
const full: DashboardResponse = {
  ...empty,
  kpis: { netBusinessPositionMinor: 555_500, totalInvestmentMinor: 1_234_500, founderCapitalMinor: 777_700, loansMinor: 250_000, totalBusinessExpensesMinor: 400_000, reimbursedByBusinessMinor: 100_000, founderFundedExpensesMinor: 300_000, refundsMinor: 30_000, settledMinor: 20_000, outstandingSettlementsMinor: 133_333 },
  founders: [
    card('f1', 'Asha', { role: 'Founder', investedMinor: 500_000, contributionMinor: 500_000, paidMinor: 200_000, fairShareMinor: 66_667, netPositionMinor: 133_333, outstandingMinor: 133_333, action: 'receive', reimbursedMinor: 100_000 }),
    card('f2', 'Bilal', { fairShareMinor: 66_667, netPositionMinor: -66_667, outstandingMinor: -66_667, action: 'pay' }),
    card('f3', 'Chen', { fairShareMinor: 66_666, netPositionMinor: -66_666, outstandingMinor: -66_666, action: 'pay' }),
  ],
  charts: {
    contributionByFounder: [{ founderId: 'f1', name: 'Asha', contributionMinor: 500_000, loanMinor: 0 }, { founderId: 'f2', name: 'Bilal', contributionMinor: 0, loanMinor: 250_000 }],
    expenseByCategory: [{ categoryId: 'c1', name: 'Software', amountMinor: 300_000, other: false, shareBp: 7500 }, { categoryId: null, name: 'Uncategorised', amountMinor: 100_000, other: false, shareBp: 2500 }],
    monthly: [{ month: '2026-04', expensesMinor: 300_000, investmentMinor: 500_000 }, { month: '2026-05', expensesMinor: 100_000, investmentMinor: 250_000 }],
  },
  settlement: { recommendations: [{ payer: { id: 'f2', name: 'Bilal' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 66_667 }, { payer: { id: 'f3', name: 'Chen' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 66_666 }], unresolvedMinor: 0 },
  recent: [
    { id: 't2', txnNumber: 'TXN-000002', date: '2026-05-06', type: 'reimbursement', status: 'approved', description: 'Paid back hosting', amountMinor: 100_000, category: null, paidBy: { id: 'f1', name: 'Asha' }, counterparty: null, counted: true },
    { id: 't1', txnNumber: 'TXN-000001', date: '2026-04-15', type: 'business_expense', status: 'pending_approval', description: 'Cloud hosting', amountMinor: 300_000, category: { id: 'c1', name: 'Software' }, paidBy: { id: 'f1', name: 'Asha' }, counterparty: null, counted: false },
  ],
  counts: { matchingTransactions: 2, notCountedYet: 1, byStatus: { approved: 1, pending_approval: 1 }, byType: {} },
  pendingApprovals: { count: 3 },
  upcomingRecurring: { today: '2026-05-10', summary: { activeCount: 2, pausedCount: 0, monthlyCommitmentMinor: 150_000, overdueCount: 1, dueSoonCount: 1 }, items: [
    { id: 'rc1', provider: 'Cloud Host', description: null, amountMinor: 100_000, frequency: 'monthly', nextDueDate: '2026-05-08', status: 'active', notes: null, version: 1, paidBy: { id: 'f1', name: 'Asha' }, category: { id: 'c1', name: 'Software' }, splitFounders: [], dueState: 'overdue' },
    { id: 'rc2', provider: 'Design Tool', description: null, amountMinor: 50_000, frequency: 'quarterly', nextDueDate: '2026-05-12', status: 'active', notes: null, version: 1, paidBy: { id: 'f1', name: 'Asha' }, category: { id: 'c1', name: 'Software' }, splitFounders: [], dueState: 'due_soon' },
  ] },
};
const base = { ...me, 'GET /founders': { status: 200, body: { founders: foundersFixture } }, 'GET /categories': { status: 200, body: { categories: categoriesFixture } } };
const ok = (body: unknown) => ({ status: 200, body });

describe('dashboard shows server values verbatim', () => {
  it('KPI cards, founder cards, settlements, recent transactions and charts', async () => {
    mockFetch({ ...base, 'GET /dashboard': ok(full) });
    renderApp('/dashboard');
    const kpis = await screen.findByRole('region', { name: 'Key figures' });
    // The four required KPI cards, exactly as the server returned them (no client arithmetic).
    expect(kpis).toHaveTextContent(/Total business expenses.*4,000\.00.*1,000\.00 reimbursed by the business/);
    expect(kpis).toHaveTextContent(/Founder contributions.*7,777\.00.*plus.*2,500\.00 in founder loans/);
    expect(kpis).toHaveTextContent(/Net business position.*\+.*5,555\.00/); // server says 555,500 even though 12,345 − … would differ: displayed verbatim
    expect(kpis).toHaveTextContent(/Pending approvals.*3.*Waiting for a decision/);
    expect(within(kpis).getByRole('link', { name: /Pending approvals/ })).toHaveAttribute('href', '/approvals');
    const more = within(kpis).getByLabelText('More figures');
    expect(more).toHaveTextContent(/Total investment.*12,345\.00/); // not 7,777 + 2,500
    expect(more).toHaveTextContent(/Outstanding settlements.*1,333\.33/);
    expect(more).toHaveTextContent(/Founder capital.*7,777\.00/);
    expect(more).toHaveTextContent(/Reimbursed by the business.*1,000\.00/);
    expect(within(kpis).getByRole('navigation', { name: 'Shortcuts' })).toHaveTextContent(/Add transaction.*Approvals.*Settlements.*Recurring payments.*Reports.*Founders/);

    const upcoming = screen.getByRole('list', { name: 'Upcoming recurring payments' });
    expect(upcoming).toHaveTextContent(/Cloud Host.*Due 2026-05-08.*Overdue.*1,000\.00/);
    expect(upcoming).toHaveTextContent(/Design Tool.*Due soon.*500\.00/);
    expect(screen.getByText(/Monthly commitment/).textContent).toMatch(/1,500\.00 across 2 active payments/);

    const cards = within(screen.getByRole('list', { name: 'Founder cards' })).getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent(/Asha.*Founder.*To receive.*Invested.*5,000\.00.*Fair share.*666\.67.*Net position.*\+.*1,333\.33.*To receive.*1,333\.33/);
    expect(cards[1]).toHaveTextContent(/To pay.*−.*666\.67/);
    expect(cards[2]).toHaveTextContent(/−.*666\.66/);
    expect(cards[0]).toHaveTextContent('1,000.00 of their expenses reimbursed by the business');

    const rec = within(screen.getByRole('list', { name: 'Recommended payments' })).getAllByRole('listitem');
    expect(rec[0]).toHaveTextContent(/Bilal.*pays.*Asha.*666\.67/);
    expect(within(rec[0]!).getByRole('button', { name: 'Record payment from Bilal to Asha' })).toHaveTextContent('Settle');

    expect(screen.getByRole('table', { name: 'Expenses by category' })).toHaveTextContent('Software');
    expect(screen.getByRole('table', { name: 'Monthly expenses and investment' })).toHaveTextContent(/2026-04.*3,000\.00.*5,000\.00/);
    expect(screen.getByRole('list', { name: 'Contribution by founder' })).toHaveTextContent(/Bilal.*2,500\.00/);
    expect(screen.getByRole('img', { name: /donut chart/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /line chart/ })).toBeInTheDocument();

    const recent = screen.getByRole('list', { name: 'Recent transactions' });
    expect(recent).toHaveTextContent(/Paid back hosting.*Reimbursement/);
    expect(recent).toHaveTextContent('Pending approval');
    expect(screen.getByTestId('scope-note')).toHaveTextContent(/1 transaction is not counted yet/);
    expect(screen.getByRole('link', { name: /View all 2 transactions/ })).toHaveAttribute('href', '/transactions');
  });

  it('uses the approved Option C wording and never the obsolete external terminology', async () => {
    mockFetch({ ...base, 'GET /dashboard': ok(full) });
    renderApp('/dashboard');
    await screen.findByRole('region', { name: 'Key figures' });
    expect(document.body.textContent).toMatch(/reimbursed by the business/i);
    expect(document.body.textContent).not.toMatch(/external|PASS_WITH_EXTERNAL|business-funded share/i);
  });

  it('flags records needing attention, using the server status only', async () => {
    mockFetch({ ...base, 'GET /dashboard': ok({ ...full, reconciliation: { ...full.reconciliation, status: 'REVIEW' }, warnings: 2 }) });
    renderApp('/dashboard');
    expect(await screen.findByRole('alert')).toHaveTextContent(/2 records need attention/);
  });
});

describe('loading, error and empty states', () => {
  it('shows a loading state first', async () => {
    mockFetch({ ...base, 'GET /dashboard': ok(full) });
    const real = globalThis.fetch; // make the dashboard response slow enough to observe the skeleton deterministically
    vi.stubGlobal('fetch', (i: RequestInfo | URL, init?: RequestInit) => (String(i).includes('/api/dashboard') ? new Promise((r) => setTimeout(() => r(real(i, init)), 250)) : real(i, init)));
    renderApp('/dashboard');
    expect(await screen.findByRole('status', { name: 'Loading dashboard' })).toBeInTheDocument();
    await screen.findByRole('region', { name: 'Key figures' });
    expect(screen.queryByRole('status', { name: 'Loading dashboard' })).toBeNull();
  });
  it('a failing dashboard API shows a friendly error with retry, without exposing internals, and the filters stay usable', async () => {
    let fail = true;
    mockFetch({ ...base, 'GET /dashboard': () => (fail ? { status: 500, body: { error: { code: 'INTERNAL', message: 'Something went wrong' } } } : ok(full)) });
    renderApp('/dashboard');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert.textContent).not.toMatch(/stack|at .*\.ts|mongo/i);
    expect(screen.getByRole('region', { name: 'Filters' })).toBeInTheDocument();
    fail = false;
    await userEvent.click(within(alert).getByRole('button', { name: /retry|try again/i }));
    expect(await screen.findByRole('region', { name: 'Key figures' })).toBeInTheDocument();
  });
  it('no data at all: honest zeros plus clear empty messages in every section (no fake chart)', async () => {
    mockFetch({ ...base, 'GET /dashboard': ok(empty) });
    renderApp('/dashboard');
    expect(await screen.findByText(/No transactions match this period and filters/)).toBeInTheDocument();
    for (const t of ['No contributions in this period.', 'No expenses in this period.', 'No monthly activity in this period.', 'No transactions to show.', 'No founders yet. An admin can add founder profiles in Settings.', 'No payments needed between founders.'].slice(0, 5)) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /chart/ })).toBeNull();
    expect(screen.getByRole('region', { name: 'Key figures' })).toHaveTextContent('₹0.00'); // the server really returned zero
  });
  it('a failing filter list does not break the dashboard', async () => {
    mockFetch({ ...base, 'GET /founders': { status: 500, body: { error: { code: 'X', message: 'x' } } }, 'GET /categories': { status: 500, body: { error: { code: 'X', message: 'x' } } }, 'GET /dashboard': ok(full) });
    renderApp('/dashboard');
    expect(await screen.findByRole('region', { name: 'Key figures' })).toBeInTheDocument();
    expect(screen.getByLabelText('Founder')).toBeDisabled();
  });
});

describe('filters are sent to the server (nothing is filtered or summed in the browser)', () => {
  it('period preset, founder and category become query parameters; reset clears them', async () => {
    const calls = mockFetch({ ...base, 'GET /dashboard': ok(full) });
    renderApp('/dashboard');
    await screen.findByRole('region', { name: 'Key figures' });
    expect(calls.filter((c) => c.startsWith('GET /dashboard'))).toEqual(['GET /dashboard']);
    await userEvent.selectOptions(screen.getByLabelText('Period'), 'this_year');
    await waitFor(() => expect(calls.some((c) => /^GET \/dashboard\?from=\d{4}-01-01&to=\d{4}-12-31$/.test(c))).toBe(true));
    await userEvent.selectOptions(screen.getByLabelText('Founder'), 'f2');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'c1');
    await waitFor(() => expect(calls.some((c) => c.includes('founderId=f2') && c.includes('categoryId=c1') && c.includes('from='))).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: /Reset/ }));
    await waitFor(() => expect(calls.at(-1)).toBe('GET /dashboard'));
  });
  it('filters can be opened from a link (URL is the source of truth) and a server 400 is shown, not swallowed', async () => {
    const calls = mockFetch({ ...base, 'GET /dashboard': (u) => (u.includes('from=2026-06-01') ? { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'from must be on or before to' } } } : ok(full)) });
    renderApp('/dashboard?from=2026-06-01&to=2026-05-01');
    expect(await screen.findByRole('alert')).toHaveTextContent('from must be on or before to');
    expect(calls).toContain('GET /dashboard?from=2026-06-01&to=2026-05-01');
  });
});

describe('period helpers (dates only)', () => {
  const now = new Date(2026, 0, 15); // 15 Jan 2026
  it('computes preset ranges, including year boundaries and leap years', () => {
    expect(presetRange('all', now)).toBeNull();
    expect(presetRange('this_month', now)).toEqual({ from: '2026-01-01', to: '2026-01-31' });
    expect(presetRange('last_month', now)).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(presetRange('last_3_months', now)).toEqual({ from: '2025-11-01', to: '2026-01-31' });
    expect(presetRange('this_year', now)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(presetRange('this_month', new Date(2028, 1, 10))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
  it('detects presets and custom ranges', () => {
    expect(detectPreset('', '', now)).toBe('all');
    expect(detectPreset('2026-01-01', '2026-01-31', now)).toBe('this_month');
    expect(detectPreset('2026-01-02', '2026-01-31', now)).toBe('custom');
  });
});

const sources = import.meta.glob('./*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
describe('no financial arithmetic in the dashboard views', () => {
  it('only formats server values; charts do pixel geometry only', () => {
    const files = Object.keys(sources).filter((f) => !f.includes('.test.')).sort();
    expect(files).toEqual(['./DashboardPage.tsx', './charts.tsx', './periods.ts']);
    for (const f of files) {
      const src = sources[f]!.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(src, f).not.toMatch(/\.reduce\(/); // no summing of figures
      if (f !== './charts.tsx') {
        expect(src, f).not.toMatch(/Math\.(round|floor|ceil)\(/);
        const bad = src.match(/Minor\b\s*[-+*/%]\s*[\w.(]|[\w)]\s*[-+*/%]\s*[\w.]*Minor\b/g);
        expect(bad, `${f}: ${bad?.join(' | ')}`).toBeNull();
      }
    }
  });
});
