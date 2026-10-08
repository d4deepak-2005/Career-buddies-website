import { Schema, model } from 'mongoose';

export const REVISION_ACTIONS = ['created', 'edited', 'submitted', 'voided', 'receipt_added'] as const;

/** Append-only history: one row per change, holding the state AFTER the change. */
const revisionSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    version: { type: Number, required: true },
    action: { type: String, enum: REVISION_ACTIONS, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, required: true, default: () => new Date() },
    reason: { type: String, maxlength: 500 },
    snapshot: { type: Schema.Types.Mixed },
  },
  { collection: 'transaction_revisions', versionKey: false },
);
revisionSchema.index({ transactionId: 1, at: 1 });

const blocked = (): never => {
  throw new Error('Revision history is append-only');
};
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'] as const) {
  revisionSchema.pre(op as 'updateOne', blocked);
}

export const TransactionRevision = model('TransactionRevision', revisionSchema);
