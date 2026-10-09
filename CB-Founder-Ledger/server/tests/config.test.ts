import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env';

const base = {
  MONGO_URI: 'mongodb://localhost:27017/x',
  JWT_ACCESS_SECRET: 'a-sufficiently-long-random-secret-value-1234',
};

describe('environment configuration', () => {
  it('applies safe defaults', () => {
    const env = parseEnv({ ...base });
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.COOKIE_SECURE).toBe(false);
  });

  it('ALLOWED_ORIGINS is optional, comma-separated and validated', () => {
    expect(parseEnv({ ...base }).ALLOWED_ORIGINS).toEqual([]);
    expect(parseEnv({ ...base, ALLOWED_ORIGINS: 'http://127.0.0.1:8080, http://localhost:8081' }).ALLOWED_ORIGINS).toEqual(['http://127.0.0.1:8080', 'http://localhost:8081']);
    expect(() => parseEnv({ ...base, ALLOWED_ORIGINS: 'not-an-origin' })).toThrow(/ALLOWED_ORIGINS/);
    expect(() => parseEnv({ ...base, ALLOWED_ORIGINS: 'http://a.test/path' })).toThrow(/ALLOWED_ORIGINS/);
  });

  it('defaults cookies to secure in production', () => {
    const env = parseEnv({ ...base, NODE_ENV: 'production' });
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it('reports every missing/invalid variable', () => {
    expect(() => parseEnv({})).toThrow(/MONGO_URI[\s\S]*JWT_ACCESS_SECRET/);
  });

  it('rejects short JWT secrets and non-mongo URIs', () => {
    expect(() => parseEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/at least 32/);
    expect(() => parseEnv({ ...base, MONGO_URI: 'http://nope' })).toThrow(/MONGO_URI/);
  });

  it('refuses insecure cookies and placeholder secrets in production', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production', COOKIE_SECURE: 'false' })).toThrow(/COOKIE_SECURE/);
    expect(() =>
      parseEnv({ ...base, NODE_ENV: 'production', JWT_ACCESS_SECRET: 'change-me-change-me-change-me-change-me' }),
    ).toThrow(/placeholder/);
  });
});
