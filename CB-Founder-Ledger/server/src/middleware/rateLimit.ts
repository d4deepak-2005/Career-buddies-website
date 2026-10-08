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
