import { Schema, model } from 'mongoose';

export const RECEIPT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type ReceiptMime = (typeof RECEIPT_MIME_TYPES)[number];

/** Metadata only. File bytes live in private storage; `storageKey` is never exposed through the API. */
const receiptSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
    originalName: { type: String, required: true, maxlength: 120 },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, enum: RECEIPT_MIME_TYPES, required: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    sha256: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'receipts', versionKey: false },
);

export const Receipt = model('Receipt', receiptSchema);
