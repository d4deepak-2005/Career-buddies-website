import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
};

interface MongoDuplicateKeyError { code: number }
interface BodyParserError { type?: string; status?: number }

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  const bp = err as BodyParserError;
  if (bp?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body' } });
    return;
  }
  if (bp?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } });
    return;
  }
  if ((err as MongoDuplicateKeyError)?.code === 11000) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with the same unique value already exists' } });
    return;
  }
  // Never leak internals to the client.
  if (process.env['NODE_ENV'] !== 'test') console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
