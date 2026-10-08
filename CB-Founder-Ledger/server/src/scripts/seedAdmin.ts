/**
 * Creates the first admin account from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME.
 * Idempotent: does nothing if a user with that email exists. Creates NO financial data.
 */
import 'dotenv/config';
import { getEnv } from '../config/env';
import { connectDb, disconnectDb } from '../db/connect';
import { hashPassword } from '../lib/password';
import { User } from '../models/User';
import { passwordSchema } from '../modules/users/users.routes';
import { z } from 'zod';

async function main() {
  const env = getEnv();
  const email = z.string().email().parse(process.env['SEED_ADMIN_EMAIL']).toLowerCase();
  const password = passwordSchema.parse(process.env['SEED_ADMIN_PASSWORD']);
  const name = process.env['SEED_ADMIN_NAME']?.trim() || 'Admin';

  await connectDb(env.MONGO_URI);
  if (await User.exists({ email })) {
    console.log(`User ${email} already exists; nothing to do.`);
  } else {
    await User.create({ email, name, role: 'admin', passwordHash: await hashPassword(password, env.BCRYPT_COST) });
    console.log(`Admin ${email} created.`);
  }
  await disconnectDb();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
