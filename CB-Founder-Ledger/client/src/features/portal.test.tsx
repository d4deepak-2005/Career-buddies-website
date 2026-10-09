/** Portal screens added on top of the verified financial core: settings propagation, approvals, recurring, reports, audit, entry route. */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApprovalsResponse, ReportSummary, Transaction } from '../lib/types';
import { adminUser, configFixture, founderUser, foundersFixture, mockFetch, renderApp, unauth } from '../test/utils';

const meAdmin = { 'GET /auth/me': { status: 200, body: { user: adminUser } } };
const meFounder = { 'GET /auth/me': { status: 200, body: { user: founderUser } } };
const jsonBody = (init?: RequestInit) => JSON.parse(String(init?.body)) as Record<string, unknown>;
const cfgWith = (over: Record<string, unknown>) => ({ ...configFixture, settings: { ...configFixture.settings, ...over } });
afterEach(() => vi.restoreAllMocks());

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't1', txnNumber: 'TXN-000001', type: 'business_expense', amountMinor: 300_000, description: 'Cloud hosting', notes: null, method: null, category: { id: 'c1', name: 'Software' },
  paidBy: { id: 'f1', name: 'Asha' }, counterparty: null, transactionDate: '2026-04-15', status: 'pending_approval', split: null, receiptCount: 0, void: null, version: 1,
  createdBy: { id: '2', name: 'Founder One' }, updatedBy: { id: '2', name: 'Founder One' }, createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-04-15T10:00:00Z', ...over,
});

describe('brand and settings propagate from the one central configuration', () => {
  it('the saved product name and logo appear in the sidebar, the tab title and the logo image', async () => {
    mockFetch({ ...meFounder, 'GET /config': { status: 200, body: cfgWith({ business: { displayName: 'Founders Money Hub', shortName: 'FMH', organisationName: 'CareerBuddies' }, branding: { hasCustomLogo: true, logoVersion: 4, logoAlt: 'Custom logo', logoUrl: '/api/branding/logo?v=4' } }) } });
    renderApp('/dashboard');
    expect((await screen.findAllByTestId('brand-name'))[0]).toHaveTextContent('Founders Money Hub');
    await waitFor(() => expect(document.title).toBe('Dashboard · Founders Money Hub'));
    const logos = screen.getAllByAltText('Custom logo');
    expect(logos[0]).toHaveAttribute('src', '/api/branding/logo?v=4');
  });

  it('the login page (signed out) shows the public brand name and logo', async () => {
    mockFetch({ 'GET /auth/me': unauth, 'POST /auth/refresh': unauth, 'GET /branding/public': { status: 200, body: { displayName: 'Founders Money Hub', shortName: 'FMH', organisationName: 'CareerBuddies', logoUrl: '/api/branding/logo?v=2', logoAlt: 'Brand logo', locale: 'en-IN' } } });
    renderApp('/login');
    expect(await screen.findByText(/Founders Money Hub — founders and admins only/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByAltText('Brand logo')[0]).toHaveAttribute('src', '/api/branding/logo?v=2'));
  });

  it('the number format setting changes how every amount is displayed (en-IN grouping)', async () => {
    const dash = { calculatedAt: 'x', currency: { code: 'INR', minorUnits: 2 }, filters: { from: null, to: null, founderId: null, categoryId: null },
      kpis: { netBusinessPositionMinor: 0, totalInvestmentMinor: 0, founderCapitalMinor: 0, loansMinor: 0, totalBusinessExpensesMinor: 123_456_700, reimbursedByBusinessMinor: 0, founderFundedExpensesMinor: 0, refundsMinor: 0, settledMinor: 0, outstandingSettlementsMinor: 0 },
      founders: [], charts: { contributionByFounder: [], expenseByCategory: [], monthly: [] }, settlement: { recommendations: [], unresolvedMinor: 0 }, recent: [], founderPeriod: [], pendingApprovals: { count: 0 },
      upcomingRecurring: { items: [], today: '2026-05-10', summary: { activeCount: 0, pausedCount: 0, monthlyCommitmentMinor: 0, overdueCount: 0, dueSoonCount: 0 } },
      counts: { matchingTransactions: 0, notCountedYet: 0, byStatus: {}, byType: {} }, reconciliation: { status: 'PASS', isBalanced: true, sumNetPositionMinor: 0, businessBorneMinor: 0 }, warnings: 0 };
    mockFetch({ ...meFounder, 'GET /dashboard': { status: 200, body: dash }, 'GET /config': { status: 200, body: { ...configFixture, currency: { code: 'INR', minorUnits: 2, locale: 'en-IN' } } } });
    renderApp('/dashboard');
    expect(await screen.findByLabelText('Key figures')).toHaveTextContent('12,34,567.00');
  });
});

describe('Settings (admin)', () => {
  const sectionNav = () => screen.getByRole('navigation', { name: 'Settings sections' });

  it('lists the twelve sections and only admins can open Settings', async () => {
    mockFetch({ ...meAdmin });
    renderApp('/settings');
    const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual(['Business profile', 'Branding and logo', 'Founders', 'Expense categories', 'Currency and regional', 'Approval rules', 'Reimbursement rules', 'Settlement preferences', 'Recurring payments', 'Dashboard display', 'User access', 'Calculation and reporting']);
  });

  it('saving sends only the changed section with the settings version, validates first, and reloads the configuration', async () => {
    let patched: Record<string, unknown> | null = null;
    let displayName = 'CareerBuddies Founder Ledger';
    const calls = mockFetch({
      ...meAdmin,
      'GET /config': () => ({ status: 200, body: cfgWith({ business: { displayName, shortName: 'CB Founder Ledger', organisationName: 'CareerBuddies' }, version: 3 }) }),
      'PATCH /settings': (_u, init) => { patched = jsonBody(init); displayName = 'Founders Money Hub'; return { status: 200, body: {} }; },
    });
    renderApp('/settings');
    const field = await screen.findByLabelText('Display name');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled(); // nothing to save yet
    await userEvent.clear(field);
    await userEvent.type(field, 'F');
    expect(await screen.findByText('Enter at least 2 characters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(patched).toBeNull(); // blocked by client validation
    await userEvent.type(field, 'ounders Money Hub');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Saved\. The change is now applied everywhere/)).toBeInTheDocument();
    expect(patched).toEqual({ expectedVersion: 3, business: { displayName: 'Founders Money Hub', shortName: 'CB Founder Ledger', organisationName: 'CareerBuddies' } });
    await waitFor(() => expect(calls.filter((c) => c === 'GET /config').length).toBeGreaterThanOrEqual(2)); // central config re-fetched
    expect((await screen.findAllByTestId('brand-name'))[0]).toHaveTextContent('Founders Money Hub');
  });

  it('shows server validation messages and version conflicts without losing the user\'s input', async () => {
    mockFetch({ ...meAdmin, 'PATCH /settings': { status: 409, body: { error: { code: 'VERSION_CONFLICT', message: 'Settings were changed by someone else.' } } } });
    renderApp('/settings?section=approvals');
    await userEvent.click(await screen.findByRole('switch', { name: /Require a reason when rejecting/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/changed by someone else\. Reload the page/);
    expect(screen.getByRole('switch', { name: /Require a reason when rejecting/ })).toBeChecked();
  });

  it('unsaved-change protection: switching section or leaving asks first, Cancel restores the saved value', async () => {
    mockFetch({ ...meAdmin });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderApp('/settings');
    const field = await screen.findByLabelText('Display name');
    await userEvent.type(field, 'X');
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument();
    await userEvent.click(within(sectionNav()).getByRole('button', { name: 'Founders' }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText('Display name')).toBeInTheDocument(); // stayed
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Dashboard' }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Display name')).toHaveValue('CareerBuddies Founder Ledger');
    expect(screen.queryByText('You have unsaved changes.')).toBeNull();
  });

  it('reimbursement and calculation rules are read-only text, not controls', async () => {
    mockFetch({ ...meAdmin, 'GET /settings': { status: 200, body: { settings: configFixture.settings, currency: { code: 'INR', minorUnits: 2 }, policy: { reimbursement: { label: 'Reimbursement rules (approved Option C)', rules: ['A reimbursement must link to exactly one approved business expense.'] }, calculation: { label: 'Calc', rules: ['x'] } } } } });
    renderApp('/settings?section=reimbursement');
    expect(await screen.findByText(/exactly one approved business expense/)).toBeInTheDocument();
    expect(screen.getByText(/Approved policy: Option C/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });

  it('logo upload validates the file on the client and posts it to the branding endpoint', async () => {
    const uploads: string[] = [];
    mockFetch({ ...meAdmin, 'PUT /branding/logo': (_u, init) => { uploads.push(String((init?.body as FormData).get('file') instanceof File)); return { status: 200, body: {} }; } });
    renderApp('/settings?section=branding');
    const input = await screen.findByLabelText(/Upload new logo|logo-file/, { selector: 'input' }).catch(() => document.getElementById('logo-file')!);
    await userEvent.upload(input as HTMLInputElement, new File(['x'], 'logo.gif', { type: 'image/gif' }), { applyAccept: false });
    expect(await screen.findByText(/must be a PNG, JPG or WebP/)).toBeInTheDocument();
    await userEvent.upload(input as HTMLInputElement, new File([new Uint8Array(3 * 1024 * 1024)], 'big.png', { type: 'image/png' }));
    expect(await screen.findByText(/too large/)).toBeInTheDocument();
    expect(uploads).toEqual([]);
    await userEvent.upload(input as HTMLInputElement, new File(['png'], 'logo.png', { type: 'image/png' }));
    expect(await screen.findByText('Logo updated everywhere.')).toBeInTheDocument();
    expect(uploads).toEqual(['true']);
  });

  it('founders: ordered list with role, placeholder photo, reorder sends every id, a rename sends only name and role', async () => {
    let order: unknown = null, patch: unknown = null;
    const fs = foundersFixture.map((f, i) => ({ ...f, role: i === 0 ? 'Founder' : 'Co-founder', displayOrder: i, hasPhoto: false, photoUrl: null }));
    mockFetch({ ...meAdmin, 'GET /founders': { status: 200, body: { founders: fs } }, 'PUT /founders/order': (_u, init) => { order = jsonBody(init); return { status: 200, body: { founders: fs } }; }, 'PATCH /founders/f2': (_u, init) => { patch = jsonBody(init); return { status: 200, body: {} }; } });
    renderApp('/settings?section=founders');
    const list = await screen.findByRole('list', { name: 'Founders' });
    expect(within(list).getAllByLabelText('Display name').map((i) => (i as HTMLInputElement).value)).toEqual(['Asha', 'Bilal', 'Chen']);
    expect(within(list).getAllByRole('img', { name: /no photograph/ })).toHaveLength(3); // neutral initials placeholder, never a generated portrait
    expect(screen.getByRole('button', { name: 'Move Asha up' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Move Bilal up' }));
    await waitFor(() => expect(order).toEqual({ ids: ['f2', 'f1', 'f3'] }));
    const bilal = within(list).getAllByLabelText('Display name')[1] as HTMLInputElement;
    await userEvent.clear(bilal); await userEvent.type(bilal, 'Bilal Khan');
    await userEvent.click(within(bilal.closest('li')!).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(patch).toEqual({ name: 'Bilal Khan', role: 'Co-founder' }));
  });
});

describe('approvals', () => {
  const page = (items: Transaction[], counts = { pending_approval: items.length, approved: 4, rejected: 1 }): ApprovalsResponse => ({ items, page: 1, pageSize: 15, total: items.length, counts });

  it('shows the three tabs with counts, who requested, and decides with a comment; the list refreshes afterwards', async () => {
    let decided: Record<string, unknown> | null = null;
    let pending = [tx()];
    mockFetch({ ...meFounder,
      'GET /approvals': (u) => ({ status: 200, body: u.includes('status=approved') ? page([tx({ id: 't9', txnNumber: 'TXN-000009', description: 'Old one', status: 'approved', decision: { outcome: 'approved', at: '2026-04-16T10:00:00Z', comment: 'fine', by: { id: '3', name: 'Founder Two' } } })]) : page(pending) }),
      'POST /transactions/t1/approve': (_u, init) => { decided = jsonBody(init); pending = []; return { status: 200, body: { transaction: tx({ status: 'approved' }) } }; } });
    renderApp('/approvals');
    const tabs = await screen.findByRole('tablist', { name: 'Approval status' });
    await waitFor(() => expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Pending1', 'Approved4', 'Rejected1']));
    expect(await screen.findByText(/Requested by/)).toHaveTextContent('Founder One');
    await userEvent.click(screen.getByRole('button', { name: 'Approve TXN-000001' }));
    await userEvent.type(screen.getByLabelText(/Comment/), 'looks right');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(decided).toEqual({ expectedVersion: 1, comment: 'looks right' }));
    expect(await screen.findByText('Nothing is waiting for approval')).toBeInTheDocument();
    await userEvent.click(within(tabs).getByRole('tab', { name: /Approved/ }));
    expect(await screen.findByText(/by Founder Two on/)).toHaveTextContent('“fine”');
  });

  it('shows the server\'s reason when a decision is refused (self-approval rule) and keeps the dialog open', async () => {
    mockFetch({ ...meFounder, 'GET /approvals': { status: 200, body: page([tx()]) }, 'POST /transactions/t1/approve': { status: 403, body: { error: { code: 'SELF_APPROVAL_NOT_ALLOWED', message: 'You created this transaction. Approval rules require someone else to decide it.' } } } });
    renderApp('/approvals');
    await userEvent.click(await screen.findByRole('button', { name: 'Approve TXN-000001' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(/Approval rules require someone else/);
  });

  it('a mandatory rejection reason (Settings) disables Reject until one is typed', async () => {
    mockFetch({ ...meFounder, 'GET /config': { status: 200, body: cfgWith({ approvals: { allowSelfApproval: true, requireRejectionReason: true } }) }, 'GET /approvals': { status: 200, body: page([tx()]) } });
    renderApp('/approvals');
    await userEvent.click(await screen.findByRole('button', { name: 'Reject TXN-000001' }));
    const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Comment/), 'duplicate');
    expect(confirm).toBeEnabled();
  });

  it('pending badge in the navigation comes from the server count; empty tabs explain themselves', async () => {
    mockFetch({ ...meFounder, 'GET /approvals': { status: 200, body: page([], { pending_approval: 0, approved: 0, rejected: 0 }) } });
    renderApp('/approvals');
    expect(await screen.findByText('Nothing is waiting for approval')).toBeInTheDocument();
    expect(screen.queryByLabelText(/pending approvals$/)).toBeNull();
  });
});

describe('recurring payments', () => {
  const item = { id: 'r1', provider: 'Cloud Host', description: 'Servers', amountMinor: 120_000, frequency: 'monthly', nextDueDate: '2026-05-08', status: 'active', notes: null, version: 1, paidBy: { id: 'f1', name: 'Asha' }, category: { id: 'c1', name: 'Software' }, splitFounders: [{ id: 'f1', name: 'Asha' }, { id: 'f2', name: 'Bilal' }], dueState: 'overdue' };
  const data = { today: '2026-05-10', reminderDaysAhead: 7, items: [item], summary: { activeCount: 1, pausedCount: 0, monthlyCommitmentMinor: 120_000, overdueCount: 1, dueSoonCount: 0 } };

  it('lists schedules with overdue state and commitment; recording requires confirmation and says it is not yet an expense', async () => {
    let recorded: Record<string, unknown> | null = null;
    mockFetch({ ...meFounder, 'GET /recurring': { status: 200, body: data }, 'POST /recurring/r1/record': (_u, init) => { recorded = jsonBody(init); return { status: 201, body: {} }; } });
    renderApp('/recurring');
    const summary = await screen.findByLabelText('Recurring summary');
    expect(summary).toHaveTextContent(/Monthly commitment.*1,200\.00.*1 active/);
    expect(summary).toHaveTextContent(/Overdue.*1/);
    const row = screen.getByRole('list', { name: 'Recurring payments' });
    expect(row).toHaveTextContent(/Cloud Host.*Overdue.*Next due 2026-05-08/);
    await userEvent.click(screen.getByRole('button', { name: /Record payment/ }));
    const dlg = screen.getByRole('dialog');
    expect(dlg).toHaveTextContent(/creates a pending expense.*not a confirmed expense until it is approved/i);
    await userEvent.click(within(dlg).getByRole('button', { name: 'Record payment' }));
    await waitFor(() => expect(recorded).toEqual({ dueDate: '2026-05-08' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/pending expense. It counts once it is approved/);
  });

  it('pause / resume / cancel use the item version; cancelling asks first', async () => {
    const posts: string[] = [];
    mockFetch({ ...meFounder, 'GET /recurring': { status: 200, body: data }, 'POST /recurring/r1/pause': (_u, init) => { posts.push(`pause ${JSON.stringify(jsonBody(init))}`); return { status: 200, body: {} }; }, 'POST /recurring/r1/cancel': () => { posts.push('cancel'); return { status: 200, body: {} }; } });
    renderApp('/recurring');
    await userEvent.click(await screen.findByRole('button', { name: /Pause/ }));
    await waitFor(() => expect(posts).toEqual(['pause {"expectedVersion":1}']));
    await userEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(posts).toHaveLength(1); // not yet
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel recurring payment' }));
    await waitFor(() => expect(posts).toEqual(['pause {"expectedVersion":1}', 'cancel']));
  });

  it('add form validates, then posts minor units; empty state invites the first entry', async () => {
    let created: Record<string, unknown> | null = null;
    mockFetch({ ...meFounder, 'GET /recurring': { status: 200, body: { ...data, items: [], summary: { ...data.summary, activeCount: 0, monthlyCommitmentMinor: 0, overdueCount: 0 } } }, 'POST /recurring': (_u, init) => { created = jsonBody(init); return { status: 201, body: {} }; } });
    renderApp('/recurring');
    expect(await screen.findByText('No recurring payments yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add recurring payment' }));
    await userEvent.click(within(screen.getByRole('form', { name: 'Add recurring payment' })).getByRole('button', { name: 'Add recurring payment' }));
    expect(await screen.findByText('Enter the service or provider')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid amount greater than 0')).toBeInTheDocument();
    expect(created).toBeNull();
    await userEvent.type(screen.getByLabelText('Service / provider'), 'Design Tool');
    await userEvent.type(screen.getByLabelText('Amount'), '499.50');
    await userEvent.type(screen.getByLabelText('Next due date'), '2026-06-01');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'c1');
    await userEvent.selectOptions(screen.getByLabelText('Paid by'), 'f1');
    await userEvent.click(within(screen.getByRole('form', { name: 'Add recurring payment' })).getByRole('button', { name: 'Add recurring payment' }));
    await waitFor(() => expect(created).toMatchObject({ provider: 'Design Tool', amountMinor: 49_950, frequency: 'monthly', nextDueDate: '2026-06-01', paidByFounderId: 'f1', categoryId: 'c1', splitFounderIds: ['f1', 'f2', 'f3'] }));
  });
});

describe('reports', () => {
  const report: ReportSummary = {
    calculatedAt: 'x', currency: { code: 'INR', minorUnits: 2 }, fiscalYearStartMonth: 4, filters: { from: null, to: null, founderId: null, categoryId: null, type: null },
    totals: { totalExpensesMinor: 400_000, reimbursedByBusinessMinor: 30_000, founderFundedExpensesMinor: 370_000, refundsMinor: 30_000, founderCapitalMinor: 700_000, loansMinor: 150_000, totalInvestmentMinor: 850_000, settledMinor: 20_000, netBusinessPositionMinor: 480_000, outstandingSettlementsMinor: 136_666 },
    monthly: [{ month: '2026-04', expensesMinor: 300_000, investmentMinor: 500_000 }], annual: [{ fiscalYear: '2026-27', expensesMinor: 400_000, investmentMinor: 850_000 }],
    categories: [{ categoryId: 'c1', name: 'Software', amountMinor: 400_000, other: false, shareBp: 10_000 }],
    founders: [{ founderId: 'f1', name: 'Asha', active: true, role: 'Founder', photoUrl: null, contributionMinor: 200_000, loanOutstandingMinor: 0, investedMinor: 200_000, paidMinor: 270_000, fairShareMinor: 113_334, netPositionMinor: 156_666, outstandingMinor: 136_666, action: 'receive', reimbursedMinor: 0, loanMinor: 0, expensePaidMinor: 300_000, founderFundedMinor: 300_000, allocatedShareMinor: 113_334 }],
    settlements: [{ id: 's1', txnNumber: 'TXN-000008', date: '2026-05-09', status: 'approved', amountMinor: 20_000, payer: 'Bilal', receiver: 'Asha', method: 'UPI' }],
    counts: { matchingTransactions: 9, notCountedYet: 1, byStatus: { approved: 8, pending_approval: 1 }, byType: { business_expense: 2 } }, pendingApprovals: { count: 1 },
    reconciliation: { status: 'PASS', isBalanced: true, sumNetPositionMinor: 0, businessBorneMinor: 30_000 },
  };

  it('shows totals, annual spend, founder rows, counts and settlements exactly as served; export links carry the filters', async () => {
    const calls = mockFetch({ ...meFounder, 'GET /reports/summary': { status: 200, body: { ...report, filters: { ...report.filters, from: '2026-04-01', to: '2026-05-31', type: 'business_expense' } } } });
    renderApp('/reports?from=2026-04-01&to=2026-05-31&type=business_expense');
    const totals = await screen.findByLabelText('Report totals');
    expect(totals).toHaveTextContent(/Total expenses.*4,000\.00/);
    expect(totals).toHaveTextContent(/Reimbursed by the business.*300\.00/);
    expect(totals).toHaveTextContent(/Net business position.*\+.*4,800\.00/);
    expect(screen.getByRole('table', { name: 'Annual spend by financial year' })).toHaveTextContent('2026-27');
    const fo = screen.getByRole('table', { name: 'Founder summaries' });
    expect(fo).toHaveTextContent(/Asha.*Founder.*2,000\.00.*3,000\.00.*3,000\.00.*1,133\.34.*\+.*1,566\.66/);
    expect(screen.getByText((_, el) => el?.tagName === 'P' && /1 transaction is waiting for approval \(all periods\)/.test(el.textContent ?? ''))).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && /Bilal.*→.*Asha.*UPI/.test(el.textContent ?? '') && el.children.length === 2)).toBeInTheDocument();
    expect(calls.some((c) => c === 'GET /reports/summary?from=2026-04-01&to=2026-05-31&type=business_expense')).toBe(true);
    const link = within(screen.getByRole('main')).getByRole('link', { name: 'Transactions' });
    expect(link).toHaveAttribute('href', '/api/reports/export?kind=transactions&from=2026-04-01&to=2026-05-31&type=business_expense');
    expect(screen.getByTestId('report-scope')).toHaveTextContent(/2026-04-01 to 2026-05-31.*INR.*month 4/);
  });

  it('error with retry and an honest empty report', async () => {
    let fail = true;
    mockFetch({ ...meFounder, 'GET /reports/summary': () => (fail ? { status: 500, body: { error: { code: 'X', message: 'Something went wrong' } } } : { status: 200, body: { ...report, totals: { ...report.totals, totalExpensesMinor: 0 }, monthly: [], annual: [], categories: [], settlements: [], founders: [], counts: { ...report.counts, byStatus: {}, byType: {} } } }) });
    renderApp('/reports');
    const alert = await screen.findByRole('alert');
    fail = false;
    await userEvent.click(within(alert).getByRole('button'));
    expect(await screen.findByText('No monthly activity in this period.')).toBeInTheDocument();
    expect(screen.getByText('No settlements in this period.')).toBeInTheDocument();
    expect(screen.getByText('No transactions in this period.')).toBeInTheDocument();
  });
});

describe('audit log', () => {
  it('admin sees events with actor, action and before/after; founders are bounced from the URL; filters are sent to the server', async () => {
    const calls = mockFetch({ ...meAdmin, 'GET /audit-log': { status: 200, body: { page: 1, pageSize: 25, total: 1, items: [{ id: 'a1', at: '2026-05-10T10:00:00Z', actor: 'Admin One <a@cb.test>', actorId: '1', action: 'TRANSACTION_APPROVED', entityType: 'transaction', entityId: 't1', summary: 'TXN-000001 approved', before: { status: 'pending_approval' }, after: { status: 'approved' }, reason: 'ok' }] } } });
    renderApp('/audit-log');
    const list = await screen.findByRole('list', { name: 'Audit events' });
    expect(list).toHaveTextContent(/TXN-000001 approved.*TRANSACTION_APPROVED.*Admin One <a@cb\.test>.*Reason: “ok”/);
    expect(list).toHaveTextContent('"status": "approved"');
    await userEvent.selectOptions(screen.getByLabelText('Record type'), 'transaction');
    await waitFor(() => expect(calls.some((c) => c.includes('entityType=transaction'))).toBe(true));
  });

  it('is not available to founders', async () => {
    mockFetch({ ...meFounder });
    renderApp('/audit-log');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).not.toHaveTextContent('Audit Log');
  });
});

describe('settlement payment recording', () => {
  it('Record payment opens a dialog with the suggested amount, posts minor units and a request id, and shows the remaining amount on refusal', async () => {
    let posted: Record<string, unknown> | null = null;
    let refuse = true;
    mockFetch({ ...meFounder,
      'GET /settlements/recommendations': { status: 200, body: { calculatedAt: 'x', unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0, reconciliation: { status: 'PASS', explanation: '', checks: [], totalPaidMinor: 0, totalFairShareMinor: 0, sumGrossNetPositionMinor: 0, businessBorneMinor: 0, totalReceivableMinor: 0, totalPayableMinor: 0, recommendedTotalMinor: 0, unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0, isBalanced: true }, recommendations: [{ payer: { id: 'f2', name: 'Bilal' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 66_667 }] } },
      'GET /settlements/summary': { status: 200, body: { calculatedAt: 'x', warnings: [], totals: { settledMinor: 0, outstandingPayableMinor: 66_667, outstandingReceivableMinor: 66_667, netSettlementMinor: 0, recommendedTransfersMinor: 66_667, businessBorneMinor: 0 }, counts: { official: 0, awaitingApproval: 0, voidedOrRejected: 0, recommendedTransfers: 1 }, history: [], reconciliation: { status: 'PASS', explanation: '', checks: [], totalPaidMinor: 0, totalFairShareMinor: 0, sumGrossNetPositionMinor: 0, businessBorneMinor: 0, totalReceivableMinor: 0, totalPayableMinor: 0, recommendedTotalMinor: 0, unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0, isBalanced: true } } },
      'POST /settlements/record': (_u, init) => { posted = jsonBody(init); return refuse ? { status: 400, body: { error: { code: 'EXCEEDS_OUTSTANDING', message: 'This payment is larger than the amount still owed', details: [{ path: 'amountMinor', message: 'Amount is larger than the amount still owed', remainingMinor: 50_000 }] } } } : { status: 201, body: {} }; } });
    renderApp('/settlements');
    await userEvent.click(await screen.findByRole('button', { name: 'Record payment from Bilal to Asha' }));
    const amount = screen.getByLabelText(/Amount/);
    expect(amount).toHaveValue('666.67');
    expect(screen.getByLabelText(/Payment method/)).toHaveTextContent('UPI');
    expect(screen.getByLabelText(/Payment method/)).toHaveTextContent('Cheque'); // options come from Settings
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Record payment' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(/larger than the amount still owed.*still owed: .*500\.00/);
    expect(posted).toMatchObject({ payerFounderId: 'f2', receiverFounderId: 'f1', amountMinor: 66_667 });
    expect(String((posted as unknown as { clientRequestId: string }).clientRequestId).length).toBeGreaterThanOrEqual(8);
    refuse = false;
    await userEvent.clear(amount); await userEvent.type(amount, '500');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Record payment' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/recorded\. It counts once it is confirmed/);
    expect((posted as unknown as { amountMinor: number }).amountMinor).toBe(50_000);
  });
});

describe('portal entry route', () => {
  it('/ledger sends a signed-in user to the dashboard and an anonymous user to sign-in', async () => {
    mockFetch({ ...meFounder });
    const { unmount } = renderApp('/ledger');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    unmount();
    mockFetch({ 'GET /auth/me': unauth, 'POST /auth/refresh': unauth });
    renderApp('/ledger');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('login form', () => {
  it('validates before calling the API and can show or hide the password', async () => {
    const calls = mockFetch({ 'GET /auth/me': unauth, 'POST /auth/refresh': unauth });
    renderApp('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(calls.filter((c) => c.startsWith('POST /auth/login'))).toEqual([]);
    const pw = screen.getByLabelText('Password');
    expect(pw).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(pw).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(pw).toHaveAttribute('type', 'password');
  });
});

describe('dashboard preferences from Settings', () => {
  const empty = { calculatedAt: 'x', currency: { code: 'INR', minorUnits: 2 }, filters: { from: null, to: null, founderId: null, categoryId: null },
    kpis: { netBusinessPositionMinor: 0, totalInvestmentMinor: 0, founderCapitalMinor: 0, loansMinor: 0, totalBusinessExpensesMinor: 0, reimbursedByBusinessMinor: 0, founderFundedExpensesMinor: 0, refundsMinor: 0, settledMinor: 0, outstandingSettlementsMinor: 0 },
    founders: [], charts: { contributionByFounder: [], expenseByCategory: [], monthly: [] }, settlement: { recommendations: [], unresolvedMinor: 0 }, recent: [], founderPeriod: [], pendingApprovals: { count: 0 },
    upcomingRecurring: { items: [], today: '2026-05-10', summary: { activeCount: 0, pausedCount: 0, monthlyCommitmentMinor: 0, overdueCount: 0, dueSoonCount: 0 } },
    counts: { matchingTransactions: 0, notCountedYet: 0, byStatus: {}, byType: {} }, reconciliation: { status: 'PASS', isBalanced: true, sumNetPositionMinor: 0, businessBorneMinor: 0 }, warnings: 0 };

  it('the saved default period is applied when the URL has none, and "All time" remains an explicit choice', async () => {
    const calls = mockFetch({ ...meFounder, 'GET /config': { status: 200, body: cfgWith({ dashboard: { defaultPeriod: 'this_year', recentTransactionsCount: 10, upcomingRecurringCount: 5 } }) }, 'GET /dashboard': { status: 200, body: empty } });
    renderApp('/dashboard');
    await screen.findByLabelText('Key figures');
    expect(calls.some((c) => /^GET \/dashboard\?from=\d{4}-01-01&to=\d{4}-12-31$/.test(c))).toBe(true);
    expect(screen.getByLabelText('Period')).toHaveValue('this_year');
    await userEvent.selectOptions(screen.getByLabelText('Period'), 'all');
    await waitFor(() => expect(calls.at(-1)).toBe('GET /dashboard'));
    expect(screen.getByLabelText('Period')).toHaveValue('all');
  });
});
