/** Every endpoint added with the portal: anonymous → 401, founder on admin-only → 403, and nothing mutates on refusal. */
import request from 'supertest';
import { Types } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { AuditEvent } from '../src/models/AuditEvent';
import { PNG, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
beforeAll(async () => { await setupDb(); w = await seedWorld(app); });
afterAll(teardownDb);

const id = new Types.ObjectId().toString();
type Call = [method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, body?: Record<string, unknown>];
const SIGNED_IN: Call[] = [
  ['get', '/api/settings'], ['get', '/api/config'], ['get', '/api/dashboard'], ['get', '/api/approvals'], ['get', '/api/recurring'], ['get', '/api/reports/summary'], ['get', '/api/reports/export?kind=summary'],
  ['post', `/api/transactions/${id}/approve`, { expectedVersion: 1 }], ['post', `/api/transactions/${id}/reject`, { expectedVersion: 1 }],
  ['post', '/api/settlements/record', { payerFounderId: id, receiverFounderId: id, amountMinor: 1, transactionDate: '2026-01-01' }],
  ['post', '/api/recurring', {}], ['patch', `/api/recurring/${id}`, { expectedVersion: 1, provider: 'x' }], ['post', `/api/recurring/${id}/record`, { dueDate: '2026-01-01' }],
  ['get', `/api/founders/${id}/photo`],
];
const ADMIN_ONLY: Call[] = [
  ['patch', '/api/settings', { expectedVersion: 1, business: { displayName: 'Nope' } }], ['put', '/api/branding/logo'], ['delete', '/api/branding/logo'],
  ['get', '/api/audit-log'], ['put', '/api/founders/order', { ids: [id] }], ['put', `/api/founders/${id}/photo`], ['delete', `/api/founders/${id}/photo`], ['put', '/api/categories/order', { ids: [id] }],
  ['post', `/api/transactions/${id}/void`, { expectedVersion: 1, reason: 'abcdef' }],
];

describe('authorization matrix', () => {
  it.each(SIGNED_IN)('anonymous %s %s → 401', async (method, path, body) => {
    const r = await request(app)[method](path).send(body ?? {});
    expect(r.status).toBe(401);
  });
  it.each(ADMIN_ONLY)('anonymous %s %s → 401', async (method, path, body) => {
    expect((await request(app)[method](path).send(body ?? {})).status).toBe(401);
  });
  it.each(ADMIN_ONLY)('founder %s %s → 403', async (method, path, body) => {
    const r = path.includes('/photo') || path.includes('/logo') ? await w.a[method](path).attach('file', PNG, { filename: 'x.png', contentType: 'image/png' }) : await w.a[method](path).send(body ?? {});
    expect(r.status).toBe(403);
  });
  it('refused calls changed nothing and wrote no audit events other than the sign-ins', async () => {
    const kinds = (await AuditEvent.find({}).lean()).map((e) => e.action);
    expect(kinds.every((k) => k === 'LOGIN')).toBe(true);
  });
});
