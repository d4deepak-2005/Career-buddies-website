import { Category } from '../models/Category';
import { Founder } from '../models/Founder';

/**
 * Idempotent, non-destructive data migrations that run at start-up (and are safe to run any number of times).
 * They only ADD missing presentation fields to records created before those fields existed; they never change or delete
 * financial data. (A founder row without `displayOrder` would otherwise sort BEFORE every founder that has one.)
 */
export async function runMigrations(log: (m: string) => void = () => undefined): Promise<{ foundersBackfilled: number; categoriesBackfilled: number }> {
  const f = await Founder.collection.updateMany({ displayOrder: { $exists: false } }, { $set: { displayOrder: 1000 } });
  const c = await Category.collection.updateMany({ sortOrder: { $exists: false } }, { $set: { sortOrder: 1000 } });
  if (f.modifiedCount || c.modifiedCount) log(`migration: backfilled displayOrder on ${f.modifiedCount} founder(s) and sortOrder on ${c.modifiedCount} categor(ies)`);
  return { foundersBackfilled: f.modifiedCount, categoriesBackfilled: c.modifiedCount };
}
