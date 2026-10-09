import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { loginAgent, makeUser, setupDb, teardownDb } from './helpers';

// Regression for QA finding OBS-01: limiters used to be created inside the first request that reached them, which makes
// express-rate-limit log ERR_ERL_CREATED_IN_REQUEST_HANDLER. They are now created when the app is built.
beforeAll(setupDb);
afterAll(teardownDb);

describe('rate limiter creation', () => {
  it('logs no framework validation error when write and upload endpoints receive their first requests', async () => {
    const app = createApp();
    await makeUser('limiter-admin@example.test', 'admin');
    const a = await loginAgent(app, 'limiter-admin@example.test');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await a.post('/api/transactions').send({});
    await a.post('/api/recurring').send({});
    await a.put('/api/branding/logo');
    await a.put('/api/founders/64b7f0f0f0f0f0f0f0f0f0f0/photo');
    await a.post('/api/transactions/64b7f0f0f0f0f0f0f0f0f0f0/receipts');
    const logged = errors.mock.calls.flat().map(String).join('\n');
    errors.mockRestore();
    expect(logged).not.toMatch(/ERR_ERL_CREATED_IN_REQUEST_HANDLER/);
  });
});
