import { Schema, model, type InferSchemaType } from 'mongoose';

const founderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    /** Optional link to the login account of this founder. */
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    /**
     * Default share of expenses, in percent (0-100). Stored for later phases only;
     * Phase 1 does not use it in any calculation and does not require founders to sum to 100.
     */
    defaultSharePercent: { type: Number, min: 0, max: 100 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type FounderDoc = InferSchemaType<typeof founderSchema>;
export const Founder = model('Founder', founderSchema);
