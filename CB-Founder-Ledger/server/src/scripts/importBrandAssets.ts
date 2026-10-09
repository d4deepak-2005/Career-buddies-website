/**
 * Imports the logo and founder photographs you place in CB-Founder-Ledger/assets/ (see assets/README.md):
 *   assets/brand/careerbuddies-logo.(png|jpg|webp)
 *   assets/founders/nishant-sharma.(png|jpg|webp)  deepak-sah.*  divyanshu-gautam.*
 * Files are validated (real image type, size limit) and copied into the private branding storage; the settings / founder
 * records are updated and audited. Idempotent: a file whose content is already in use is skipped. Missing files are ignored
 * (a neutral placeholder is shown). Nothing is ever generated or downloaded.
 */
import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { FOUNDER_TARGETS } from '../domain/founderSeed';
import { audit } from '../lib/audit';
import { detectImageType } from '../lib/imageType';
import { Founder } from '../models/Founder';
import { loadSettings, setLogo } from '../modules/settings/settings.service';
import { getBrandingStorage } from '../storage/brandingStorage';

const EXTS = ['png', 'jpg', 'jpeg', 'webp'];

async function findFile(dir: string, base: string): Promise<string | null> {
  for (const e of EXTS) {
    const p = path.join(dir, `${base}.${e}`);
    try { await readFile(p); return p; } catch { /* next */ }
  }
  return null;
}

export async function importBrandAssets(assetsDir: string, log: (m: string) => void = console.log): Promise<number> {
  const env = getEnv();
  const storage = getBrandingStorage(env.BRANDING_STORAGE_DIR);
  let changed = 0;
  const load = async (file: string) => {
    const buf = await readFile(file);
    if (buf.length === 0 || buf.length > env.IMAGE_MAX_BYTES) { log(`SKIPPED ${path.basename(file)}: empty or larger than ${env.IMAGE_MAX_BYTES} bytes`); return null; }
    const type = detectImageType(buf);
    if (!type) { log(`SKIPPED ${path.basename(file)}: not a PNG, JPG or WebP image`); return null; }
    return { buf, type, sha: createHash('sha256').update(buf).digest('hex') };
  };

  const logoFile = await findFile(path.join(assetsDir, 'brand'), 'careerbuddies-logo');
  if (logoFile) {
    const img = await load(logoFile);
    const current = (await loadSettings()).values.branding;
    if (img && current.logoSha256 !== img.sha) {
      const key = `logo-${randomBytes(6).toString('hex')}.${img.type.ext}`;
      await storage.put(key, img.buf);
      const { previousKey } = await setLogo(key, img.type.mime, null, img.sha);
      if (previousKey) await storage.remove(previousKey).catch(() => undefined);
      log('logo imported'); changed++;
    } else if (img) log('logo unchanged');
  } else log('no logo file found (the shipped CareerBuddies logo stays)');

  for (const t of FOUNDER_TARGETS) {
    const file = await findFile(path.join(assetsDir, 'founders'), t.slug);
    if (!file) { log(`no photograph for ${t.name} (placeholder shown)`); continue; }
    const f = await Founder.findOne({ name: t.name });
    if (!f) { log(`SKIPPED ${t.name}: founder record not found — run seed:founders first`); continue; }
    const img = await load(file);
    if (!img) continue;
    if (f.photo?.sha256 === img.sha) { log(`photograph unchanged: ${t.name}`); continue; }
    const key = `founder-${String(f._id)}-${randomBytes(6).toString('hex')}.${img.type.ext}`;
    await storage.put(key, img.buf);
    const old = f.photo?.key;
    await Founder.updateOne({ _id: f._id }, { $set: { photo: { key, mime: img.type.mime, updatedAt: new Date(), sha256: img.sha } } });
    if (old) await storage.remove(old).catch(() => undefined);
    await audit(null, { action: 'FOUNDER_PHOTO_CHANGED', entityType: 'founder', entityId: String(f._id), summary: `Photograph imported: ${t.name}`, after: { hasPhoto: true } });
    log(`photograph imported: ${t.name}`); changed++;
  }
  return changed;
}

async function main() {
  await connectDb(getEnv().MONGO_URI);
  const dir = path.resolve(process.env['ASSETS_DIR'] ?? './assets');
  console.log(`Importing from ${dir}`);
  const n = await importBrandAssets(dir);
  console.log(n === 0 ? 'Nothing to import.' : `${n} asset(s) imported.`);
  await disconnectDb();
}

if (require.main === module) {
  main().catch((err: unknown) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
}
