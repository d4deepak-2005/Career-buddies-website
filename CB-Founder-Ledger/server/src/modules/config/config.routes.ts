import { Router } from 'express';
import { getEnv } from '../../config/env';
import { RULES, TRANSACTION_STATUSES, TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS } from '../../domain/transactionRules';
import { SPLIT_METHODS } from '../../domain/splits';
import { ALLOWED_EXTENSIONS } from '../../lib/fileType';
import { authenticate } from '../../middleware/auth';
import { MAX_RECEIPTS_PER_TRANSACTION } from '../receipts/receipts.routes';

export const configRouter = Router();

/** Runtime configuration for the client, so currency and type rules are never hard-coded there. */
configRouter.get('/', authenticate, (_req, res) => {
  const env = getEnv();
  res.json({
    currency: { code: env.CURRENCY_CODE, minorUnits: env.CURRENCY_MINOR_UNITS },
    receipts: { maxBytes: env.RECEIPT_MAX_BYTES, allowedExtensions: ALLOWED_EXTENSIONS, maxPerTransaction: MAX_RECEIPTS_PER_TRANSACTION },
    transactionTypes: TRANSACTION_TYPES.map((value) => ({ value, label: TRANSACTION_TYPE_LABELS[value], rules: RULES[value] })),
    transactionStatuses: TRANSACTION_STATUSES,
    splitMethods: SPLIT_METHODS,
  });
});
