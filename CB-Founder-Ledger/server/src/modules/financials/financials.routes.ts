import { Router } from 'express';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { idParams } from '../transactions/transactions.schemas';
import { mountRecordSettlement } from './settlements.record';
import { founderHistory, loadCalculation, recommendationsView, settlementSummary } from './financials.service';

/** Read-only. All financial values are computed by the server; there is nothing a client can submit. */
const noQuery = z.object({}).strict();
/** Engine position + presentation fields (role, photograph) + the founder-funded expense amount (expenses paid − reimbursed by the business). */
export function enrichPosition(l: import('./financials.service').Loaded, p: import('../../domain/calculationEngine').FounderFinancialPosition) {
  const meta = l.founderMeta.get(p.founderId);
  return { ...p, role: meta?.role ?? null, photoUrl: meta?.photoUrl ?? null, founderFundedExpenseMinor: p.expensePaidMinor - p.reimbursedMinor };
}

const currency = () => ({ code: getEnv().CURRENCY_CODE, minorUnits: getEnv().CURRENCY_MINOR_UNITS });

// Mounted BEFORE the Phase 1 founders router so `/financial-positions` is not read as an `:id`.
export const founderFinancialsRouter = Router();

founderFinancialsRouter.get('/financial-positions', authenticate, validate(noQuery, 'query'), asyncHandler(async (_req, res) => {
  const l = await loadCalculation();
  res.json({ calculatedAt: l.calculatedAt, currency: currency(), positions: l.result.founders.map((p) => enrichPosition(l, p)), reconciliation: l.result.reconciliation, included: l.result.included, excluded: l.result.excluded, warnings: l.result.warnings });
}));

founderFinancialsRouter.get('/:id/financial-position', authenticate, validate(idParams, 'params'), validate(noQuery, 'query'), asyncHandler(async (req, res) => {
  const id = (req.params as { id: string }).id;
  const l = await loadCalculation();
  const position = l.result.founders.find((p) => p.founderId === id);
  if (!position) throw AppError.notFound('Founder not found');
  res.json({
    calculatedAt: l.calculatedAt, currency: currency(), position: enrichPosition(l, position), history: founderHistory(l, id), reconciliation: l.result.reconciliation,
    warnings: l.result.warnings,
  });
}));

export const settlementsRouter = Router();
settlementsRouter.use(authenticate);
mountRecordSettlement(settlementsRouter);

settlementsRouter.get('/recommendations', validate(noQuery, 'query'), asyncHandler(async (_req, res) => {
  const l = await loadCalculation();
  const r = l.result.reconciliation;
  res.json({
    calculatedAt: l.calculatedAt, currency: currency(), recommendations: recommendationsView(l),
    unresolvedPayableMinor: r.unresolvedPayableMinor, unresolvedReceivableMinor: r.unresolvedReceivableMinor, reconciliation: r,
  });
}));

settlementsRouter.get('/summary', validate(noQuery, 'query'), asyncHandler(async (_req, res) => {
  const l = await loadCalculation();
  res.json({ calculatedAt: l.calculatedAt, currency: currency(), ...settlementSummary(l), reconciliation: l.result.reconciliation, warnings: l.result.warnings });
}));
