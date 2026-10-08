import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Category, slugify } from '../../models/Category';

const fields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
};

const createSchema = z.object({ ...fields, active: z.boolean().default(true) }).strict();

// No defaults on update: an empty PATCH must stay empty (and be rejected).
const updateSchema = z.object({ ...fields, active: z.boolean() }).partial().strict()
  .refine((v) => Object.keys(v).length > 0, 'At least one field is required');

const idParams = z.object({ id: z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id') });

function publicCategory(c: { _id: unknown; name: string; slug: string; description?: string | null; active: boolean; isDevSeed?: boolean }) {
  return { id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? null, active: c.active, isDevSeed: c.isDevSeed ?? false };
}

export const categoriesRouter = Router();
categoriesRouter.use(authenticate);

categoriesRouter.get('/', asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ categories: categories.map(publicCategory) });
}));

categoriesRouter.post('/', requireRole('admin'), validate(createSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const slug = slugify(body.name);
  if (!slug) throw AppError.badRequest('Category name must contain letters or numbers');
  const category = await Category.create({ ...body, slug });
  res.status(201).json({ category: publicCategory(category) });
}));

categoriesRouter.patch('/:id', requireRole('admin'), validate(idParams, 'params'), validate(updateSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof updateSchema>;
  const update: Record<string, unknown> = { ...body };
  if (body.name) {
    update['slug'] = slugify(body.name);
    if (!update['slug']) throw AppError.badRequest('Category name must contain letters or numbers');
  }
  const category = await Category.findByIdAndUpdate((req.params as z.infer<typeof idParams>).id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!category) throw AppError.notFound('Category not found');
  res.json({ category: publicCategory(category) });
}));
