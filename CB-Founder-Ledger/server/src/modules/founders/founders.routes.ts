import { randomBytes } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { AppError } from '../../lib/errors';
import { authenticate, requireRole } from '../../middleware/auth';
import { uploadRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { FOUNDER_ORDER, Founder } from '../../models/Founder';
import { getBrandingStorage } from '../../storage/brandingStorage';
import { readImageUpload } from '../settings/settings.routes';

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id');

const fields = {
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  userId: objectId.optional(),
  defaultSharePercent: z.number().min(0).max(100).optional(),
  role: z.string().trim().max(60).optional(),
};

const createSchema = z.object({ ...fields, active: z.boolean().default(true) }).strict();

// No defaults on update: an empty PATCH must stay empty (and be rejected).
const updateSchema = z.object({ ...fields, active: z.boolean() }).partial().strict()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');

const orderSchema = z.object({ ids: z.array(objectId).min(1).max(100) }).strict();
const idParams = z.object({ id: objectId });
const photoQuery = z.object({ v: z.string().regex(/^\d{1,13}$/).optional() }).strict();

type FounderLike = { _id: unknown; name: string; email?: string | null; userId?: unknown; defaultSharePercent?: number | null; active: boolean; role?: string | null; displayOrder?: number | null; photo?: { key: string; updatedAt: Date } | null };

export function publicFounder(f: FounderLike) {
  return {
    id: String(f._id),
    name: f.name,
    email: f.email ?? null,
    userId: f.userId ? String(f.userId) : null,
    defaultSharePercent: f.defaultSharePercent ?? null,
    active: f.active,
    role: f.role ?? null,
    displayOrder: f.displayOrder ?? 1000,
    hasPhoto: !!f.photo,
    photoUrl: f.photo ? `/api/founders/${String(f._id)}/photo?v=${f.photo.updatedAt.getTime()}` : null,
  };
}

/** The attributes that matter for the audit trail (never anything secret). */
const auditView = (f: FounderLike) => ({ name: f.name, role: f.role ?? null, active: f.active, email: f.email ?? null, defaultSharePercent: f.defaultSharePercent ?? null, displayOrder: f.displayOrder ?? 1000, hasPhoto: !!f.photo });

let limiter: RequestHandler | undefined;
const limitUploads: RequestHandler = (req, res, next) => (limiter ??= uploadRateLimiter())(req, res, next);

export const foundersRouter = Router();
foundersRouter.use(authenticate);

// Any authenticated founder/admin may read. Order is always the configured display order.
foundersRouter.get('/', asyncHandler(async (_req, res) => {
  const founders = await Founder.find().sort(FOUNDER_ORDER).lean();
  res.json({ founders: founders.map(publicFounder) });
}));

foundersRouter.get('/:id', validate(idParams, 'params'), asyncHandler(async (req, res) => {
  const founder = await Founder.findById((req.params as z.infer<typeof idParams>).id).lean();
  if (!founder) throw AppError.notFound('Founder not found');
  res.json({ founder: publicFounder(founder) });
}));

// Authenticated, streamed photograph (founder photos are personal data: no public URL).
foundersRouter.get('/:id/photo', validate(idParams, 'params'), validate(photoQuery, 'query'), asyncHandler(async (req, res) => {
  const founder = await Founder.findById((req.params as z.infer<typeof idParams>).id).lean();
  if (!founder?.photo) throw AppError.notFound('No photograph');
  const opened = await getBrandingStorage(getEnv().BRANDING_STORAGE_DIR).open(founder.photo.key);
  if (!opened) throw AppError.notFound('Photograph is not available');
  res.setHeader('Content-Type', founder.photo.mime);
  res.setHeader('Content-Length', String(opened.size));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  opened.stream.on('error', () => res.destroy());
  opened.stream.pipe(res);
}));

// Only admins may write. Founders are deactivated (active=false), never deleted.
foundersRouter.post('/', requireRole('admin'), validate(createSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const last = await Founder.findOne().sort({ displayOrder: -1 }).select('displayOrder').lean();
  const founder = await Founder.create({ ...body, displayOrder: Math.max((last?.displayOrder ?? -1) + 1, 0) });
  await audit(req.auth!, { action: 'FOUNDER_CREATED', entityType: 'founder', entityId: String(founder._id), summary: `Founder added: ${founder.name}`, after: auditView(founder) });
  res.status(201).json({ founder: publicFounder(founder) });
}));

// Fixed path before "/:id" patterns: the complete display order, as a list of every founder id.
foundersRouter.put('/order', requireRole('admin'), validate(orderSchema), asyncHandler(async (req, res) => {
  const { ids } = req.body as z.infer<typeof orderSchema>;
  const all = await Founder.find().select('_id displayOrder name').sort(FOUNDER_ORDER).lean();
  const known = new Set(all.map((f) => String(f._id)));
  if (new Set(ids).size !== ids.length || ids.length !== known.size || !ids.every((i) => known.has(i))) {
    throw new AppError(400, 'INVALID_ORDER', 'Send every founder id exactly once');
  }
  const before = all.map((f) => ({ id: String(f._id), name: f.name }));
  await Founder.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { displayOrder: i } } } })));
  const names = new Map(all.map((f) => [String(f._id), f.name]));
  await audit(req.auth!, { action: 'FOUNDER_REORDERED', entityType: 'founder', summary: 'Founder display order changed', before: before.map((b) => b.name), after: ids.map((i) => names.get(i)) });
  const founders = await Founder.find().sort(FOUNDER_ORDER).lean();
  res.json({ founders: founders.map(publicFounder) });
}));

foundersRouter.patch('/:id', requireRole('admin'), validate(idParams, 'params'), validate(updateSchema), asyncHandler(async (req, res) => {
  const id = (req.params as z.infer<typeof idParams>).id;
  const before = await Founder.findById(id).lean();
  if (!before) throw AppError.notFound('Founder not found');
  const founder = await Founder.findByIdAndUpdate(id, { $set: req.body as z.infer<typeof updateSchema> }, { new: true, runValidators: true }).lean();
  if (!founder) throw AppError.notFound('Founder not found');
  await audit(req.auth!, { action: 'FOUNDER_UPDATED', entityType: 'founder', entityId: id, summary: `Founder updated: ${founder.name}`, before: auditView(before), after: auditView(founder) });
  res.json({ founder: publicFounder(founder) });
}));

foundersRouter.put('/:id/photo', requireRole('admin'), limitUploads, validate(idParams, 'params'), asyncHandler(async (req, res) => {
  const id = (req.params as z.infer<typeof idParams>).id;
  const existing = await Founder.findById(id).lean();
  if (!existing) throw AppError.notFound('Founder not found');
  const img = await readImageUpload(req, res);
  const key = `founder-${id}-${randomBytes(6).toString('hex')}.${img.ext}`;
  const storage = getBrandingStorage(getEnv().BRANDING_STORAGE_DIR);
  await storage.put(key, img.buffer);
  try {
    const founder = await Founder.findByIdAndUpdate(id, { $set: { photo: { key, mime: img.mime, updatedAt: new Date() } } }, { new: true }).lean();
    if (existing.photo?.key) await storage.remove(existing.photo.key).catch(() => undefined);
    await audit(req.auth!, { action: 'FOUNDER_PHOTO_CHANGED', entityType: 'founder', entityId: id, summary: `Photograph updated: ${existing.name}`, before: { hasPhoto: !!existing.photo }, after: { hasPhoto: true } });
    res.json({ founder: publicFounder(founder!) });
  } catch (err) {
    await storage.remove(key).catch(() => undefined);
    throw err;
  }
}));

foundersRouter.delete('/:id/photo', requireRole('admin'), validate(idParams, 'params'), asyncHandler(async (req, res) => {
  const id = (req.params as z.infer<typeof idParams>).id;
  const existing = await Founder.findById(id).lean();
  if (!existing) throw AppError.notFound('Founder not found');
  const founder = await Founder.findByIdAndUpdate(id, { $unset: { photo: 1 } }, { new: true }).lean();
  if (existing.photo?.key) await getBrandingStorage(getEnv().BRANDING_STORAGE_DIR).remove(existing.photo.key).catch(() => undefined);
  await audit(req.auth!, { action: 'FOUNDER_PHOTO_CHANGED', entityType: 'founder', entityId: id, summary: `Photograph removed: ${existing.name}`, before: { hasPhoto: !!existing.photo }, after: { hasPhoto: false } });
  res.json({ founder: publicFounder(founder!) });
}));
