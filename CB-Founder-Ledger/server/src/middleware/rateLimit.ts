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
