/** Approval workflow end to end through the API (no database shortcuts), incl. Option C interplay, audit and settings. */
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { AuditEvent } from '../src/models/AuditEvent';
import { Transaction } from '../src/models/Transaction';
import { TransactionRevision } from '../src/models/TransactionRevision';
import { expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

type Agent = World['a'];
const equalAll = (world: World) => ({ method: 'equal', entries: [{ founderId: world.f.a }, { founderId: world.f.b }, { founderId: world.f.c }] });
const exp = (over: Record<string, unknown> = {}) => expensePayload(w, { amountMinor: 300_000, split: equalAll(w), ...over });
async function make(agent: Agent, payload: Record<string, unknown>) { const r = await agent.post('/api/transactions').send(payload); expect(r.status, JSON.stringify(r.body)).toBe(201); return r.body.transaction as { id: string; version: number }; }
const decide = (agent: Agent, id: string, action: 'approve' | 'reject', v: number, comment?: string) => agent.post(`/api/transactions/${id}/${action}`).send({ expectedVersion: v, ...(comment ? { comment } : {}) });
const kpis = async () => (await w.a.get('/api/dashboard')).body.kpis;
const setSettings = (patch: Record<string, unknown>) => w.admin.patch('/api/settings').send({ expectedVersion: 1, ...patch });

describe('approve', () => {
  it('another founder approves: status, who/when/comment are stored, official figures now include it, history and audit are written', async () => {
    const t = await make(w.a, exp());
    expect((await kpis()).totalBusinessExpensesMinor).toBe(0);
    const r = await decide(w.b, t.id, 'approve', t.version, 'looks right');
    expect(r.status).toBe(200);
    expect(r.body.transaction.status).toBe('approved');
    expect(r.body.transaction.decision).toMatchObject({ outcome: 'approved', comment: 'looks right', by: { name: 'fb' } });
    expect(r.body.transaction.version).toBe(t.version + 1);
    expect((await kpis()).totalBusinessExpensesMinor).toBe(300_000);
    const rev = await TransactionRevision.find({ transactionId: t.id }).lean();
    expect(rev.map((x) => x.action)).toEqual(['created', 'approved']);
    const ev = await AuditEvent.find({ action: 'TRANSACTION_APPROVED' }).lean();
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ entityId: t.id, reason: 'looks right' });
  });

  it('requires sign-in; only pending transactions can be decided; double approval and stale versions are rejected', async () => {
    const t = await make(w.a, exp());
    expect((await request(app).post(`/api/transactions/${t.id}/approve`).send({ expectedVersion: 1 })).status).toBe(401);
    expect((await decide(w.b, t.id, 'approve', 99)).status).toBe(409);
    expect((await decide(w.b, t.id, 'approve', t.version)).status).toBe(200);
    const again = await decide(w.admin, t.id, 'approve', t.version + 1);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('INVALID_TRANSITION');
    expect((await decide(w.admin, t.id, 'reject', t.version + 1)).status).toBe(409);
    const draft = (await w.a.post('/api/transactions').send({ ...exp(), status: 'draft' })).body.transaction;
    expect((await decide(w.b, draft.id, 'approve', draft.version)).status).toBe(409); // drafts must be submitted first
  });

  it('two simultaneous decisions: exactly one wins', async () => {
    const t = await make(w.a, exp());
    const [x, y] = await Promise.all([decide(w.b, t.id, 'approve', t.version), decide(w.admin, t.id, 'reject', t.version)]);
    expect([x.status, y.status].sort()).toEqual([200, 409]);
    expect(['approved', 'rejected']).toContain((await Transaction.findById(t.id).lean())!.status);
  });

  it('an approved record is final: it can no longer be edited, only voided', async () => {
    const t = await make(w.a, exp());
    await decide(w.b, t.id, 'approve', t.version);
    expect((await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 2, description: 'changed' })).status).toBe(409);
  });
});

describe('reject', () => {
  it('rejects with an optional comment; rejected records never count; they cannot be edited or re-decided', async () => {
    const t = await make(w.a, exp());
    const r = await decide(w.b, t.id, 'reject', t.version, 'duplicate invoice');
    expect(r.body.transaction).toMatchObject({ status: 'rejected', decision: { outcome: 'rejected', comment: 'duplicate invoice' } });
    expect((await kpis()).totalBusinessExpensesMinor).toBe(0);
    expect((await decide(w.b, t.id, 'approve', 2)).status).toBe(409);
    expect((await w.a.patch(`/api/transactions/${t.id}`).send({ expectedVersion: 2, description: 'x' })).status).toBe(409);
    expect((await AuditEvent.find({ action: 'TRANSACTION_REJECTED' }).lean())[0]).toMatchObject({ reason: 'duplicate invoice' });
  });

  it('Settings → Approval rules: a rejection reason can be made mandatory', async () => {
    expect((await setSettings({ approvals: { requireRejectionReason: true } })).status).toBe(200);
    const t = await make(w.a, exp());
    const none = await decide(w.b, t.id, 'reject', t.version);
    expect(none.status).toBe(400);
    expect(none.body.error.code).toBe('REASON_REQUIRED');
    expect((await decide(w.b, t.id, 'reject', t.version, 'no')).status).toBe(400); // too short
    expect((await decide(w.b, t.id, 'reject', t.version, 'wrong amount')).status).toBe(200);
  });
});

describe('self-approval rule (Settings → Approval rules)', () => {
  it('allowed by default; when switched off the creator is blocked but others (and an admin who did not create it) can decide', async () => {
    const mine = await make(w.a, exp());
    expect((await decide(w.a, mine.id, 'approve', mine.version)).status).toBe(200);
    expect((await setSettings({ approvals: { allowSelfApproval: false } })).status).toBe(200);
    const t2 = await make(w.a, exp());
    const blocked = await decide(w.a, t2.id, 'approve', t2.version);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('SELF_APPROVAL_NOT_ALLOWED');
    expect((await decide(w.a, t2.id, 'reject', t2.version)).status).toBe(403);
    expect((await decide(w.admin, t2.id, 'approve', t2.version)).status).toBe(200);
    const adminOwn = await make(w.admin, exp());
    expect((await decide(w.admin, adminOwn.id, 'approve', adminOwn.version)).status).toBe(403);
    expect((await decide(w.b, adminOwn.id, 'approve', adminOwn.version)).status).toBe(200);
  });
});

describe('Option C interplay', () => {
  const reimb = (expenseId: string, amountMinor: number) => ({ type: 'reimbursement', amountMinor, transactionDate: '2026-05-03', description: 'back', paidByFounderId: w.f.a, reimbursesTransactionId: expenseId });

  it('a reimbursement can only be created for an APPROVED expense, and approving it moves the figures (business-borne)', async () => {
    const e = await make(w.a, exp());
    expect((await w.a.post('/api/transactions').send(reimb(e.id, 100_000))).status).toBe(400); // expense still pending
    await decide(w.b, e.id, 'approve', e.version);
    const r = await make(w.a, reimb(e.id, 100_000));
    expect((await kpis()).reimbursedByBusinessMinor).toBe(0); // pending: not official
    await decide(w.b, r.id, 'approve', r.version);
    expect(await kpis()).toMatchObject({ totalBusinessExpensesMinor: 300_000, reimbursedByBusinessMinor: 100_000, founderFundedExpensesMinor: 200_000 });
    const a = (await w.a.get('/api/dashboard')).body.founders.find((f: { founderId: string }) => f.founderId === w.f.a);
    expect(a.netPositionMinor).toBe(133_333);
  });

  it('rejecting a reimbursement gives its capacity back (the expense becomes fully reimbursable again)', async () => {
    const e = await make(w.a, exp());
    await decide(w.b, e.id, 'approve', e.version);
    const r = await make(w.a, reimb(e.id, 300_000));
    expect((await w.a.post('/api/transactions').send(reimb(e.id, 1))).status).toBe(400); // fully reserved while pending
    expect((await decide(w.b, r.id, 'reject', r.version, 'wrong expense')).status).toBe(200);
    expect((await w.a.post('/api/transactions').send(reimb(e.id, 300_000))).status).toBe(201);
    expect((await Transaction.findById(e.id).lean())!.reimbursedMinor).toBe(300_000);
  });

  it('an expense with an active (even pending) reimbursement still cannot be voided; after the reimbursement is rejected it can', async () => {
    const e = await make(w.a, exp());
    await decide(w.b, e.id, 'approve', e.version);
    const r = await make(w.a, reimb(e.id, 50_000));
    expect((await w.admin.post(`/api/transactions/${e.id}/void`).send({ expectedVersion: 2, reason: 'mistake entered' })).status).toBe(409);
    await decide(w.b, r.id, 'reject', r.version);
    expect((await w.admin.post(`/api/transactions/${e.id}/void`).send({ expectedVersion: 2, reason: 'mistake entered' })).status).toBe(200);
  });

  it('a settlement counts only after approval (SETTLEMENT_COMPLETED is audited); a pending one changes nothing', async () => {
    const e = await make(w.a, exp());
    await decide(w.b, e.id, 'approve', e.version);
    const s = await make(w.b, { type: 'settlement', amountMinor: 100_000, transactionDate: '2026-05-04', description: 'pay A', paidByFounderId: w.f.b, counterpartyFounderId: w.f.a });
    expect((await kpis()).settledMinor).toBe(0);
    expect((await kpis()).outstandingSettlementsMinor).toBe(200_000);
    await decide(w.a, s.id, 'approve', s.version);
    expect((await kpis()).settledMinor).toBe(100_000);
    expect((await kpis()).outstandingSettlementsMinor).toBe(100_000);
    expect(await AuditEvent.countDocuments({ action: 'SETTLEMENT_COMPLETED' })).toBe(1);
    expect(await AuditEvent.countDocuments({ action: 'SETTLEMENT_CREATED' })).toBe(1);
  });
});

describe('approvals inbox', () => {
  it('lists the three tabs with counts, oldest pending first, and validates its query', async () => {
    const t1 = await make(w.a, exp({ description: 'first' }));
    await make(w.a, exp({ description: 'second' }));
    const t3 = await make(w.a, exp({ description: 'third' }));
    await decide(w.b, t1.id, 'approve', t1.version);
    await decide(w.b, t3.id, 'reject', t3.version, 'nope');
    const pending = (await w.b.get('/api/approvals')).body;
    expect(pending.counts).toEqual({ pending_approval: 1, approved: 1, rejected: 1 });
    expect(pending.items.map((i: { description: string }) => i.description)).toEqual(['second']);
    expect((await w.b.get('/api/approvals?status=approved')).body.items[0]).toMatchObject({ description: 'first', decision: { outcome: 'approved' } });
    expect((await w.b.get('/api/approvals?status=rejected')).body.items[0].decision.comment).toBe('nope');
    expect((await w.b.get('/api/approvals?status=voided')).status).toBe(400);
    expect((await w.b.get('/api/approvals?foo=1')).status).toBe(400);
    expect((await request(app).get('/api/approvals')).status).toBe(401);
    expect((await w.a.get('/api/dashboard')).body.pendingApprovals.count).toBe(1);
  });
});
