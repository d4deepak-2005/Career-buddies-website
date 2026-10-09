import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { redact } from '../src/lib/audit';
import { AuditEvent } from '../src/models/AuditEvent';
import { PASSWORD, expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

describe('audit log', () => {
  it('is admin-only and read-only: founders and anonymous users are refused; there is no write route', async () => {
    expect((await request(app).get('/api/audit-log')).status).toBe(401);
    expect((await w.a.get('/api/audit-log')).status).toBe(403);
    expect((await w.admin.get('/api/audit-log')).status).toBe(200);
    for (const m of ['post', 'put', 'patch', 'delete'] as const) expect((await w.admin[m]('/api/audit-log').send({ action: 'X' })).status, m).toBeGreaterThanOrEqual(400);
    expect((await w.admin.delete('/api/audit-log/123')).status).toBeGreaterThanOrEqual(400);
  });

  it('records the important actions with actor, entity, timestamp and before/after', async () => {
    const t = (await w.a.post('/api/transactions').send(expensePayload(w, { amountMinor: 100_000 }))).body.transaction;
    await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 1, amountMinor: 120_000 });
    await w.b.post(`/api/transactions/${t.id}/approve`).send({ expectedVersion: 2, comment: 'ok' });
    await w.admin.post(`/api/transactions/${t.id}/void`).send({ expectedVersion: 3, reason: 'duplicate entry' });
    await w.admin.post('/api/categories').send({ name: 'Marketing' });
    await w.admin.patch(`/api/founders/${w.f.a}`).send({ role: 'Founder' });
    await w.admin.patch('/api/settings').send({ expectedVersion: 1, regional: { locale: 'en-GB' } });
    const all = (await w.admin.get('/api/audit-log?pageSize=100')).body;
    const actions = all.items.map((i: { action: string }) => i.action);
    for (const a of ['LOGIN', 'TRANSACTION_CREATED', 'TRANSACTION_EDITED', 'TRANSACTION_APPROVED', 'TRANSACTION_VOIDED', 'CATEGORY_CREATED', 'FOUNDER_UPDATED', 'SETTINGS_CHANGED']) expect(actions, a).toContain(a);
    const edited = all.items.find((i: { action: string }) => i.action === 'TRANSACTION_EDITED');
    expect(edited).toMatchObject({ entityType: 'transaction', entityId: t.id, actor: expect.stringContaining('fa@cb.test') });
    expect(edited.before.amountMinor).toBe(100_000);
    expect(edited.after.amountMinor).toBe(120_000);
    expect(new Date(edited.at).getTime()).toBeLessThanOrEqual(Date.now());
    expect(all.items.find((i: { action: string }) => i.action === 'TRANSACTION_VOIDED').reason).toBe('duplicate entry');
    expect(all.items[0].at >= all.items[all.items.length - 1].at).toBe(true); // newest first
  });

  it('filters by action, entity, actor and date; paginates; rejects bad queries', async () => {
    const t = (await w.a.post('/api/transactions').send(expensePayload(w))).body.transaction;
    await w.admin.post('/api/categories').send({ name: 'Ops' });
    const byAction = (await w.admin.get('/api/audit-log?action=TRANSACTION_CREATED')).body;
    expect(byAction.items.every((i: { action: string }) => i.action === 'TRANSACTION_CREATED')).toBe(true);
    expect((await w.admin.get(`/api/audit-log?entityType=transaction&entityId=${t.id}`)).body.total).toBe(1);
    expect((await w.admin.get('/api/audit-log?pageSize=1&page=2')).body.items).toHaveLength(1);
    const today = new Date().toISOString().slice(0, 10);
    expect((await w.admin.get(`/api/audit-log?from=${today}&to=${today}`)).body.total).toBeGreaterThan(0);
    expect((await w.admin.get('/api/audit-log?from=2000-01-01&to=2000-01-02')).body.total).toBe(0);
    for (const bad of ['action=drop%20table', 'from=yesterday', 'pageSize=1000', 'x=1', 'actorId=nope', 'action[$ne]=x']) expect((await w.admin.get(`/api/audit-log?${bad}`)).status, bad).toBe(400);
  });

  it('login, logout and failed logins are recorded WITHOUT any password', async () => {
    await request(app).post('/api/auth/login').send({ email: 'fa@cb.test', password: 'definitely-wrong-password' });
    const a = request.agent(app);
    await a.post('/api/auth/login').send({ email: 'fb@cb.test', password: PASSWORD });
    await a.post('/api/auth/logout');
    const events = await AuditEvent.find({}).lean();
    const kinds = events.map((e) => e.action);
    expect(kinds).toEqual(expect.arrayContaining(['LOGIN', 'LOGOUT', 'LOGIN_FAILED']));
    const failed = events.find((e) => e.action === 'LOGIN_FAILED');
    expect(failed!.actorLabel).toBe('fa@cb.test');
    const blob = JSON.stringify(events);
    expect(blob).not.toContain('definitely-wrong-password');
    expect(blob).not.toContain(PASSWORD);
    expect(blob).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('user and permission changes are audited without credentials', async () => {
    const created = await w.admin.post('/api/users').send({ email: 'new@cb.test', name: 'New', password: 'a-long-enough-passphrase-1', role: 'founder' });
    await w.admin.patch(`/api/users/${created.body.user.id}`).send({ role: 'admin' });
    const ev = await AuditEvent.find({ entityType: 'user' }).sort({ at: 1, _id: 1 }).lean();
    expect(ev.map((e) => e.action)).toEqual(['USER_CREATED', 'PERMISSION_CHANGED']);
    expect(JSON.stringify(ev)).not.toContain('a-long-enough-passphrase-1');
    expect((ev[1]!.before as { role: string }).role).toBe('founder');
    expect((ev[1]!.after as { role: string }).role).toBe('admin');
  });

  it('is append-only at the model level (update / delete / replace are blocked)', async () => {
    await w.admin.post('/api/categories').send({ name: 'Ops' });
    const ev = await AuditEvent.findOne({}).lean();
    await expect(AuditEvent.updateOne({ _id: ev!._id }, { $set: { summary: 'tampered' } })).rejects.toThrow(/append-only/);
    await expect(AuditEvent.findOneAndUpdate({ _id: ev!._id }, { $set: { summary: 'tampered' } })).rejects.toThrow(/append-only/);
    await expect(AuditEvent.deleteOne({ _id: ev!._id })).rejects.toThrow(/append-only/);
    await expect(AuditEvent.deleteMany({})).rejects.toThrow(/append-only/);
    await expect(AuditEvent.replaceOne({ _id: ev!._id }, { action: 'X', entityType: 'x', summary: 'y' })).rejects.toThrow(/append-only/);
    expect((await AuditEvent.findOne({ _id: ev!._id }).lean())!.summary).toBe(ev!.summary);
  });

  it('redact() removes secrets, operator keys and truncates long text', () => {
    const r = redact({ name: 'x', password: 'p', nested: { apiKey: 'k', token: 't', ok: 1, $where: 'bad', 'a.b': 1 }, list: [{ passwordHash: 'h' }], long: 'z'.repeat(900) }) as Record<string, unknown>;
    expect(r).toMatchObject({ name: 'x', password: '[redacted]', nested: { apiKey: '[redacted]', token: '[redacted]', ok: 1 }, list: [{ passwordHash: '[redacted]' }] });
    expect(JSON.stringify(r)).not.toContain('$where');
    expect((r['long'] as string).length).toBeLessThan(510);
  });
});
