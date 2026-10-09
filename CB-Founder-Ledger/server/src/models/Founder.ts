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
    /** Display role, e.g. "Founder" / "Co-founder". Presentation only: never part of any calculation. */
    role: { type: String, trim: true, maxlength: 60 },
    /** Position in every founder list (ascending). Presentation only; accounting never reads it. */
    displayOrder: { type: Number, required: true, default: 1000, min: 0 },
    /** Photograph managed from Settings (key in the branding storage). */
    photo: { type: new Schema({ key: { type: String, required: true }, mime: { type: String, required: true }, updatedAt: { type: Date, required: true }, sha256: { type: String } }, { _id: false }) },
  },
  { timestamps: true },
);

/** Mandatory display order everywhere founders are listed: configured order, then creation order. */
export const FOUNDER_ORDER = { displayOrder: 1, createdAt: 1, _id: 1 } as const;

export type FounderDoc = InferSchemaType<typeof founderSchema>;
export const Founder = model('Founder', founderSchema);
