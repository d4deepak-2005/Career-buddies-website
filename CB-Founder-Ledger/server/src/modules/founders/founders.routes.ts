import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Founder } from '../../models/Founder';

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id');

const fields = {
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
  userId: objectId.optional(),
  defaultSharePercent: z.number().min(0).max(100).optional(),
};

const createSchema = z.object({ ...fields, active: z.boolean().default(true) }).strict();

// No defaults on update: an empty PATCH must stay empty (and be rejected).
const updateSchema = z.object({ ...fields, active: z.boolean() }).partial().strict()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');

const idParams = z.object({ id: objectId });

function publicFounder(f: { _id: unknown; name: string; email?: string | null; userId?: unknown; defaultSharePercent?: number | null; active: boolean }) {
  return {
    id: String(f._id),
    name: f.name,
    email: f.email ?? null,
    userId: f.userId ? String(f.userId) : null,
    defaultSharePercent: f.defaultSharePercent ?? null,
    active: f.active,
  };
}

export const foundersRouter = Router();
foundersRouter.use(authenticate);

// Any authenticated founder/admin may read.
foundersRouter.get('/', asyncHandler(async (_req, res) => {
  const founders = await Founder.find().sort({ createdAt: 1 }).lean();
  res.json({ founders: founders.map(publicFounder) });
}));

foundersRouter.get('/:id', validate(idParams, 'params'), asyncHandler(async (req, res) => {
  const founder = await Founder.findById((req.params as z.infer<typeof idParams>).id).lean();
  if (!founder) throw AppError.notFound('Founder not found');
  res.json({ founder: publicFounder(founder) });
}));

// Only admins may write. Founders are deactivated (active=false), never deleted.
foundersRouter.post('/', requireRole('admin'), validate(createSchema), asyncHandler(async (req, res) => {
  const founder = await Founder.create(req.body as z.infer<typeof createSchema>);
  res.status(201).json({ founder: publicFounder(founder) });
}));

foundersRouter.patch('/:id', requireRole('admin'), validate(idParams, 'params'), validate(updateSchema), asyncHandler(async (req, res) => {
  const founder = await Founder.findByIdAndUpdate(
    (req.params as z.infer<typeof idParams>).id,
    { $set: req.body as z.infer<typeof updateSchema> },
    { new: true, runValidators: true },
  ).lean();
  if (!founder) throw AppError.notFound('Founder not found');
  res.json({ founder: publicFounder(founder) });
}));
