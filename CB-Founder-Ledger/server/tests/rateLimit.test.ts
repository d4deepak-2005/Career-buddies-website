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

describe('rate limiter initialisation', () => {
  it('deferredLimiter builds its limiter at initRateLimiters() (not on the first request) and still enforces the limit', async () => {
    vi.resetModules();
    const express = (await import('express')).default;
    const rateLimit = (await import('express-rate-limit')).default;
    const { deferredLimiter, initRateLimiters } = await import('../src/middleware/rateLimit.js');
    let created = 0;
    const limiter = deferredLimiter(() => { created++; return rateLimit({ windowMs: 60_000, limit: 2, standardHeaders: 'draft-7', legacyHeaders: false }); });
    const app = express();
    app.get('/x', limiter, (_req, res) => { res.json({ ok: true }); });
    expect(created).toBe(0);
    initRateLimiters();
    expect(created).toBe(1);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await request(app).get('/x')).status);
    expect(statuses).toEqual([200, 200, 429, 429]);
    expect(created).toBe(1); // one shared counter, never rebuilt per request
  });
});
