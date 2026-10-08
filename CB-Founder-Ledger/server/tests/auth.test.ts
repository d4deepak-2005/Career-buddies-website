import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { getEnv } from '../src/config/env';
import { signAccessToken } from '../src/lib/tokens';
import { User } from '../src/models/User';
import { PASSWORD, cookieNames, loginAgent, makeUser, setupDb, teardownDb } from './helpers';

const app = createApp();

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => {
  await User.deleteMany({});
  await makeUser('admin@cb.test', 'admin');
});

describe('POST /api/auth/login', () => {
  it('logs in, sets httpOnly cookies and never returns secrets', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'Admin@CB.test', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'admin@cb.test', role: 'admin' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|sessions|\$2[aby]\$/);
    const cookies = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookieNames(res).sort()).toEqual(['cb_access', 'cb_refresh']);
    expect(cookies).toMatch(/HttpOnly/i);
    expect(cookies).toMatch(/SameSite=Strict/i);
  });

  it('stores a bcrypt hash, never the plain password, and only a hash of the refresh token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@cb.test', password: PASSWORD });
    const refresh = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('cb_refresh='))!.split(';')[0]!.slice('cb_refresh='.length);
    const raw = await User.collection.findOne({ email: 'admin@cb.test' });
    expect(raw?.['passwordHash']).toMatch(/^\$2[aby]\$/);
    expect(JSON.stringify(raw)).not.toContain(PASSWORD);
    expect(JSON.stringify(raw)).not.toContain(refresh);
    expect(raw?.['sessions']).toHaveLength(1);
  });

  it.each([
    ['wrong password', { email: 'admin@cb.test', password: 'wrong-password-123' }],
    ['unknown email', { email: 'nobody@cb.test', password: PASSWORD }],
  ])('rejects %s with an identical generic 401', async (_n, body) => {
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects disabled accounts', async () => {
    await makeUser('off@cb.test', 'founder', 'disabled');
    const res = await request(app).post('/api/auth/login').send({ email: 'off@cb.test', password: PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe('session handling', () => {
  it('GET /me rejects anonymous callers and returns the user when logged in', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const agent = await loginAgent(app, 'admin@cb.test');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ email: 'admin@cb.test', role: 'admin' });
  });

  it('rejects forged, wrong-secret and expired access tokens', async () => {
    const u = await User.findOne({ email: 'admin@cb.test' });
    const id = String(u!._id);
    const forged = signAccessToken({ sub: id, role: 'admin', sid: 'x' }, 'x'.repeat(40), 5);
    const expired = signAccessToken({ sub: id, role: 'admin', sid: 'x' }, getEnv().JWT_ACCESS_SECRET, -1);
    // Correct signature, but no matching server-side session.
    const noSession = signAccessToken({ sub: id, role: 'admin', sid: 'not-a-session' }, getEnv().JWT_ACCESS_SECRET, 5);
    for (const token of [forged, expired, noSession, 'garbage']) {
      const res = await request(app).get('/api/auth/me').set('Cookie', `cb_access=${token}`);
      expect(res.status).toBe(401);
    }
  });

  it('rotates refresh tokens and rejects reuse of an old one', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@cb.test', password: PASSWORD });
    const oldRefresh = (login.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('cb_refresh='))!.split(';')[0]!;

    const first = await request(app).post('/api/auth/refresh').set('Cookie', oldRefresh);
    expect(first.status).toBe(200);
    expect(cookieNames(first).sort()).toEqual(['cb_access', 'cb_refresh']);

    const replay = await request(app).post('/api/auth/refresh').set('Cookie', oldRefresh);
    expect(replay.status).toBe(401);
  });

  it('logout revokes the refresh token and clears cookies', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await agent.post('/api/auth/refresh')).status).toBe(401);
    const raw = await User.collection.findOne({ email: 'admin@cb.test' });
    expect(raw?.['sessions']).toHaveLength(0);
  });

  it('logout invalidates an already-issued access token immediately', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@cb.test', password: PASSWORD });
    const cookies = (login.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]!);
    const header = cookies.join('; ');
    expect((await request(app).get('/api/auth/me').set('Cookie', header)).status).toBe(200);
    expect((await request(app).post('/api/auth/logout').set('Cookie', header)).status).toBe(204);
    // A stolen copy of the old access cookie must no longer work, even though the JWT has not expired.
    expect((await request(app).get('/api/auth/me').set('Cookie', header)).status).toBe(401);
  });

  it('keeps the same session across refresh rotation', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin@cb.test', password: PASSWORD });
    const refresh = (login.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('cb_refresh='))!.split(';')[0]!;
    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', refresh);
    const access = (rotated.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('cb_access='))!.split(';')[0]!;
    expect((await request(app).get('/api/auth/me').set('Cookie', access)).status).toBe(200);
  });

  it('rejects access for a user disabled after login', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    await User.updateOne({ email: 'admin@cb.test' }, { status: 'disabled' });
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
