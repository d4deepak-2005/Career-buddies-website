import type { RequestHandler } from 'express';
import { getEnv } from '../config/env';
import { AppError } from '../lib/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (cookies are also SameSite=Strict): state-changing requests that carry
 * an Origin header must come from the configured client origin.
 */
export const originCheck: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin;
  const env = getEnv();
  const allowed = [new URL(env.CLIENT_ORIGIN).origin, ...env.ALLOWED_ORIGINS.map((o) => new URL(o).origin)];
  if (origin && !allowed.includes(origin)) {
    return next(new AppError(403, 'BAD_ORIGIN', 'Request origin not allowed'));
  }
  next();
};
