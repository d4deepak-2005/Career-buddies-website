import { Schema, model, type InferSchemaType } from 'mongoose';

export const ROLES = ['admin', 'founder'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'disabled'] as const;

const sessionSchema = new Schema(
  {
    /** Session id carried in the access token; deleting the session revokes the access token immediately. */
    sid: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, maxlength: 300 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'founder' },
    status: { type: String, enum: USER_STATUSES, required: true, default: 'active' },
    /** Hashed refresh tokens (rotating). Never exposed through the API. */
    sessions: { type: [sessionSchema], default: [], select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
