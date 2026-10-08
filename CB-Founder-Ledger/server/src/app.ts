import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { getEnv } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { originCheck } from './middleware/originCheck';
import { rejectUnsafeKeys } from './middleware/sanitize';
import { authRouter } from './modules/auth/auth.routes';
import { configRouter } from './modules/config/config.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { foundersRouter } from './modules/founders/founders.routes';
import { healthRouter } from './modules/health/health.routes';
import { transactionsRouter } from './modules/transactions/transactions.routes';
import { usersRouter } from './modules/users/users.routes';

export function createApp(): Express {
  const env = getEnv();
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin: new URL(env.CLIENT_ORIGIN).origin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); // API responses may hold financial data.
    next();
  });

  app.use('/api/health', healthRouter);

  app.use('/api', originCheck, rejectUnsafeKeys);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/founders', foundersRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/config', configRouter);
  app.use('/api/transactions', transactionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
