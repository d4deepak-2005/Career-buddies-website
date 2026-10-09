import { Router } from 'express';
import { getEnv } from '../../config/env';
import { RULES, TRANSACTION_STATUSES, TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS } from '../../domain/transactionRules';
import { SPLIT_METHODS } from '../../domain/splits';
import { ALLOWED_EXTENSIONS } from '../../lib/fileType';
import { authenticate } from '../../middleware/auth';
import { MAX_RECEIPTS_PER_TRANSACTION } from '../receipts/receipts.routes';
import { asyncHandler } from '../../lib/asyncHandler';
import { loadSettings, publicSettings } from '../settings/settings.service';

export const configRouter = Router();

/** Runtime configuration for the client, so currency and type rules are never hard-coded there. */
configRouter.get('/', authenticate, asyncHandler(async (_req, res) => {
  const env = getEnv();
  const settings = publicSettings(await loadSettings());
  res.json({
    // The currency itself is deployment configuration (changing it would re-label stored amounts); only its formatting is a setting.
    currency: { code: env.CURRENCY_CODE, minorUnits: env.CURRENCY_MINOR_UNITS, locale: settings.regional.locale },
    settings,
    imageMaxBytes: env.IMAGE_MAX_BYTES,
    receipts: { maxBytes: env.RECEIPT_MAX_BYTES, allowedExtensions: ALLOWED_EXTENSIONS, maxPerTransaction: MAX_RECEIPTS_PER_TRANSACTION },
    transactionTypes: TRANSACTION_TYPES.map((value) => ({ value, label: TRANSACTION_TYPE_LABELS[value], rules: RULES[value] })),
    transactionStatuses: TRANSACTION_STATUSES,
    splitMethods: SPLIT_METHODS,
  });
}));
