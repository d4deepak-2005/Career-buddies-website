/**
 * DEVELOPMENT / TEST ONLY. Inserts a handful of generic categories flagged `isDevSeed: true`.
 * These are NOT a business taxonomy and are not assumed anywhere in the code. Refuses to run in production.
 * Creates no financial transactions.
 */
import 'dotenv/config';
import { getEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { Category, slugify } from '../models/Category';

export const DEV_SEED_CATEGORIES = ['General', 'Software & Tools', 'Travel', 'Marketing'];

async function main() {
  const env = getEnv();
  if (env.NODE_ENV === 'production') throw new Error('Refusing to seed development categories when NODE_ENV=production');
  await connectDb(env.MONGO_URI);
  for (const name of DEV_SEED_CATEGORIES) {
    const r = await Category.updateOne({ slug: slugify(name) }, { $setOnInsert: { name, slug: slugify(name), description: 'Development seed category', active: true, isDevSeed: true } }, { upsert: true });
    console.log(`${name}: ${r.upsertedCount ? 'created (dev seed)' : 'already exists'}`);
  }
  await disconnectDb();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
