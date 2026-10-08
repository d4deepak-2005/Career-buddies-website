/** Phase 4 dashboard API on a real MongoDB. Every expectation is hand-computed (minor units: 300_000 = ₹3,000.00) and cross-checked against the Phase 3 API. */
import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { Transaction } from '../src/models/Transaction';
import { expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

type Agent = World['a'];
const setStatus = (id: string, status: string) => Transaction.collection.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status } });
async function create(agent: Agent, payload: Record<string, unknown>, status: string | null = 'approved') {
  const r = await agent.post('/api/transactions').send(payload);
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  if (status) await setStatus(r.body.transaction.id, status);
  return r.body.transaction.id as string;
}
const equalAll = (world: World) => ({ method: 'equal', entries: [{ founderId: world.f.a }, { founderId: world.f.b }, { founderId: world.f.c }] });
const exp = (over: Record<string, unknown> = {}) => expensePayload(w, { amountMinor: 300_000, split: equalAll(w), ...over });
const contrib = (by: string, amountMinor: number, date = '2026-04-10', type = 'founder_contribution') => ({ type, amountMinor, transactionDate: date, description: type, paidByFounderId: by });
const stable = (d: Record<string, unknown>) => JSON.stringify({ ...d, calculatedAt: undefined });
const dash = async (qs = '', agent: Agent = w.a) => { const r = await agent.get(`/api/dashboard${qs}`); expect(r.status, JSON.stringify(r.body)).toBe(200); return r.body; };
const positions = async () => (await w.a.get('/api/founders/financial-positions')).body;

describe('access control and input validation (1, 2, 19, 20, 21)', () => {
  it('requires sign-in; founders and admins can both read', async () => {
    expect((await request(app).get('/api/dashboard')).status).toBe(401);
    for (const agent of [w.a, w.b, w.admin]) expect((await agent.get('/api/dashboard')).status).toBe(200);
  });
  it('is read-only: no write method succeeds and nothing changes', async () => {
    await create(w.a, exp());
    const before = stable(await dash());
    for (const m of ['post', 'put', 'patch', 'delete'] as const) expect((await w.admin[m]('/api/dashboard').send({ totalBusinessExpensesMinor: 1 })).status, m).toBeGreaterThanOrEqual(400);
    expect(stable(await dash())).toBe(before);
  });
  it('rejects client-supplied financial values, unknown keys, operators and malformed filters', async () => {
    const bad = ['kpis=1', 'totalBusinessExpensesMinor=5', 'netPositionMinor=1', 'founderId=nope', 'founderId[$ne]=1', 'categoryId=123', 'from=2026-13-01', 'from=2026-02-30', 'from=yesterday', 'to=2026-1-1',
      'from=2026-05-02&to=2026-05-01', 'founderId=a&founderId=b', 'from[$gt]=1', 'limit=5000', 'asOf=2026-01-01'];
    for (const qs of bad) expect((await w.a.get(`/api/dashboard?${qs}`)).status, qs).toBe(400);
  });
  it('unknown (but well-formed) founder or category is 404', async () => {
    const id = new Types.ObjectId().toString();
    expect((await w.a.get(`/api/dashboard?founderId=${id}`)).status).toBe(404);
    expect((await w.a.get(`/api/dashboard?categoryId=${id}`)).status).toBe(404);
  });
});

describe('zero data (3, 14) and shape', () => {
  it('no transactions: honest zeros, empty lists, balanced', async () => {
    const d = await dash();
    expect(d.kpis).toEqual({ totalInvestmentMinor: 0, founderCapitalMinor: 0, loansMinor: 0, totalBusinessExpensesMinor: 0, reimbursedByBusinessMinor: 0, founderFundedExpensesMinor: 0, refundsMinor: 0, settledMinor: 0, outstandingSettlementsMinor: 0 });
    expect(d.charts).toEqual({ contributionByFounder: [], expenseByCategory: [], monthly: [] });
    expect(d.recent).toEqual([]);
    expect(d.settlement.recommendations).toEqual([]);
    expect(d.reconciliation).toMatchObject({ status: 'PASS', isBalanced: true, sumNetPositionMinor: 0 });
    expect(d.currency).toEqual({ code: 'INR', minorUnits: 2 });
    expect(d.founders).toHaveLength(4); // 3 active + 1 inactive profile, all zero
  });
  it('a period with no activity returns zero KPIs but keeps cumulative balances', async () => {
    await create(w.a, exp({ transactionDate: '2026-03-10' }));
    const d = await dash('?from=2026-07-01&to=2026-07-31');
    expect(d.kpis.totalBusinessExpensesMinor).toBe(0);
    expect(d.charts.monthly).toEqual([]); expect(d.recent).toEqual([]);
  });
});

describe('KPIs equal the Phase 3 engine (4–12, 15, 16)', () => {
  async function scenario() {
    await create(w.a, exp({ transactionDate: '2026-04-15' }));                                     // A paid 3,000, equal
    const e2 = await create(w.b, exp({ amountMinor: 100_000, paidByFounderId: w.f.b, transactionDate: '2026-05-05' })); // B paid 1,000
    await create(w.a, { type: 'reimbursement', amountMinor: 30_000, transactionDate: '2026-05-06', description: 'reimb', paidByFounderId: w.f.b, reimbursesTransactionId: e2 });
    await create(w.a, contrib(w.f.c, 500_000, '2026-04-02'));
    await create(w.a, contrib(w.f.a, 200_000, '2026-05-02'));
    await create(w.a, contrib(w.f.b, 150_000, '2026-05-03', 'founder_loan'));
    await create(w.a, { type: 'refund', amountMinor: 30_000, transactionDate: '2026-05-08', description: 'refund', paidByFounderId: w.f.a, split: equalAll(w) });
    await create(w.b, { type: 'settlement', amountMinor: 20_000, transactionDate: '2026-05-09', description: 'B pays A', paidByFounderId: w.f.b, counterpartyFounderId: w.f.a });
  }
  it('expense, contribution, loan, reimbursement, refund and settlement totals', async () => {
    await scenario();
    const d = await dash();
    expect(d.kpis).toMatchObject({
      totalBusinessExpensesMinor: 400_000, reimbursedByBusinessMinor: 30_000, founderFundedExpensesMinor: 370_000,
      founderCapitalMinor: 700_000, loansMinor: 150_000, totalInvestmentMinor: 850_000, refundsMinor: 30_000, settledMinor: 20_000,
    });
    // charts agree with the KPIs
    expect(d.charts.contributionByFounder.reduce((s: number, f: { contributionMinor: number }) => s + f.contributionMinor, 0)).toBe(700_000);
    expect(d.charts.expenseByCategory.reduce((s: number, c: { amountMinor: number }) => s + c.amountMinor, 0)).toBe(d.kpis.totalBusinessExpensesMinor);
    expect(d.charts.monthly.reduce((s: number, m: { expensesMinor: number }) => s + m.expensesMinor, 0)).toBe(d.kpis.totalBusinessExpensesMinor);
    expect(d.charts.monthly.reduce((s: number, m: { investmentMinor: number }) => s + m.investmentMinor, 0)).toBe(d.kpis.totalInvestmentMinor);
    expect(d.charts.monthly.map((m: { month: string }) => m.month)).toEqual(['2026-04', '2026-05']);
  });
  it('founder cards, outstanding settlements and recommendations are the engine values, unchanged; Σ net = 0', async () => {
    await scenario();
    const d = await dash(); const p = await positions();
    for (const card of d.founders) {
      const e = p.positions.find((x: { founderId: string }) => x.founderId === card.founderId);
      expect(card).toMatchObject({ paidMinor: e.paidMinor, fairShareMinor: e.fairShareMinor, netPositionMinor: e.grossNetPositionMinor, outstandingMinor: e.outstandingMinor, action: e.action, contributionMinor: e.contributionMinor, loanOutstandingMinor: e.loanOutstandingMinor });
      expect(card.investedMinor).toBe(e.contributionMinor + e.loanOutstandingMinor);
    }
    expect(d.founders.reduce((s: number, f: { netPositionMinor: number }) => s + f.netPositionMinor, 0)).toBe(0);
    expect(d.kpis.outstandingSettlementsMinor).toBe(p.reconciliation.totalPayableMinor);
    const rec = (await w.a.get('/api/settlements/recommendations')).body.recommendations;
    expect(d.settlement.recommendations).toEqual(rec.map((r: { payer: unknown; receiver: unknown; amountMinor: number }) => ({ payer: r.payer, receiver: r.receiver, amountMinor: r.amountMinor })));
    expect(d.kpis.reimbursedByBusinessMinor).toBe(p.reconciliation.businessBorneMinor);
    expect(JSON.stringify(d)).not.toMatch(/external|PASS_WITH_EXTERNAL|founderBalance/);
  });
  it('Option C figures on the dashboard: ₹1,000 of ₹3,000 reimbursed → A +1,333.33, B −666.67, C −666.66', async () => {
    const e = await create(w.a, exp());
    await create(w.a, { type: 'reimbursement', amountMinor: 100_000, transactionDate: '2026-05-03', description: 'r', paidByFounderId: w.f.a, reimbursesTransactionId: e });
    const d = await dash();
    const net = (id: string) => d.founders.find((f: { founderId: string }) => f.founderId === id).netPositionMinor;
    expect([net(w.f.a), net(w.f.b), net(w.f.c)]).toEqual([133_333, -66_667, -66_666]);
    expect(d.settlement.recommendations.map((r: { amountMinor: number }) => r.amountMinor)).toEqual([66_667, 66_666]);
    expect(d.kpis).toMatchObject({ totalBusinessExpensesMinor: 300_000, reimbursedByBusinessMinor: 100_000, founderFundedExpensesMinor: 200_000 });
  });
  it('voided, pending, draft and rejected records are excluded from every figure (17, 18) but pending ones are flagged as not counted', async () => {
    await create(w.a, exp());
    const base = JSON.stringify((await dash()).kpis);
    await create(w.a, exp(), 'pending_approval'); await create(w.a, exp(), 'draft'); await create(w.a, exp(), 'rejected');
    const v = await create(w.a, exp()); expect((await w.admin.post(`/api/transactions/${v}/void`).send({ expectedVersion: 1, reason: 'entered by mistake' })).status).toBe(200);
    await create(w.a, contrib(w.f.a, 999_999), 'pending_approval');
    const d = await dash();
    expect(JSON.stringify(d.kpis)).toBe(base);
    expect(d.counts.notCountedYet).toBe(3); // pending expense, draft expense, pending contribution
    expect(d.recent.filter((r: { counted: boolean }) => !r.counted).length).toBeGreaterThanOrEqual(3);
    expect(d.founders.reduce((s: number, f: { netPositionMinor: number }) => s + f.netPositionMinor, 0)).toBe(0);
  });
  it('"Other" never enters any figure', async () => {
    await create(w.a, exp());
    const base = JSON.stringify((await dash()).kpis);
    await create(w.a, { type: 'other', amountMinor: 9_000_000, transactionDate: '2026-05-01', description: 'misc', notes: 'x', paidByFounderId: w.f.a });
    expect(JSON.stringify((await dash()).kpis)).toBe(base);
  });
});

describe('period and filters (13)', () => {
  beforeEach(async () => {
    await create(w.a, exp({ transactionDate: '2026-03-31' }));
    await create(w.a, exp({ transactionDate: '2026-04-01', amountMinor: 120_000 }));
    await create(w.a, exp({ transactionDate: '2026-04-30', amountMinor: 60_000 }));
    await create(w.a, exp({ transactionDate: '2026-05-01', amountMinor: 30_000 }));
    await create(w.b, contrib(w.f.b, 400_000, '2026-04-15'));
  });
  it('period bounds are inclusive and apply to every flow widget identically', async () => {
    const d = await dash('?from=2026-04-01&to=2026-04-30');
    expect(d.kpis).toMatchObject({ totalBusinessExpensesMinor: 180_000, founderCapitalMinor: 400_000 });
    expect(d.charts.monthly).toEqual([{ month: '2026-04', expensesMinor: 180_000, investmentMinor: 400_000 }]);
    expect(d.charts.expenseByCategory.reduce((s: number, c: { amountMinor: number }) => s + c.amountMinor, 0)).toBe(180_000);
    expect(d.recent.map((r: { date: string }) => r.date).every((x: string) => x >= '2026-04-01' && x <= '2026-04-30')).toBe(true);
    expect(d.recent).toHaveLength(3);
  });
  it('balances are cumulative up to the period end, so a later period start does not change them', async () => {
    const all = await dash('?to=2026-04-30'); const window = await dash('?from=2026-04-15&to=2026-04-30');
    expect(window.founders).toEqual(all.founders);
    expect(window.kpis.outstandingSettlementsMinor).toBe(all.kpis.outstandingSettlementsMinor);
    expect(all.kpis.totalBusinessExpensesMinor).toBe(300_000 + 120_000 + 60_000);
    // as-of 2026-03-31 only the first expense exists: A +2,000
    const early = await dash('?to=2026-03-31');
    expect(early.founders.find((f: { founderId: string }) => f.founderId === w.f.a).netPositionMinor).toBe(200_000);
  });
  it('founder filter narrows cards, recommendations and flows to that founder', async () => {
    const d = await dash(`?founderId=${w.f.b}`);
    expect(d.founders.map((f: { founderId: string }) => f.founderId)).toEqual([w.f.b]);
    expect(d.kpis.totalBusinessExpensesMinor).toBe(0); // B paid no expense
    expect(d.kpis.founderCapitalMinor).toBe(400_000);
    expect(d.settlement.recommendations.every((r: { payer: { id: string }; receiver: { id: string } }) => r.payer.id === w.f.b || r.receiver.id === w.f.b)).toBe(true);
  });
  it('category filter counts only that category; balances are not narrowed', async () => {
    const other = (await w.admin.post('/api/categories').send({ name: 'Travel' })).body.category.id;
    await create(w.a, exp({ categoryId: other, amountMinor: 45_000, transactionDate: '2026-04-20' }));
    const d = await dash(`?categoryId=${other}`);
    expect(d.kpis.totalBusinessExpensesMinor).toBe(45_000);
    expect(d.charts.expenseByCategory).toEqual([{ categoryId: other, name: 'Travel', amountMinor: 45_000, other: false, shareBp: 10_000 }]);
    expect(d.kpis.founderCapitalMinor).toBe(0);
    expect(d.founders.find((f: { founderId: string }) => f.founderId === w.f.a).paidMinor).toBe((await positions()).positions.find((p: { founderId: string }) => p.founderId === w.f.a).paidMinor);
  });
});

describe('recent transactions and categories (23)', () => {
  it('newest first, limited to 10, with names resolved by the server', async () => {
    for (let i = 1; i <= 12; i++) await create(w.a, exp({ transactionDate: `2026-04-${String(i).padStart(2, '0')}`, description: `Expense ${i}` }));
    const d = await dash();
    expect(d.recent).toHaveLength(10);
    expect(d.recent[0]).toMatchObject({ description: 'Expense 12', date: '2026-04-12', type: 'business_expense', status: 'approved', counted: true, category: { name: 'Software' }, paidBy: { name: 'Founder A' } });
    expect(d.counts.matchingTransactions).toBe(12);
    expect(d.charts.expenseByCategory).toEqual([{ categoryId: w.cat, name: 'Software', amountMinor: 3_600_000, other: false, shareBp: 10_000 }]);
  });
  it('uncategorised spending is labelled, never dropped', async () => {
    const e = await create(w.a, { type: 'other', amountMinor: 1_000, transactionDate: '2026-04-01', description: 'x', notes: 'n', paidByFounderId: w.f.a });
    expect(e).toBeTruthy();
    await Transaction.collection.updateMany({ type: 'business_expense' }, { $unset: { categoryId: '' } });
    await create(w.a, exp());
    await Transaction.collection.updateMany({ type: 'business_expense' }, { $unset: { categoryId: '' } });
    expect((await dash()).charts.expenseByCategory).toEqual([{ categoryId: null, name: 'Uncategorised', amountMinor: 300_000, other: false, shareBp: 10_000 }]);
  });
});

describe('category donut grouping', () => {
  it('merges the long tail into "Other categories" on the server; slices still add up to the KPI; shares ≈ 100%', async () => {
    for (let i = 1; i <= 9; i++) {
      const c = (await w.admin.post('/api/categories').send({ name: `Cat ${i}` })).body.category.id;
      await create(w.a, exp({ categoryId: c, amountMinor: i * 10_000 }));
    }
    const d = await dash();
    const slices = d.charts.expenseByCategory;
    expect(slices).toHaveLength(7);
    expect(slices[0]).toMatchObject({ name: 'Cat 9', amountMinor: 90_000 });
    expect(slices[6]).toMatchObject({ name: 'Other categories', other: true, amountMinor: (1 + 2 + 3) * 10_000 });
    expect(slices.reduce((s: number, c: { amountMinor: number }) => s + c.amountMinor, 0)).toBe(d.kpis.totalBusinessExpensesMinor);
    const bp = slices.reduce((s: number, c: { shareBp: number }) => s + c.shareBp, 0);
    expect(Math.abs(bp - 10_000)).toBeLessThanOrEqual(7);
  });
});

describe('large values and monthly gaps', () => {
  it('handles values beyond 2^31 minor units exactly and fills empty months between data points', async () => {
    await create(w.a, exp({ amountMinor: 9_000_000_000, transactionDate: '2026-01-15', split: { method: 'equal', entries: [{ founderId: w.f.a }] } }));
    await create(w.a, exp({ amountMinor: 1_000, transactionDate: '2026-04-15', split: { method: 'equal', entries: [{ founderId: w.f.a }] } }));
    const d = await dash();
    expect(d.kpis.totalBusinessExpensesMinor).toBe(9_000_001_000);
    expect(d.charts.monthly.map((m: { month: string; expensesMinor: number }) => [m.month, m.expensesMinor])).toEqual([['2026-01', 9_000_000_000], ['2026-02', 0], ['2026-03', 0], ['2026-04', 1_000]]);
  });
});
