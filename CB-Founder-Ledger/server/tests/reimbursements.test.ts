/**
 * Option C — expense-linked reimbursement, end to end through the API on a real MongoDB.
 * Numbers are minor units: 300_000 = ₹3,000.00. Phase 5 owns approval, so tests flip the status with a raw write.
 */
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
const equalAll = (world: World) => ({ method: 'equal', entries: [{ founderId: world.f.a }, { founderId: world.f.b }, { founderId: world.f.c }] });

async function expense(over: Record<string, unknown> = {}, status = 'approved', agent: Agent = w.a) {
  const r = await agent.post('/api/transactions').send(expensePayload(w, { amountMinor: 300_000, split: equalAll(w), ...over }));
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  if (status !== 'pending_approval') await setStatus(r.body.transaction.id, status);
  return r.body.transaction.id as string;
}
const reimbPayload = (expenseId: string | undefined, amountMinor: number, over: Record<string, unknown> = {}) => ({
  type: 'reimbursement', amountMinor, transactionDate: '2026-05-03', description: 'Reimbursed by the business', paidByFounderId: w.f.a,
  ...(expenseId ? { reimbursesTransactionId: expenseId } : {}), ...over,
});
const post = (body: Record<string, unknown>, agent: Agent = w.a) => agent.post('/api/transactions').send(body);
async function reimburse(expenseId: string, amountMinor: number, over: Record<string, unknown> = {}, approve = true) {
  const r = await post(reimbPayload(expenseId, amountMinor, over));
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  if (approve) await setStatus(r.body.transaction.id, 'approved');
  return r.body.transaction.id as string;
}
const get = async (id: string) => (await w.admin.get(`/api/transactions/${id}`)).body.transaction;
const voidTx = async (id: string, agent: Agent = w.admin) => {
  const expectedVersion = (await get(id)).version;
  return await agent.post(`/api/transactions/${id}/void`).send({ expectedVersion, reason: 'entered by mistake' });
};
const positions = async () => (await w.a.get('/api/founders/financial-positions')).body;
const net = (b: { positions: Array<Record<string, unknown>> }, id: string) => b.positions.find((p) => p.founderId === id) as Record<string, number>;
const rawExpense = (id: string) => Transaction.collection.findOne({ _id: new Types.ObjectId(id) });

describe('1-3. the link is mandatory, only for reimbursements, and must point at a business expense', () => {
  it('1. a valid reimbursement links to its expense and exposes the link', async () => {
    const e = await expense();
    const r = await post(reimbPayload(e, 100_000));
    expect(r.status).toBe(201);
    expect(r.body.transaction).toMatchObject({ reimbursesTransactionId: e, reimbursesTransaction: { id: e, amountMinor: 300_000 } });
    expect((await get(e))).toMatchObject({ reimbursedMinor: 100_000, remainingReimbursableMinor: 200_000 });
  });
  it('2. a reimbursement without the link is rejected', async () => {
    const r = await post(reimbPayload(undefined, 100_000));
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.body.error.details)).toMatch(/reimbursesTransactionId/);
  });
  it('3. a non-reimbursement cannot carry the link (create and edit)', async () => {
    const e = await expense();
    for (const type of ['business_expense', 'founder_contribution', 'founder_loan', 'settlement', 'refund', 'other']) {
      const body: Record<string, unknown> = type === 'business_expense' ? expensePayload(w, { reimbursesTransactionId: e }) : { type, amountMinor: 1_000, transactionDate: '2026-05-01', description: 'x', notes: 'n', paidByFounderId: w.f.a, reimbursesTransactionId: e, ...(type === 'settlement' ? { counterpartyFounderId: w.f.b } : {}), ...(type === 'refund' ? { split: equalAll(w) } : {}) };
      expect((await post(body)).status, type).toBe(400);
    }
    const other = await post(expensePayload(w));
    const patch = await w.a.patch(`/api/transactions/${other.body.transaction.id}`).send({ expectedVersion: 1, reimbursesTransactionId: e });
    expect(patch.status).toBe(400);
  });
  it('4. wrong or invalid targets are rejected: not an expense, unknown id, malformed id, not approved, payer mismatch, voided', async () => {
    const pendingE = await expense({}, 'pending_approval');
    const draftE = await expense({}, 'draft');
    const rejectedE = await expense({}, 'rejected');
    const voidedE = await expense();
    expect((await voidTx(voidedE)).status).toBe(200);
    const contribution = (await post({ type: 'founder_contribution', amountMinor: 5_000, transactionDate: '2026-05-01', description: 'cap', paidByFounderId: w.f.a })).body.transaction.id;
    await setStatus(contribution, 'approved');
    const good = await expense();
    const cases: Array<[string, string, Record<string, unknown>, string]> = [
      ['not an expense', contribution, {}, 'TARGET_NOT_EXPENSE'],
      ['unknown id', String(new Types.ObjectId()), {}, 'UNKNOWN_TARGET'],
      ['pending', pendingE, {}, 'TARGET_NOT_APPROVED'],
      ['draft', draftE, {}, 'TARGET_NOT_APPROVED'],
      ['rejected', rejectedE, {}, 'TARGET_NOT_APPROVED'],
      ['voided', voidedE, {}, 'TARGET_NOT_APPROVED'],
      ['payer mismatch', good, { paidByFounderId: w.f.b }, 'PAYER_MISMATCH'],
    ];
    for (const [label, target, over, code] of cases) {
      const r = await post(reimbPayload(target, 1_000, over));
      expect(r.status, label).toBe(400);
      expect(JSON.stringify(r.body.error.details), label).toContain(code);
    }
    for (const bad of ['nope', '123', '{"$ne":1}']) expect((await post(reimbPayload(bad, 1_000))).status, bad).toBe(400);
    expect((await post(reimbPayload(good, 1_000, { reimbursesTransactionId: { $ne: null } }))).status).toBe(400); // operator injection
    expect((await get(good)).reimbursedMinor).toBe(0); // nothing was reserved by any rejected attempt
  });
});

describe('5-6. cap: partial, full, over, cumulative', () => {
  it('5. ₹1,000 of ₹3,000, then the rest; ₹3,000 reimbursed in full is allowed', async () => {
    const e = await expense();
    await reimburse(e, 100_000);
    expect((await get(e)).remainingReimbursableMinor).toBe(200_000);
    await reimburse(e, 200_000);
    expect(await rawExpense(e)).toMatchObject({ reimbursedMinor: 300_000 });
    const e2 = await expense();
    await reimburse(e2, 300_000);
    expect((await get(e2)).remainingReimbursableMinor).toBe(0);
  });
  it('6. over-reimbursement is rejected with the remaining amount: single, cumulative (₹2,000 + ₹1,500 on ₹3,000)', async () => {
    const e = await expense();
    const big = await post(reimbPayload(e, 300_001));
    expect(big.status).toBe(400);
    expect(big.body.error.code).toBe('REIMBURSEMENT_EXCEEDS_EXPENSE');
    await reimburse(e, 200_000);
    const over = await post(reimbPayload(e, 150_000));
    expect(over.status).toBe(400);
    expect(over.body.error.code).toBe('REIMBURSEMENT_EXCEEDS_EXPENSE');
    expect(over.body.error.details[0]).toMatchObject({ remainingMinor: 100_000 });
    expect((await post(reimbPayload(e, 100_000))).status).toBe(201); // exactly the remainder fits
    expect((await post(reimbPayload(e, 1))).status).toBe(400);
    expect(await rawExpense(e)).toMatchObject({ reimbursedMinor: 300_000 });
    expect(await Transaction.collection.countDocuments({ reimbursesTransactionId: new Types.ObjectId(e) })).toBe(2); // rejected attempts left nothing behind
  });
  it('pending and draft reimbursements hold capacity too (so approval later can never exceed the cap)', async () => {
    const e = await expense();
    await reimburse(e, 200_000, {}, false);
    expect((await post(reimbPayload(e, 150_000, { status: 'draft' }))).status).toBe(400);
  });
});

describe('7-12. calculation through the API', () => {
  it('7. ₹1,000 of ₹3,000 reimbursed: business-borne 1,000; founders share the funded 2,000 (667/667/666)', async () => {
    const e = await expense();
    await reimburse(e, 100_000);
    const b = await positions();
    expect([w.f.a, w.f.b, w.f.c].map((id) => [net(b, id).paidMinor, net(b, id).fairShareMinor, net(b, id).grossNetPositionMinor]))
      .toEqual([[200_000, 66_667, 133_333], [0, 66_667, -66_667], [0, 66_666, -66_666]]);
    expect(b.reconciliation).toMatchObject({ businessBorneMinor: 100_000, sumGrossNetPositionMinor: 0, status: 'PASS', isBalanced: true });
    const rec = (await w.b.get('/api/settlements/recommendations')).body;
    expect(rec.recommendations.map((r: { payer: { name: string }; receiver: { name: string }; amountMinor: number }) => `${r.payer.name}->${r.receiver.name}:${r.amountMinor}`)).toEqual(['Founder B->Founder A:66667', 'Founder C->Founder A:66666']);
  });
  it('8. full ₹3,000 reimbursed: nothing is owed by anyone', async () => {
    const e = await expense();
    await reimburse(e, 300_000);
    const b = await positions();
    expect(b.positions.every((p: { outstandingMinor: number; action: string }) => p.outstandingMinor === 0 && p.action === 'settled')).toBe(true);
    expect(b.reconciliation).toMatchObject({ businessBorneMinor: 300_000, totalFairShareMinor: 0, totalPaidMinor: 0 });
    expect((await w.a.get('/api/settlements/recommendations')).body.recommendations).toEqual([]);
  });
  it('9. several partial reimbursements add up (1,000 + 500 → founders share 1,500 → 500 each)', async () => {
    const e = await expense();
    await reimburse(e, 100_000);
    await reimburse(e, 50_000);
    const b = await positions();
    expect([w.f.a, w.f.b, w.f.c].map((id) => net(b, id).fairShareMinor)).toEqual([50_000, 50_000, 50_000]);
    expect([w.f.a, w.f.b, w.f.c].map((id) => net(b, id).grossNetPositionMinor)).toEqual([100_000, -50_000, -50_000]);
  });
  it('10. each expense uses its own split; the sum of net positions is exactly 0 (largest remainder, odd cents)', async () => {
    const e1 = await expense({ amountMinor: 100_001 });
    await expense({ amountMinor: 77_777, paidByFounderId: w.f.b, split: { method: 'percentage', entries: [{ founderId: w.f.a, percent: 33.33 }, { founderId: w.f.c, percent: 66.67 }] } }, 'approved', w.b);
    await reimburse(e1, 33_333);
    const b = await positions();
    expect(b.positions.reduce((s: number, p: { grossNetPositionMinor: number }) => s + p.grossNetPositionMinor, 0)).toBe(0);
    expect(b.reconciliation.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
    expect(b.reconciliation.totalFairShareMinor).toBe(100_001 + 77_777 - 33_333);
  });
  it('11. "Other", voided, pending and rejected reimbursements change nothing', async () => {
    const e = await expense();
    const before = JSON.stringify((await positions()).positions);
    await reimburse(e, 10_000, {}, false); // pending: holds capacity but is not official
    const r2 = await reimburse(e, 10_000);
    await setStatus(r2, 'rejected');
    await post({ type: 'other', amountMinor: 9_000_000, transactionDate: '2026-05-01', description: 'misc', notes: 'unclear', paidByFounderId: w.f.a });
    expect(JSON.stringify((await positions()).positions)).toBe(before);
  });
  it('12. regression: refund, loan, contribution still behave (contribution/loan outside fair share; refund reduces it)', async () => {
    const e = await expense();
    await reimburse(e, 100_000);
    for (const [type, extra] of [['founder_contribution', {}], ['founder_loan', {}]] as const) {
      const id = (await post({ type, amountMinor: 500_000, transactionDate: '2026-05-02', description: type, paidByFounderId: w.f.c, ...extra })).body.transaction.id;
      await setStatus(id, 'approved');
    }
    const rf = (await post({ type: 'refund', amountMinor: 30_000, transactionDate: '2026-05-04', description: 'refund', paidByFounderId: w.f.b, split: equalAll(w) })).body.transaction.id;
    await setStatus(rf, 'approved');
    const b = await positions();
    expect(b.reconciliation.totalFairShareMinor).toBe(300_000 - 100_000 - 30_000);
    expect(net(b, w.f.c)).toMatchObject({ contributionMinor: 500_000, loanOutstandingMinor: 500_000 });
    expect(net(b, w.f.b)).toMatchObject({ refundReceivedMinor: 30_000 });
    expect(b.positions.reduce((s: number, p: { grossNetPositionMinor: number }) => s + p.grossNetPositionMinor, 0)).toBe(0);
  });
});

describe('13-16. voiding', () => {
  it('13. voiding a reimbursement restores the founder-funded amount, frees the capacity and deletes nothing', async () => {
    const e = await expense();
    const r = await reimburse(e, 100_000);
    expect(net(await positions(), w.f.b).fairShareMinor).toBe(66_667);
    expect((await voidTx(r)).status).toBe(200);
    const b = await positions();
    expect([w.f.a, w.f.b, w.f.c].map((id) => net(b, id).fairShareMinor)).toEqual([100_000, 100_000, 100_000]);
    expect(b.reconciliation.businessBorneMinor).toBe(0);
    expect(await rawExpense(e)).toMatchObject({ reimbursedMinor: 0 });
    expect(await Transaction.collection.countDocuments({ _id: new Types.ObjectId(r), status: 'voided' })).toBe(1); // still there
    expect((await post(reimbPayload(e, 300_000))).status).toBe(201); // full capacity is available again
  });
  it('14. an expense with active linked reimbursements cannot be voided (409 with the blocking list)', async () => {
    const e = await expense();
    const r = await reimburse(e, 100_000);
    const res = await voidTx(e);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('HAS_LINKED_REIMBURSEMENTS');
    expect(res.body.error.details).toEqual([expect.objectContaining({ id: r, amountMinor: 100_000, status: 'approved' })]);
    expect((await get(e)).status).toBe('approved');
  });
  it('15. after the reimbursement is voided the expense can be voided', async () => {
    const e = await expense();
    const r = await reimburse(e, 100_000);
    expect((await voidTx(r)).status).toBe(200);
    expect((await voidTx(e)).status).toBe(200);
    expect((await positions()).reconciliation.totalFairShareMinor).toBe(0);
  });
  it('16. a pending reimbursement also blocks the expense void', async () => {
    const e = await expense();
    await reimburse(e, 100_000, {}, false);
    expect((await voidTx(e)).status).toBe(409);
  });
});

describe('17-19. editing a reimbursement keeps the reserved capacity exact', () => {
  it('amount down frees capacity, amount up is capped, moving to another expense moves the reservation', async () => {
    const e1 = await expense();
    const e2 = await expense();
    const r = await post(reimbPayload(e1, 200_000));
    const id = r.body.transaction.id as string;
    expect(await rawExpense(e1)).toMatchObject({ reimbursedMinor: 200_000 });
    let v = 1;
    const patch = async (body: Record<string, unknown>) => { const res = await w.a.patch(`/api/transactions/${id}`).send({ expectedVersion: v, ...body }); if (res.status === 200) v = res.body.transaction.version; return res; };
    expect((await patch({ amountMinor: 50_000 })).status).toBe(200);
    expect(await rawExpense(e1)).toMatchObject({ reimbursedMinor: 50_000 });
    expect((await patch({ amountMinor: 300_001 })).status).toBe(400);
    expect(await rawExpense(e1)).toMatchObject({ reimbursedMinor: 50_000 }); // failed edit left it untouched
    expect((await patch({ amountMinor: 300_000 })).status).toBe(200);
    expect((await patch({ reimbursesTransactionId: e2 })).status).toBe(200);
    expect(await rawExpense(e1)).toMatchObject({ reimbursedMinor: 0 });
    expect(await rawExpense(e2)).toMatchObject({ reimbursedMinor: 300_000 });
    expect((await patch({ reimbursesTransactionId: null })).status).toBe(400); // the link can never be removed
  });
});

describe('20. concurrency', () => {
  it('five simultaneous ₹1,000 reimbursements of a ₹3,000 expense: exactly three succeed', async () => {
    const e = await expense();
    const results = await Promise.all(Array.from({ length: 5 }, () => post(reimbPayload(e, 100_000))));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 201, 201, 400, 400]);
    expect(await rawExpense(e)).toMatchObject({ reimbursedMinor: 300_000 });
    expect(await Transaction.collection.countDocuments({ reimbursesTransactionId: new Types.ObjectId(e) })).toBe(3);
  });
  it('two simultaneous requests of ₹2,000 and ₹1,500: only one is accepted', async () => {
    const e = await expense();
    const [a, b] = await Promise.all([post(reimbPayload(e, 200_000)), post(reimbPayload(e, 150_000))]);
    expect([a.status, b.status].sort()).toEqual([201, 400]);
  });
  it('voiding the expense while a reimbursement is created: never both succeed', async () => {
    for (let i = 0; i < 5; i++) {
      const e = await expense();
      const [v, r] = await Promise.all([voidTx(e), post(reimbPayload(e, 100_000))]);
      expect(v.status === 200 && r.status === 201, `iteration ${i}`).toBe(false);
      const ex = await rawExpense(e);
      if (v.status === 200) expect(ex).toMatchObject({ status: 'voided', reimbursedMinor: 0 });
      else expect(ex).toMatchObject({ status: 'approved', reimbursedMinor: 100_000 });
    }
  });
});

describe('21-22. deleted / invalid target and settlement after a reimbursement', () => {
  it('21. a linked expense that becomes invalid after the fact is excluded by the engine with a named warning (never guessed)', async () => {
    const e = await expense();
    const r = await reimburse(e, 100_000);
    await Transaction.collection.updateOne({ _id: new Types.ObjectId(r) }, { $set: { reimbursesTransactionId: new Types.ObjectId() } }); // dangling link, as from a legacy/raw write
    const b = await positions();
    expect(b.warnings).toEqual([expect.objectContaining({ code: 'REIMBURSEMENT_TARGET_MISSING', level: 'warning' })]);
    expect(b.reconciliation.businessBorneMinor).toBe(0);
    expect(b.reconciliation.status).toBe('REVIEW');
    expect(b.positions.reduce((s: number, p: { grossNetPositionMinor: number }) => s + p.grossNetPositionMinor, 0)).toBe(0);
  });
  it('22. settlement after a partial and a full reimbursement', async () => {
    const e = await expense();
    await reimburse(e, 100_000);
    const s1 = (await post({ type: 'settlement', amountMinor: 30_000, transactionDate: '2026-05-05', description: 'B pays A', paidByFounderId: w.f.b, counterpartyFounderId: w.f.a }, w.b)).body.transaction.id;
    await setStatus(s1, 'approved');
    let b = await positions();
    expect(net(b, w.f.b)).toMatchObject({ settledPaidMinor: 30_000, outstandingMinor: -36_667 });
    const s2 = (await post({ type: 'settlement', amountMinor: 36_667, transactionDate: '2026-05-06', description: 'B rest', paidByFounderId: w.f.b, counterpartyFounderId: w.f.a }, w.b)).body.transaction.id;
    const s3 = (await post({ type: 'settlement', amountMinor: 66_666, transactionDate: '2026-05-06', description: 'C pays', paidByFounderId: w.f.c, counterpartyFounderId: w.f.a })).body.transaction.id;
    await setStatus(s2, 'approved'); await setStatus(s3, 'approved');
    b = await positions();
    expect(b.positions.every((p: { outstandingMinor: number }) => p.outstandingMinor === 0)).toBe(true);
    expect(b.reconciliation).toMatchObject({ status: 'PASS', businessBorneMinor: 100_000 });
    expect((await w.a.get('/api/settlements/recommendations')).body.recommendations).toEqual([]);
  });
});

describe('23. reimbursable-expense picker endpoint and storage', () => {
  it('lists approved expenses of that payer that still have capacity, and the own reservation is excluded when editing', async () => {
    const e1 = await expense({ description: 'Hosting' });
    const e2 = await expense({ description: 'Domains' });
    await expense({ description: 'Pending one' }, 'pending_approval');
    await expense({ description: 'B paid', paidByFounderId: w.f.b }, 'approved', w.b);
    await reimburse(e2, 300_000); // exhausted
    const list = await w.a.get(`/api/transactions/reimbursable-expenses?paidByFounderId=${w.f.a}`);
    expect(list.status).toBe(200);
    expect(list.body.expenses).toEqual([expect.objectContaining({ id: e1, remainingMinor: 300_000 })]);
    const own = await reimburse(e1, 100_000);
    const editing = await w.a.get(`/api/transactions/reimbursable-expenses?paidByFounderId=${w.f.a}&forReimbursementId=${own}`);
    expect(editing.body.expenses).toEqual([expect.objectContaining({ id: e1, remainingMinor: 300_000 })]);
    expect((await w.a.get(`/api/transactions/reimbursable-expenses?paidByFounderId=${w.f.a}`)).body.expenses[0]).toMatchObject({ remainingMinor: 200_000 });
    expect((await w.a.get('/api/transactions/reimbursable-expenses')).status).toBe(400);
    expect((await w.a.get(`/api/transactions/reimbursable-expenses?paidByFounderId=${w.f.a}&x=1`)).status).toBe(400);
    expect((await request(app).get(`/api/transactions/reimbursable-expenses?paidByFounderId=${w.f.a}`)).status).toBe(401);
  });
  it('the link field is indexed', async () => {
    const idx = await Transaction.collection.indexes();
    expect(idx.some((i) => i.key && 'reimbursesTransactionId' in i.key)).toBe(true);
  });
});
