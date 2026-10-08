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
  if (origin && origin !== new URL(getEnv().CLIENT_ORIGIN).origin) {
    return next(new AppError(403, 'BAD_ORIGIN', 'Request origin not allowed'));
  }
  next();
};
