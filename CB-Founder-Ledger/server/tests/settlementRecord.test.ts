/** Guided settlement recording, idempotent creates, and one mutation reflected consistently on every screen. */
import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { AuditEvent } from '../src/models/AuditEvent';
import { Transaction } from '../src/models/Transaction';
import { expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

const equalAll = (world: World) => ({ method: 'equal', entries: [{ founderId: world.f.a }, { founderId: world.f.b }, { founderId: world.f.c }] });
async function expense(amountMinor = 300_000) {
  const r = await w.a.post('/api/transactions').send(expensePayload(w, { amountMinor, split: equalAll(w) }));
  await w.b.post(`/api/transactions/${r.body.transaction.id}/approve`).send({ expectedVersion: 1 });
  return r.body.transaction.id as string;
}
const body = (over: Record<string, unknown> = {}) => ({ payerFounderId: w.f.b, receiverFounderId: w.f.a, amountMinor: 100_000, transactionDate: '2026-05-04', method: 'UPI', ...over });
const record = (b: Record<string, unknown>, agent = w.b) => agent.post('/api/settlements/record').send(b);
const dash = async () => (await w.a.get('/api/dashboard')).body;

describe('POST /api/settlements/record', () => {
  it('a suggestion is not a payment: recording creates a PENDING settlement that changes no balance until approved', async () => {
    await expense();
    const before = await dash();
    expect(before.settlement.recommendations.map((r: { amountMinor: number }) => r.amountMinor)).toEqual([100_000, 100_000]);
    const r = await record(body());
    expect(r.status).toBe(201);
    expect(r.body.transaction).toMatchObject({ type: 'settlement', status: 'pending_approval', amountMinor: 100_000, method: 'UPI', paidBy: { name: 'Founder B' }, counterparty: { name: 'Founder A' } });
    expect((await dash()).settlement.recommendations).toEqual(before.settlement.recommendations);
    expect((await dash()).kpis.settledMinor).toBe(0);
    await w.a.post(`/api/transactions/${r.body.transaction.id}/approve`).send({ expectedVersion: 1 }); // the receiver confirms
    const after = await dash();
    expect(after.kpis.settledMinor).toBe(100_000);
    expect(after.settlement.recommendations).toHaveLength(1);
    expect(after.settlement.recommendations[0]).toMatchObject({ payer: { name: 'Founder C' }, receiver: { name: 'Founder A' }, amountMinor: 100_000 });
    expect(await AuditEvent.countDocuments({ action: 'SETTLEMENT_CREATED' })).toBe(1);
    expect(await AuditEvent.countDocuments({ action: 'SETTLEMENT_COMPLETED' })).toBe(1);
  });

  it('rejects self-settlement, unknown/inactive founders, non-positive amounts and unknown fields', async () => {
    await expense();
    for (const b of [body({ receiverFounderId: w.f.b }), body({ receiverFounderId: w.f.inactive }), body({ payerFounderId: new Types.ObjectId().toString() }), body({ amountMinor: 0 }), body({ amountMinor: 1.5 }), body({ transactionDate: '2026-13-01' }), { ...body(), status: 'approved' }, { ...body(), createdBy: 'x' }]) {
      expect((await record(b)).status, JSON.stringify(b)).toBe(400);
    }
    expect(await Transaction.countDocuments({ type: 'settlement' })).toBe(0);
  });

  it('cannot pay more than is still owed, counting payments already awaiting approval; reports the remaining amount', async () => {
    await expense();
    const over = await record(body({ amountMinor: 100_001 }));
    expect(over.status).toBe(400);
    expect(over.body.error.code).toBe('EXCEEDS_OUTSTANDING');
    expect(over.body.error.details[0].remainingMinor).toBe(100_000);
    expect((await record(body({ amountMinor: 60_000 }))).status).toBe(201);
    const second = await record(body({ amountMinor: 60_000, transactionDate: '2026-05-05' }));
    expect(second.status).toBe(400);
    expect(second.body.error.details[0].remainingMinor).toBe(40_000);
    expect((await record(body({ amountMinor: 40_000, transactionDate: '2026-05-05' }))).status).toBe(201);
    expect((await record(body({ amountMinor: 1, transactionDate: '2026-05-06' }))).body.error.code).toBe('EXCEEDS_OUTSTANDING');
    expect((await record(body({ payerFounderId: w.f.c, receiverFounderId: w.f.b, amountMinor: 1 }))).status).toBe(400); // B is owed nothing
  });

  it('prevents duplicates: an identical pending settlement is a 409; a retry with the same request id is idempotent', async () => {
    await expense();
    const first = await record(body({ amountMinor: 30_000 }));
    expect(first.status).toBe(201);
    const dup = await record(body({ amountMinor: 30_000 }));
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_SETTLEMENT');
    const withId = body({ amountMinor: 20_000, clientRequestId: 'req-settle-0001' });
    const [x, y] = await Promise.all([record(withId), record(withId)]);
    expect([x.status, y.status].every((s) => s === 200 || s === 201)).toBe(true);
    expect(x.body.transaction.id).toBe(y.body.transaction.id);
    expect(await Transaction.countDocuments({ type: 'settlement' })).toBe(2);
  });

  it('requires sign-in; reverse = void (admin only) restores the suggestion; voiding never deletes', async () => {
    await expense();
    expect((await w.admin.post('/api/settlements/record').send(body())).status).toBe(201);
    const t = await Transaction.findOne({ type: 'settlement' }).lean();
    await w.a.post(`/api/transactions/${t!._id}/approve`).send({ expectedVersion: 1 });
    expect((await dash()).kpis.settledMinor).toBe(100_000);
    expect((await w.a.post(`/api/transactions/${t!._id}/void`).send({ expectedVersion: 2, reason: 'wrong person paid' })).status).toBe(403);
    expect((await w.admin.post(`/api/transactions/${t!._id}/void`).send({ expectedVersion: 2, reason: 'wrong person paid' })).status).toBe(200);
    const d = await dash();
    expect(d.kpis.settledMinor).toBe(0);
    expect(d.settlement.recommendations.map((r: { amountMinor: number }) => r.amountMinor)).toEqual([100_000, 100_000]);
    expect(await Transaction.countDocuments({ type: 'settlement', status: 'voided' })).toBe(1);
    const supertest = (await import('supertest')).default;
    expect((await supertest(app).post('/api/settlements/record').send(body())).status).toBe(401);
  });
});

describe('idempotent create (double-click protection)', () => {
  it('the same clientRequestId creates one transaction, even when submitted concurrently; a different user cannot collide', async () => {
    const p = { ...expensePayload(w), clientRequestId: 'form-token-0001' };
    const rs = await Promise.all([1, 2, 3, 4].map(() => w.a.post('/api/transactions').send(p)));
    expect(rs.every((r) => r.status === 200 || r.status === 201)).toBe(true);
    expect(new Set(rs.map((r) => r.body.transaction.id)).size).toBe(1);
    expect(await Transaction.countDocuments({})).toBe(1);
    expect(rs.filter((r) => r.status === 201).length).toBe(1);
    expect(rs.filter((r) => r.body.replayed).length).toBe(3);
    expect((await w.b.post('/api/transactions').send(p)).status).toBe(201); // ids are per creator
    expect((await w.a.post('/api/transactions').send({ ...p, clientRequestId: 'short' })).status).toBe(400);
  });

  it('a replayed reimbursement does not reserve capacity twice', async () => {
    const e = await expense();
    const p = { type: 'reimbursement', amountMinor: 100_000, transactionDate: '2026-05-03', description: 'back', paidByFounderId: w.f.a, reimbursesTransactionId: e, clientRequestId: 'reimb-token-0001' };
    await Promise.all([w.a.post('/api/transactions').send(p), w.a.post('/api/transactions').send(p), w.a.post('/api/transactions').send(p)]);
    expect(await Transaction.countDocuments({ type: 'reimbursement' })).toBe(1);
    expect((await Transaction.findById(e).lean())!.reimbursedMinor).toBe(100_000);
  });
});

describe('one mutation, every screen (dashboard = founder view = report = settlements)', () => {
  it('approving a ₹3,000 expense and a ₹1,000 reimbursement moves all four views identically', async () => {
    const e = (await w.a.post('/api/transactions').send(expensePayload(w, { amountMinor: 300_000, split: equalAll(w) }))).body.transaction;
    const views = async () => {
      const d = await dash();
      const pos = (await w.a.get('/api/founders/financial-positions')).body.positions;
      const ledger = (await w.a.get(`/api/founders/${w.f.a}/financial-position`)).body.position;
      const rep = (await w.a.get('/api/reports/summary')).body;
      const sum = (await w.a.get('/api/settlements/summary')).body;
      const csv = (await w.a.get('/api/reports/export?kind=summary')).text;
      return { d, pos, ledger, rep, sum, csv };
    };
    let v = await views();
    expect([v.d.kpis.totalBusinessExpensesMinor, v.rep.totals.totalExpensesMinor, v.sum.totals.outstandingPayableMinor]).toEqual([0, 0, 0]); // pending: nothing counts anywhere
    await w.b.post(`/api/transactions/${e.id}/approve`).send({ expectedVersion: 1 });
    const r = (await w.a.post('/api/transactions').send({ type: 'reimbursement', amountMinor: 100_000, transactionDate: '2026-05-03', description: 'r', paidByFounderId: w.f.a, reimbursesTransactionId: e.id })).body.transaction;
    await w.b.post(`/api/transactions/${r.id}/approve`).send({ expectedVersion: 1 });
    v = await views();
    const aCard = v.d.founders.find((f: { founderId: string }) => f.founderId === w.f.a);
    const aPos = v.pos.find((p: { founderId: string }) => p.founderId === w.f.a);
    const aRep = v.rep.founders.find((f: { founderId: string }) => f.founderId === w.f.a);
    expect([aCard.netPositionMinor, aPos.grossNetPositionMinor, v.ledger.grossNetPositionMinor, aRep.netPositionMinor]).toEqual([133_333, 133_333, 133_333, 133_333]);
    expect([aCard.fairShareMinor, aPos.fairShareMinor, v.ledger.fairShareMinor]).toEqual([66_667, 66_667, 66_667]);
    expect([v.d.kpis.totalBusinessExpensesMinor, v.rep.totals.totalExpensesMinor]).toEqual([300_000, 300_000]);
    expect([v.d.kpis.reimbursedByBusinessMinor, v.rep.totals.reimbursedByBusinessMinor, v.sum.totals.businessBorneMinor]).toEqual([100_000, 100_000, 100_000]);
    expect([v.d.kpis.outstandingSettlementsMinor, v.rep.totals.outstandingSettlementsMinor, v.sum.totals.outstandingPayableMinor]).toEqual([133_333, 133_333, 133_333]);
    expect(v.csv).toContain('Reimbursed by the business,1000.00');
    // voiding the reimbursement restores the founder-funded amount on every view
    await w.admin.post(`/api/transactions/${r.id}/void`).send({ expectedVersion: 2, reason: 'wrong expense chosen' });
    v = await views();
    expect([v.d.kpis.reimbursedByBusinessMinor, v.rep.totals.reimbursedByBusinessMinor, v.sum.totals.businessBorneMinor]).toEqual([0, 0, 0]);
    expect(v.d.founders.find((f: { founderId: string }) => f.founderId === w.f.a).netPositionMinor).toBe(200_000);
    expect(v.d.kpis.founderFundedExpensesMinor).toBe(300_000);
  });
});
