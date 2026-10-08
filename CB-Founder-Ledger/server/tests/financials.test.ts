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

/** Phase 5 owns approval; tests flip the status with a raw write. Authorization is not weakened. */
const approve = (id: string) => Transaction.collection.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: 'approved' } });
type Agent = World['a'];
async function create(agent: Agent, payload: Record<string, unknown>, official = true) {
  const r = await agent.post('/api/transactions').send(payload);
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  if (official) await approve(r.body.transaction.id);
  return r.body.transaction as { id: string; version: number };
}
const equalAll = (world: World) => ({ method: 'equal', entries: [{ founderId: world.f.a }, { founderId: world.f.b }, { founderId: world.f.c }] });
const settle = (_w: World, from: string, to: string, amountMinor: number, extra = {}) => ({ type: 'settlement', amountMinor, transactionDate: '2026-05-01', description: 'Settle up', paidByFounderId: from, counterpartyFounderId: to, ...extra });
const positions = async (agent: Agent = w.a) => (await agent.get('/api/founders/financial-positions')).body;
const pos = (body: { positions: Array<{ founderId: string }> }, id: string) => body.positions.find((p) => p.founderId === id) as Record<string, number | string>;

describe('authentication and authorization', () => {
  it('every financial endpoint requires sign-in', async () => {
    for (const path of ['/api/founders/financial-positions', `/api/founders/${w.f.a}/financial-position`, '/api/settlements/recommendations', '/api/settlements/summary']) {
      const r = await request(app).get(path);
      expect(r.status, path).toBe(401);
    }
  });
  it('founders and admins can both read', async () => {
    for (const agent of [w.a, w.b, w.admin]) {
      expect((await agent.get('/api/founders/financial-positions')).status).toBe(200);
      expect((await agent.get('/api/settlements/recommendations')).status).toBe(200);
      expect((await agent.get('/api/settlements/summary')).status).toBe(200);
      expect((await agent.get(`/api/founders/${w.f.a}/financial-position`)).status).toBe(200);
    }
  });
  it('there is no way to submit financial values: nothing succeeds, nothing changes', async () => {
    await create(w.a, expensePayload(w, { split: equalAll(w) }));
    const before = JSON.stringify((await positions()).positions);
    for (const agent of [w.a, w.admin]) {
      for (const method of ['post', 'put', 'patch', 'delete'] as const) {
        for (const path of ['/api/founders/financial-positions', '/api/settlements/recommendations', '/api/settlements/summary', `/api/founders/${w.f.a}/financial-position`]) {
          const r = await agent[method](path).send({ netPositionMinor: 1, fairShareMinor: 1, outstandingMinor: 1, amountMinor: 1 });
          expect(r.status, `${method} ${path}`).toBeGreaterThanOrEqual(400); // never a success
        }
      }
    }
    expect(JSON.stringify((await positions()).positions)).toBe(before);
    // client-supplied financial figures in the existing founder endpoints are rejected by the strict schema
    for (const extra of [{ netPositionMinor: 99 }, { fairShareMinor: 99 }, { paidMinor: 99 }, { outstandingMinor: 99 }]) {
      expect((await w.admin.post('/api/founders').send({ name: 'X', ...extra })).status).toBe(400);
      expect((await w.admin.patch(`/api/founders/${w.f.a}`).send(extra)).status).toBe(400);
    }
    for (const qs of ['netPositionMinor=5', 'founderId=x', 'fairShareMinor=1', 'asOf=2026-01-01', 'a[$ne]=1']) {
      for (const path of ['/api/founders/financial-positions', '/api/settlements/recommendations', '/api/settlements/summary', `/api/founders/${w.f.a}/financial-position`]) {
        expect((await w.a.get(`${path}?${qs}`)).status, `${path}?${qs}`).toBe(400);
      }
    }
  });
  it('invalid or unknown founder ids', async () => {
    for (const id of ['nope', '123', '{"$ne":1}', 'zzzzzzzzzzzzzzzzzzzzzzzz']) expect((await w.a.get(`/api/founders/${encodeURIComponent(id)}/financial-position`)).status, id).toBe(400);
    const r = await w.a.get('/api/founders/64b7f0f0f0f0f0f0f0f0f0f0/financial-position');
    expect(r.status).toBe(404);
    // the Phase 1 founder routes still work next to the new ones
    expect((await w.a.get(`/api/founders/${w.f.a}`)).status).toBe(200);
    expect((await w.a.get('/api/founders')).body.founders).toHaveLength(4);
  });
});

describe('no data and official-record rules', () => {
  it('no transactions: every founder is zero / settled and nothing is recommended', async () => {
    const b = await positions();
    expect(b.positions).toHaveLength(4); // 3 active + 1 inactive profile
    for (const p of b.positions) expect(p).toMatchObject({ paidMinor: 0, fairShareMinor: 0, grossNetPositionMinor: 0, outstandingMinor: 0, action: 'settled' });
    expect(b.reconciliation).toMatchObject({ isBalanced: true, externalMinor: 0, status: 'PASS' });
    expect((await w.a.get('/api/settlements/recommendations')).body.recommendations).toEqual([]);
    expect(b.currency).toEqual({ code: 'INR', minorUnits: 2 });
  });

  it('draft / pending / (raw) rejected / voided do not count; approved does', async () => {
    const p = expensePayload(w, { split: equalAll(w) });
    await create(w.a, p, false);                                  // pending
    await create(w.a, { ...p, status: 'draft' }, false);          // draft
    const rej = await create(w.a, p, false);
    await Transaction.collection.updateOne({ _id: new Types.ObjectId(rej.id) }, { $set: { status: 'rejected' } }); // Phase 5 would do this
    const voided = await create(w.a, p);
    expect((await w.admin.post(`/api/transactions/${voided.id}/void`).send({ expectedVersion: 1, reason: 'entered by mistake' })).status).toBe(200);
    const before = await positions();
    expect(before.reconciliation.totalFairShareMinor).toBe(0);
    expect(before.excluded.byStatus).toEqual({ pending_approval: 1, draft: 1, rejected: 1, voided: 1 });

    await create(w.a, p); // approved
    const after = await positions();
    expect(after.reconciliation).toMatchObject({ totalFairShareMinor: 3_000_000, totalPaidMinor: 3_000_000 });
    expect(pos(after, w.f.a)).toMatchObject({ paidMinor: 3_000_000, fairShareMinor: 1_000_000, grossNetPositionMinor: 2_000_000, action: 'receive' });
  });

  it('other-type, and legacy invalid official records are excluded with warnings, never guessed', async () => {
    await create(w.a, expensePayload(w, { split: equalAll(w) }));
    await create(w.a, { type: 'other', amountMinor: 777, transactionDate: '2026-05-01', description: 'misc', notes: 'agreed', paidByFounderId: w.f.a });
    // a legacy approved refund saved before Phase 3 required a split (inserted raw)
    await Transaction.collection.insertOne({
      txnNumber: 'TXN-LEGACY', type: 'refund', amountMinor: 500, transactionDate: new Date('2026-05-02'), description: 'legacy refund', status: 'approved',
      paidByFounderId: new Types.ObjectId(w.f.a), receiptCount: 0, version: 1, createdBy: w.adminUser._id, updatedBy: w.adminUser._id, createdAt: new Date(), updatedAt: new Date(),
    });
    const b = await positions();
    expect(b.excluded).toMatchObject({ unclassifiedOther: 1, invalid: 1 });
    expect(b.warnings.filter((x: { level: string }) => x.level === 'warning')).toEqual([expect.objectContaining({ code: 'MISSING_SPLIT' })]);
    expect(b.warnings.filter((x: { level: string }) => x.level === 'info')).toEqual([expect.objectContaining({ code: 'OTHER_NOT_CALCULATED' })]);
    expect(b.reconciliation.totalFairShareMinor).toBe(3_000_000); // unchanged by the excluded records
    await Transaction.collection.deleteOne({ txnNumber: 'TXN-LEGACY' });
  });
});

describe('multiple transactions and the three-founder example', () => {
  it('equal expense: payer receives, the others pay; recommendations clear it exactly', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 3_000_000, split: equalAll(w) }));
    const b = await positions();
    expect(b.positions.filter((p: { active: boolean }) => p.active).map((p: Record<string, number | string>) => [p.founderName, p.paidMinor, p.fairShareMinor, p.grossNetPositionMinor, p.action]))
      .toEqual([['Founder A', 3_000_000, 1_000_000, 2_000_000, 'receive'], ['Founder B', 0, 1_000_000, -1_000_000, 'pay'], ['Founder C', 0, 1_000_000, -1_000_000, 'pay']]);
    const rec = (await w.b.get('/api/settlements/recommendations')).body;
    expect(rec.recommendations.map((r: { payer: { name: string }; receiver: { name: string }; amountMinor: number }) => `${r.payer.name}->${r.receiver.name}:${r.amountMinor}`)).toEqual(['Founder B->Founder A:1000000', 'Founder C->Founder A:1000000']);
    expect(rec.reconciliation).toMatchObject({ totalPayableMinor: 2_000_000, totalReceivableMinor: 2_000_000, recommendedTotalMinor: 2_000_000, isBalanced: true });
  });

  it('mixes types, splits, categories and dates; contribution and loan stay out of fair share', async () => {
    const other = await w.admin.post('/api/categories').send({ name: 'Travel' });
    await create(w.a, expensePayload(w, { amountMinor: 1_000_000, transactionDate: '2026-01-10', split: { method: 'percentage', entries: [{ founderId: w.f.a, percent: 50 }, { founderId: w.f.b, percent: 30 }, { founderId: w.f.c, percent: 20 }] } }));
    await create(w.b, expensePayload(w, { amountMinor: 600_000, transactionDate: '2026-03-10', categoryId: other.body.category.id, paidByFounderId: w.f.b, split: { method: 'shares', entries: [{ founderId: w.f.a, shares: 2 }, { founderId: w.f.b, shares: 1 }, { founderId: w.f.c, shares: 3 }] } }));
    await create(w.a, { type: 'founder_contribution', amountMinor: 5_000_000, transactionDate: '2026-02-01', description: 'capital', paidByFounderId: w.f.c });
    await create(w.a, { type: 'founder_loan', amountMinor: 2_500_000, transactionDate: '2026-02-02', description: 'loan', paidByFounderId: w.f.c });
    const b = await positions();
    expect(pos(b, w.f.a)).toMatchObject({ paidMinor: 1_000_000, fairShareMinor: 500_000 + 200_000, grossNetPositionMinor: 300_000 });
    expect(pos(b, w.f.b)).toMatchObject({ paidMinor: 600_000, fairShareMinor: 300_000 + 100_000 });
    expect(pos(b, w.f.c)).toMatchObject({ paidMinor: 0, fairShareMinor: 200_000 + 300_000, contributionMinor: 5_000_000, loanOutstandingMinor: 2_500_000, grossNetPositionMinor: -500_000 });
    expect(b.reconciliation).toMatchObject({ totalPaidMinor: 1_600_000, totalFairShareMinor: 1_600_000, externalMinor: 0, status: 'PASS', isBalanced: true });
  });

  it('reimbursement and refund through the API do not double count', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 3_000, split: equalAll(w) }));
    await create(w.a, { type: 'reimbursement', amountMinor: 3_000, transactionDate: '2026-05-03', description: 'reimburse A', paidByFounderId: w.f.a });
    let b = await positions();
    expect(b.reconciliation).toMatchObject({ totalFairShareMinor: 3_000, externalMinor: 3_000, sumGrossNetPositionMinor: -3_000, status: 'PASS_WITH_EXTERNAL', isBalanced: true });
    expect(pos(b, w.f.a)).toMatchObject({ expensePaidMinor: 3_000, reimbursedMinor: 3_000, paidMinor: 0 });
    expect((await w.a.get('/api/settlements/recommendations')).body).toMatchObject({ recommendations: [], unresolvedPayableMinor: 0, reconciliation: { externalMinor: 3_000 } });
    expect(b.positions.every((p: { action: string }) => p.action === 'settled')).toBe(true);

    await create(w.a, { type: 'refund', amountMinor: 900, transactionDate: '2026-05-04', description: 'vendor refund', paidByFounderId: w.f.b, split: equalAll(w) });
    b = await positions();
    expect(b.reconciliation.totalFairShareMinor).toBe(2_100);
    expect(pos(b, w.f.b)).toMatchObject({ refundReceivedMinor: 900, paidMinor: -900, fairShareMinor: 700 });
  });
});

describe('external (business-funded) amount over the API', () => {
  const reimburse = (to: string, amountMinor: number) => ({ type: 'reimbursement', amountMinor, transactionDate: '2026-05-03', description: 'reimburse', paidByFounderId: to });

  it('partial reimbursement: founders are treated symmetrically and the external amount is explicit', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 3_000, split: equalAll(w) }));
    await create(w.a, reimburse(w.f.a, 1_000));
    const b = await positions();
    expect(b.positions.slice(0, 3).map((p: Record<string, number>) => [p.grossNetPositionMinor, p.businessFundedShareMinor, p.founderBalanceMinor])).toEqual([[1_000, 334, 1_334], [-1_000, 333, -667], [-1_000, 333, -667]]);
    expect(b.reconciliation).toMatchObject({ status: 'PASS_WITH_EXTERNAL', externalMinor: 1_000, sumGrossNetPositionMinor: -1_000, founderBalanceSumMinor: 0, isBalanced: true });
    expect(b.reconciliation.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
    const rec = (await w.b.get('/api/settlements/recommendations')).body;
    expect(rec.recommendations.map((r: { payer: { name: string }; amountMinor: number }) => [r.payer.name, r.amountMinor])).toEqual([['Founder B', 667], ['Founder C', 667]]);
    expect(rec.reconciliation.recommendedTotalMinor).toBe(1_334); // founder-to-founder only; the external 1,000 is not in it
    const sum = (await w.a.get('/api/settlements/summary')).body;
    expect(sum.totals).toMatchObject({ externalMinor: 1_000, outstandingPayableMinor: 1_334, outstandingReceivableMinor: 1_334 });
  });

  it('over-settlement is surfaced through the API, not hidden', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 3_000, split: equalAll(w) }));
    await create(w.b, settle(w, w.f.b, w.f.a, 1_500));
    const b = await positions();
    expect(pos(b, w.f.b)).toMatchObject({ outstandingMinor: 500, overSettledMinor: 500 });
    expect(b.warnings).toEqual([expect.objectContaining({ code: 'OVER_SETTLED', level: 'warning', founderId: w.f.b })]);
    expect(b.reconciliation.status).toBe('REVIEW');
    const ledger = (await w.a.get(`/api/founders/${w.f.b}/financial-position`)).body;
    expect(ledger.position.overSettledMinor).toBe(500);
    expect(ledger.warnings).toHaveLength(1);
  });

  it('"Other" is reported as an info diagnostic only and never enters totals', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 3_000, split: equalAll(w) }));
    await create(w.a, { type: 'other', amountMinor: 9_000_000, transactionDate: '2026-05-01', description: 'misc', notes: 'unclear', paidByFounderId: w.f.a });
    const b = await positions();
    expect(b.reconciliation).toMatchObject({ status: 'PASS', totalPaidMinor: 3_000, totalFairShareMinor: 3_000 });
    expect(b.excluded.unclassifiedOther).toBe(1);
    expect(b.warnings).toEqual([expect.objectContaining({ code: 'OTHER_NOT_CALCULATED', level: 'info' })]);
  });
});

describe('changes are reflected immediately', () => {
  it('editing a pending transaction, then it becoming official, uses the NEW amount', async () => {
    const t = await create(w.a, expensePayload(w, { amountMinor: 3_000_000, split: equalAll(w) }), false);
    expect((await positions()).reconciliation.totalFairShareMinor).toBe(0); // pending: not official
    const edited = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, amountMinor: 4_500_000 });
    expect(edited.status).toBe(200);
    await approve(t.id);
    const b = await positions();
    expect(b.positions.slice(0, 3).map((p: Record<string, number>) => p.fairShareMinor)).toEqual([1_500_000, 1_500_000, 1_500_000]);
    expect(pos(b, w.f.a).grossNetPositionMinor).toBe(3_000_000);
  });

  it('amount of an official record changed at the data layer is picked up on the next request (no cache)', async () => {
    const t = await create(w.a, expensePayload(w, { amountMinor: 3_000_000, split: equalAll(w) }));
    expect(pos(await positions(), w.f.b).fairShareMinor).toBe(1_000_000);
    await Transaction.collection.updateOne({ _id: new Types.ObjectId(t.id) }, { $set: { amountMinor: 6_000_000, 'split.entries.0.allocatedMinor': 2_000_000, 'split.entries.1.allocatedMinor': 2_000_000, 'split.entries.2.allocatedMinor': 2_000_000 } });
    expect(pos(await positions(), w.f.b).fairShareMinor).toBe(2_000_000);
  });

  it('voiding (with the right version) is reflected in positions and recommendations', async () => {
    const t = await create(w.a, expensePayload(w, { split: equalAll(w) }));
    const v = (await w.admin.get(`/api/transactions/${t.id}`)).body.transaction.version;
    expect((await w.admin.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: v, reason: 'duplicate of another entry' })).status).toBe(200);
    const b = await positions();
    expect(b.reconciliation.totalFairShareMinor).toBe(0);
    expect(pos(b, w.f.a).action).toBe('settled');
    expect((await w.a.get('/api/settlements/recommendations')).body.recommendations).toEqual([]);
  });

  it('a recorded settlement reduces the outstanding amount; pending settlements do not count until official', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 3_000_000, split: equalAll(w) }));
    const pending = await create(w.b, settle(w, w.f.b, w.f.a, 1_000_000, { method: 'UPI' }), false);
    expect(pos(await positions(), w.f.b).outstandingMinor).toBe(-1_000_000);
    await approve(pending.id);
    const b = await positions();
    expect(pos(b, w.f.b)).toMatchObject({ settledPaidMinor: 1_000_000, outstandingMinor: 0, action: 'settled', settlementStatus: 'settled', paidMinor: 0, fairShareMinor: 1_000_000 });
    expect(pos(b, w.f.a)).toMatchObject({ settledReceivedMinor: 1_000_000, outstandingMinor: 1_000_000 });
    expect(b.reconciliation.totalFairShareMinor).toBe(3_000_000); // settlement did not become an expense
    const rec = (await w.a.get('/api/settlements/recommendations')).body.recommendations;
    expect(rec).toHaveLength(1);
    expect(rec[0]).toMatchObject({ payer: { name: 'Founder C' }, receiver: { name: 'Founder A' }, amountMinor: 1_000_000 });

    const sum = (await w.a.get('/api/settlements/summary')).body;
    expect(sum.totals).toMatchObject({ settledMinor: 1_000_000, outstandingPayableMinor: 1_000_000, outstandingReceivableMinor: 1_000_000 });
    expect(sum.counts).toMatchObject({ official: 1, awaitingApproval: 0, recommendedTransfers: 1 });
    expect(sum.history[0]).toMatchObject({ payer: { name: 'Founder B' }, receiver: { name: 'Founder A' }, amountMinor: 1_000_000, method: 'UPI', status: 'approved', counted: true });
  });
});

describe('founder ledger', () => {
  it('returns the position plus complete history (all statuses) with counted flags and effects', async () => {
    const e = await create(w.a, expensePayload(w, { amountMinor: 3_000, split: equalAll(w) }));
    await create(w.b, { type: 'founder_contribution', amountMinor: 900, transactionDate: '2026-02-01', description: 'pending capital', paidByFounderId: w.f.b }, false);
    const r = await w.a.get(`/api/founders/${w.f.b}/financial-position`);
    expect(r.status).toBe(200);
    expect(r.body.position).toMatchObject({ founderName: 'Founder B', fairShareMinor: 1_000, paidMinor: 0, contributionMinor: 0, outstandingPayableMinor: 1_000, action: 'pay' });
    expect(r.body.history).toHaveLength(2);
    const counted = r.body.history.find((h: { id: string }) => h.id === e.id);
    expect(counted).toMatchObject({ counted: true, effects: [{ kind: 'expense_share', amountMinor: 1_000 }] });
    expect(r.body.history.find((h: { description: string }) => h.description === 'pending capital')).toMatchObject({ counted: false, status: 'pending_approval', effects: [] });
    // someone uninvolved sees an empty history but a valid, zeroed position
    const d = await w.a.get(`/api/founders/${w.f.inactive}/financial-position`);
    expect(d.body.history).toEqual([]);
    expect(d.body.position.active).toBe(false);
  });
});

describe('invariants against the live API (A-F)', () => {
  it('sum of net = 0, payable = receivable, recommendations within limits, allocations reconcile', async () => {
    await create(w.a, expensePayload(w, { amountMinor: 1_000_001, split: equalAll(w) }));
    await create(w.b, expensePayload(w, { amountMinor: 777, paidByFounderId: w.f.b, split: { method: 'percentage', entries: [{ founderId: w.f.a, percent: 33.33 }, { founderId: w.f.c, percent: 66.67 }] } }));
    await create(w.a, settle(w, w.f.c, w.f.a, 12_345));
    const b = await positions();
    const sum = (k: string) => b.positions.reduce((s: number, p: Record<string, number>) => s + p[k]!, 0);
    expect(sum('grossNetPositionMinor')).toBe(0);                                                 // A
    expect(sum('outstandingMinor')).toBe(0);
    expect(b.reconciliation.totalPayableMinor).toBe(b.reconciliation.totalReceivableMinor);       // B
    const rec = (await w.a.get('/api/settlements/recommendations')).body;
    const out = new Map<string, number>(), inn = new Map<string, number>();
    for (const t of rec.recommendations) { out.set(t.payer.id, (out.get(t.payer.id) ?? 0) + t.amountMinor); inn.set(t.receiver.id, (inn.get(t.receiver.id) ?? 0) + t.amountMinor); }
    for (const p of b.positions) {
      expect(out.get(p.founderId) ?? 0).toBeLessThanOrEqual(p.outstandingPayableMinor);          // C
      expect(inn.get(p.founderId) ?? 0).toBeLessThanOrEqual(p.outstandingReceivableMinor);        // D
    }
    const approvedExpenses = await Transaction.aggregate([{ $match: { status: 'approved', type: 'business_expense' } }, { $group: { _id: null, t: { $sum: '$amountMinor' } } }]);
    expect(b.reconciliation.totalFairShareMinor).toBe(approvedExpenses[0].t);                      // E (independent DB sum)
    expect(b.reconciliation.totalPaidMinor).toBe(approvedExpenses[0].t);
  });
});
