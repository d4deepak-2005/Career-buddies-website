import { Schema, model, type InferSchemaType } from 'mongoose';
import { SPLIT_METHODS } from '../domain/splits';
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../domain/transactionRules';

const splitEntrySchema = new Schema(
  {
    founderId: { type: Schema.Types.ObjectId, ref: 'Founder', required: true },
    percent: { type: Number },
    shares: { type: Number },
    amountMinor: { type: Number },
    note: { type: String, maxlength: 200 },
    /** Resolved responsibility for THIS transaction (recomputed on every write). Not a balance. */
    allocatedMinor: { type: Number, required: true },
  },
  { _id: false },
);

const splitSchema = new Schema(
  {
    method: { type: String, enum: SPLIT_METHODS, required: true },
    entries: { type: [splitEntrySchema], required: true },
  },
  { _id: false },
);

const voidSchema = new Schema(
  {
    reason: { type: String, required: true, maxlength: 500 },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voidedAt: { type: Date, required: true },
  },
  { _id: false },
);

const transactionSchema = new Schema(
  {
    /** Human-readable unique id, e.g. TXN-000042. */
    txnNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    /** Integer minor units (e.g. paise). Currency is configuration, not stored per calculation. */
    amountMinor: { type: Number, required: true, min: 1, validate: { validator: Number.isSafeInteger, message: 'amountMinor must be an integer' } },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 2000 },
    paidByFounderId: { type: Schema.Types.ObjectId, ref: 'Founder' },
    /** Receiving founder (settlement only). */
    counterpartyFounderId: { type: Schema.Types.ObjectId, ref: 'Founder' },
    /** Settlement payment method (settlement type only). */
    method: { type: String, trim: true, maxlength: 50 },
    transactionDate: { type: Date, required: true },
    status: { type: String, enum: TRANSACTION_STATUSES, required: true, default: 'pending_approval' },
    /** Split definition + resolved per-founder responsibility, embedded (no separate collection). */
    split: { type: splitSchema },
    /** Denormalised count of receipts, for the list indicator. */
    receiptCount: { type: Number, required: true, default: 0, min: 0 },
    void: { type: voidSchema },
    /** Optimistic-concurrency token; every edit must present the version it was based on. */
    version: { type: Number, required: true, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

transactionSchema.index({ transactionDate: -1, _id: -1 });
transactionSchema.index({ status: 1, transactionDate: -1 });
transactionSchema.index({ type: 1, transactionDate: -1 });
transactionSchema.index({ categoryId: 1, transactionDate: -1 });
transactionSchema.index({ paidByFounderId: 1, transactionDate: -1 });
transactionSchema.index({ createdBy: 1, createdAt: -1 });
transactionSchema.index({ amountMinor: 1 });
// Phase 3: founder-involvement lookups for the founder ledger.
transactionSchema.index({ counterpartyFounderId: 1, transactionDate: -1 });
transactionSchema.index({ 'split.entries.founderId': 1 });

// Financial records are never hard-deleted. Use void.
const blocked = (): never => {
  throw new Error('Transactions cannot be deleted; void them instead');
};
for (const op of ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'] as const) {
  transactionSchema.pre(op as 'deleteOne', blocked);
}
transactionSchema.pre('deleteOne', { document: true, query: false }, blocked);

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;
export const Transaction = model('Transaction', transactionSchema);
