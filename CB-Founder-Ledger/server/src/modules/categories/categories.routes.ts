import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { audit } from '../../lib/audit';
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

function publicCategory(c: { _id: unknown; name: string; slug: string; description?: string | null; active: boolean; isDevSeed?: boolean; sortOrder?: number | null }) {
  return { id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? null, active: c.active, isDevSeed: c.isDevSeed ?? false, sortOrder: c.sortOrder ?? 1000 };
}

export const categoriesRouter = Router();
categoriesRouter.use(authenticate);

categoriesRouter.get('/', asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ categories: categories.map(publicCategory) });
}));

categoriesRouter.post('/', requireRole('admin'), validate(createSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const slug = slugify(body.name);
  if (!slug) throw AppError.badRequest('Category name must contain letters or numbers');
  const last = await Category.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
  const category = await Category.create({ ...body, slug, sortOrder: Math.max((last?.sortOrder ?? -1) + 1, 0) });
  await audit(req.auth!, { action: 'CATEGORY_CREATED', entityType: 'category', entityId: String(category._id), summary: `Category added: ${category.name}`, after: { name: category.name, active: category.active } });
  res.status(201).json({ category: publicCategory(category) });
}));

categoriesRouter.put('/order', requireRole('admin'), validate(z.object({ ids: z.array(z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id')).min(1).max(500) }).strict()), asyncHandler(async (req, res) => {
  const { ids } = req.body as { ids: string[] };
  const all = await Category.find().select('_id name').sort({ sortOrder: 1, name: 1 }).lean();
  const known = new Set(all.map((c) => String(c._id)));
  if (new Set(ids).size !== ids.length || ids.length !== known.size || !ids.every((i) => known.has(i))) throw new AppError(400, 'INVALID_ORDER', 'Send every category id exactly once');
  await Category.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { sortOrder: i } } } })));
  const names = new Map(all.map((c) => [String(c._id), c.name]));
  await audit(req.auth!, { action: 'CATEGORY_REORDERED', entityType: 'category', summary: 'Category display order changed', before: all.map((c) => c.name), after: ids.map((i) => names.get(i)) });
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  res.json({ categories: categories.map(publicCategory) });
}));

categoriesRouter.patch('/:id', requireRole('admin'), validate(idParams, 'params'), validate(updateSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof updateSchema>;
  const update: Record<string, unknown> = { ...body };
  if (body.name) {
    update['slug'] = slugify(body.name);
    if (!update['slug']) throw AppError.badRequest('Category name must contain letters or numbers');
  }
  const id = (req.params as z.infer<typeof idParams>).id;
  const before = await Category.findById(id).lean();
  const category = await Category.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!category || !before) throw AppError.notFound('Category not found');
  await audit(req.auth!, { action: 'CATEGORY_UPDATED', entityType: 'category', entityId: id, summary: `Category updated: ${category.name}`, before: { name: before.name, description: before.description, active: before.active }, after: { name: category.name, description: category.description, active: category.active } });
  res.json({ category: publicCategory(category) });
}));
