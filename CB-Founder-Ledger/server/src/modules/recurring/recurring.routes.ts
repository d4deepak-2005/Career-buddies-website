import { Router, type RequestHandler } from 'express';
import { trusted } from 'mongoose';
import { z } from 'zod';
import { advanceDueDate, dueState, isRealDate, monthlyCommitmentMinor, todayIn, type Frequency } from '../../domain/recurrence';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { AppError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { writeRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { Category } from '../../models/Category';
import { Founder } from '../../models/Founder';
import { FREQUENCIES, RECURRING_STATUSES, RecurringPayment, type RecurringDoc } from '../../models/RecurringPayment';
import { Transaction } from '../../models/Transaction';
import { loadSettings } from '../settings/settings.service';
import { amountMinor, idParams, objectIdString } from '../transactions/transactions.schemas';
import * as svc from '../transactions/transactions.service';

type Stored = RecurringDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date };

const dateString = z.string().refine(isRealDate, 'Enter a valid date (YYYY-MM-DD)');
const fields = {
  provider: z.string().trim().min(1).max(120),
  description: z.string().trim().max(200).optional(),
  amountMinor,
  frequency: z.enum(FREQUENCIES),
  nextDueDate: dateString,
  paidByFounderId: objectIdString,
  categoryId: objectIdString,
  splitFounderIds: z.array(objectIdString).min(1).max(20).refine((a) => new Set(a).size === a.length, 'A founder can only be listed once'),
  notes: z.string().trim().max(500).optional(),
};
const createSchema = z.object(fields).strict();
const patchSchema = z.object({ ...fields, expectedVersion: z.number().int().min(1) }).partial().required({ expectedVersion: true }).strict()
  .refine((v) => Object.keys(v).length > 1, 'Provide at least one field to change');
const versionBody = z.object({ expectedVersion: z.number().int().min(1) }).strict();
const recordBody = z.object({ dueDate: dateString, transactionDate: dateString.optional(), clientRequestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional() }).strict();
const listQuery = z.object({ status: z.enum(RECURRING_STATUSES).optional() }).strict();

let limiter: RequestHandler | undefined;
const limitWrites: RequestHandler = (req, res, next) => (limiter ??= writeRateLimiter())(req, res, next);

const conflict = () => new AppError(409, 'VERSION_CONFLICT', 'This recurring payment was changed by someone else. Reload to see the latest version.');

async function validateRefs(v: { paidByFounderId?: string | undefined; categoryId?: string | undefined; splitFounderIds?: string[] | undefined }) {
  const issues: Array<{ path: string; message: string }> = [];
  const ids = [...new Set([v.paidByFounderId, ...(v.splitFounderIds ?? [])].filter((x): x is string => !!x))];
  if (ids.length) {
    const found = await Founder.find({ _id: trusted({ $in: ids }) }).select('active').lean();
    const m = new Map(found.map((f) => [String(f._id), f.active]));
    if (v.paidByFounderId && m.get(v.paidByFounderId) !== true) issues.push({ path: 'paidByFounderId', message: m.has(v.paidByFounderId) ? 'Founder is inactive' : 'Founder does not exist' });
    (v.splitFounderIds ?? []).forEach((id, i) => { if (m.get(id) !== true) issues.push({ path: `splitFounderIds.${i}`, message: m.has(id) ? 'Founder is inactive' : 'Founder does not exist' }); });
  }
  if (v.categoryId) {
    const c = await Category.findById(v.categoryId).select('active').lean();
    if (!c) issues.push({ path: 'categoryId', message: 'Category does not exist' });
    else if (!c.active) issues.push({ path: 'categoryId', message: 'Category is inactive' });
  }
  if (issues.length) throw new AppError(400, 'VALIDATION_ERROR', 'Recurring payment validation failed', issues);
}

export async function listRecurring(opts: { status?: string | undefined; limit?: number | undefined; today?: string | undefined } = {}) {
  const settings = (await loadSettings()).values;
  const today = opts.today ?? todayIn(settings.regional.timeZone);
  const filter = opts.status ? { status: opts.status } : {};
  const docs = await RecurringPayment.find(filter).sort({ nextDueDate: 1, _id: 1 }).lean<Stored[]>();
  const founderIds = [...new Set(docs.flatMap((d) => [String(d.paidByFounderId), ...d.splitFounderIds.map(String)]))];
  const [founders, cats] = await Promise.all([
    Founder.find({ _id: trusted({ $in: founderIds }) }).select('name').lean(),
    Category.find({ _id: trusted({ $in: [...new Set(docs.map((d) => String(d.categoryId)))] }) }).select('name').lean(),
  ]);
  const fn = new Map(founders.map((f) => [String(f._id), f.name]));
  const cn = new Map(cats.map((c) => [String(c._id), c.name]));
  const items = docs.map((d) => ({
    id: String(d._id), provider: d.provider, description: d.description ?? null, amountMinor: d.amountMinor, frequency: d.frequency as Frequency,
    nextDueDate: d.nextDueDate, status: d.status, notes: d.notes ?? null, version: d.version,
    paidBy: { id: String(d.paidByFounderId), name: fn.get(String(d.paidByFounderId)) ?? 'Unknown' },
    category: { id: String(d.categoryId), name: cn.get(String(d.categoryId)) ?? 'Unknown' },
    splitFounders: d.splitFounderIds.map((id) => ({ id: String(id), name: fn.get(String(id)) ?? 'Unknown' })),
    dueState: d.status === 'active' ? dueState(d.nextDueDate, today, settings.recurring.reminderDaysAhead) : null,
  }));
  const active = items.filter((i) => i.status === 'active');
  return {
    today, reminderDaysAhead: settings.recurring.reminderDaysAhead, items: opts.limit ? items.filter((i) => i.status === 'active').slice(0, opts.limit) : items,
    summary: {
      activeCount: active.length, pausedCount: items.filter((i) => i.status === 'paused').length,
      monthlyCommitmentMinor: monthlyCommitmentMinor(active),
      overdueCount: active.filter((i) => i.dueState === 'overdue').length, dueSoonCount: active.filter((i) => i.dueState === 'due_soon').length,
    },
  };
}

export const recurringRouter = Router();
recurringRouter.use(authenticate);

recurringRouter.get('/', validate(listQuery, 'query'), asyncHandler(async (req, res) => {
  res.json(await listRecurring({ status: (req.query as z.infer<typeof listQuery>).status }));
}));

recurringRouter.post('/', limitWrites, validate(createSchema), asyncHandler(async (req, res) => {
  const b = req.body as z.infer<typeof createSchema>;
  await validateRefs(b);
  const doc = await RecurringPayment.create({ ...b, anchorDay: Number(b.nextDueDate.slice(8, 10)), createdBy: req.auth!.id, updatedBy: req.auth!.id });
  await audit(req.auth!, { action: 'RECURRING_CREATED', entityType: 'recurring', entityId: String(doc._id), summary: `Recurring payment added: ${doc.provider}`, after: { provider: doc.provider, amountMinor: doc.amountMinor, frequency: doc.frequency, nextDueDate: doc.nextDueDate } });
  res.status(201).json({ recurring: (await listRecurring()).items.find((i) => i.id === String(doc._id)) });
}));

recurringRouter.patch('/:id', limitWrites, validate(idParams, 'params'), validate(patchSchema), asyncHandler(async (req, res) => {
  const id = (req.params as { id: string }).id;
  const { expectedVersion, ...changes } = req.body as z.infer<typeof patchSchema>;
  const existing = await RecurringPayment.findById(id).lean<Stored>();
  if (!existing) throw AppError.notFound('Recurring payment not found');
  if (existing.status === 'cancelled') throw new AppError(409, 'NOT_EDITABLE', 'A cancelled recurring payment cannot be edited');
  await validateRefs(changes);
  const set: Record<string, unknown> = { ...changes, updatedBy: req.auth!.id };
  if (changes.nextDueDate) set['anchorDay'] = Number(changes.nextDueDate.slice(8, 10));
  const updated = await RecurringPayment.findOneAndUpdate({ _id: id, version: expectedVersion, status: trusted({ $ne: 'cancelled' }) }, { $set: set, $inc: { version: 1 } }, { new: true }).lean<Stored>();
  if (!updated) throw conflict();
  await audit(req.auth!, { action: 'RECURRING_UPDATED', entityType: 'recurring', entityId: id, summary: `Recurring payment updated: ${updated.provider}`,
    before: { provider: existing.provider, amountMinor: existing.amountMinor, frequency: existing.frequency, nextDueDate: existing.nextDueDate }, after: { provider: updated.provider, amountMinor: updated.amountMinor, frequency: updated.frequency, nextDueDate: updated.nextDueDate } });
  res.json({ recurring: (await listRecurring()).items.find((i) => i.id === id) });
}));

const transition = (action: 'pause' | 'resume' | 'cancel', from: string[], to: 'paused' | 'active' | 'cancelled'): RequestHandler => asyncHandler(async (req, res) => {
  const id = (req.params as { id: string }).id;
  const { expectedVersion } = req.body as z.infer<typeof versionBody>;
  const existing = await RecurringPayment.findById(id).lean<Stored>();
  if (!existing) throw AppError.notFound('Recurring payment not found');
  if (!from.includes(existing.status)) throw new AppError(409, 'INVALID_TRANSITION', `Cannot ${action} a ${existing.status} recurring payment`);
  const updated = await RecurringPayment.findOneAndUpdate({ _id: id, version: expectedVersion, status: trusted({ $in: from }) }, { $set: { status: to, updatedBy: req.auth!.id }, $inc: { version: 1 } }, { new: true }).lean<Stored>();
  if (!updated) throw conflict();
  await audit(req.auth!, { action: `RECURRING_${action.toUpperCase()}`, entityType: 'recurring', entityId: id, summary: `Recurring payment ${to}: ${updated.provider}`, before: { status: existing.status }, after: { status: to } });
  res.json({ recurring: (await listRecurring()).items.find((i) => i.id === id) });
});
recurringRouter.post('/:id/pause', limitWrites, validate(idParams, 'params'), validate(versionBody), transition('pause', ['active'], 'paused'));
recurringRouter.post('/:id/resume', limitWrites, validate(idParams, 'params'), validate(versionBody), transition('resume', ['paused'], 'active'));
recurringRouter.post('/:id/cancel', limitWrites, validate(idParams, 'params'), validate(versionBody), transition('cancel', ['active', 'paused'], 'cancelled'));

/**
 * Record the payment for ONE due date. This is a deliberate human action (nothing is recorded because a date arrived).
 * It creates an ordinary PENDING Business Expense; the unique `recurringKey` makes recording the same occurrence twice impossible,
 * and the schedule then advances to the next due date. Idempotent: repeating the call returns the existing record.
 */
recurringRouter.post('/:id/record', limitWrites, validate(idParams, 'params'), validate(recordBody), asyncHandler(async (req, res) => {
  const id = (req.params as { id: string }).id;
  const b = req.body as z.infer<typeof recordBody>;
  const rec = await RecurringPayment.findById(id).lean<Stored>();
  if (!rec) throw AppError.notFound('Recurring payment not found');
  if (rec.status !== 'active') throw new AppError(409, 'NOT_ACTIVE', `A ${rec.status} recurring payment cannot be recorded. Resume it first.`);
  const key = `${id}:${b.dueDate}`;
  const advance = async () => {
    const next = advanceDueDate(rec.nextDueDate, rec.anchorDay, rec.frequency as Frequency);
    await RecurringPayment.updateOne({ _id: id, nextDueDate: rec.nextDueDate, status: 'active' }, { $set: { nextDueDate: next, updatedBy: req.auth!.id }, $inc: { version: 1 } });
  };
  const existing = await Transaction.findOne({ recurringKey: key }).lean();
  if (existing) {
    if (b.dueDate === rec.nextDueDate) await advance(); // heal: the occurrence was recorded but the schedule did not move
    const [h] = await svc.hydrate([existing as never]);
    res.status(200).json({ transaction: h, replayed: true });
    return;
  }
  if (b.dueDate !== rec.nextDueDate) throw new AppError(409, 'NOT_THE_NEXT_DUE_DATE', `The next payment due is ${rec.nextDueDate}`, { nextDueDate: rec.nextDueDate });
  let tx;
  try {
    tx = await svc.createTransaction({
      type: 'business_expense', amountMinor: rec.amountMinor, transactionDate: b.transactionDate ?? b.dueDate,
      description: `${rec.provider}${rec.description ? ` — ${rec.description}` : ''}`.slice(0, 200), notes: `Recurring payment due ${b.dueDate}`,
      categoryId: String(rec.categoryId), paidByFounderId: String(rec.paidByFounderId),
      split: { method: 'equal', entries: rec.splitFounderIds.map((f) => ({ founderId: String(f) })) },
    }, 'pending_approval', req.auth!, { clientRequestId: b.clientRequestId, recurring: { id, dueDate: b.dueDate } });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw new AppError(409, 'ALREADY_RECORDED', 'This occurrence has already been recorded');
    throw err;
  }
  await advance();
  await audit(req.auth!, { action: 'RECURRING_RECORDED', entityType: 'recurring', entityId: id, summary: `Payment recorded for ${rec.provider} (due ${b.dueDate}) as ${tx.txnNumber}`, after: { transactionId: String(tx._id), dueDate: b.dueDate } });
  const [h] = await svc.hydrate([await svc.loadOr404(String(tx._id))]);
  res.status(201).json({ transaction: h });
}));
