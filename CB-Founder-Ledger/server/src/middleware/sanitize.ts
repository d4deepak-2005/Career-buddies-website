import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors';

function hasUnsafeKey(value: unknown, depth = 0): boolean {
  if (depth > 10) return true;
  if (Array.isArray(value)) return value.some((v) => hasUnsafeKey(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([k, v]) => k.startsWith('$') || k.includes('.') || k === '__proto__' || hasUnsafeKey(v, depth + 1),
    );
  }
  return false;
}

/** Reject MongoDB operator injection (`$ne`, `a.b`, `__proto__`) in body, query and params. */
export const rejectUnsafeKeys: RequestHandler = (req, _res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return next(new AppError(400, 'INVALID_INPUT', 'Request contains disallowed characters in field names'));
  }
  next();
};
