import { Schema, model, type InferSchemaType } from 'mongoose';

export const FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const; // Product Plan §14
export const RECURRING_STATUSES = ['active', 'paused', 'cancelled'] as const;

/**
 * A SCHEDULED OBLIGATION, not an expense. It never changes any balance until someone records a payment
 * (which creates an ordinary pending Business Expense). Changing the amount here never touches past transactions.
 */
const recurringSchema = new Schema(
  {
    provider: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 200 },
    amountMinor: { type: Number, required: true, min: 1, validate: { validator: Number.isSafeInteger, message: 'amountMinor must be an integer' } },
    frequency: { type: String, enum: FREQUENCIES, required: true },
    /** YYYY-MM-DD of the next obligation. */
    nextDueDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    /** Day of month the schedule is anchored to (so Jan 31 -> Feb 28 -> Mar 31 and not drifting to the 28th). */
    anchorDay: { type: Number, required: true, min: 1, max: 31 },
    paidByFounderId: { type: Schema.Types.ObjectId, ref: 'Founder', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    /** Founders sharing each recorded payment equally. */
    splitFounderIds: { type: [Schema.Types.ObjectId], ref: 'Founder', required: true },
    status: { type: String, enum: RECURRING_STATUSES, required: true, default: 'active' },
    notes: { type: String, trim: true, maxlength: 500 },
    version: { type: Number, required: true, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { collection: 'recurring_payments', timestamps: true, versionKey: false },
);
recurringSchema.index({ status: 1, nextDueDate: 1 });

const blocked = (): never => { throw new Error('Recurring payments are cancelled, never deleted'); };
for (const op of ['deleteOne', 'deleteMany', 'findOneAndDelete'] as const) recurringSchema.pre(op as 'deleteOne', blocked);

export type RecurringDoc = InferSchemaType<typeof recurringSchema>;
export const RecurringPayment = model('RecurringPayment', recurringSchema);
