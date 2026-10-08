import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { Category } from '../src/models/Category';
import { Transaction } from '../src/models/Transaction';
import { TransactionRevision } from '../src/models/TransactionRevision';
import { expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

const base = (over: Record<string, unknown> = {}) => ({ amountMinor: 250_000, transactionDate: '2026-05-01', description: 'Test entry', ...over });

describe('creating every transaction type', () => {
  it('1. Business Expense (equal split, resolved responsibility stored)', async () => {
    const res = await w.a.post('/api/transactions').send(expensePayload(w));
    expect(res.status).toBe(201);
    const t = res.body.transaction;
    expect(t).toMatchObject({ type: 'business_expense', amountMinor: 3_000_000, status: 'pending_approval', version: 1, receiptCount: 0, transactionDate: '2026-04-15' });
    expect(t.txnNumber).toMatch(/^TXN-\d{6}$/);
    expect(t.category).toMatchObject({ id: w.cat, name: 'Software' });
    expect(t.paidBy).toMatchObject({ id: w.f.a, name: 'Founder A' });
    expect(t.createdBy.name).toBe('fa');
    expect(t.split.method).toBe('equal');
    expect(t.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([1_000_000, 1_000_000, 1_000_000]);
  });
  it('2. Founder Contribution', async () => {
    const res = await w.a.post('/api/transactions').send(base({ type: 'founder_contribution', paidByFounderId: w.f.a }));
    expect(res.status).toBe(201);
    expect(res.body.transaction.split).toBeNull();
  });
  it('3. Founder Loan', async () => {
    expect((await w.a.post('/api/transactions').send(base({ type: 'founder_loan', paidByFounderId: w.f.b }))).status).toBe(201);
  });
  it('4. Reimbursement (Option C: linked to the approved expense it reimburses)', async () => {
    const exp = await w.a.post('/api/transactions').send(expensePayload(w, { paidByFounderId: w.f.c }));
    expect(exp.status).toBe(201);
    await Transaction.collection.updateOne({ _id: new Types.ObjectId(exp.body.transaction.id) }, { $set: { status: 'approved' } });
    const res = await w.a.post('/api/transactions').send(base({ type: 'reimbursement', paidByFounderId: w.f.c, reimbursesTransactionId: exp.body.transaction.id }));
    expect(res.status).toBe(201);
    expect(res.body.transaction.reimbursesTransaction).toMatchObject({ id: exp.body.transaction.id, amountMinor: 3_000_000 });
    expect((await w.a.post('/api/transactions').send(base({ type: 'reimbursement', paidByFounderId: w.f.c }))).status).toBe(400); // link is mandatory
  });
  it('5. Settlement (payer -> receiver)', async () => {
    const res = await w.a.post('/api/transactions').send(base({ type: 'settlement', paidByFounderId: w.f.a, counterpartyFounderId: w.f.b }));
    expect(res.status).toBe(201);
    expect(res.body.transaction.counterparty).toMatchObject({ id: w.f.b });
  });
  it('6. Refund (Phase 3: needs the founder who received the money and a split of the refunded cost)', async () => {
    const split = { method: 'equal', entries: [{ founderId: w.f.a }, { founderId: w.f.b }] };
    const ok = await w.a.post('/api/transactions').send(base({ type: 'refund', categoryId: w.cat, paidByFounderId: w.f.a, split }));
    expect(ok.status).toBe(201);
    expect(ok.body.transaction.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([125_000, 125_000]);
    expect((await w.a.post('/api/transactions').send(base({ type: 'refund', categoryId: w.cat }))).status).toBe(400); // no payee / split
    expect((await w.a.post('/api/transactions').send(base({ type: 'refund', paidByFounderId: w.f.a }))).status).toBe(400); // no split
  });
  it('settlement accepts an optional payment method; other types reject it', async () => {
    const s = await w.a.post('/api/transactions').send(base({ type: 'settlement', paidByFounderId: w.f.a, counterpartyFounderId: w.f.b, method: 'UPI' }));
    expect(s.status).toBe(201);
    expect(s.body.transaction.method).toBe('UPI');
    expect((await w.a.post('/api/transactions').send(base({ type: 'settlement', paidByFounderId: w.f.a, counterpartyFounderId: w.f.b }))).status).toBe(201);
    expect((await w.a.post('/api/transactions').send(base({ type: 'founder_loan', paidByFounderId: w.f.a, method: 'UPI' }))).status).toBe(400);
    expect((await w.a.post('/api/transactions').send(base({ type: 'settlement', paidByFounderId: w.f.a, counterpartyFounderId: w.f.b, method: 'x'.repeat(51) }))).status).toBe(400);
    const edited = await w.a.patch(`/api/transactions/${s.body.transaction.id}`).send({ expectedVersion: 1, method: null });
    expect(edited.status).toBe(200);
    expect(edited.body.transaction.method).toBeNull();
  });
  it('7. Other (notes mandatory)', async () => {
    expect((await w.a.post('/api/transactions').send(base({ type: 'other', notes: 'Misc adjustment agreed by founders' }))).status).toBe(201);
    const bad = await w.a.post('/api/transactions').send(base({ type: 'other' }));
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body.error.details)).toMatch(/Notes is required/);
  });
  it('can be created as a draft, and ids are unique and sequential', async () => {
    const d = await w.a.post('/api/transactions').send(expensePayload(w, { status: 'draft' }));
    const e = await w.a.post('/api/transactions').send(expensePayload(w));
    expect(d.body.transaction.status).toBe('draft');
    expect(d.body.transaction.txnNumber).not.toBe(e.body.transaction.txnNumber);
  });
});

describe('create validation', () => {
  it('8. rejects an invalid transaction type', async () => {
    expect((await w.a.post('/api/transactions').send(base({ type: 'gift' }))).status).toBe(400);
  });
  it('9. rejects invalid amounts', async () => {
    for (const amountMinor of [0, -5, 10.5, '100', null, 1e15]) {
      const res = await w.a.post('/api/transactions').send(expensePayload(w, { amountMinor }));
      expect(res.status, `amount ${String(amountMinor)}`).toBe(400);
    }
  });
  it('10. rejects unknown, malformed and inactive categories', async () => {
    expect((await w.a.post('/api/transactions').send(expensePayload(w, { categoryId: '64b7f0f0f0f0f0f0f0f0f0f0' }))).status).toBe(400);
    expect((await w.a.post('/api/transactions').send(expensePayload(w, { categoryId: 'nope' }))).status).toBe(400);
    const inactive = await w.a.post('/api/transactions').send(expensePayload(w, { categoryId: w.inactiveCat }));
    expect(inactive.status).toBe(400);
    expect(JSON.stringify(inactive.body)).toMatch(/inactive/i);
  });
  it('rejects type-rule violations (missing category/paid-by/split, forbidden split, settlement to self)', async () => {
    const noCat = await w.a.post('/api/transactions').send(expensePayload(w, { categoryId: undefined }));
    expect(noCat.status).toBe(400);
    expect((await w.a.post('/api/transactions').send(expensePayload(w, { split: undefined }))).status).toBe(400);
    expect((await w.a.post('/api/transactions').send(base({ type: 'founder_loan', paidByFounderId: w.f.a, split: { method: 'equal', entries: [{ founderId: w.f.a }] } }))).status).toBe(400);
    expect((await w.a.post('/api/transactions').send(base({ type: 'settlement', paidByFounderId: w.f.a, counterpartyFounderId: w.f.a }))).status).toBe(400);
  });
  it('rejects unknown or inactive founders, bad dates and blank descriptions', async () => {
    expect((await w.a.post('/api/transactions').send(expensePayload(w, { paidByFounderId: '64b7f0f0f0f0f0f0f0f0f0f0' }))).status).toBe(400);
    expect((await w.a.post('/api/transactions').send(expensePayload(w, { paidByFounderId: w.f.inactive }))).status).toBe(400);
    for (const transactionDate of ['2026-02-30', '15/04/2026', '1999-01-01', 'tomorrow']) {
      expect((await w.a.post('/api/transactions').send(expensePayload(w, { transactionDate }))).status).toBe(400);
    }
    expect((await w.a.post('/api/transactions').send(expensePayload(w, { description: '   ' }))).status).toBe(400);
  });
});

describe('split validation (server-side, authoritative)', () => {
  const post = (split: unknown, amountMinor = 1_000_000) => w.a.post('/api/transactions').send(expensePayload(w, { amountMinor, split }));

  it('11. equal: selected founders required; duplicates rejected', async () => {
    expect((await post({ method: 'equal', entries: [{ founderId: w.f.a }, { founderId: w.f.b }] })).status).toBe(201);
    expect((await post({ method: 'equal', entries: [] })).status).toBe(400);
    expect((await post({ method: 'equal', entries: [{ founderId: w.f.a }, { founderId: w.f.a }] })).status).toBe(400);
  });
  it('12. percentage must equal 100%', async () => {
    const good = await post({ method: 'percentage', entries: [{ founderId: w.f.a, percent: 50 }, { founderId: w.f.b, percent: 30 }, { founderId: w.f.c, percent: 20 }] });
    expect(good.status).toBe(201);
    expect(good.body.transaction.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([500_000, 300_000, 200_000]);
    const bad = await post({ method: 'percentage', entries: [{ founderId: w.f.a, percent: 50 }, { founderId: w.f.b, percent: 30 }] });
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body.error.details)).toMatch(/add up to 100%/);
  });
  it('13. exact must equal the transaction amount', async () => {
    expect((await post({ method: 'exact', entries: [{ founderId: w.f.a, amountMinor: 600_000 }, { founderId: w.f.b, amountMinor: 400_000 }] })).status).toBe(201);
    const bad = await post({ method: 'exact', entries: [{ founderId: w.f.a, amountMinor: 600_000 }, { founderId: w.f.b, amountMinor: 300_000 }] });
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body.error.details)).toMatch(/transaction amount/);
  });
  it('14. shares: positive whole numbers only', async () => {
    const good = await post({ method: 'shares', entries: [{ founderId: w.f.a, shares: 2 }, { founderId: w.f.b, shares: 1 }, { founderId: w.f.c, shares: 1 }] });
    expect(good.status).toBe(201);
    expect(good.body.transaction.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([500_000, 250_000, 250_000]);
    for (const shares of [0, -2, 1.5, '2']) {
      expect((await post({ method: 'shares', entries: [{ founderId: w.f.a, shares }, { founderId: w.f.b, shares: 1 }] })).status).toBe(400);
    }
  });
  it('15. custom: valid responsibilities summing to the amount', async () => {
    const good = await post({ method: 'custom', entries: [{ founderId: w.f.a, amountMinor: 1_000_000, note: 'Only A used it' }, { founderId: w.f.b, amountMinor: 0 }] });
    expect(good.status).toBe(201);
    expect((await post({ method: 'custom', entries: [{ founderId: w.f.a, amountMinor: 900_000 }, { founderId: w.f.b, amountMinor: 0 }] })).status).toBe(400);
    expect((await post({ method: 'custom', entries: [{ founderId: w.f.a, amountMinor: -1 }, { founderId: w.f.b, amountMinor: 1_000_001 }] })).status).toBe(400);
  });
  it('16. invalid split shapes are rejected (unknown method, mixed fields, unknown/inactive founders)', async () => {
    expect((await post({ method: 'random', entries: [{ founderId: w.f.a }] })).status).toBe(400);
    expect((await post({ method: 'equal', entries: [{ founderId: w.f.a, percent: 100 }] })).status).toBe(400);
    expect((await post({ method: 'equal', entries: [{ founderId: '64b7f0f0f0f0f0f0f0f0f0f0' }] })).status).toBe(400);
    expect((await post({ method: 'equal', entries: [{ founderId: w.f.inactive }] })).status).toBe(400);
    expect((await post({ method: 'equal' })).status).toBe(400);
  });
  it('split-preview resolves without saving and reports errors', async () => {
    const ok = await w.a.post('/api/transactions/split-preview').send({ amountMinor: 100, split: { method: 'equal', entries: [{ founderId: w.f.a }, { founderId: w.f.b }, { founderId: w.f.c }] } });
    expect(ok.status).toBe(200);
    expect(ok.body.entries.map((e: { allocatedMinor: number; founderName: string }) => [e.founderName, e.allocatedMinor])).toEqual([['Founder A', 34], ['Founder B', 33], ['Founder C', 33]]);
    const bad = await w.a.post('/api/transactions/split-preview').send({ amountMinor: 100, split: { method: 'percentage', entries: [{ founderId: w.f.a, percent: 10 }] } });
    expect(bad.status).toBe(400);
    expect(await Transaction.countDocuments()).toBe(0);
  });
});

describe('editing', () => {
  async function create(agent = w.a, over = {}) {
    return (await agent.post('/api/transactions').send(expensePayload(w, over))).body.transaction as { id: string; version: number };
  }

  it('17. edit authorization: creator and admin can; another founder cannot', async () => {
    const t = await create(w.a);
    const other = await w.b.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'hijack' });
    expect(other.status).toBe(403);
    const own = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'Updated by owner' });
    expect(own.status).toBe(200);
    expect(own.body.transaction).toMatchObject({ description: 'Updated by owner', version: 2 });
    const admin = await w.admin.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 2, description: 'Admin fix' });
    expect(admin.status).toBe(200);
    expect(admin.body.transaction.updatedBy.name).toBe('admin');
    expect(admin.body.transaction.createdBy.name).toBe('fa');
  });

  it('amount change: equal/percentage/shares recalculate automatically (30,000 -> 45,000)', async () => {
    const t = await create();
    const r = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, amountMinor: 4_500_000 });
    expect(r.status).toBe(200);
    expect(r.body.transaction.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([1_500_000, 1_500_000, 1_500_000]);

    const p = await create(w.a, { split: { method: 'percentage', entries: [{ founderId: w.f.a, percent: 70 }, { founderId: w.f.b, percent: 30 }] }, amountMinor: 1000 });
    const r2 = await w.a.patch(`/api/transactions/${p.id}`).send({ expectedVersion: 1, amountMinor: 4500 });
    expect(r2.body.transaction.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([3150, 1350]);
  });

  it('amount change: exact/custom are re-validated and rejected unless the split is updated too', async () => {
    const split = { method: 'exact', entries: [{ founderId: w.f.a, amountMinor: 1_500_000 }, { founderId: w.f.b, amountMinor: 1_500_000 }] };
    const t = await create(w.a, { split });
    const bad = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, amountMinor: 4_500_000 });
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body.error.details)).toMatch(/transaction amount/);
    const good = await w.a.patch(`/api/transactions/${t.id}`).send({
      expectedVersion: 1, amountMinor: 4_500_000,
      split: { method: 'exact', entries: [{ founderId: w.f.a, amountMinor: 2_000_000 }, { founderId: w.f.b, amountMinor: 2_500_000 }] },
    });
    expect(good.status).toBe(200);
    expect((await Transaction.findById(t.id))?.amountMinor).toBe(4_500_000);
  });

  it('null clears optional fields; type rules are re-checked after the merge', async () => {
    const t = await create();
    expect((await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, categoryId: null })).status).toBe(400); // category required for expense
    const ok = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, type: 'other', notes: 'reclassified', categoryId: null, split: null, paidByFounderId: null });
    expect(ok.status).toBe(200);
    expect(ok.body.transaction).toMatchObject({ type: 'other', category: null, split: null, paidBy: null });
  });

  it('26. rejects arbitrary field injection (status, version, createdBy, receiptCount, unknown, operators)', async () => {
    const t = await create();
    const attempts: Record<string, unknown>[] = [
      { status: 'approved' }, { version: 99 }, { createdBy: w.adminUser.id }, { receiptCount: 50 }, { txnNumber: 'TXN-999999' },
      { isAdmin: true }, { $set: { status: 'approved' } }, { 'split.method': 'equal' }, { description: { $ne: null } },
    ];
    for (const extra of attempts) {
      const r = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'x', ...extra });
      expect(r.status, JSON.stringify(extra)).toBe(400);
    }
    const create1 = await w.a.post('/api/transactions').send(expensePayload(w, { createdBy: w.adminUser.id, version: 7, receiptCount: 3, status: 'approved' }));
    expect(create1.status).toBe(400);
    const stored = await Transaction.findById(t.id).lean();
    expect(stored).toMatchObject({ status: 'pending_approval', version: 1, receiptCount: 0, description: 'Cloud hosting' });
  });

  it('25. concurrent edits: exactly one wins, the other gets a version conflict', async () => {
    const t = await create();
    const [r1, r2] = await Promise.all([
      w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'from tab 1' }),
      w.admin.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'from tab 2' }),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    const loser = r1.status === 409 ? r1 : r2;
    expect(loser.body.error.code).toBe('VERSION_CONFLICT');
    expect(loser.body.error.details.currentVersion).toBe(2);
    expect((await Transaction.findById(t.id))?.version).toBe(2);
  });

  it('stale version is rejected and requires reload', async () => {
    const t = await create();
    await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'v2' });
    const stale = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'stale' });
    expect(stale.status).toBe(409);
    expect((await w.a.patch(`/api/transactions/${t.id}`).send({ description: 'no version' })).status).toBe(400);
  });

  it('keeps append-only history of every change', async () => {
    const t = await create();
    await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'second' });
    const h = await w.b.get(`/api/transactions/${t.id}/history`);
    expect(h.status).toBe(200);
    expect(h.body.history.map((x: { action: string; version: number }) => [x.action, x.version])).toEqual([['created', 1], ['edited', 2]]);
    expect(h.body.history[1].actor.name).toBe('fa');
    await expect(TransactionRevision.updateOne({}, { reason: 'tamper' })).rejects.toThrow(/append-only/);
  });
});

describe('lifecycle: submit, void, no deletion', () => {
  async function draft() {
    return (await w.a.post('/api/transactions').send(expensePayload(w, { status: 'draft' }))).body.transaction as { id: string };
  }

  it('submit moves draft -> pending approval (creator/admin only, once)', async () => {
    const t = await draft();
    expect((await w.b.post(`/api/transactions/${t.id}/submit`).send({ expectedVersion: 1 })).status).toBe(403);
    const r = await w.a.post(`/api/transactions/${t.id}/submit`).send({ expectedVersion: 1 });
    expect(r.status).toBe(200);
    expect(r.body.transaction).toMatchObject({ status: 'pending_approval', version: 2 });
    expect((await w.a.post(`/api/transactions/${t.id}/submit`).send({ expectedVersion: 2 })).status).toBe(409);
  });

  it('23. void/reversal is admin-only, needs a reason, and keeps the record', async () => {
    const t = await draft();
    expect((await w.a.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: 1, reason: 'entered twice' })).status).toBe(403);
    expect((await w.admin.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: 1, reason: 'no' })).status).toBe(400);
    const r = await w.admin.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: 1, reason: 'Entered twice by mistake' });
    expect(r.status).toBe(200);
    expect(r.body.transaction).toMatchObject({ status: 'voided', version: 2 });
    expect(r.body.transaction.void).toMatchObject({ reason: 'Entered twice by mistake', voidedBy: { name: 'admin' } });
    expect(await Transaction.countDocuments()).toBe(1);
    // voided is terminal: no edit, no re-void
    expect((await w.admin.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 2, description: 'revive' })).status).toBe(409);
    expect((await w.admin.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: 2, reason: 'again please' })).status).toBe(409);
  });

  it('approved transactions cannot be edited but can be voided (never silently removed)', async () => {
    const t = await draft();
    await Transaction.collection.updateOne({ _id: new (await import('mongoose')).Types.ObjectId(t.id) }, { $set: { status: 'approved' } }); // approval workflow is Phase 5
    const edit = await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'edit approved' });
    expect(edit.status).toBe(409);
    expect(edit.body.error.code).toBe('NOT_EDITABLE');
    expect((await w.admin.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: 1, reason: 'Approved by mistake' })).status).toBe(200);
  });

  it('24. hard deletion is prevented at the API and model level', async () => {
    const t = await draft();
    for (const agent of [w.a, w.admin]) {
      const r = await agent.delete(`/api/transactions/${t.id}`);
      expect(r.status).toBe(405);
      expect(r.body.error.code).toBe('HARD_DELETE_DISABLED');
    }
    expect((await request(app).delete(`/api/transactions/${t.id}`)).status).toBe(401);
    await expect(Transaction.deleteOne({ _id: t.id })).rejects.toThrow(/cannot be deleted/);
    await expect(Transaction.deleteMany({})).rejects.toThrow(/cannot be deleted/);
    await expect(Transaction.findByIdAndDelete(t.id)).rejects.toThrow(/cannot be deleted/);
    expect(await Transaction.countDocuments()).toBe(1);
  });
});

describe('access control, list, detail', () => {
  it('27. every transaction endpoint requires authentication', async () => {
    const id = '64b7f0f0f0f0f0f0f0f0f0f0';
    const calls = [
      request(app).get('/api/transactions'), request(app).post('/api/transactions').send({}), request(app).post('/api/transactions/split-preview').send({}),
      request(app).get(`/api/transactions/${id}`), request(app).get(`/api/transactions/${id}/split`), request(app).get(`/api/transactions/${id}/history`),
      request(app).patch(`/api/transactions/${id}`).send({}), request(app).post(`/api/transactions/${id}/submit`).send({}), request(app).post(`/api/transactions/${id}/void`).send({}),
      request(app).get(`/api/transactions/${id}/receipts`), request(app).post(`/api/transactions/${id}/receipts`), request(app).get('/api/config'),
    ];
    for (const res of await Promise.all(calls)) expect(res.status).toBe(401);
  });

  it('18. founders cannot perform admin-only category operations; admins can; inactive categories are flagged', async () => {
    expect((await w.a.post('/api/categories').send({ name: 'Nope' })).status).toBe(403);
    expect((await w.a.patch(`/api/categories/${w.cat}`).send({ active: false })).status).toBe(403);
    const created = await w.admin.post('/api/categories').send({ name: 'Legal', description: 'Legal fees' });
    expect(created.status).toBe(201);
    expect(created.body.category.isDevSeed).toBe(false);
    expect((await w.admin.patch(`/api/categories/${created.body.category.id}`).send({ active: false })).body.category.active).toBe(false);
    expect((await w.a.get('/api/categories')).status).toBe(200);
    // a deactivated category blocks NEW use but does not break an existing transaction's edits
    const t = (await w.a.post('/api/transactions').send(expensePayload(w))).body.transaction;
    await w.admin.patch(`/api/categories/${w.cat}`).send({ active: false });
    expect((await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, description: 'still editable' })).status).toBe(200);
    expect((await w.a.post('/api/transactions').send(expensePayload(w))).status).toBe(400);
  });

  it('28. list: filters, search, sort, pagination (no totals in the response)', async () => {
    const mk = (over: Record<string, unknown>) => w.a.post('/api/transactions').send(expensePayload(w, over));
    await mk({ description: 'Domain renewal', amountMinor: 120_000, transactionDate: '2026-01-10' });
    await mk({ description: 'Laptop', amountMinor: 9_000_000, transactionDate: '2026-02-10', paidByFounderId: w.f.b });
    await mk({ description: 'Hosting', amountMinor: 500_000, transactionDate: '2026-03-10', status: 'draft' });
    await w.b.post('/api/transactions').send({ type: 'founder_contribution', amountMinor: 7_000_000, transactionDate: '2026-03-20', description: 'Seed money', paidByFounderId: w.f.b });
    const get = async (qs: string) => (await w.a.get(`/api/transactions?${qs}`)).body;

    const all = await get('');
    expect(all.total).toBe(4);
    expect(Object.keys(all).sort()).toEqual(['items', 'page', 'pageSize', 'total']);
    expect(all.items[0].description).toBe('Seed money'); // default: newest date first
    expect((await get('type=founder_contribution')).items).toHaveLength(1);
    expect((await get('status=draft')).items.map((i: { description: string }) => i.description)).toEqual(['Hosting']);
    expect((await get(`paidByFounderId=${w.f.b}`)).total).toBe(2);
    expect((await get(`categoryId=${w.cat}`)).total).toBe(3);
    expect((await get('dateFrom=2026-02-01&dateTo=2026-03-15')).total).toBe(2);
    expect((await get('search=laptop')).items[0].description).toBe('Laptop');
    expect((await get('search=TXN-000002')).total).toBe(1);
    expect((await get('search=.*')).total).toBe(0); // regex characters are escaped, not interpreted
    expect((await get('sort=amountMinor&order=asc')).items[0].description).toBe('Domain renewal');
    expect((await get('sort=amountMinor&order=desc&pageSize=2&page=2')).items.map((i: { description: string }) => i.description)).toEqual(['Hosting', 'Domain renewal']);
    expect((await get('hasReceipt=true')).total).toBe(0);
    expect((await get('hasReceipt=false')).total).toBe(4);
  });

  it('list rejects unknown params, bad enums and operator injection', async () => {
    for (const qs of ['foo=1', 'type=gift', 'sort=password', 'pageSize=1000', 'page=0', 'search[$ne]=x', 'status[$ne]=voided', 'type=business_expense&type=refund']) {
      expect((await w.a.get(`/api/transactions?${qs}`)).status, qs).toBe(400);
    }
  });

  it('29. detail returns the full transaction, split, receipts list; 404 for unknown/invalid ids', async () => {
    const t = (await w.a.post('/api/transactions').send(expensePayload(w))).body.transaction;
    const d = await w.b.get(`/api/transactions/${t.id}`);
    expect(d.status).toBe(200);
    expect(d.body.transaction).toMatchObject({ id: t.id, description: 'Cloud hosting', status: 'pending_approval' });
    expect(d.body.receipts).toEqual([]);
    const s = await w.b.get(`/api/transactions/${t.id}/split`);
    expect(s.body).toMatchObject({ amountMinor: 3_000_000, split: { method: 'equal' } });
    expect((await w.b.get('/api/transactions/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
    expect((await w.b.get('/api/transactions/not-an-id')).status).toBe(400);
  });

  it('config endpoint exposes currency and type rules to the client (nothing hard-coded there)', async () => {
    const c = await w.a.get('/api/config');
    expect(c.body.currency).toEqual({ code: 'INR', minorUnits: 2 });
    expect(c.body.transactionTypes).toHaveLength(7);
    expect(c.body.transactionTypes.find((x: { value: string }) => x.value === 'settlement').rules.counterparty).toBe('required');
    expect(c.body.receipts.allowedExtensions).toEqual(['pdf', 'jpg', 'jpeg', 'png']);
  });

  it('categories seeded for development are flagged and nothing else is auto-created', async () => {
    expect(await Category.countDocuments({ isDevSeed: true })).toBe(0);
    expect(await Transaction.countDocuments()).toBe(0);
  });
});
