import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../lib/types';
import { adminUser, categoriesFixture, founderUser, mockFetch, renderApp } from '../../test/utils';

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't1', txnNumber: 'TXN-000001', type: 'business_expense', amountMinor: 3_000_000, description: 'Cloud hosting', notes: null, method: null,
  category: { id: 'c1', name: 'Software' }, paidBy: { id: 'f1', name: 'Asha' }, counterparty: null, transactionDate: '2026-04-15', status: 'pending_approval',
  split: { method: 'equal', entries: [{ founderId: 'f1', founderName: 'Asha', allocatedMinor: 1_000_000 }, { founderId: 'f2', founderName: 'Bilal', allocatedMinor: 1_000_000 }, { founderId: 'f3', founderName: 'Chen', allocatedMinor: 1_000_000 }] },
  receiptCount: 1, void: null, version: 1, createdBy: { id: '2', name: 'Founder One' }, updatedBy: { id: '2', name: 'Founder One' }, createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-04-15T10:00:00Z', ...over,
});
const me = (user: typeof founderUser | typeof adminUser) => ({ 'GET /auth/me': { status: 200, body: { user } } });
const body = (init?: RequestInit) => JSON.parse(String(init?.body)) as Record<string, unknown>;

describe('transactions list', () => {
  it('shows ledger columns, status, receipt indicator — and no totals', async () => {
    mockFetch({ ...me(founderUser), 'GET /transactions': { status: 200, body: { items: [tx(), tx({ id: 't2', txnNumber: 'TXN-000002', description: 'Old entry', status: 'voided', receiptCount: 0 })], page: 1, pageSize: 25, total: 2 } } });
    renderApp('/transactions');
    const table = await screen.findByRole('table');
    for (const col of ['ID', 'Date', 'Description', 'Type', 'Category', 'Paid by', 'Status', 'Amount', 'Receipt', 'Created']) expect(within(table).getByRole('columnheader', { name: new RegExp(col) })).toBeInTheDocument();
    expect(within(table).getByText('Cloud hosting')).toHaveAttribute('href', '/transactions/t1');
    expect(within(table).getByText('Voided')).toBeInTheDocument();
    expect(within(table).getAllByText(/30,000\.00/)).toHaveLength(2);
    expect(within(table).getAllByText('receipts attached')).toHaveLength(1); // only the first row has a receipt
    expect(screen.queryByText(/total (amount|expenses|investment)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/2 transactions · page 1 of 1/)).toBeInTheDocument();
  });

  it('responsive: renders both the desktop table and the mobile card list, toggled by CSS', async () => {
    mockFetch({ ...me(founderUser), 'GET /transactions': { status: 200, body: { items: [tx()], page: 1, pageSize: 25, total: 1 } } });
    renderApp('/transactions');
    const table = await screen.findByRole('table');
    expect(table.closest('div')).toHaveClass('hidden', 'md:block', 'relative', 'overflow-x-auto'); // `relative` keeps sr-only text inside the scroller
    expect(screen.getByRole('list', { name: 'Transactions' })).toHaveClass('md:hidden');
  });

  it('sends filters and search to the API and can clear them', async () => {
    const calls = mockFetch({ ...me(founderUser), 'GET /transactions': { status: 200, body: { items: [], page: 1, pageSize: 25, total: 0 } } });
    renderApp('/transactions');
    await screen.findByText('No transactions yet');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'settlement');
    await waitFor(() => expect(calls.some((c) => c.includes('type=settlement'))).toBe(true));
    await userEvent.selectOptions(screen.getByLabelText('Paid by'), 'f2');
    await userEvent.type(screen.getByLabelText('Search transactions'), 'laptop');
    await waitFor(() => expect(calls.some((c) => c.includes('search=laptop') && c.includes('paidByFounderId=f2'))).toBe(true));
    expect(await screen.findByText('No transactions match these filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Clear filters/ }));
    await waitFor(() => expect(screen.getByLabelText('Type')).toHaveValue(''));
  });

  it('sorts by clicking a column header', async () => {
    const calls = mockFetch({ ...me(founderUser), 'GET /transactions': { status: 200, body: { items: [tx()], page: 1, pageSize: 25, total: 1 } } });
    renderApp('/transactions');
    await userEvent.click(await screen.findByRole('button', { name: 'Amount' }));
    await waitFor(() => expect(calls.some((c) => c.includes('sort=amountMinor') && c.includes('order=desc'))).toBe(true));
  });
});

describe('add transaction form', () => {
  it('renders all seven types, the required fields and obvious founder choice', async () => {
    mockFetch(me(founderUser));
    renderApp('/transactions/new');
    const types = await screen.findByRole('radiogroup', { name: 'Transaction type' });
    expect(within(types).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Business Expense', 'Founder Contribution', 'Founder Loan', 'Reimbursement', 'Settlement', 'Refund', 'Other']);
    expect(screen.getByLabelText(/Amount \(INR\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    const paid = screen.getByRole('radiogroup', { name: 'Paid by' });
    expect(within(paid).getAllByRole('radio')).toHaveLength(3);
    await waitFor(() => expect(within(paid).getByRole('radio', { name: /Asha/ })).toBeChecked()); // defaults to the signed-in founder
    expect(screen.getByRole('radiogroup', { name: 'Split method' })).toBeInTheDocument();
    expect(within(screen.getByRole('radiogroup', { name: 'Split method' })).getAllByRole('radio').map((r) => r.textContent)).toEqual(['Equal', 'Percentage', 'Exact amount', 'Shares', 'Custom']);
  });

  it('shows immediate, helpful validation without calling the API', async () => {
    const calls = mockFetch(me(founderUser));
    renderApp('/transactions/new');
    await screen.findByLabelText('Description');
    await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    expect(await screen.findByText(/Enter a valid amount greater than 0/)).toBeInTheDocument();
    expect(screen.getByText('Add a short description')).toBeInTheDocument();
    expect(screen.getByText('Choose a category')).toBeInTheDocument();
    expect(calls.filter((c) => c.startsWith('POST /transactions'))).toEqual([]);
  });

  it('adapts to the type using server-provided rules (settlement: receiver, no split)', async () => {
    mockFetch(me(founderUser));
    renderApp('/transactions/new');
    await userEvent.click(await screen.findByRole('radio', { name: 'Settlement' }));
    expect(screen.getByRole('radiogroup', { name: 'Who received the money?' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Split method' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Other' }));
    expect(screen.getByLabelText('Split this between founders')).toBeInTheDocument(); // optional for "other"
    expect(screen.queryByRole('radiogroup', { name: 'Who received the money?' })).not.toBeInTheDocument();
  });

  it('previews the split via the server and shows its validation messages', async () => {
    const previews: Array<Record<string, unknown>> = [];
    mockFetch({
      ...me(founderUser),
      'POST /transactions/split-preview': (_u, init) => {
        const b = body(init); previews.push(b);
        const split = b['split'] as { method: string };
        return split.method === 'percentage'
          ? { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'x', details: [{ path: 'split.entries', message: 'Percentages must add up to 100% (currently 50%)' }] } } }
          : { status: 200, body: { entries: [{ founderId: 'f1', founderName: 'Asha', allocatedMinor: 50000 }, { founderId: 'f2', founderName: 'Bilal', allocatedMinor: 50000 }, { founderId: 'f3', founderName: 'Chen', allocatedMinor: 50000 }] } };
      },
    });
    renderApp('/transactions/new');
    await userEvent.type(await screen.findByLabelText(/Amount/), '1500');
    expect(await screen.findByLabelText('Asha pays')).toHaveTextContent(/500\.00/);
    expect(previews[0]).toEqual({ amountMinor: 150000, split: { method: 'equal', entries: [{ founderId: 'f1' }, { founderId: 'f2' }, { founderId: 'f3' }] } });

    await userEvent.click(screen.getByRole('radio', { name: 'Percentage' }));
    await userEvent.type(await screen.findByLabelText('Percent for Asha'), '50');
    await userEvent.type(screen.getByLabelText('Percent for Bilal'), '0');
    expect(screen.getByText('Enter a percentage for Chen.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Include Chen' }));
    expect(await screen.findByText('Percentages must add up to 100% (currently 50%)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0);
  });

  it('creates a transaction with integer minor units and opens it', async () => {
    let posted: Record<string, unknown> | null = null;
    mockFetch({
      ...me(founderUser),
      'POST /transactions/split-preview': { status: 200, body: { entries: [] } },
      'POST /transactions': (_u, init) => { posted = body(init); return { status: 201, body: { transaction: tx() } }; },
      'GET /transactions/t1': { status: 200, body: { transaction: tx(), receipts: [] } },
      'GET /transactions/t1/history': { status: 200, body: { history: [] } },
    });
    renderApp('/transactions/new');
    await userEvent.type(await screen.findByLabelText(/Amount/), '1,500.50');
    await userEvent.type(screen.getByLabelText('Description'), '  Hosting  ');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    expect(await screen.findByRole('heading', { name: 'Cloud hosting' })).toBeInTheDocument();
    expect(posted).toMatchObject({ type: 'business_expense', amountMinor: 150050, description: 'Hosting', categoryId: categoriesFixture[0]!.id, paidByFounderId: 'f1', status: 'pending_approval', split: { method: 'equal' } });
    expect(typeof (posted as unknown as { amountMinor: unknown }).amountMinor).toBe('number');
  });

  describe('reimbursement expense picker (Option C)', () => {
    const expenses = [
      { id: 'e1', txnNumber: 'TXN-000001', description: 'Cloud hosting', transactionDate: '2026-04-15', amountMinor: 300_000, reimbursedMinor: 0, remainingMinor: 300_000 },
      { id: 'e2', txnNumber: 'TXN-000002', description: 'Domains', transactionDate: '2026-04-20', amountMinor: 50_000, reimbursedMinor: 20_000, remainingMinor: 30_000 },
    ];
    it('a reimbursement requires choosing the expense; the picker lists only that founder\'s reimbursable expenses', async () => {
      const calls = mockFetch({ ...me(founderUser), 'GET /transactions/reimbursable-expenses': { status: 200, body: { expenses } } });
      renderApp('/transactions/new');
      await userEvent.click(await screen.findByRole('radio', { name: 'Reimbursement' }));
      expect(screen.getByRole('radiogroup', { name: 'Expense being reimbursed' })).toBeInTheDocument();
      expect(await screen.findByRole('radio', { name: /TXN-000001.*Cloud hosting/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /TXN-000002.*Up to .*300\.00/ })).toBeInTheDocument();
      expect(calls.some((c) => c.startsWith('GET /transactions/reimbursable-expenses?paidByFounderId=f1'))).toBe(true);
      await userEvent.type(screen.getByLabelText(/Amount/), '100');
      await userEvent.type(screen.getByLabelText('Description'), 'Paid back');
      await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
      expect(await screen.findByText('Choose the expense this reimburses')).toBeInTheDocument();
      expect(calls.filter((c) => c === 'POST /transactions')).toEqual([]);
    });
    it('sends only the link id (no financial values from the client) and shows server errors such as over-reimbursement', async () => {
      let posted: Record<string, unknown> | null = null;
      mockFetch({
        ...me(founderUser),
        'GET /transactions/reimbursable-expenses': { status: 200, body: { expenses } },
        'POST /transactions': (_u, init) => { posted = body(init); return { status: 400, body: { error: { code: 'REIMBURSEMENT_EXCEEDS_EXPENSE', message: 'This reimbursement would take the total reimbursed above the expense amount', details: [{ path: 'amountMinor', code: 'REIMBURSEMENT_EXCEEDS_EXPENSE', message: 'This reimbursement would take the total reimbursed above the expense amount', remainingMinor: 100_000 }] } } }; },
      });
      renderApp('/transactions/new');
      await userEvent.click(await screen.findByRole('radio', { name: 'Reimbursement' }));
      await userEvent.click(await screen.findByRole('radio', { name: /TXN-000001/ }));
      await userEvent.type(screen.getByLabelText(/Amount/), '2500');
      await userEvent.type(screen.getByLabelText('Description'), 'Paid back');
      await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
      expect((await screen.findAllByText(/above the expense amount/)).length).toBeGreaterThan(0);
      expect(posted).toMatchObject({ type: 'reimbursement', amountMinor: 250_000, reimbursesTransactionId: 'e1', paidByFounderId: 'f1' });
      expect(Object.keys(posted as unknown as object)).not.toEqual(expect.arrayContaining(['fairShareMinor', 'reimbursedMinor']));
    });
    it('no approved expenses left -> explains instead of showing an empty list', async () => {
      mockFetch({ ...me(founderUser), 'GET /transactions/reimbursable-expenses': { status: 200, body: { expenses: [] } } });
      renderApp('/transactions/new');
      await userEvent.click(await screen.findByRole('radio', { name: 'Reimbursement' }));
      expect(await screen.findByText(/no approved expenses left to reimburse/)).toBeInTheDocument();
    });
  });

  describe('settlement prefill from the dashboard "Settle" button', () => {
    it('prefills a settlement (type, payer, receiver, amount) but still goes through the normal validated form', async () => {
      let posted: Record<string, unknown> | null = null;
      mockFetch({ ...me(founderUser), 'POST /transactions': (_u, init) => { posted = body(init); return { status: 201, body: { transaction: tx({ type: 'settlement' }) } }; }, 'GET /transactions/t1': { status: 200, body: { transaction: tx(), receipts: [] } }, 'GET /transactions/t1/history': { status: 200, body: { history: [] } } });
      renderApp('/transactions/new?type=settlement&paidBy=f2&counterparty=f1&amount=66667');
      expect(await screen.findByLabelText(/Amount/)).toHaveValue('666.67');
      expect(screen.getByRole('radio', { name: 'Settlement' })).toHaveAttribute('aria-checked', 'true');
      await waitFor(() => expect(within(screen.getByRole('radiogroup', { name: 'Who paid?' })).getByRole('radio', { name: /Bilal/ })).toHaveAttribute('aria-checked', 'true'));
      await waitFor(() => expect(within(screen.getByRole('radiogroup', { name: 'Who received the money?' })).getByRole('radio', { name: /Asha/ })).toHaveAttribute('aria-checked', 'true'));
      await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
      await screen.findByRole('heading', { name: 'Cloud hosting' });
      expect(posted).toMatchObject({ type: 'settlement', amountMinor: 66667, paidByFounderId: 'f2', counterpartyFounderId: 'f1', status: 'pending_approval' });
    });
    it('ignores malformed or unknown prefill values', async () => {
      mockFetch(me(founderUser));
      renderApp('/transactions/new?type=settlement&paidBy=zzz&counterparty=yyy&amount=1e9');
      await screen.findByLabelText(/Amount/);
      expect(screen.getByLabelText(/Amount/)).toHaveValue('');
      expect(screen.getByRole('radio', { name: 'Business Expense' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('shows server-side field errors returned by the API', async () => {
    mockFetch({
      ...me(founderUser),
      'POST /transactions/split-preview': { status: 200, body: { entries: [] } },
      'POST /transactions': { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'Transaction validation failed', details: [{ path: 'categoryId', message: 'Category is inactive' }] } } },
    });
    renderApp('/transactions/new');
    await userEvent.type(await screen.findByLabelText(/Amount/), '10');
    await userEvent.type(screen.getByLabelText('Description'), 'x');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    expect((await screen.findAllByText('Category is inactive')).length).toBeGreaterThan(0);
  });
});

describe('transaction detail', () => {
  const detail = (t: Transaction, user: typeof founderUser | typeof adminUser, extra: Record<string, unknown> = {}) => mockFetch({
    ...me(user), 'GET /transactions/t1': { status: 200, body: { transaction: t, receipts: [{ id: 'r1', transactionId: 't1', fileName: 'scan.png', mimeType: 'image/png', sizeBytes: 2048, sha256: 'x', uploadedAt: '2026-04-15T10:00:00Z', uploadedBy: { id: '2', name: 'Founder One' } }] } },
    'GET /transactions/t1/history': { status: 200, body: { history: [{ id: 'h1', version: 1, action: 'created', at: '2026-04-15T10:00:00Z', reason: null, actor: { id: '2', name: 'Founder One' } }] } }, ...extra,
  });

  it('an expense shows what is reimbursed and links to its reimbursements; a reimbursement links back to its expense', async () => {
    mockFetch({
      ...me(adminUser),
      'GET /transactions/t1': { status: 200, body: { transaction: tx({ status: 'approved', reimbursedMinor: 1_000_000, remainingReimbursableMinor: 2_000_000 }), receipts: [],
        linkedReimbursements: [{ id: 'r9', txnNumber: 'TXN-000009', amountMinor: 1_000_000, status: 'approved', transactionDate: '2026-05-03' }] } },
      'GET /transactions/t1/history': { status: 200, body: { history: [] } },
      'GET /transactions/r9': { status: 200, body: { transaction: tx({ id: 'r9', txnNumber: 'TXN-000009', type: 'reimbursement', amountMinor: 1_000_000, split: null, description: 'Paid back', reimbursesTransactionId: 't1', reimbursesTransaction: { id: 't1', txnNumber: 'TXN-000001', description: 'Cloud hosting', amountMinor: 3_000_000 } }), receipts: [], linkedReimbursements: [] } },
      'GET /transactions/r9/history': { status: 200, body: { history: [] } },
    });
    renderApp('/transactions/t1');
    const summary = await screen.findByTestId('reimbursed-summary');
    expect(summary).toHaveTextContent(/10,000\.00 reimbursed.*20,000\.00 still reimbursable.*founders share .*20,000\.00/);
    expect(screen.getByRole('link', { name: 'TXN-000009' })).toHaveAttribute('href', '/transactions/r9');
  });
  it('a blocked expense void shows the server explanation', async () => {
    detail(tx({ status: 'approved' }), adminUser, { 'POST /transactions/t1/void': { status: 409, body: { error: { code: 'HAS_LINKED_REIMBURSEMENTS', message: 'This expense has active reimbursements. Void the linked reimbursement(s) first, then void the expense.', details: [] } } } });
    renderApp('/transactions/t1');
    await userEvent.click(await screen.findByRole('button', { name: 'Void transaction' }));
    await userEvent.type(screen.getByLabelText('Reason (required)'), 'entered twice');
    await userEvent.click(screen.getAllByRole('button', { name: 'Void transaction' }).at(-1)!);
    expect(await screen.findByText(/Void the linked reimbursement\(s\) first/)).toBeInTheDocument();
  });

  it('shows split responsibility, authorised receipt links (no public URLs) and history', async () => {
    detail(tx(), founderUser);
    renderApp('/transactions/t1');
    expect(await screen.findByRole('heading', { name: 'Cloud hosting' })).toBeInTheDocument();
    const split = screen.getByRole('region', { name: /Split/ });
    expect(within(split).getAllByText(/10,000\.00/)).toHaveLength(3);
    expect(screen.getByRole('link', { name: /View/ })).toHaveAttribute('href', '/api/transactions/t1/receipts/r1/file');
    expect(screen.getByRole('link', { name: /Download/ })).toHaveAttribute('href', '/api/transactions/t1/receipts/r1/file?download=1');
    expect(screen.getByAltText('Receipt scan.png')).toHaveAttribute('src', '/api/transactions/t1/receipts/r1/file');
    expect(screen.getByText('Created', { selector: 'dt' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'History' })).getByText('Created')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit/ })).toBeInTheDocument(); // owner
  });

  it('hides edit/void from a founder who did not create it, and void from non-admins', async () => {
    detail(tx({ createdBy: { id: '99', name: 'Someone Else' } }), founderUser);
    renderApp('/transactions/t1');
    await screen.findByRole('heading', { name: 'Cloud hosting' });
    expect(screen.queryByRole('link', { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Void transaction/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Upload receipt/)).not.toBeInTheDocument();
  });

  it('void needs confirmation and a reason, then calls the void endpoint (no delete)', async () => {
    let voidBody: Record<string, unknown> | null = null;
    const calls = detail(tx(), adminUser, { 'POST /transactions/t1/void': (_u: string, init?: RequestInit) => { voidBody = body(init); return { status: 200, body: { transaction: tx({ status: 'voided' }) } }; } });
    renderApp('/transactions/t1');
    await userEvent.click(await screen.findByRole('button', { name: 'Void transaction' }));
    const dialog = screen.getByRole('dialog', { name: 'Void this transaction?' });
    const confirm = within(dialog).getByRole('button', { name: 'Void transaction' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Reason/), 'Entered twice');
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await waitFor(() => expect(voidBody).toEqual({ expectedVersion: 1, reason: 'Entered twice' }));
    expect(calls.some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  it('cancelling the void dialog changes nothing', async () => {
    const calls = detail(tx(), adminUser);
    renderApp('/transactions/t1');
    await userEvent.click(await screen.findByRole('button', { name: 'Void transaction' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(calls.some((c) => c.includes('/void'))).toBe(false);
  });

  it('voided transactions show who/why and offer no edit or void', async () => {
    detail(tx({ status: 'voided', void: { reason: 'Entered twice', voidedAt: '2026-04-16T10:00:00Z', voidedBy: { id: '1', name: 'Admin One' } } }), adminUser);
    renderApp('/transactions/t1');
    expect(await screen.findByText(/Entered twice/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Void transaction' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Edit/ })).not.toBeInTheDocument();
  });
});

describe('settings: categories (admin)', () => {
  it('lists categories, flags dev seed data, and adds a category', async () => {
    let created: Record<string, unknown> | null = null;
    mockFetch({
      ...me(adminUser),
      'GET /categories': { status: 200, body: { categories: [{ ...categoriesFixture[0]!, isDevSeed: true }] } },
      'POST /categories': (_u, init) => { created = body(init); return { status: 201, body: { category: {} } }; },
    });
    renderApp('/settings?section=categories');
    expect(await screen.findByText('dev seed')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name'), 'Legal');
    await userEvent.click(screen.getByRole('button', { name: /Add/ }));
    await waitFor(() => expect(created).toEqual({ name: 'Legal' }));
  });
});
