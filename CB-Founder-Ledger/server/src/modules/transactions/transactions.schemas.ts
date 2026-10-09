import { z } from 'zod';
import { MAX_SHARES, MAX_SPLIT_ENTRIES } from '../../domain/splits';
import { CREATABLE_STATUSES, TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../../domain/transactionRules';

export const objectIdString = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
export const idParams = z.object({ id: objectIdString }).strict();

const founderRef = objectIdString;
const entries = <T extends z.ZodRawShape>(shape: T) =>
  z.array(z.object({ founderId: founderRef, ...shape }).strict()).min(1, 'Select at least one founder').max(MAX_SPLIT_ENTRIES);

/** Shape-level validation of a split definition. Totals and allocation are checked by domain/splits.ts. */
export const splitSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('equal'), entries: entries({}) }).strict(),
  z.object({ method: z.literal('percentage'), entries: entries({ percent: z.number().gt(0).lte(100) }) }).strict(),
  z.object({ method: z.literal('exact'), entries: entries({ amountMinor: z.number().int().min(1).max(1e12) }) }).strict(),
  z.object({ method: z.literal('shares'), entries: entries({ shares: z.number().int().min(1).max(MAX_SHARES) }) }).strict(),
  z.object({ method: z.literal('custom'), entries: entries({ amountMinor: z.number().int().min(0).max(1e12), note: z.string().trim().max(200).optional() }) }).strict(),
]);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && d.getUTCFullYear() >= 2000 && d.getUTCFullYear() <= 2100;
  }, 'Enter a valid date');

export const amountMinor = z.number().int('Amount must be a whole number of minor units').min(1, 'Amount must be greater than 0').max(1e12, 'Amount is too large');

const contentShape = {
  type: z.enum(TRANSACTION_TYPES),
  amountMinor,
  transactionDate: dateString,
  description: z.string().trim().min(1, 'Description is required').max(200),
  notes: z.string().trim().max(2000).optional(),
  method: z.string().trim().max(50).optional(),
  reimbursesTransactionId: objectIdString.optional(),
  categoryId: objectIdString.optional(),
  paidByFounderId: objectIdString.optional(),
  counterpartyFounderId: objectIdString.optional(),
  split: splitSchema.optional(),
};

/** Everything that describes a transaction (used for create and for validating a merged edit). */
export const contentSchema = z.object(contentShape).strict();
export type TransactionContent = z.infer<typeof contentSchema>;

export const createSchema = z.object({ ...contentShape, status: z.enum(CREATABLE_STATUSES).default('pending_approval'), clientRequestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'Invalid request id').optional() }).strict();

const nullable = { notes: contentShape.notes.nullable(), method: contentShape.method.nullable(), reimbursesTransactionId: contentShape.reimbursesTransactionId.nullable(), categoryId: contentShape.categoryId.nullable(), paidByFounderId: contentShape.paidByFounderId.nullable(), counterpartyFounderId: contentShape.counterpartyFounderId.nullable(), split: splitSchema.nullable() };

/** `null` clears an optional field. `status` is deliberately not editable here (use /submit, /void). */
export const patchSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    type: contentShape.type,
    amountMinor,
    transactionDate: dateString,
    description: contentShape.description,
    ...nullable,
  })
  .partial()
  .required({ expectedVersion: true })
  .strict()
  .refine((v) => Object.keys(v).length > 1, 'Provide at least one field to change');

export const versionOnlySchema = z.object({ expectedVersion: z.number().int().min(1) }).strict();
export const decisionBodySchema = z.object({ expectedVersion: z.number().int().min(1), comment: z.string().trim().max(500).optional() }).strict();
export const voidBodySchema = z.object({ expectedVersion: z.number().int().min(1), reason: z.string().trim().min(5, 'Please give a reason (at least 5 characters)').max(500) }).strict();
export const previewSchema = z.object({ amountMinor, split: splitSchema }).strict();

export const SORT_FIELDS = ['transactionDate', 'amountMinor', 'createdAt', 'txnNumber'] as const;

export const listQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    type: z.enum(TRANSACTION_TYPES).optional(),
    status: z.enum(TRANSACTION_STATUSES).optional(),
    categoryId: objectIdString.optional(),
    paidByFounderId: objectIdString.optional(),
    dateFrom: dateString.optional(),
    dateTo: dateString.optional(),
    hasReceipt: z.enum(['true', 'false']).optional(),
    sort: z.enum(SORT_FIELDS).default('transactionDate'),
    order: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();
export type ListQuery = z.infer<typeof listQuerySchema>;

/** Eligible expenses for the reimbursement picker. `forReimbursementId` lets an edit keep its own current target selectable. */
export const reimbursableQuerySchema = z.object({ paidByFounderId: objectIdString, forReimbursementId: objectIdString.optional() }).strict();
