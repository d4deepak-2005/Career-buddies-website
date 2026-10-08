import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loginAgent, makeUser, setupDb, teardownDb } from './helpers';

const app = createApp();

beforeAll(async () => {
  await setupDb();
  await makeUser('admin@cb.test', 'admin');
});
afterAll(teardownDb);

describe('request validation', () => {
  it('rejects malformed login bodies with field details', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(['email', 'password']);
  });

  it('rejects unknown fields (strict schemas)', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    const res = await agent.post('/api/categories').send({ name: 'Ok', isAdmin: true });
    expect(res.status).toBe(400);
  });

  it('rejects weak passwords, bad roles, bad ids and empty updates', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    expect((await agent.post('/api/users').send({ email: 'a@b.co', name: 'A', password: 'short' })).status).toBe(400);
    expect((await agent.post('/api/users').send({ email: 'a@b.co', name: 'A', password: 'a-long-enough-password', role: 'superuser' })).status).toBe(400);
    expect((await agent.patch('/api/founders/not-an-id').send({ active: false })).status).toBe(400);
    expect((await agent.patch('/api/categories/64b7f0f0f0f0f0f0f0f0f0f0').send({})).status).toBe(400);
    expect((await agent.post('/api/founders').send({ name: 'F', defaultSharePercent: 150 })).status).toBe(400);
  });

  it('returns 404 for unknown ids and routes in the JSON error shape', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    const res = await agent.get('/api/founders/64b7f0f0f0f0f0f0f0f0f0f0');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect((await request(app).get('/api/nope')).status).toBe(404);
  });

  it('returns 409 for duplicates', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    await agent.post('/api/categories').send({ name: 'Travel' });
    expect((await agent.post('/api/categories').send({ name: 'travel' })).status).toBe(409);
    expect((await agent.post('/api/users').send({ email: 'ADMIN@cb.test', name: 'Dup', password: 'a-long-enough-password' })).status).toBe(409);
  });

  it('handles malformed JSON without leaking internals', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('NoSQL injection and CSRF protections', () => {
  it('rejects operator objects in login credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  it('rejects $-prefixed and dotted keys anywhere in the payload', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x', $where: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect((await request(app).get('/api/founders?name[$ne]=x')).status).toBe(400);
  });

  it('rejects state-changing requests from a foreign Origin', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({ email: 'admin@cb.test', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('BAD_ORIGIN');
  });

  it('only allows the configured origin via CORS', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    // The configured origin is always echoed, never the caller's, so browsers block evil.example.
    expect(bad.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
