import { AppError } from '../../lib/errors';
import { audit } from '../../lib/audit';
import { mergeSettings, type AppSettingsValues, type SettingsPatch } from '../../domain/settings';
import { AppSettings } from '../../models/AppSettings';
import type { AuthUser } from '../../middleware/auth';

export interface LoadedSettings { values: AppSettingsValues; version: number }

export async function loadSettings(): Promise<LoadedSettings> {
  const doc = await AppSettings.findOne({ key: 'main' }).lean();
  return { values: mergeSettings(doc?.values as never), version: doc?.version ?? 1 };
}

/** Public (client-safe) view: nothing here is secret; the storage key of the logo is not exposed. */
export function publicSettings(s: LoadedSettings) {
  const { branding, ...rest } = s.values;
  return {
    ...rest,
    branding: { hasCustomLogo: !!branding.logoKey, logoVersion: branding.logoVersion, logoAlt: branding.logoAlt, logoUrl: branding.logoKey ? `/api/branding/logo?v=${branding.logoVersion}` : null },
    version: s.version,
  };
}

/** Apply a validated patch atomically (optimistic concurrency) and audit the before/after of the changed sections. */
export async function updateSettings(patch: SettingsPatch, actor: AuthUser) {
  const { expectedVersion, reason, ...sections } = patch;
  const current = await loadSettings();
  if (current.version !== expectedVersion) {
    throw new AppError(409, 'VERSION_CONFLICT', 'Settings were changed by someone else. Reload to see the latest values.', { currentVersion: current.version });
  }
  const next = structuredClone(current.values) as unknown as Record<string, Record<string, unknown>>;
  const before: Record<string, unknown> = {}, after: Record<string, unknown> = {};
  for (const [section, vals] of Object.entries(sections)) {
    if (!vals) continue;
    before[section] = structuredClone((current.values as unknown as Record<string, unknown>)[section]);
    Object.assign(next[section]!, vals);
    after[section] = structuredClone(next[section]);
  }
  const res = await AppSettings.findOneAndUpdate(
    { key: 'main', version: expectedVersion },
    { $set: { values: next, updatedBy: actor.id }, $inc: { version: 1 } },
    { new: true },
  ).lean();
  if (!res) {
    // First write ever (no document yet) or a concurrent change.
    const exists = await AppSettings.exists({ key: 'main' });
    if (exists) throw new AppError(409, 'VERSION_CONFLICT', 'Settings were changed by someone else. Reload to see the latest values.');
    if (expectedVersion !== 1) throw new AppError(409, 'VERSION_CONFLICT', 'Settings were changed by someone else. Reload to see the latest values.');
    try {
      await AppSettings.create({ key: 'main', values: next, version: 2, updatedBy: actor.id });
    } catch {
      throw new AppError(409, 'VERSION_CONFLICT', 'Settings were changed by someone else. Reload to see the latest values.');
    }
  }
  await audit(actor, { action: 'SETTINGS_CHANGED', entityType: 'settings', entityId: 'main', summary: `Settings changed: ${Object.keys(after).join(', ')}`, before, after, reason });
  return loadSettings();
}

/** Logo bookkeeping (called by the branding routes). */
export async function setLogo(key: string | null, mime: string | null, actor: AuthUser | null, sha256: string | null = null): Promise<{ previousKey: string | null; settings: LoadedSettings }> {
  const current = await loadSettings();
  const next = structuredClone(current.values);
  const previousKey = next.branding.logoKey;
  next.branding = { ...next.branding, logoKey: key, logoMime: mime, logoSha256: sha256, logoVersion: next.branding.logoVersion + 1 };
  await AppSettings.findOneAndUpdate({ key: 'main' }, { $set: { values: next, ...(actor ? { updatedBy: actor.id } : {}) }, $inc: { version: 1 }, $setOnInsert: { key: 'main' } }, { upsert: true, new: true });
  await audit(actor, { action: 'BRANDING_CHANGED', entityType: 'settings', entityId: 'logo', summary: key ? 'Logo replaced' : 'Logo reset to the default', before: { logo: previousKey ? 'custom' : 'default' }, after: { logo: key ? 'custom' : 'default' } });
  return { previousKey, settings: await loadSettings() };
}
