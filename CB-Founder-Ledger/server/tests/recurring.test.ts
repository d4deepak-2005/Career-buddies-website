import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { addDays, advanceDueDate, dueState, monthlyCommitmentMinor, todayIn } from '../src/domain/recurrence';
import { AuditEvent } from '../src/models/AuditEvent';
import { Transaction } from '../src/models/Transaction';
import { seedWorld, setupDb, teardownDb, type World } from './helpers';

describe('recurrence domain (pure)', () => {
  it('advances monthly/quarterly/yearly and keeps the anchor day across short months and leap years', () => {
    expect(advanceDueDate('2026-01-31', 31, 'monthly')).toBe('2026-02-28');
    expect(advanceDueDate('2026-02-28', 31, 'monthly')).toBe('2026-03-31');
    expect(advanceDueDate('2028-01-31', 31, 'monthly')).toBe('2028-02-29');
    expect(advanceDueDate('2026-11-30', 30, 'quarterly')).toBe('2027-02-28');
    expect(advanceDueDate('2028-02-29', 29, 'yearly')).toBe('2029-02-28');
    expect(advanceDueDate('2026-12-15', 15, 'monthly')).toBe('2027-01-15');
    expect(advanceDueDate('2026-10-15', 15, 'quarterly')).toBe('2027-01-15');
  });
  it('classifies overdue / due soon / upcoming with inclusive boundaries', () => {
    expect(dueState('2026-05-09', '2026-05-10', 7)).toBe('overdue');
    expect(dueState('2026-05-10', '2026-05-10', 7)).toBe('due_soon');
    expect(dueState('2026-05-17', '2026-05-10', 7)).toBe('due_soon');
    expect(dueState('2026-05-18', '2026-05-10', 7)).toBe('upcoming');
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
  });
  it('monthly commitment is exact: yearly total / 12 rounded half up once', () => {
    expect(monthlyCommitmentMinor([])).toBe(0);
    expect(monthlyCommitmentMinor([{ amountMinor: 1000, frequency: 'monthly' }, { amountMinor: 3000, frequency: 'quarterly' }, { amountMinor: 12000, frequency: 'yearly' }])).toBe(3000);
    expect(monthlyCommitmentMinor([{ amountMinor: 1, frequency: 'yearly' }])).toBe(0);
    expect(monthlyCommitmentMinor([{ amountMinor: 6, frequency: 'yearly' }])).toBe(1); // 0.5 rounds up
    expect(monthlyCommitmentMinor([{ amountMinor: 100, frequency: 'monthly' }, { amountMinor: 100, frequency: 'monthly' }])).toBe(200);
  });
  it('today is evaluated in the configured time zone', () => {
    const t = new Date('2026-05-10T20:00:00Z'); // already 11 May in Kolkata (UTC+5:30)
    expect(todayIn('UTC', t)).toBe('2026-05-10');
    expect(todayIn('Asia/Kolkata', t)).toBe('2026-05-11');
  });
});

const app = createApp();
let w: World;
let cat: string;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); cat = w.cat; });

const payload = (over: Record<string, unknown> = {}) => ({ provider: 'Cloud Host', description: 'Servers', amountMinor: 120_000, frequency: 'monthly', nextDueDate: '2026-06-15', paidByFounderId: w.f.a, categoryId: cat, splitFounderIds: [w.f.a, w.f.b, w.f.c], ...over });
const create = async (over: Record<string, unknown> = {}) => { const r = await w.a.post('/api/recurring').send(payload(over)); expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.recurring as { id: string; version: number; nextDueDate: string }; };
const list = async () => (await w.a.get('/api/recurring')).body;

describe('management', () => {
  it('requires sign-in; creates, lists and audits; validates every field', async () => {
    expect((await request(app).get('/api/recurring')).status).toBe(401);
    const r = await create();
    expect((await list()).items[0]).toMatchObject({ provider: 'Cloud Host', amountMinor: 120_000, frequency: 'monthly', status: 'active', paidBy: { name: 'Founder A' }, category: { name: 'Software' } });
    expect(await AuditEvent.countDocuments({ action: 'RECURRING_CREATED', entityId: r.id })).toBe(1);
    const bad: Array<Record<string, unknown>> = [{ provider: '' }, { amountMinor: 0 }, { amountMinor: 1.5 }, { frequency: 'weekly' }, { nextDueDate: '2026-02-30' }, { nextDueDate: 'soon' }, { splitFounderIds: [] }, { splitFounderIds: [w.f.a, w.f.a] },
      { paidByFounderId: w.f.inactive }, { splitFounderIds: [w.f.inactive] }, { paidByFounderId: new Types.ObjectId().toString() }, { categoryId: w.inactiveCat }, { categoryId: new Types.ObjectId().toString() }, { status: 'cancelled' }, { amountMinor: '100' }];
    for (const b of bad) expect((await w.a.post('/api/recurring').send(payload(b))).status, JSON.stringify(b)).toBe(400);
  });

  it('changing the amount never touches transactions already recorded', async () => {
    const r = await create({ nextDueDate: '2026-06-15' });
    const rec = await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-06-15' });
    expect(rec.status).toBe(201);
    const upd = await w.a.patch(`/api/recurring/${r.id}`).send({ expectedVersion: 2, amountMinor: 150_000 });
    expect(upd.status).toBe(200);
    expect(upd.body.recurring.amountMinor).toBe(150_000);
    expect((await Transaction.findById(rec.body.transaction.id).lean())!.amountMinor).toBe(120_000);
  });

  it('pause → resume → cancel with version checks; a cancelled schedule is read-only; nothing is ever deleted', async () => {
    const r = await create();
    expect((await w.a.post(`/api/recurring/${r.id}/pause`).send({ expectedVersion: 9 })).status).toBe(409);
    const p = await w.a.post(`/api/recurring/${r.id}/pause`).send({ expectedVersion: 1 });
    expect(p.body.recurring).toMatchObject({ status: 'paused', dueState: null });
    expect((await w.a.post(`/api/recurring/${r.id}/pause`).send({ expectedVersion: 2 })).status).toBe(409);
    expect((await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-06-15' })).status).toBe(409); // paused: cannot record
    expect((await w.a.post(`/api/recurring/${r.id}/resume`).send({ expectedVersion: 2 })).body.recurring.status).toBe('active');
    expect((await w.a.post(`/api/recurring/${r.id}/cancel`).send({ expectedVersion: 3 })).body.recurring.status).toBe('cancelled');
    expect((await w.a.patch(`/api/recurring/${r.id}`).send({ expectedVersion: 4, amountMinor: 5 })).status).toBe(409);
    expect((await w.a.post(`/api/recurring/${r.id}/resume`).send({ expectedVersion: 4 })).status).toBe(409);
    expect((await list()).items).toHaveLength(1);
    expect((await w.a.delete(`/api/recurring/${r.id}`)).status).toBe(404);
    expect(await AuditEvent.countDocuments({ entityType: 'recurring', entityId: r.id })).toBe(4); // created, paused, resumed, cancelled (rejected attempts leave no event)
  });

  it('summary: monthly commitment counts active items only; overdue / due-soon use today in the configured zone', async () => {
    const today = todayIn('Asia/Kolkata');
    await create({ provider: 'Overdue', nextDueDate: addDays(today, -2), amountMinor: 100_000 });
    await create({ provider: 'Soon', nextDueDate: addDays(today, 3), amountMinor: 300_000, frequency: 'quarterly' });
    await create({ provider: 'Later', nextDueDate: addDays(today, 40), amountMinor: 1_200_000, frequency: 'yearly' });
    const paused = await create({ provider: 'Paused', nextDueDate: addDays(today, 1), amountMinor: 999_999 });
    await w.a.post(`/api/recurring/${paused.id}/pause`).send({ expectedVersion: 1 });
    const l = await list();
    expect(l.summary).toMatchObject({ activeCount: 3, pausedCount: 1, overdueCount: 1, dueSoonCount: 1, monthlyCommitmentMinor: 100_000 + 100_000 + 100_000 });
    expect(l.items.map((i: { provider: string; dueState: string | null }) => [i.provider, i.dueState])).toEqual([['Overdue', 'overdue'], ['Paused', null], ['Soon', 'due_soon'], ['Later', 'upcoming']]);
    const dash = (await w.a.get('/api/dashboard')).body.upcomingRecurring;
    expect(dash.items.map((i: { provider: string }) => i.provider)).toEqual(['Overdue', 'Soon', 'Later']); // active only, soonest first
    expect(dash.summary.monthlyCommitmentMinor).toBe(300_000);
  });

  it('reminder window comes from Settings and changes the due-soon classification', async () => {
    const today = todayIn('Asia/Kolkata');
    await create({ nextDueDate: addDays(today, 20) });
    expect((await list()).summary.dueSoonCount).toBe(0);
    await w.admin.patch('/api/settings').send({ expectedVersion: 1, recurring: { reminderDaysAhead: 30 } });
    expect((await list()).summary.dueSoonCount).toBe(1);
  });
});

describe('recording a payment (a deliberate action, never automatic)', () => {
  it('creates ONE pending expense (not counted), links it, advances the schedule; nothing is recorded just because a date arrived', async () => {
    const r = await create({ nextDueDate: '2020-01-31', frequency: 'monthly' }); // long overdue
    expect(await Transaction.countDocuments({})).toBe(0); // being overdue recorded nothing
    expect((await w.a.get('/api/dashboard')).body.kpis.totalBusinessExpensesMinor).toBe(0);
    const rec = await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2020-01-31' });
    expect(rec.status).toBe(201);
    expect(rec.body.transaction).toMatchObject({ type: 'business_expense', status: 'pending_approval', amountMinor: 120_000, recurringId: r.id, recurringDueDate: '2020-01-31', paidBy: { name: 'Founder A' } });
    expect(rec.body.transaction.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([40_000, 40_000, 40_000]);
    expect((await list()).items[0].nextDueDate).toBe('2020-02-29'); // anchored on the 31st, 2020 is a leap year
    expect((await w.a.get('/api/dashboard')).body.kpis.totalBusinessExpensesMinor).toBe(0); // pending → still not a confirmed expense
    await w.b.post(`/api/transactions/${rec.body.transaction.id}/approve`).send({ expectedVersion: 1 });
    expect((await w.a.get('/api/dashboard')).body.kpis.totalBusinessExpensesMinor).toBe(120_000); // confirmed only after approval
  });

  it('duplicate prevention: repeating the call, or racing five calls, creates exactly one transaction', async () => {
    const r = await create({ nextDueDate: '2026-07-01' });
    const results = await Promise.all(Array.from({ length: 5 }, () => w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-07-01' })));
    expect(results.every((x) => [200, 201, 409].includes(x.status))).toBe(true);
    expect(results.filter((x) => x.status === 201).length).toBeLessThanOrEqual(1);
    expect(await Transaction.countDocuments({ recurringId: r.id })).toBe(1);
    const again = await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-07-01' });
    expect(again.status).toBe(200);
    expect(again.body.replayed).toBe(true);
    expect(await Transaction.countDocuments({ recurringId: r.id })).toBe(1);
    expect((await list()).items[0].nextDueDate).toBe('2026-08-01'); // advanced exactly once
  });

  it('only the NEXT due date can be recorded; a voided record frees its occurrence', async () => {
    const r = await create({ nextDueDate: '2026-07-01' });
    const wrong = await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-08-01' });
    expect(wrong.status).toBe(409);
    expect(wrong.body.error.code).toBe('NOT_THE_NEXT_DUE_DATE');
    const rec = await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-07-01' });
    expect((await w.admin.post(`/api/transactions/${rec.body.transaction.id}/void`).send({ expectedVersion: 1, reason: 'recorded by mistake' })).status).toBe(200);
    expect((await Transaction.findById(rec.body.transaction.id).lean())!.recurringKey).toBeUndefined();
    // the schedule is edited back to that date and the occurrence can be recorded again
    expect((await w.a.patch(`/api/recurring/${r.id}`).send({ expectedVersion: 2, nextDueDate: '2026-07-01' })).status).toBe(200);
    expect((await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-07-01' })).status).toBe(201);
    expect(await Transaction.countDocuments({ recurringId: r.id })).toBe(2);
  });

  it('refuses to record when a referenced founder or category has since been deactivated (validated like any expense)', async () => {
    const r = await create({ nextDueDate: '2026-07-01' });
    await w.admin.patch(`/api/founders/${w.f.c}`).send({ active: false });
    const rec = await w.a.post(`/api/recurring/${r.id}/record`).send({ dueDate: '2026-07-01' });
    expect(rec.status).toBe(400);
    expect(await Transaction.countDocuments({ recurringId: r.id })).toBe(0);
    expect((await list()).items[0].nextDueDate).toBe('2026-07-01'); // the schedule did not move
  });
});
