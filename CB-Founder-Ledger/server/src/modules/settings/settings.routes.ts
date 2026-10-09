import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { Router, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import { getEnv } from '../../config/env';
import { POLICY, settingsPatchSchema, type SettingsPatch } from '../../domain/settings';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { ALLOWED_IMAGE_EXTENSIONS, detectImageType } from '../../lib/imageType';
import { authenticate, requireRole } from '../../middleware/auth';
import { uploadRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { getBrandingStorage } from '../../storage/brandingStorage';
import { loadSettings, publicSettings, setLogo, updateSettings } from './settings.service';

const currency = () => ({ code: getEnv().CURRENCY_CODE, minorUnits: getEnv().CURRENCY_MINOR_UNITS });

export const settingsRouter = Router();
settingsRouter.use(authenticate);

// Any signed-in user may read (the whole UI is branded by these values). Admins change them.
settingsRouter.get('/', asyncHandler(async (_req, res) => {
  const s = await loadSettings();
  res.json({ settings: publicSettings(s), currency: currency(), policy: POLICY });
}));

settingsRouter.patch('/', requireRole('admin'), validate(settingsPatchSchema), asyncHandler(async (req, res) => {
  const s = await updateSettings(req.body as SettingsPatch, req.auth!);
  res.json({ settings: publicSettings(s), currency: currency(), policy: POLICY });
}));

/** Parse one image from the "file" field (memory only, size-capped) and validate its real type. */
export async function readImageUpload(req: Request, res: Response): Promise<{ buffer: Buffer; mime: string; ext: 'png' | 'jpg' | 'webp' }> {
  const max = getEnv().IMAGE_MAX_BYTES;
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: max, files: 1, fields: 0, parts: 2 } }).single('file');
  const file = await new Promise<Express.Multer.File>((resolve, reject) => {
    upload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return reject(new AppError(413, 'FILE_TOO_LARGE', `Image is too large (maximum ${Math.round((max / 1024 / 1024) * 10) / 10} MB)`));
        return reject(new AppError(400, 'UPLOAD_ERROR', 'Upload must contain exactly one file in the "file" field'));
      }
      if (err) return reject(err);
      if (!req.file) return reject(new AppError(400, 'NO_FILE', 'No file was uploaded (use the "file" field)'));
      resolve(req.file);
    });
  });
  if (file.size === 0) throw new AppError(400, 'EMPTY_FILE', 'The file is empty');
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  const detected = detectImageType(file.buffer);
  const extOk = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext) && detected && (ext === detected.ext || (ext === 'jpeg' && detected.ext === 'jpg'));
  if (!detected || !extOk || file.mimetype !== detected.mime) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Only PNG, JPG/JPEG and WebP images are allowed, and the file content must match its type');
  }
  return { buffer: file.buffer, mime: detected.mime, ext: detected.ext };
}

let limiter: RequestHandler | undefined;
const limitUploads: RequestHandler = (req, res, next) => (limiter ??= uploadRateLimiter())(req, res, next);

export const brandingRouter = Router();

// The logo is shown on the login page too, so it is readable without signing in. It is a brand asset, not financial data.
brandingRouter.get('/logo', asyncHandler(async (_req, res) => {
  const s = await loadSettings();
  const { logoKey, logoMime } = s.values.branding;
  if (logoKey && logoMime) {
    const opened = await getBrandingStorage(getEnv().BRANDING_STORAGE_DIR).open(logoKey);
    if (opened) {
      res.setHeader('Content-Type', logoMime);
      res.setHeader('Content-Length', String(opened.size));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      opened.stream.on('error', () => res.destroy());
      opened.stream.pipe(res);
      return;
    }
  }
  res.redirect(302, '/brand/careerbuddies-logo.png'); // the official asset shipped with the client
}));

// What the login page needs before anyone is signed in: the product name and logo. Nothing financial.
brandingRouter.get('/public', asyncHandler(async (_req, res) => {
  const { values } = await loadSettings();
  const p = publicSettings({ values, version: 0 });
  res.setHeader('Cache-Control', 'no-cache');
  res.json({ displayName: values.business.displayName, shortName: values.business.shortName, organisationName: values.business.organisationName, logoUrl: p.branding.logoUrl ?? '/brand/careerbuddies-logo.png', logoAlt: values.branding.logoAlt, locale: values.regional.locale });
}));

brandingRouter.put('/logo', authenticate, requireRole('admin'), limitUploads, asyncHandler(async (req, res) => {
  const img = await readImageUpload(req, res);
  const key = `logo-${randomBytes(6).toString('hex')}.${img.ext}`;
  const storage = getBrandingStorage(getEnv().BRANDING_STORAGE_DIR);
  await storage.put(key, img.buffer);
  try {
    const { previousKey, settings } = await setLogo(key, img.mime, req.auth!);
    if (previousKey) await storage.remove(previousKey).catch(() => undefined);
    res.json({ settings: publicSettings(settings) });
  } catch (err) {
    await storage.remove(key).catch(() => undefined);
    throw err;
  }
}));

brandingRouter.delete('/logo', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const { previousKey, settings } = await setLogo(null, null, req.auth!);
  if (previousKey) await getBrandingStorage(getEnv().BRANDING_STORAGE_DIR).remove(previousKey).catch(() => undefined);
  res.json({ settings: publicSettings(settings) });
}));

