import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

describe('auth rate limiting', () => {
  it('returns 429 after too many login attempts', async () => {
    process.env['AUTH_RATE_LIMIT_MAX'] = '3';
    vi.resetModules();
    const { resetEnvCache } = await import('../src/config/env.js');
    resetEnvCache();
    const { createApp } = await import('../src/app.js');
    const app = createApp();

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      // Validation fails (400) before touching the database, but still counts toward the limit.
      statuses.push((await request(app).post('/api/auth/login').send({})).status);
    }
    expect(statuses).toEqual([400, 400, 400, 429, 429]);

    process.env['AUTH_RATE_LIMIT_MAX'] = '1000';
    resetEnvCache();
  });
});
