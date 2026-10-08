import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { getEnv } from '../src/config/env';
import { connectDb, disconnectDb, getDbState } from '../src/db/connect';
import { setupDb, teardownDb } from './helpers';

describe('database connection', () => {
  it('fails fast when MongoDB is unreachable', async () => {
    await expect(connectDb('mongodb://127.0.0.1:1/none', 500)).rejects.toThrow();
    expect(getDbState()).toBe('disconnected');
  });

  it('connects with the configured URI', async () => {
    await connectDb(getEnv().MONGO_URI, 3000);
    expect(getDbState()).toBe('connected');
    const ping = await mongoose.connection.db?.admin().ping();
    expect(ping?.ok).toBe(1);
    await disconnectDb();
  });
});

describe('health endpoint', () => {
  it('reports degraded (503) when the database is down', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'degraded', db: 'disconnected' });
  });

  describe('with database', () => {
    beforeAll(setupDb);
    afterAll(teardownDb);

    it('reports ok (200) when connected, without auth', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok', db: 'connected' });
    });

    it('sends security headers and hides the framework', async () => {
      const res = await request(createApp()).get('/api/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });
});
