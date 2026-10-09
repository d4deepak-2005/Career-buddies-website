/** Settings: persistence, validation, authorization, audit and propagation to the config the whole UI is branded from. */
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { AppSettings } from '../src/models/AppSettings';
import { AuditEvent } from '../src/models/AuditEvent';
import { JPG, PDF, PNG, WEBP, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

const get = async (agent = w.a) => (await agent.get('/api/settings')).body;
const patch = (body: Record<string, unknown>, agent = w.admin) => agent.patch('/api/settings').send(body);
const audits = (action: string) => AuditEvent.find({ action }).lean();

describe('reading', () => {
  it('requires sign-in; every signed-in user can read the defaults and the read-only policy', async () => {
    expect((await request(app).get('/api/settings')).status).toBe(401);
    const s = await get();
    expect(s.settings.business).toEqual({ displayName: 'CareerBuddies Founder Ledger', shortName: 'CB Founder Ledger', organisationName: 'CareerBuddies' });
    expect(s.settings.regional).toEqual({ locale: 'en-IN', timeZone: 'Asia/Kolkata' });
    expect(s.settings.approvals).toEqual({ allowSelfApproval: true, requireRejectionReason: false });
    expect(s.settings.version).toBe(1);
    expect(s.currency).toEqual({ code: 'INR', minorUnits: 2 });
    expect(s.policy.reimbursement.rules.join(' ')).toMatch(/exactly one approved business expense/);
    expect(JSON.stringify(s)).not.toMatch(/logoKey|logoSha256|secret|password/i);
  });
});

describe('changing settings', () => {
  it('only admins can change; founders get 403 and nothing changes', async () => {
    expect((await patch({ expectedVersion: 1, business: { displayName: 'Hacked' } }, w.a)).status).toBe(403);
    expect((await request(app).patch('/api/settings').send({ expectedVersion: 1, business: { displayName: 'x' } })).status).toBe(401);
    expect((await get()).settings.business.displayName).toBe('CareerBuddies Founder Ledger');
  });

  it('persists, bumps the version, is audited with before/after, and survives a fresh read from MongoDB', async () => {
    const r = await patch({ expectedVersion: 1, business: { displayName: 'Founders Money Hub', shortName: 'FMH' }, reason: 'rename for the demo' });
    expect(r.status).toBe(200);
    expect(r.body.settings.business).toMatchObject({ displayName: 'Founders Money Hub', shortName: 'FMH', organisationName: 'CareerBuddies' });
    expect(r.body.settings.version).toBe(2);
    const raw = await AppSettings.findOne({ key: 'main' }).lean();
    expect((raw!.values as { business: { displayName: string } }).business.displayName).toBe('Founders Money Hub'); // really in the database
    const ev = await audits('SETTINGS_CHANGED');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ entityType: 'settings', reason: 'rename for the demo' });
    expect((ev[0]!.before as { business: { displayName: string } }).business.displayName).toBe('CareerBuddies Founder Ledger');
    expect((ev[0]!.after as { business: { displayName: string } }).business.displayName).toBe('Founders Money Hub');
  });

  it('PROPAGATION: the change reaches /api/config (the source of every heading, title and format) for every user', async () => {
    await patch({ expectedVersion: 1, business: { displayName: 'Founders Money Hub' }, regional: { locale: 'en-US' }, dashboard: { recentTransactionsCount: 7 } });
    for (const agent of [w.a, w.b, w.admin]) {
      const c = (await agent.get('/api/config')).body;
      expect(c.settings.business.displayName).toBe('Founders Money Hub');
      expect(c.currency).toEqual({ code: 'INR', minorUnits: 2, locale: 'en-US' });
      expect(c.settings.dashboard.recentTransactionsCount).toBe(7);
    }
  });

  it('the dashboard obeys the recent-transactions preference', async () => {
    await patch({ expectedVersion: 1, dashboard: { recentTransactionsCount: 5 } });
    for (let i = 0; i < 7; i++) {
      await w.a.post('/api/transactions').send({ type: 'founder_contribution', amountMinor: 1000 + i, transactionDate: '2026-04-01', description: `c${i}`, paidByFounderId: w.f.a });
    }
    expect((await w.a.get('/api/dashboard')).body.recent).toHaveLength(5);
  });

  it('rejects invalid values with field messages and changes nothing', async () => {
    const bad: Array<Record<string, unknown>> = [
      { business: { displayName: '' } }, { business: { displayName: 'x' } }, { business: { displayName: '<script>alert(1)</script>' } }, { business: { displayName: 'a'.repeat(81) } },
      { regional: { locale: 'xx-YY' } }, { regional: { timeZone: 'Mars/Phobos' } },
      { dashboard: { recentTransactionsCount: 4 } }, { dashboard: { recentTransactionsCount: 21 } }, { dashboard: { defaultPeriod: 'forever' } },
      { recurring: { reminderDaysAhead: 0 } }, { reports: { fiscalYearStartMonth: 13 } }, { settlements: { paymentMethods: [] } },
      { approvals: { allowSelfApproval: 'yes' } },
      { business: { unknownKey: 'x' } }, { unknownSection: { a: 1 } },
      { branding: { logoKey: 'evil.png' } }, { policy: { reimbursement: 'off' } }, { currency: { code: 'USD' } },
    ];
    for (const b of bad) expect((await patch({ expectedVersion: 1, ...b })).status, JSON.stringify(b)).toBe(400);
    expect((await patch({ expectedVersion: 1 })).status).toBe(400); // nothing to change
    expect((await get()).settings.version).toBe(1);
    expect(await audits('SETTINGS_CHANGED')).toHaveLength(0);
  });

  it('detects concurrent edits (409) so one admin cannot silently overwrite another', async () => {
    expect((await patch({ expectedVersion: 1, regional: { locale: 'en-GB' } })).status).toBe(200);
    const stale = await patch({ expectedVersion: 1, regional: { locale: 'en-US' } });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('VERSION_CONFLICT');
    expect((await get()).settings.regional.locale).toBe('en-GB');
  });

  it('accounting policy is NOT a setting: reimbursement and calculation rules are read-only and cannot be edited through the API', async () => {
    for (const body of [{ reimbursement: { enabled: false } }, { calculation: { rounding: 'up' } }, { approvals: { reimbursementPolicy: 'IA-5' } }]) {
      expect((await patch({ expectedVersion: 1, ...body })).status).toBe(400);
    }
  });

  it('settlement payment methods and time zone are validated and persisted', async () => {
    const r = await patch({ expectedVersion: 1, settlements: { paymentMethods: ['UPI', 'NEFT'] }, regional: { timeZone: 'UTC' } });
    expect(r.status).toBe(200);
    expect(r.body.settings.settlements.paymentMethods).toEqual(['UPI', 'NEFT']);
    expect(r.body.settings.regional.timeZone).toBe('UTC');
  });
});

describe('logo', () => {
  it('serves the official default until replaced; admin uploads (PNG/JPG/WebP), it is served and versioned; reset restores the default', async () => {
    const def = await request(app).get('/api/branding/logo');
    expect(def.status).toBe(302);
    expect(def.headers['location']).toBe('/brand/careerbuddies-logo.png');
    for (const [buf, name, mime] of [[PNG, 'logo.png', 'image/png'], [JPG, 'logo.jpg', 'image/jpeg'], [WEBP, 'logo.webp', 'image/webp']] as const) {
      const up = await w.admin.put('/api/branding/logo').attach('file', buf, { filename: name, contentType: mime });
      expect(up.status, name).toBe(200);
      expect(up.body.settings.branding.hasCustomLogo).toBe(true);
      const served = await request(app).get('/api/branding/logo');
      expect(served.status).toBe(200);
      expect(served.headers['content-type']).toBe(mime);
      expect(served.headers['x-content-type-options']).toBe('nosniff');
    }
    const cfg = (await w.a.get('/api/config')).body.settings.branding;
    expect(cfg.logoVersion).toBe(3);
    expect(cfg.logoUrl).toBe('/api/branding/logo?v=3');
    expect((await audits('BRANDING_CHANGED')).length).toBe(3);
    const reset = await w.admin.delete('/api/branding/logo');
    expect(reset.body.settings.branding.hasCustomLogo).toBe(false);
    expect((await request(app).get('/api/branding/logo')).status).toBe(302);
  });

  it('rejects wrong content, spoofed type, empty, oversized files and non-admins', async () => {
    const put = (buf: Buffer, filename: string, contentType: string, agent = w.admin) => agent.put('/api/branding/logo').attach('file', buf, { filename, contentType });
    expect((await put(PDF, 'logo.pdf', 'application/pdf')).status).toBe(415);
    expect((await put(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'logo.svg', 'image/svg+xml')).status).toBe(415);
    expect((await put(Buffer.from('<html>not an image</html>'), 'logo.png', 'image/png')).status).toBe(415); // extension and header lie
    expect((await put(PNG, 'logo.png', 'image/jpeg')).status).toBe(415); // mime mismatch
    expect((await put(Buffer.alloc(0), 'logo.png', 'image/png')).status).toBe(400);
    expect((await put(Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]), 'big.png', 'image/png')).status).toBe(413);
    expect((await put(PNG, 'logo.png', 'image/png', w.a)).status).toBe(403);
    expect((await request(app).put('/api/branding/logo').attach('file', PNG, { filename: 'logo.png', contentType: 'image/png' })).status).toBe(401);
    expect((await w.admin.get('/api/config')).body.settings.branding.hasCustomLogo).toBe(false);
  });
});
