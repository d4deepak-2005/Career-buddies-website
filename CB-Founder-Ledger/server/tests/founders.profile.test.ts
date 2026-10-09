/** Founder profiles: mandatory order, roles, photographs, reorder, idempotent seeding, history is never rewritten. */
import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { FOUNDER_TARGETS, planFounderSeed } from '../src/domain/founderSeed';
import { AuditEvent } from '../src/models/AuditEvent';
import { Founder } from '../src/models/Founder';
import { Transaction } from '../src/models/Transaction';
import { seedFounders } from '../src/scripts/seedFounders';
import { importBrandAssets } from '../src/scripts/importBrandAssets';
import { JPG, PDF, PNG, WEBP, expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

const names = async (path = '/api/founders') => ((await w.a.get(path)).body.founders as Array<{ name: string }>).map((f) => f.name);
const approve = (id: string) => Transaction.collection.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: 'approved' } });

describe('mandatory order and roles via seeding (idempotent, no duplicates)', () => {
  it('planFounderSeed: pure planning covers create / update / keep / ambiguous / push-back', () => {
    expect(planFounderSeed([]).map((a) => a.kind)).toEqual(['create', 'create', 'create']);
    const plan = planFounderSeed([{ id: '1', name: 'Deepak', displayOrder: 5 }, { id: '2', name: 'Someone Else', displayOrder: 0 }]);
    expect(plan[1]).toMatchObject({ kind: 'update', id: '1', name: 'Deepak Sah', role: 'Co-founder', order: 1 });
    expect(plan.find((a) => a.kind === 'push-back')).toMatchObject({ id: '2', order: 3 });
    expect(planFounderSeed([{ id: '1', name: 'Deepak A' }, { id: '2', name: 'deepak b' }]).find((a) => a.kind === 'ambiguous')).toMatchObject({ target: 'Deepak Sah' });
  });

  it('creates the three founders in order; running again changes nothing; an existing "Deepak" is renamed IN PLACE (same id, same history)', async () => {
    await Founder.deleteMany({});
    const old = await Founder.create({ name: 'deepak', displayOrder: 7 });
    const other = await Founder.create({ name: 'Zed Partner', displayOrder: 0 });
    const log: string[] = [];
    expect(await seedFounders((m) => log.push(m))).toBeGreaterThan(0);
    expect(await names()).toEqual(['Nishant Sharma', 'Deepak Sah', 'Divyanshu Gautam', 'Zed Partner']);
    const fs = (await w.a.get('/api/founders')).body.founders;
    expect(fs.map((f: { role: string | null }) => f.role)).toEqual(['Founder', 'Co-founder', 'Co-founder', null]);
    expect(fs[1].id).toBe(String(old._id)); // updated, not duplicated
    expect(await Founder.countDocuments({ name: /deepak/i })).toBe(1);
    expect(String((await Founder.findOne({ name: 'Zed Partner' }))!._id)).toBe(String(other._id));
    expect(await seedFounders(() => undefined)).toBe(0); // idempotent
    expect(await Founder.countDocuments({})).toBe(4);
    expect(FOUNDER_TARGETS.map((t) => t.name)).toEqual(['Nishant Sharma', 'Deepak Sah', 'Divyanshu Gautam']);
  });

  it('renaming a founder never rewrites accounting: balances and allocations are identical before and after', async () => {
    const created = await w.a.post('/api/transactions').send(expensePayload(w, { amountMinor: 300_000, split: { method: 'equal', entries: [{ founderId: w.f.a }, { founderId: w.f.b }, { founderId: w.f.c }] } }));
    await approve(created.body.transaction.id);
    const before = (await w.a.get('/api/founders/financial-positions')).body.positions.map((p: Record<string, unknown>) => ({ ...p, founderName: undefined }));
    await seedFounders(() => undefined); // creates the three target founders (none of the test names match)
    await w.admin.patch(`/api/founders/${w.f.a}`).send({ name: 'Renamed Person', role: 'Advisor' });
    const after = (await w.a.get('/api/founders/financial-positions')).body.positions.filter((p: { founderId: string }) => [w.f.a, w.f.b, w.f.c].includes(p.founderId)).map((p: Record<string, unknown>) => ({ ...p, founderName: undefined }));
    expect(after).toEqual(before.filter((p: { founderId: string }) => [w.f.a, w.f.b, w.f.c].includes(p.founderId)));
    const tx = (await w.a.get(`/api/transactions/${created.body.transaction.id}`)).body.transaction;
    expect(tx.split.entries.map((e: { allocatedMinor: number }) => e.allocatedMinor)).toEqual([100_000, 100_000, 100_000]);
    expect(tx.paidBy.name).toBe('Renamed Person'); // display name follows the founder; ownership is by id
  });
});

describe('display order is the same everywhere', () => {
  it('reorder (admin only) changes every founder list, the dashboard and the positions; invalid orders are rejected', async () => {
    const ids = (await w.a.get('/api/founders')).body.founders.map((f: { id: string }) => f.id) as string[];
    const reversed = [...ids].reverse();
    expect((await w.a.put('/api/founders/order').send({ ids: reversed })).status).toBe(403);
    for (const bad of [ids.slice(1), [...ids, ids[0]], [...ids.slice(1), new Types.ObjectId().toString()], []]) expect((await w.admin.put('/api/founders/order').send({ ids: bad })).status).toBe(400);
    expect((await w.admin.put('/api/founders/order').send({ ids: reversed })).status).toBe(200);
    expect((await w.a.get('/api/founders')).body.founders.map((f: { id: string }) => f.id)).toEqual(reversed);
    expect((await w.a.get('/api/founders/financial-positions')).body.positions.map((p: { founderId: string }) => p.founderId)).toEqual(reversed);
    expect((await w.a.get('/api/dashboard')).body.founders.map((p: { founderId: string }) => p.founderId)).toEqual(reversed);
    const ev = await AuditEvent.find({ action: 'FOUNDER_REORDERED' }).lean();
    expect(ev).toHaveLength(1);
  });

  it('order does not depend on contribution size, name, or net position', async () => {
    await w.a.post('/api/transactions').send({ type: 'founder_contribution', amountMinor: 99_999_999, transactionDate: '2026-04-01', description: 'big', paidByFounderId: w.f.c });
    const created = await w.a.post('/api/transactions').send({ type: 'founder_contribution', amountMinor: 5_000, transactionDate: '2026-04-01', description: 'small', paidByFounderId: w.f.a });
    await approve(created.body.transaction.id);
    expect((await w.a.get('/api/dashboard')).body.founders.slice(0, 3).map((f: { name: string }) => f.name)).toEqual(['Founder A', 'Founder B', 'Founder C']);
  });
});

describe('profile edits and photographs', () => {
  it('admin edits role; founders cannot; changes are audited', async () => {
    expect((await w.a.patch(`/api/founders/${w.f.a}`).send({ role: 'Founder' })).status).toBe(403);
    const r = await w.admin.patch(`/api/founders/${w.f.a}`).send({ role: 'Co-founder' });
    expect(r.body.founder.role).toBe('Co-founder');
    const ev = await AuditEvent.findOne({ action: 'FOUNDER_UPDATED' }).lean();
    expect((ev!.before as { role: string | null }).role).toBeNull();
    expect((ev!.after as { role: string }).role).toBe('Co-founder');
    expect((await w.admin.patch(`/api/founders/${w.f.a}`).send({ displayOrder: 0 })).status).toBe(400); // order only via /order
    expect((await w.admin.patch(`/api/founders/${w.f.a}`).send({ role: 'x'.repeat(61) })).status).toBe(400);
  });

  it('photo: upload, authenticated serving, replace (old file removed), delete; wrong types rejected; no public access', async () => {
    const photo = (id: string, buf: Buffer, filename: string, contentType: string, agent = w.admin) => agent.put(`/api/founders/${id}/photo`).attach('file', buf, { filename, contentType });
    expect((await w.a.get(`/api/founders/${w.f.a}/photo`)).status).toBe(404);
    const up = await photo(w.f.a, PNG, 'me.png', 'image/png');
    expect(up.status).toBe(200);
    expect(up.body.founder).toMatchObject({ hasPhoto: true });
    expect(up.body.founder.photoUrl).toMatch(new RegExp(`^/api/founders/${w.f.a}/photo\\?v=\\d+$`));
    expect(JSON.stringify(up.body)).not.toMatch(/founder-[a-f0-9]{24}-[a-f0-9]{12}/); // storage key never leaves the server
    const served = await w.b.get(`/api/founders/${w.f.a}/photo`);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');
    expect((await request(app).get(`/api/founders/${w.f.a}/photo`)).status).toBe(401);
    expect((await photo(w.f.a, WEBP, 'me.webp', 'image/webp')).status).toBe(200);
    expect((await w.b.get(`/api/founders/${w.f.a}/photo`)).headers['content-type']).toBe('image/webp');
    expect((await photo(w.f.a, JPG, 'me.jpg', 'image/jpeg')).status).toBe(200);
    for (const [buf, n, t] of [[PDF, 'a.pdf', 'application/pdf'], [Buffer.from('GIF89a....'), 'a.gif', 'image/gif'], [Buffer.from('<?php echo 1;'), 'a.png', 'image/png']] as const) {
      expect((await photo(w.f.a, buf, n, t)).status, n).toBe(415);
    }
    expect((await photo(w.f.a, PNG, 'me.png', 'image/png', w.a)).status).toBe(403);
    expect((await photo(new Types.ObjectId().toString(), PNG, 'me.png', 'image/png')).status).toBe(404);
    const del = await w.admin.delete(`/api/founders/${w.f.a}/photo`);
    expect(del.body.founder.hasPhoto).toBe(false);
    expect((await w.a.get(`/api/founders/${w.f.a}/photo`)).status).toBe(404);
    expect((await AuditEvent.find({ action: 'FOUNDER_PHOTO_CHANGED' }).lean()).length).toBe(4);
  });

  it('importBrandAssets imports files from the drop-in folder, validates them, and is idempotent', async () => {
    await Founder.deleteMany({});
    await seedFounders(() => undefined);
    const dir = await mkdtemp(join(tmpdir(), 'cb-assets-'));
    await mkdir(join(dir, 'founders'), { recursive: true }); await mkdir(join(dir, 'brand'), { recursive: true });
    await writeFile(join(dir, 'founders', 'nishant-sharma.png'), PNG);
    await writeFile(join(dir, 'founders', 'deepak-sah.jpg'), Buffer.from('not really a jpg'));
    await writeFile(join(dir, 'brand', 'careerbuddies-logo.webp'), WEBP);
    const log: string[] = [];
    expect(await importBrandAssets(dir, (m) => log.push(m))).toBe(2); // logo + Nishant; Deepak's file is not an image
    expect(log.join('\n')).toMatch(/SKIPPED deepak-sah\.jpg|SKIPPED .*not a PNG/);
    expect(log.join('\n')).toMatch(/no photograph for Divyanshu Gautam/);
    expect(await importBrandAssets(dir, () => undefined)).toBe(0);
    const f = (await w.a.get('/api/founders')).body.founders;
    expect(f.map((x: { hasPhoto: boolean }) => x.hasPhoto)).toEqual([true, false, false]);
    expect((await w.a.get('/api/config')).body.settings.branding.hasCustomLogo).toBe(true);
  });
});
