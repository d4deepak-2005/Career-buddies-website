import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { audit } from '../../lib/audit';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { PASSWORD_MIN_LENGTH, hashPassword } from '../../lib/password';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ROLES, USER_STATUSES, User } from '../../models/User';

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128);

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(120),
  password: passwordSchema,
  role: z.enum(ROLES).default('founder'),
}).strict();

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
}).strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required');

const idParams = z.object({ id: z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id') });

function publicUser(u: { _id: unknown; email: string; name: string; role: string; status: string; lastLoginAt?: Date | null }) {
  return { id: String(u._id), email: u.email, name: u.name, role: u.role, status: u.status, lastLoginAt: u.lastLoginAt ?? null };
}

export const usersRouter = Router();
usersRouter.use(authenticate, requireRole('admin'));

usersRouter.get('/', asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 }).lean();
  res.json({ users: users.map(publicUser) });
}));

usersRouter.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const user = await User.create({
    email: body.email,
    name: body.name,
    role: body.role,
    passwordHash: await hashPassword(body.password, getEnv().BCRYPT_COST),
  });
  await audit(req.auth!, { action: 'USER_CREATED', entityType: 'user', entityId: String(user._id), summary: `User created: ${user.email} (${user.role})`, after: { email: user.email, name: user.name, role: user.role } });
  res.status(201).json({ user: publicUser(user) });
}));

usersRouter.patch('/:id', validate(idParams, 'params'), validate(updateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as z.infer<typeof idParams>;
  const body = req.body as z.infer<typeof updateSchema>;
  if (id === req.auth?.id && (body.role === 'founder' || body.status === 'disabled')) {
    throw AppError.badRequest('You cannot demote or disable your own account');
  }
  const update: Record<string, unknown> = { ...body };
  // Changing role/status invalidates existing refresh sessions.
  if (body.role || body.status === 'disabled') update['sessions'] = [];
  const before = await User.findById(id).lean();
  const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!user || !before) throw AppError.notFound('User not found');
  await audit(req.auth!, { action: body.role || body.status ? 'PERMISSION_CHANGED' : 'USER_UPDATED', entityType: 'user', entityId: id, summary: `User updated: ${user.email}`, before: { name: before.name, role: before.role, status: before.status }, after: { name: user.name, role: user.role, status: user.status } });
  res.json({ user: publicUser(user) });
}));
