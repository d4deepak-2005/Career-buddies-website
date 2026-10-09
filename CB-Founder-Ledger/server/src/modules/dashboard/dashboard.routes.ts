import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { buildDashboard, type DashTx } from '../../domain/dashboard';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Category } from '../../models/Category';
import { loadCalculation } from '../financials/financials.service';
import { listRecurring } from '../recurring/recurring.routes';
import { loadSettings } from '../settings/settings.service';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, 'Not a real calendar date');
const objectId = z.string().refine((v) => Types.ObjectId.isValid(v) && String(new Types.ObjectId(v)) === v.toLowerCase(), 'Invalid id');

/** The ONLY inputs: a period and two optional filters. There is no way to submit a financial value. */
export const dashboardQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  founderId: objectId.optional(),
  categoryId: objectId.optional(),
}).strict().refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'from must be on or before to', path: ['from'] });

export const dashboardRouter = Router();
dashboardRouter.use(authenticate); // any signed-in founder or admin, same visibility as the ledger (Phase 3 IA-15)

dashboardRouter.get('/', validate(dashboardQuery, 'query'), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof dashboardQuery>;
  const [l, categories, settings] = await Promise.all([loadCalculation(q.to ? { asOf: q.to } : {}), Category.find().select('name').lean(), loadSettings()]);
  if (q.founderId && !l.names.has(q.founderId)) throw AppError.notFound('Founder not found');
  const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
  if (q.categoryId && !categoryNames.has(q.categoryId)) throw AppError.notFound('Category not found');

  const txs: DashTx[] = l.stored.map((t) => ({
    id: String(t._id), txnNumber: t.txnNumber, type: t.type, status: t.status, amountMinor: t.amountMinor, description: t.description,
    date: t.transactionDate.toISOString().slice(0, 10),
    paidByFounderId: t.paidByFounderId ? String(t.paidByFounderId) : null,
    counterpartyFounderId: t.counterpartyFounderId ? String(t.counterpartyFounderId) : null,
    categoryId: t.categoryId ? String(t.categoryId) : null,
  }));
  const body = buildDashboard({ result: l.result, txs, founderNames: l.names, categoryNames, founderMeta: l.founderMeta, recentLimit: settings.values.dashboard.recentTransactionsCount, filters: { from: q.from, to: q.to, founderId: q.founderId, categoryId: q.categoryId } });
  const recurring = await listRecurring({ status: 'active', limit: settings.values.dashboard.upcomingRecurringCount });
  res.json({
    calculatedAt: l.calculatedAt,
    currency: { code: getEnv().CURRENCY_CODE, minorUnits: getEnv().CURRENCY_MINOR_UNITS },
    filters: { from: q.from ?? null, to: q.to ?? null, founderId: q.founderId ?? null, categoryId: q.categoryId ?? null },
    ...body,
    upcomingRecurring: { items: recurring.items, summary: recurring.summary, today: recurring.today },
  });
}));
