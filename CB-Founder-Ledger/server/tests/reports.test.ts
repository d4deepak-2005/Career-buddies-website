import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { csvCell, fiscalYearLabel, groupByFiscalYear, minorToDecimal, toCsv } from '../src/domain/reports';
import { Transaction } from '../src/models/Transaction';
import { expensePayload, seedWorld, setupDb, teardownDb, type World } from './helpers';

describe('report helpers (pure)', () => {
  it('fiscal-year labels for April and January starts, including boundary months', () => {
    expect(fiscalYearLabel('2026-03', 4)).toBe('2025-26');
    expect(fiscalYearLabel('2026-04', 4)).toBe('2026-27');
    expect(fiscalYearLabel('2026-12', 4)).toBe('2026-27');
    expect(fiscalYearLabel('2099-04', 4)).toBe('2099-00');
    expect(fiscalYearLabel('2026-06', 1)).toBe('2026');
    expect(fiscalYearLabel('2026-01', 7)).toBe('2025-26');
  });
  it('groups monthly rows by fiscal year and sums exactly', () => {
    const g = groupByFiscalYear([{ month: '2026-03', a: 1, b: 10 }, { month: '2026-04', a: 2, b: 20 }, { month: '2026-05', a: 3, b: 30 }], 4, ['a', 'b']);
    expect(g).toEqual([{ fiscalYear: '2025-26', a: 1, b: 10 }, { fiscalYear: '2026-27', a: 5, b: 50 }]);
  });
  it('CSV: quotes, escapes and neutralises spreadsheet formulas; amounts are exact decimals', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    for (const lead of ['+1+1', '-2', '@SUM(A1)', '\tx', '\rx']) expect(csvCell(lead).replace(/^"/, '')[0]).toBe("'");
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(12.5)).toBe('12.5');
    expect(toCsv(['A', 'B'], [['x', 1]])).toBe('﻿A,B\r\nx,1\r\n');
    expect(minorToDecimal(123456, 2)).toBe('1234.56');
    expect(minorToDecimal(5, 2)).toBe('0.05');
    expect(minorToDecimal(-5, 2)).toBe('-0.05');
    expect(minorToDecimal(7, 0)).toBe('7');
  });
});

const app = createApp();
let w: World;
beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => { w = await seedWorld(app); });

const approveRaw = (id: string) => Transaction.collection.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: 'approved' } });
const equalAll = (world: World) => ({ method: 'equal', entries: [{ founderId: world.f.a }, { founderId: world.f.b }, { founderId: world.f.c }] });
async function mk(payload: Record<string, unknown>, official = true) { const r = await w.a.post('/api/transactions').send(payload); expect(r.status, JSON.stringify(r.body)).toBe(201); if (official) await approveRaw(r.body.transaction.id); return r.body.transaction.id as string; }

async function scenario() {
  const e1 = await mk(expensePayload(w, { amountMinor: 300_000, transactionDate: '2026-03-20', split: equalAll(w) }));
  const e2 = await mk(expensePayload(w, { amountMinor: 100_000, transactionDate: '2026-05-05', paidByFounderId: w.f.b, split: equalAll(w) }));
  await mk({ type: 'reimbursement', amountMinor: 30_000, transactionDate: '2026-05-06', description: 'reimb', paidByFounderId: w.f.b, reimbursesTransactionId: e2 });
  await mk({ type: 'founder_contribution', amountMinor: 500_000, transactionDate: '2026-04-02', description: 'cap C', paidByFounderId: w.f.c });
  await mk({ type: 'founder_contribution', amountMinor: 200_000, transactionDate: '2026-05-02', description: 'cap A', paidByFounderId: w.f.a });
  await mk({ type: 'founder_loan', amountMinor: 150_000, transactionDate: '2026-05-03', description: 'loan B', paidByFounderId: w.f.b });
  await mk({ type: 'refund', amountMinor: 30_000, transactionDate: '2026-05-08', description: 'refund', paidByFounderId: w.f.a, split: equalAll(w) });
  await mk({ type: 'settlement', amountMinor: 20_000, transactionDate: '2026-05-09', description: 'B pays A', paidByFounderId: w.f.b, counterpartyFounderId: w.f.a });
  await mk(expensePayload(w, { amountMinor: 999_900, transactionDate: '2026-05-10', split: equalAll(w) }), false); // pending: never counted
  return { e1, e2 };
}
const report = async (qs = '') => { const r = await w.a.get(`/api/reports/summary${qs}`); expect(r.status, JSON.stringify(r.body)).toBe(200); return r.body; };

describe('reports reconcile with the dashboard, founders and settlements', () => {
  it('same filters → same totals everywhere (the report uses the dashboard\'s own calculation)', async () => {
    await scenario();
    for (const qs of ['', '?from=2026-05-01&to=2026-05-31', '?from=2026-04-01&to=2026-04-30', `?founderId=${w.f.b}`]) {
      const r = await report(qs); const d = (await w.a.get(`/api/dashboard${qs}`)).body;
      expect(r.totals).toMatchObject({
        totalExpensesMinor: d.kpis.totalBusinessExpensesMinor, reimbursedByBusinessMinor: d.kpis.reimbursedByBusinessMinor, founderFundedExpensesMinor: d.kpis.founderFundedExpensesMinor,
        refundsMinor: d.kpis.refundsMinor, founderCapitalMinor: d.kpis.founderCapitalMinor, loansMinor: d.kpis.loansMinor, totalInvestmentMinor: d.kpis.totalInvestmentMinor,
        settledMinor: d.kpis.settledMinor, netBusinessPositionMinor: d.kpis.netBusinessPositionMinor, outstandingSettlementsMinor: d.kpis.outstandingSettlementsMinor,
      });
      expect(r.categories).toEqual(d.charts.expenseByCategory);
      expect(r.monthly).toEqual(d.charts.monthly);
    }
  });

  it('hand-computed all-time figures; founder rows and settlement summary agree', async () => {
    await scenario();
    const r = await report();
    expect(r.totals).toMatchObject({ totalExpensesMinor: 400_000, reimbursedByBusinessMinor: 30_000, founderFundedExpensesMinor: 370_000, refundsMinor: 30_000, founderCapitalMinor: 700_000, loansMinor: 150_000, totalInvestmentMinor: 850_000, settledMinor: 20_000,
      netBusinessPositionMinor: 850_000 - (400_000 - 30_000) });
    const fc = (name: string) => r.founders.find((f: { name: string }) => f.name === name);
    expect(fc('Founder A')).toMatchObject({ contributionMinor: 200_000, expensePaidMinor: 300_000, reimbursedMinor: 0, founderFundedMinor: 300_000 });
    expect(fc('Founder B')).toMatchObject({ loanMinor: 150_000, expensePaidMinor: 100_000, reimbursedMinor: 30_000, founderFundedMinor: 70_000 });
    // allocated shares: E1 100,000 each; E2 founder-funded 70,000 → 23,334 / 23,333 / 23,333; refund 10,000 each
    expect(fc('Founder A').allocatedShareMinor).toBe(100_000 + 23_334 - 10_000);
    expect(fc('Founder B').allocatedShareMinor).toBe(100_000 + 23_333 - 10_000);
    const sum = (await w.a.get('/api/settlements/summary')).body;
    expect(r.totals.outstandingSettlementsMinor).toBe(sum.totals.outstandingPayableMinor);
    expect(r.founders.reduce((s: number, f: { netPositionMinor: number }) => s + f.netPositionMinor, 0)).toBe(0);
    expect(r.counts.byStatus).toMatchObject({ approved: 8, pending_approval: 1 });
    expect(r.pendingApprovals.count).toBe(1);
    expect(r.settlements).toHaveLength(1);
    expect(r.settlements[0]).toMatchObject({ payer: 'Founder B', receiver: 'Founder A', amountMinor: 20_000, status: 'approved' });
  });

  it('annual spend groups by the fiscal year from Settings (April start by default; changeable)', async () => {
    await scenario();
    let r = await report();
    expect(r.annual).toEqual([{ fiscalYear: '2025-26', expensesMinor: 300_000, investmentMinor: 0 }, { fiscalYear: '2026-27', expensesMinor: 100_000, investmentMinor: 850_000 }]);
    await w.admin.patch('/api/settings').send({ expectedVersion: 1, reports: { fiscalYearStartMonth: 1 } });
    r = await report();
    expect(r.annual).toEqual([{ fiscalYear: '2026', expensesMinor: 400_000, investmentMinor: 850_000 }]);
    expect(r.fiscalYearStartMonth).toBe(1);
  });

  it('transaction-type filter narrows the figures and the counts', async () => {
    await scenario();
    const r = await report('?type=founder_contribution');
    expect(r.totals).toMatchObject({ founderCapitalMinor: 700_000, totalExpensesMinor: 0, loansMinor: 0 });
    expect(r.counts.byType).toEqual({ founder_contribution: 2 });
    expect((await w.a.get('/api/reports/summary?type=nonsense')).status).toBe(400);
  });

  it('empty period and empty database give honest zeros', async () => {
    const empty = await report();
    expect(empty.totals.totalExpensesMinor).toBe(0);
    expect(empty.monthly).toEqual([]); expect(empty.annual).toEqual([]); expect(empty.settlements).toEqual([]);
    await scenario();
    expect((await report('?from=2030-01-01&to=2030-12-31')).totals.totalExpensesMinor).toBe(0);
  });

  it('requires sign-in and validates input (no client totals, no operators, real dates)', async () => {
    expect((await request(app).get('/api/reports/summary')).status).toBe(401);
    for (const bad of ['from=2026-02-30', 'from=2026-06-01&to=2026-05-01', 'totalExpensesMinor=1', 'founderId[$ne]=1', 'founderId=zz', 'x=1']) expect((await w.a.get(`/api/reports/summary?${bad}`)).status, bad).toBe(400);
    expect((await w.a.get(`/api/reports/summary?founderId=${new Types.ObjectId()}`)).status).toBe(404);
  });
});

describe('CSV export', () => {
  it('exports every kind with the right content type, exact decimals and the same numbers as the summary', async () => {
    await scenario();
    const res = await w.a.get('/api/reports/export?kind=summary');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="founder-ledger-summary\.csv"/);
    expect(res.text).toContain('Total business expenses,4000.00');
    expect(res.text).toContain('Reimbursed by the business,300.00');
    expect(res.text).toContain('Net business position,4800.00');
    const tx = await w.a.get('/api/reports/export?kind=transactions&from=2026-05-01&to=2026-05-31');
    expect(tx.text.split('\r\n')[0]).toContain('Amount (INR)');
    expect(tx.text).toContain('pending_approval');
    expect(tx.text).not.toContain('2026-04-02'); // outside the period
    for (const kind of ['monthly', 'categories', 'founders', 'settlements']) {
      const r = await w.a.get(`/api/reports/export?kind=${kind}`);
      expect(r.status, kind).toBe(200);
      expect(r.text.split('\r\n').length).toBeGreaterThan(2);
    }
    expect((await w.a.get('/api/reports/export?kind=settlements')).text).toContain('Founder B,Founder A,200.00');
  });

  it('neutralises formulas in user-entered text and refuses bad input', async () => {
    await mk({ type: 'founder_contribution', amountMinor: 1000, transactionDate: '2026-05-02', description: '=HYPERLINK("http://evil","x")', paidByFounderId: w.f.a });
    const r = await w.a.get('/api/reports/export?kind=transactions');
    expect(r.text).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(r.text).not.toMatch(/,=HYPERLINK/);
    expect((await w.a.get('/api/reports/export')).status).toBe(400);
    expect((await w.a.get('/api/reports/export?kind=../../etc/passwd')).status).toBe(400);
    expect((await request(app).get('/api/reports/export?kind=summary')).status).toBe(401);
  });
});
