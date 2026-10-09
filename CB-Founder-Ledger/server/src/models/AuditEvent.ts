import { Schema, model } from 'mongoose';

/** Append-only audit trail (Product Plan §15). Updates and deletes are blocked at the model level. */
const auditSchema = new Schema(
  {
    at: { type: Date, required: true, default: () => new Date() },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    /** Name/e-mail at the time of the event (the account may change later). */
    actorLabel: { type: String, maxlength: 200 },
    action: { type: String, required: true, maxlength: 60 },
    entityType: { type: String, required: true, maxlength: 40 },
    entityId: { type: String, maxlength: 64 },
    summary: { type: String, required: true, maxlength: 300 },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String, maxlength: 500 },
  },
  { collection: 'audit_events', versionKey: false },
);
auditSchema.index({ at: -1, _id: -1 });
auditSchema.index({ action: 1, at: -1 });
auditSchema.index({ entityType: 1, entityId: 1, at: -1 });
auditSchema.index({ actorId: 1, at: -1 });

const blocked = (): never => { throw new Error('The audit log is append-only'); };
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndReplace'] as const) {
  auditSchema.pre(op as 'updateOne', blocked);
}
auditSchema.pre('deleteOne', { document: true, query: false }, blocked);

export const AuditEvent = model('AuditEvent', auditSchema);
