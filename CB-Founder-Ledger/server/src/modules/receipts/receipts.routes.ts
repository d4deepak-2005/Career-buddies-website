import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { Router, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { asyncHandler } from '../../lib/asyncHandler';
import { audit } from '../../lib/audit';
import { AppError } from '../../lib/errors';
import { ALLOWED_EXTENSIONS, detectReceiptType, sanitizeFileName } from '../../lib/fileType';
import { uploadRateLimiter, deferredLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { Receipt } from '../../models/Receipt';
import { Transaction } from '../../models/Transaction';
import { getReceiptStorage } from '../../storage/receiptStorage';
import { objectIdString } from '../transactions/transactions.schemas';
import { addReceiptRevision, loadOr404, publicReceipt, receiptsFor } from '../transactions/transactions.service';

export const MAX_RECEIPTS_PER_TRANSACTION = 10;

export const receiptsRouter = Router({ mergeParams: true });

const txParams = z.object({ id: objectIdString }).strict();
const receiptParams = z.object({ id: objectIdString, receiptId: objectIdString }).strict();
const fileQuery = z.object({ download: z.literal('1').optional() }).strict();

const limitUploads: RequestHandler = deferredLimiter(uploadRateLimiter);

function parseUpload(req: Request, res: Response): Promise<Express.Multer.File> {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: getEnv().RECEIPT_MAX_BYTES, files: 1, fields: 0, parts: 2 },
  }).single('file');
  return new Promise((resolve, reject) => {
    upload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return reject(new AppError(413, 'FILE_TOO_LARGE', `File is too large (maximum ${Math.round(getEnv().RECEIPT_MAX_BYTES / 1024 / 1024 * 10) / 10} MB)`));
        }
        return reject(new AppError(400, 'UPLOAD_ERROR', 'Upload must contain exactly one file in the "file" field'));
      }
      if (err) return reject(err);
      if (!req.file) return reject(new AppError(400, 'NO_FILE', 'No file was uploaded (use the "file" field)'));
      resolve(req.file);
    });
  });
}

receiptsRouter.get('/', validate(txParams, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await loadOr404(id);
  res.json({ receipts: await receiptsFor(id) });
}));

receiptsRouter.post('/', limitUploads, validate(txParams, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const tx = await loadOr404(id);
  const actor = req.auth!;
  if (actor.role !== 'admin' && String(tx.createdBy) !== actor.id) throw AppError.forbidden('Only the creator or an admin can attach receipts');
  if (tx.status === 'voided') throw new AppError(409, 'NOT_EDITABLE', 'Receipts cannot be added to a voided transaction');
  if (tx.receiptCount >= MAX_RECEIPTS_PER_TRANSACTION) throw new AppError(409, 'TOO_MANY_RECEIPTS', `A transaction can have at most ${MAX_RECEIPTS_PER_TRANSACTION} receipts`);

  const file = await parseUpload(req, res);
  if (file.size === 0) throw new AppError(400, 'EMPTY_FILE', 'The file is empty');

  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  const detected = detectReceiptType(file.buffer);
  const extOk = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext) && detected && (ext === detected.ext || (ext === 'jpeg' && detected.ext === 'jpg'));
  if (!detected || !extOk || file.mimetype !== detected.mime) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Only PDF, JPG, JPEG and PNG files are allowed, and the file content must match its type');
  }

  // Storage key is generated here; user input never reaches the file system path.
  const storageKey = `${randomUUID()}.${detected.ext}`;
  const storage = getReceiptStorage(getEnv().RECEIPT_STORAGE_DIR);
  await storage.put(storageKey, file.buffer);
  try {
    const doc = await Receipt.create({
      transactionId: id,
      originalName: sanitizeFileName(file.originalname),
      storageKey,
      mimeType: detected.mime,
      sizeBytes: file.size,
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
      uploadedBy: actor.id,
    });
    await Transaction.updateOne({ _id: id }, { $inc: { receiptCount: 1 } });
    await addReceiptRevision(tx, actor.id, { id: String(doc._id), fileName: doc.originalName });
    await audit(actor, { action: 'RECEIPT_UPLOADED', entityType: 'transaction', entityId: id, summary: `Receipt attached to ${tx.txnNumber}`, after: { fileName: doc.originalName, sizeBytes: doc.sizeBytes } });
    res.status(201).json({ receipt: publicReceipt(doc.toObject(), actor.name) });
  } catch (err) {
    await storage.remove(storageKey).catch(() => undefined); // roll back the orphaned file
    throw err;
  }
}));

async function findReceipt(id: string, receiptId: string) {
  const r = await Receipt.findOne({ _id: receiptId, transactionId: id }).lean();
  if (!r) throw AppError.notFound('Receipt not found');
  return r;
}

receiptsRouter.get('/:receiptId', validate(receiptParams, 'params'), asyncHandler(async (req, res) => {
  const { id, receiptId } = req.params as { id: string; receiptId: string };
  const r = await findReceipt(id, receiptId);
  res.json({ receipt: publicReceipt(r) });
}));

// Authorised, streamed access. There is no static/public path to receipt files.
receiptsRouter.get('/:receiptId/file', validate(receiptParams, 'params'), validate(fileQuery, 'query'), asyncHandler(async (req, res) => {
  const { id, receiptId } = req.params as { id: string; receiptId: string };
  const r = await findReceipt(id, receiptId);
  const opened = await getReceiptStorage(getEnv().RECEIPT_STORAGE_DIR).open(r.storageKey);
  if (!opened) throw AppError.notFound('Receipt file is not available');

  const asciiName = r.originalName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const disposition = (req.query as { download?: string }).download ? 'attachment' : 'inline';
  res.status(200);
  res.setHeader('Content-Type', r.mimeType);
  res.setHeader('Content-Length', String(opened.size));
  res.setHeader('Content-Disposition', `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(r.originalName)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:");
  opened.stream.on('error', () => res.destroy());
  opened.stream.pipe(res);
}));
