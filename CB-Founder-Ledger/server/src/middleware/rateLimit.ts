import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { getEnv } from '../config/env';

/** `multiplier` loosens the limit for lower-risk endpoints such as token refresh. */
export function authRateLimiter(multiplier = 1) {
  const env = getEnv();
  return rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    limit: env.AUTH_RATE_LIMIT_MAX * multiplier,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
  });
}

const tooMany = { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down and try again shortly.' } };

/** Create / edit / void / submit: per IP per minute. */
export function writeRateLimiter() {
  return rateLimit({ windowMs: 60_000, limit: getEnv().WRITE_RATE_LIMIT_MAX, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany });
}

/** Receipt uploads: stricter, per IP per 15 minutes. */
export function uploadRateLimiter() {
  return rateLimit({ windowMs: 15 * 60_000, limit: getEnv().UPLOAD_RATE_LIMIT_MAX, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany });
}

const registry: Array<() => RequestHandler> = [];

/**
 * A limiter that is created once, on first use or earlier via `initRateLimiters()`. Creating a limiter inside a request
 * handler makes express-rate-limit log ERR_ERL_CREATED_IN_REQUEST_HANDLER; priming them at app start-up avoids that
 * while keeping one counter per route module and the environment read at creation time (so tests can set limits first).
 */
export function deferredLimiter(factory: () => RequestHandler): RequestHandler {
  let instance: RequestHandler | undefined;
  const get = () => (instance ??= factory());
  registry.push(get);
  return (req, res, next) => get()(req, res, next);
}

/** Create every deferred limiter now (called from createApp, never from a request). */
export function initRateLimiters(): void {
  for (const get of registry) get();
}
