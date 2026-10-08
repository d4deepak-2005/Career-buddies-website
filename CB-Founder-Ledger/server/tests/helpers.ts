import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app';
import { getEnv } from '../src/config/env';
import { connectDb, disconnectDb } from '../src/db/connect';
import { hashPassword } from '../src/lib/password';
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
