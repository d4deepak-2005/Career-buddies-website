import { rm } from 'node:fs/promises';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app';
import { getEnv } from '../src/config/env';
import { connectDb, disconnectDb } from '../src/db/connect';
import { hashPassword } from '../src/lib/password';
import { Category } from '../src/models/Category';
import { Counter } from '../src/models/Counter';
import { Founder } from '../src/models/Founder';
import { Receipt } from '../src/models/Receipt';
import { Transaction } from '../src/models/Transaction';
import { User, type Role } from '../src/models/User';

export const PASSWORD = 'correct-horse-battery-staple';

export async function setupDb() {
  await connectDb(getEnv().MONGO_URI, 3000);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function teardownDb() {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
}

export async function makeUser(email: string, role: Role, status: 'active' | 'disabled' = 'active') {
  return User.create({ email, name: email.split('@')[0], role, status, passwordHash: await hashPassword(PASSWORD, 4) });
}

/** Returns a supertest agent that is logged in (keeps auth cookies). */
export async function loginAgent(app: ReturnType<typeof createApp>, email: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

export function cookieNames(res: request.Response): string[] {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((c) => c.split('=')[0] ?? '');
}

// ---------------------------------------------------------------- Phase 2 fixtures


export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 1)]);
export const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 2)]);
export const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');

export async function resetPhase2Data() {
  await rm(getEnv().RECEIPT_STORAGE_DIR, { recursive: true, force: true });
  await Counter.deleteMany({});
  // Raw collection access: the model deliberately blocks deletes.
  await Transaction.collection.deleteMany({});
  await Receipt.collection.deleteMany({});
  await Founder.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
}

export async function seedWorld(app: ReturnType<typeof createApp>) {
  await resetPhase2Data();
  const admin = await makeUser('admin@cb.test', 'admin');
  const uA = await makeUser('fa@cb.test', 'founder');
  const uB = await makeUser('fb@cb.test', 'founder');
  const fa = await Founder.create({ name: 'Founder A', userId: uA._id });
  const fb = await Founder.create({ name: 'Founder B', userId: uB._id });
  const fc = await Founder.create({ name: 'Founder C' });
  const inactive = await Founder.create({ name: 'Former Founder', active: false });
  const cat = await Category.create({ name: 'Software', slug: 'software' });
  const inactiveCat = await Category.create({ name: 'Retired', slug: 'retired', active: false });
  return {
    admin: await loginAgent(app, 'admin@cb.test'),
    a: await loginAgent(app, 'fa@cb.test'),
    b: await loginAgent(app, 'fb@cb.test'),
    adminUser: admin, uA, uB,
    f: { a: String(fa._id), b: String(fb._id), c: String(fc._id), inactive: String(inactive._id) },
    cat: String(cat._id), inactiveCat: String(inactiveCat._id),
  };
}

export type World = Awaited<ReturnType<typeof seedWorld>>;

export function expensePayload(w: World, over: Record<string, unknown> = {}) {
  return {
    type: 'business_expense',
    amountMinor: 3_000_000,
    transactionDate: '2026-04-15',
    description: 'Cloud hosting',
    categoryId: w.cat,
    paidByFounderId: w.f.a,
    split: { method: 'equal', entries: [{ founderId: w.f.a }, { founderId: w.f.b }, { founderId: w.f.c }] },
    ...over,
  };
}
