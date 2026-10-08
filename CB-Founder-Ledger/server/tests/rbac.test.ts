import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { Category } from '../src/models/Category';
import { Founder } from '../src/models/Founder';
import { User } from '../src/models/User';
import { loginAgent, makeUser, setupDb, teardownDb } from './helpers';

const app = createApp();
const FAKE_ID = '64b7f0f0f0f0f0f0f0f0f0f0';

beforeAll(async () => {
  await setupDb();
  await makeUser('admin@cb.test', 'admin');
  await makeUser('founder@cb.test', 'founder');
});
afterAll(teardownDb);

describe('unauthenticated access is rejected', () => {
  it.each([
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['patch', `/api/users/${FAKE_ID}`],
    ['get', '/api/founders'],
    ['post', '/api/founders'],
    ['patch', `/api/founders/${FAKE_ID}`],
    ['get', '/api/categories'],
    ['post', '/api/categories'],
    ['patch', `/api/categories/${FAKE_ID}`],
    ['get', '/api/auth/me'],
  ] as const)('%s %s -> 401', async (method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('founder role restrictions', () => {
  it('can read founders and categories', async () => {
    const agent = await loginAgent(app, 'founder@cb.test');
    expect((await agent.get('/api/founders')).status).toBe(200);
    expect((await agent.get('/api/categories')).status).toBe(200);
  });

  it.each([
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['patch', `/api/users/${FAKE_ID}`],
    ['post', '/api/founders'],
    ['patch', `/api/founders/${FAKE_ID}`],
    ['post', '/api/categories'],
    ['patch', `/api/categories/${FAKE_ID}`],
  ] as const)('%s %s -> 403', async (method, path) => {
    const agent = await loginAgent(app, 'founder@cb.test');
    const res = await agent[method](path).send({ name: 'x', email: 'x@y.co', password: 'a-long-enough-password' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('cannot create anything by trying anyway', async () => {
    const agent = await loginAgent(app, 'founder@cb.test');
    await agent.post('/api/categories').send({ name: 'Sneaky' });
    await agent.post('/api/founders').send({ name: 'Sneaky' });
    expect(await Category.countDocuments()).toBe(0);
    expect(await Founder.countDocuments()).toBe(0);
  });
});

describe('admin role access', () => {
  it('can manage users, founders and categories', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');

    const created = await agent.post('/api/users').send({ email: 'New@CB.test', name: 'New', password: 'a-long-enough-password', role: 'founder' });
    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({ email: 'new@cb.test', role: 'founder', status: 'active' });
    expect(JSON.stringify(created.body)).not.toMatch(/passwordHash|sessions/);
    expect((await agent.get('/api/users')).body.users.length).toBeGreaterThanOrEqual(3);

    const founder = await agent.post('/api/founders').send({ name: 'Test Founder', defaultSharePercent: 33.3 });
    expect(founder.status).toBe(201);
    const patched = await agent.patch(`/api/founders/${founder.body.founder.id}`).send({ active: false });
    expect(patched.body.founder.active).toBe(false);
    expect((await agent.get(`/api/founders/${founder.body.founder.id}`)).status).toBe(200);

    const cat = await agent.post('/api/categories').send({ name: 'Software & Tools' });
    expect(cat.status).toBe(201);
    expect(cat.body.category.slug).toBe('software-tools');
    const renamed = await agent.patch(`/api/categories/${cat.body.category.id}`).send({ name: 'Cloud Hosting' });
    expect(renamed.body.category.slug).toBe('cloud-hosting');
  });

  it('cannot demote or disable their own account', async () => {
    const agent = await loginAgent(app, 'admin@cb.test');
    const me = await User.findOne({ email: 'admin@cb.test' });
    expect((await agent.patch(`/api/users/${me!._id}`).send({ role: 'founder' })).status).toBe(400);
    expect((await agent.patch(`/api/users/${me!._id}`).send({ status: 'disabled' })).status).toBe(400);
  });
});

describe('role changes take effect immediately (role re-read from DB)', () => {
  it('a demoted admin loses admin access even with an old token', async () => {
    await makeUser('temp-admin@cb.test', 'admin');
    const agent = await loginAgent(app, 'temp-admin@cb.test');
    expect((await agent.get('/api/users')).status).toBe(200);
    await User.updateOne({ email: 'temp-admin@cb.test' }, { role: 'founder' });
    expect((await agent.get('/api/users')).status).toBe(403);
  });
});
