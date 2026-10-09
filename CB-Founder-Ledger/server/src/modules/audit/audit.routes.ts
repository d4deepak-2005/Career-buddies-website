import { Router } from 'express';
import { trusted } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AuditEvent } from '../../models/AuditEvent';
import { objectIdString } from '../transactions/transactions.schemas';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), 'Not a real date');
const querySchema = z.object({
  action: z.string().regex(/^[A-Z_]{3,60}$/).optional(),
  entityType: z.string().regex(/^[a-z_]{2,40}$/).optional(),
  entityId: z.string().max(64).regex(/^[A-Za-z0-9_.-]+$/).optional(),
  actorId: objectIdString.optional(),
  from: date.optional(),
  to: date.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const auditRouter = Router();
// Read-only and admin-only: there is no endpoint that can create, change or delete an audit event.
auditRouter.use(authenticate, requireRole('admin'));

auditRouter.get('/', validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof querySchema>;
  const filter: Record<string, unknown> = {};
  if (q.action) filter['action'] = q.action;
  if (q.entityType) filter['entityType'] = q.entityType;
  if (q.entityId) filter['entityId'] = q.entityId;
  if (q.actorId) filter['actorId'] = q.actorId;
  if (q.from || q.to) filter['at'] = trusted({ ...(q.from ? { $gte: new Date(`${q.from}T00:00:00Z`) } : {}), ...(q.to ? { $lt: new Date(new Date(`${q.to}T00:00:00Z`).getTime() + 86_400_000) } : {}) });
  const [total, rows] = await Promise.all([
    AuditEvent.countDocuments(filter),
    AuditEvent.find(filter).sort({ at: -1, _id: -1 }).skip((q.page - 1) * q.pageSize).limit(q.pageSize).lean(),
  ]);
  res.json({
    page: q.page, pageSize: q.pageSize, total,
    items: rows.map((r) => ({
      id: String(r._id), at: r.at, actor: r.actorLabel ?? 'System', actorId: r.actorId ? String(r.actorId) : null, action: r.action,
      entityType: r.entityType, entityId: r.entityId ?? null, summary: r.summary, before: r.before ?? null, after: r.after ?? null, reason: r.reason ?? null,
    })),
  });
}));
