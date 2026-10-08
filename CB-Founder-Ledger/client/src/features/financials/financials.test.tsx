import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { FounderPosition, Reconciliation } from '../../lib/types';
import { founderUser, foundersFixture, mockFetch, renderApp } from '../../test/utils';

const me = { 'GET /auth/me': { status: 200, body: { user: founderUser } } };
const currency = { code: 'INR', minorUnits: 2 };
const zero: Omit<FounderPosition, 'founderId' | 'founderName'> = {
  active: true, expensePaidMinor: 0, refundReceivedMinor: 0, reimbursedMinor: 0, paidMinor: 0, contributionMinor: 0, loanOutstandingMinor: 0, fairShareMinor: 0,
  grossNetPositionMinor: 0, settledPaidMinor: 0, settledReceivedMinor: 0, outstandingMinor: 0, outstandingReceivableMinor: 0, outstandingPayableMinor: 0, action: 'settled', settlementStatus: 'settled',
};
const balanced: Reconciliation = { totalPaidMinor: 0, totalFairShareMinor: 0, unallocatedMinor: 0, totalReceivableMinor: 0, totalPayableMinor: 0, recommendedTotalMinor: 0, unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0, isBalanced: true };
const excluded = { byStatus: {}, unclassifiedOther: 0, invalid: 0 };

const positions: FounderPosition[] = [
  { ...zero, founderId: 'f1', founderName: 'Asha', paidMinor: 8_000_000, fairShareMinor: 6_166_700, grossNetPositionMinor: 1_833_300, outstandingMinor: 1_833_300, outstandingReceivableMinor: 1_833_300, action: 'receive', settlementStatus: 'open', contributionMinor: 500_000 },
  { ...zero, founderId: 'f2', founderName: 'Bilal', paidMinor: 5_500_000, fairShareMinor: 6_166_700, grossNetPositionMinor: -666_700, outstandingMinor: -666_700, outstandingPayableMinor: 666_700, action: 'pay', settlementStatus: 'open', loanOutstandingMinor: 250_000 },
  { ...zero, founderId: 'f3', founderName: 'Chen' },
];

describe('founders page shows server-calculated positions', () => {
  it('Paid / Fair share / Net position, Receive vs Pay vs Settled, distinct and labelled', async () => {
    mockFetch({ ...me, 'GET /founders/financial-positions': { status: 200, body: { calculatedAt: 'x', currency, positions, reconciliation: balanced, included: {}, excluded, warnings: [] } } });
    renderApp('/founders');
    const list = await screen.findByRole('list', { name: 'Founder positions' });
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(within(cards[0]!).getByText('To receive')).toBeInTheDocument();
    expect(within(cards[1]!).getByText('To pay')).toBeInTheDocument();
    expect(within(cards[2]!).getByText('Settled')).toBeInTheDocument();
    expect(within(cards[0]!).getByText(/\+.*18,333\.00/)).toBeInTheDocument();      // net position, explicit +
    expect(within(cards[1]!).getByText(/−.*6,667\.00/)).toBeInTheDocument();        // explicit −
    expect(within(cards[0]!).getByText('Still to receive')).toBeInTheDocument();
    expect(within(cards[1]!).getByText('Still to pay')).toBeInTheDocument();
    expect(within(cards[0]!).getByText(/80,000\.00/)).toBeInTheDocument();
    expect(within(cards[0]!).getByText(/61,667\.00/)).toBeInTheDocument();
    expect(within(cards[1]!).getByText(/2,500\.00/)).toBeInTheDocument();           // loan outstanding
    expect(within(cards[0]!).getByRole('link', { name: 'Asha' })).toHaveAttribute('href', '/founders/f1');
  });

  it('G. displays the server\'s numbers verbatim — it never recomputes (deliberately inconsistent data)', async () => {
    // paid − fair share would be 1,000.00, but the server says the net position is 7,777.00 and outstanding 4,242.00.
    const odd: FounderPosition = { ...zero, founderId: 'f1', founderName: 'Asha', paidMinor: 300_000, fairShareMinor: 200_000, grossNetPositionMinor: 777_700, outstandingMinor: 424_200, outstandingReceivableMinor: 424_200, action: 'receive' };
    mockFetch({ ...me, 'GET /founders/financial-positions': { status: 200, body: { calculatedAt: 'x', currency, positions: [odd], reconciliation: balanced, included: {}, excluded, warnings: [] } } });
    renderApp('/founders');
    const card = (await screen.findAllByRole('listitem'))[0]!;
    expect(within(card).getByText(/\+.*7,777\.00/)).toBeInTheDocument();
    expect(within(card).getByText(/4,242\.00/)).toBeInTheDocument();
    expect(within(card).queryByText(/1,000\.00/)).not.toBeInTheDocument();
  });

  it('explains what is not counted: awaiting approval, business-funded amounts, incomplete records', async () => {
    mockFetch({ ...me, 'GET /founders/financial-positions': { status: 200, body: {
      calculatedAt: 'x', currency, positions, included: {}, excluded: { byStatus: { pending_approval: 2, draft: 1 }, unclassifiedOther: 0, invalid: 1 },
      reconciliation: { ...balanced, isBalanced: false, unallocatedMinor: -300_000 }, warnings: [{ code: 'MISSING_SPLIT', transactionId: 't', message: 'refund has no stored split' }] } } });
    renderApp('/founders');
    expect(await screen.findByText(/3 transactions are not counted yet/)).toBeInTheDocument();
    expect(screen.getByText(/3,000\.00 was paid out of business funds/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/refund has no stored split/);
  });

  it('empty state when no founder profiles exist', async () => {
    mockFetch({ ...me, 'GET /founders/financial-positions': { status: 200, body: { calculatedAt: 'x', currency, positions: [], reconciliation: balanced, included: {}, excluded, warnings: [] } } });
    renderApp('/founders');
    expect(await screen.findByText('No founders yet')).toBeInTheDocument();
  });

  it('shows an error with retry when the server fails', async () => {
    mockFetch({ ...me, 'GET /founders/financial-positions': { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } } } });
    renderApp('/founders');
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });
});

describe('founder ledger page', () => {
  it('shows every ledger metric the plan lists (§10) and a complete history with counted / not counted', async () => {
    mockFetch({ ...me, 'GET /founders/f1/financial-position': { status: 200, body: {
      calculatedAt: 'x', warnings: [], reconciliation: balanced,
      position: { ...positions[0]!, settledPaidMinor: 100_000, settledReceivedMinor: 50_000 },
      history: [
        { id: 'h1', txnNumber: 'TXN-000002', transactionDate: '2026-05-02', type: 'founder_contribution', status: 'pending_approval', description: 'Seed capital', amountMinor: 900, counted: false, effects: [] },
        { id: 'h2', txnNumber: 'TXN-000001', transactionDate: '2026-05-01', type: 'business_expense', status: 'approved', description: 'Hosting', amountMinor: 3_000_000, counted: true, effects: [{ kind: 'expense_paid', amountMinor: 3_000_000 }, { kind: 'expense_share', amountMinor: 1_000_000 }] },
      ] } } });
    renderApp(`/founders/f1`);
    expect(await screen.findByRole('heading', { name: 'Asha' })).toBeInTheDocument();
    for (const label of ['Total paid', 'Contribution', 'Loan outstanding', 'Fair share', 'Net position', 'Settled so far', 'Amount receivable', 'Amount payable', 'Outstanding']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/1,000\.00 paid · .*500\.00 received/)).toBeInTheDocument();
    expect(screen.getByText(/Paid for expense: .*30,000\.00 · Share of expense: .*10,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Not counted in the figures above/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Founder Ledger' })).toBeInTheDocument();
  });
  it('unknown founder -> clear message', async () => {
    mockFetch({ ...me, 'GET /founders/zz/financial-position': { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Founder not found' } } } });
    renderApp('/founders/zz');
    expect(await screen.findByText('Founder not found.')).toBeInTheDocument();
  });
});

describe('settlements page', () => {
  const rec = { calculatedAt: 'x', unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0, reconciliation: balanced, recommendations: [
    { payer: { id: 'f2', name: 'Bilal' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 666_700 }, { payer: { id: 'f3', name: 'Chen' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 1_166_600 }] };
  const summary = { calculatedAt: 'x', warnings: [], reconciliation: balanced,
    totals: { settledMinor: 100_000, outstandingPayableMinor: 1_833_300, outstandingReceivableMinor: 1_833_300, recommendedTransfersMinor: 1_833_300 },
    counts: { official: 1, awaitingApproval: 1, voidedOrRejected: 0, recommendedTransfers: 2 },
    history: [{ id: 's1', txnNumber: 'TXN-000009', transactionDate: '2026-05-03', status: 'approved', payer: { id: 'f2', name: 'Bilal' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 100_000, method: 'UPI', counted: true },
      { id: 's2', txnNumber: 'TXN-000010', transactionDate: '2026-05-04', status: 'pending_approval', payer: { id: 'f3', name: 'Chen' }, receiver: { id: 'f1', name: 'Asha' }, amountMinor: 5_000, method: null, counted: false }] };

  it('lists who pays whom with amounts, a summary and the history', async () => {
    mockFetch({ ...me, 'GET /settlements/recommendations': { status: 200, body: { ...rec, currency } }, 'GET /settlements/summary': { status: 200, body: { ...summary, currency } } });
    renderApp('/settlements');
    const list = await screen.findByRole('list', { name: 'Recommended payments' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Bilal.*pays.*Asha.*6,667\.00/);
    expect(items[1]).toHaveTextContent(/Chen.*pays.*Asha.*11,666\.00/);
    expect(screen.getByText('Payments needed').nextSibling).toHaveTextContent('2');
    expect(screen.getByText(/1 settlement is waiting for approval/)).toBeInTheDocument();
    expect(screen.getByText(/UPI/)).toBeInTheDocument();
    expect(screen.getByText(/TXN-000010.*not counted/)).toBeInTheDocument();
  });
  it('everyone settled -> clear message, no list', async () => {
    mockFetch({ ...me, 'GET /settlements/recommendations': { status: 200, body: { ...rec, recommendations: [] } }, 'GET /settlements/summary': { status: 200, body: { ...summary, history: [], counts: { official: 0, awaitingApproval: 0, voidedOrRejected: 0, recommendedTransfers: 0 } } } });
    renderApp('/settlements');
    expect(await screen.findByText('Everyone is settled. No payments needed.')).toBeInTheDocument();
    expect(screen.getByText('No settlements recorded yet.')).toBeInTheDocument();
  });
});

const sources = import.meta.glob('./*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('G. no financial arithmetic exists in the client', () => {
  it('financial views contain no arithmetic on *Minor values (they only format what the server returns)', () => {
    const files = Object.keys(sources).filter((f) => !f.includes('.test.')).sort();
    expect(files).toEqual(['./FounderLedgerPage.tsx', './FoundersPage.tsx', './SettlementsPage.tsx', './parts.tsx']);
    for (const f of files) {
      const src = sources[f]!.replace(/\/\/.*$/gm, '');
      const bad = src.match(/Minor\b\s*[-+*/%]\s*[\w.(]|[\w)]\s*[-+*/%]\s*[\w.]*Minor\b/g);
      expect(bad, `${f}: ${bad?.join(' | ')}`).toBeNull();
      expect(src).not.toMatch(/\.reduce\(|Math\.(round|floor|ceil)\(/); // no summing/rounding of figures in the UI
    }
  });
  it('sanity: the fixture founders match the app fixtures', () => expect(foundersFixture.map((f) => f.id)).toEqual(['f1', 'f2', 'f3']));
});
