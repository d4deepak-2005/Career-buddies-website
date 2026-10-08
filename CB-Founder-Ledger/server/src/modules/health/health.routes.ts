import { Router } from 'express';
import { getDbState } from '../../db/connect';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const db = getDbState();
  const ok = db === 'connected';
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', db, uptimeSeconds: Math.round(process.uptime()) });
});
