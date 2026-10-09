/**
 * Sets the mandatory founder names, roles and display order (Nishant Sharma — Founder, Deepak Sah — Co-founder,
 * Divyanshu Gautam — Co-founder). Idempotent and non-destructive: an existing founder whose name contains the first name is
 * UPDATED in place (its id, transactions and balances are untouched); a missing one is created; an ambiguous match is skipped
 * and reported. It never deletes or deactivates anyone and creates no financial data.
 */
import 'dotenv/config';
import { getEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { planFounderSeed } from '../domain/founderSeed';
import { audit } from '../lib/audit';
import { FOUNDER_ORDER, Founder } from '../models/Founder';

export async function seedFounders(log: (m: string) => void = console.log): Promise<number> {
  const existing = await Founder.find().sort(FOUNDER_ORDER).lean();
  const plan = planFounderSeed(existing.map((f) => ({ id: String(f._id), name: f.name, role: f.role ?? null, displayOrder: f.displayOrder ?? null })));
  let changed = 0;
  for (const a of plan) {
    if (a.kind === 'create') {
      const f = await Founder.create({ name: a.name, role: a.role, displayOrder: a.order, active: true });
      await audit(null, { action: 'FOUNDER_CREATED', entityType: 'founder', entityId: String(f._id), summary: `Founder seeded: ${a.name}`, after: { name: a.name, role: a.role, displayOrder: a.order } });
      log(`created   ${a.name} (${a.role})`); changed++;
    } else if (a.kind === 'update') {
      await Founder.updateOne({ _id: a.id }, { $set: { name: a.name, role: a.role, displayOrder: a.order } });
      await audit(null, { action: 'FOUNDER_UPDATED', entityType: 'founder', entityId: a.id, summary: `Founder profile aligned: ${a.name}`, after: { changes: a.changes } });
      log(`updated   ${a.name}: ${a.changes.join('; ')}`); changed++;
    } else if (a.kind === 'push-back') {
      await Founder.updateOne({ _id: a.id }, { $set: { displayOrder: a.order } });
      log(`reordered ${a.name} -> position ${a.order + 1}`); changed++;
    } else if (a.kind === 'ambiguous') {
      log(`SKIPPED   ${a.target}: more than one existing founder matches (${a.ids.join(', ')}). Resolve manually in Settings.`);
    } else {
      log(`ok        ${a.name}`);
    }
  }
  return changed;
}

async function main() {
  await connectDb(getEnv().MONGO_URI);
  const n = await seedFounders();
  console.log(n === 0 ? 'Nothing to change.' : `${n} change(s) applied.`);
  await disconnectDb();
}

if (require.main === module) {
  main().catch((err: unknown) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
}
