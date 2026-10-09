import { Schema, model } from 'mongoose';

/** Single settings document (key = "main"). Values are validated by domain/settings.ts before they get here. */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'main' },
    values: { type: Schema.Types.Mixed, required: true, default: {} },
    /** Optimistic-concurrency token for concurrent admins. */
    version: { type: Number, required: true, default: 1 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { collection: 'app_settings', timestamps: true, versionKey: false },
);
export const AppSettings = model('AppSettings', settingsSchema);
