// Phase 4 dashboard browser verification (Playwright + Chromium) against a RUNNING, FRESH Docker stack (no founders yet — it checks the empty state first).
// Fixtures are created through the API; approval belongs to Phase 5, so they are approved with a direct MongoDB write through `docker compose exec mongo`.
// Expected figures below are hand-computed from the fixture definitions (minor units: 300_000 = ₹3,000.00) — see docs/PHASE-4-DASHBOARD.md.
//   SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... PLAYWRIGHT_MODULE=/path/playwright/index.mjs SHOTS=/tmp/shots node tests/browser/dashboard-browser.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const B = process.env.BASE_URL ?? 'http://localhost:8080', ROOT = process.cwd(), SHOTS = process.env.SHOTS ?? '/tmp/dashboard-shots';
const EMAIL = process.env.SMOKE_ADMIN_EMAIL, PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;
fs.mkdirSync(SHOTS, { recursive: true });
const env = Object.fromEntries(fs.readFileSync(ROOT + '/.env', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1)]));
const mongo = (js) => execSync(`docker compose --env-file .env -f docker/docker-compose.yml exec -T mongo mongosh --quiet -u '${env.MONGO_ROOT_USERNAME}' -p '${env.MONGO_ROOT_PASSWORD}' --authenticationDatabase admin --eval '${js}'`, { cwd: ROOT }).toString().trim();
const approve = (id) => mongo(`db.getSiblingDB("cb_founder_ledger").transactions.updateOne({_id:ObjectId("${id}")},{$set:{status:"approved"}}).modifiedCount`);

let total = 0, failed = 0;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
const VIEWPORTS = [['desktop', 1366, 900], ['tablet', 820, 1180], ['mobile', 390, 844], ['narrow', 320, 640]];
const inr = (minor) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(minor / 100);
const flat = (t) => t.replace(/\s+/g, ' ');

// ---- login once through the UI (the auth rate limiter allows 10 logins / 15 min / IP); later contexts reuse the session
const loginCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const lp = await loginCtx.newPage();
await lp.goto(B + '/login'); await lp.fill('#email', EMAIL); await lp.fill('#password', PASSWORD);
await lp.click('button[type=submit]'); await lp.waitForURL('**/dashboard');
const storageState = await loginCtx.storageState();
const api = async (path, method = 'GET', data) => { const r = await lp.request.fetch(B + '/api' + path, { method, data, headers: data ? { 'Content-Type': 'application/json' } : {} }); const t = await r.text(); return { status: r.status(), body: t ? JSON.parse(t) : null }; };
const g = { ok: (name, cond, extra = '') => { total++; if (!cond) failed++; console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : extra); } };

// ---- 0. empty state on a fresh database: honest zeros, clear messages, no fake charts
{
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 }, storageState })).newPage();
  await page.goto(B + '/dashboard'); await page.waitForSelector('[aria-label="Key figures"]');
  const t = flat(await page.locator('main').innerText());
  g.ok('[empty] no founders / no transactions messages', /No transactions match this period/.test(t) && /No founders yet/.test(t) && /No expenses in this period/.test(t), t.slice(0, 200));
  g.ok('[empty] KPI cards show the real zero from the server', /Total investment ₹0\.00/i.test(t));
  g.ok('[empty] no chart is drawn for no data', await page.locator('svg[role=img]').count() === 0);
  await page.screenshot({ path: `${SHOTS}/dash-empty-desktop.png`, fullPage: true });
  await page.context().close();
}

// ---- fixtures (all dates inside 2026-04..05)
const fid = {};
for (const n of ['A', 'B', 'C']) fid[n] = (await api('/founders', 'POST', { name: `Founder ${n} Verylongfoundername${n}` })).body.founder.id;
const cat = {};
for (const n of ['Cloud hosting', 'Travel and conferences with an extremely long category name']) cat[n] = (await api('/categories', 'POST', { name: n })).body.category.id;
const eq = ['A', 'B', 'C'].map((n) => ({ founderId: fid[n] }));
const mk = async (payload) => { const r = await api('/transactions', 'POST', payload); if (r.status !== 201) throw new Error(JSON.stringify(r.body)); approve(r.body.transaction.id); return r.body.transaction.id; };
const e1 = await mk({ type: 'business_expense', amountMinor: 300_000, transactionDate: '2026-04-15', description: 'Annual hosting', categoryId: cat['Cloud hosting'], paidByFounderId: fid.A, split: { method: 'equal', entries: eq } });
const e2 = await mk({ type: 'business_expense', amountMinor: 100_000, transactionDate: '2026-05-05', description: 'Conference travel', categoryId: cat['Travel and conferences with an extremely long category name'], paidByFounderId: fid.B, split: { method: 'equal', entries: eq } });
await mk({ type: 'reimbursement', amountMinor: 30_000, transactionDate: '2026-05-06', description: 'Reimbursed travel', paidByFounderId: fid.B, reimbursesTransactionId: e2 });
await mk({ type: 'founder_contribution', amountMinor: 500_000, transactionDate: '2026-04-02', description: 'Capital C', paidByFounderId: fid.C });
await mk({ type: 'founder_contribution', amountMinor: 200_000, transactionDate: '2026-05-02', description: 'Capital A', paidByFounderId: fid.A });
await mk({ type: 'founder_loan', amountMinor: 150_000, transactionDate: '2026-05-03', description: 'Loan B', paidByFounderId: fid.B });
await mk({ type: 'refund', amountMinor: 30_000, transactionDate: '2026-05-08', description: 'Vendor refund', categoryId: cat['Cloud hosting'], paidByFounderId: fid.A, split: { method: 'equal', entries: eq } });
await mk({ type: 'settlement', amountMinor: 20_000, transactionDate: '2026-05-09', description: 'B pays A', paidByFounderId: fid.B, counterpartyFounderId: fid.A });
// not official: pending (never approved) and voided
await api('/transactions', 'POST', { type: 'business_expense', amountMinor: 999_900, transactionDate: '2026-05-10', description: 'Pending laptop', categoryId: cat['Cloud hosting'], paidByFounderId: fid.A, split: { method: 'equal', entries: eq } });
const vid = await mk({ type: 'business_expense', amountMinor: 888_800, transactionDate: '2026-05-11', description: 'Voided purchase', categoryId: cat['Cloud hosting'], paidByFounderId: fid.A, split: { method: 'equal', entries: eq } });
{ const v = (await api(`/transactions/${vid}`)).body.transaction.version; await api(`/transactions/${vid}/void`, 'POST', { expectedVersion: v, reason: 'entered by mistake' }); }

// ---- hand-computed expectations (all-time): see the derivation in docs/PHASE-4-DASHBOARD.md
const EXPECT = {
  kpis: { totalInvestmentMinor: 850_000, founderCapitalMinor: 700_000, loansMinor: 150_000, totalBusinessExpensesMinor: 400_000, reimbursedByBusinessMinor: 30_000, founderFundedExpensesMinor: 370_000, refundsMinor: 30_000, settledMinor: 20_000, outstandingSettlementsMinor: 136_666 },
  net: { A: 156_666, B: -43_333, C: -113_333 }, outstanding: { A: 136_666, B: -23_333, C: -113_333 }, fair: { A: 113_334, B: 113_333, C: 113_333 }, paid: { A: 270_000, B: 70_000, C: 0 },
  recs: [['C', 'A', 113_333], ['B', 'A', 23_333]],
};
const may = { totalInvestmentMinor: 350_000, founderCapitalMinor: 200_000, loansMinor: 150_000, totalBusinessExpensesMinor: 100_000, reimbursedByBusinessMinor: 30_000, refundsMinor: 30_000, settledMinor: 20_000, outstandingSettlementsMinor: 136_666 };

// ---- API vs hand-computed vs engine
{
  const d = (await api('/dashboard')).body;
  const p = (await api('/founders/financial-positions')).body;
  g.ok('[api] KPIs equal hand-computed values', Object.entries(EXPECT.kpis).every(([k, v]) => d.kpis[k] === v), JSON.stringify(d.kpis));
  const byName = (n) => d.founders.find((f) => f.name.startsWith(`Founder ${n} `));
  g.ok('[api] founder paid / fair share / net / outstanding equal hand-computed', ['A', 'B', 'C'].every((n) => byName(n).paidMinor === EXPECT.paid[n] && byName(n).fairShareMinor === EXPECT.fair[n] && byName(n).netPositionMinor === EXPECT.net[n] && byName(n).outstandingMinor === EXPECT.outstanding[n]));
  g.ok('[api] dashboard founders equal the Phase 3 positions endpoint', d.founders.every((f) => { const e = p.positions.find((x) => x.founderId === f.founderId); return e.paidMinor === f.paidMinor && e.fairShareMinor === f.fairShareMinor && e.grossNetPositionMinor === f.netPositionMinor && e.outstandingMinor === f.outstandingMinor; }));
  g.ok('[api] Σ net positions = 0 (Option C zero-sum)', d.founders.reduce((s, f) => s + f.netPositionMinor, 0) === 0);
  g.ok('[api] recommendations equal hand-computed', JSON.stringify(d.settlement.recommendations.map((r) => [r.payer.name.slice(8, 9), r.receiver.name.slice(8, 9), r.amountMinor])) === JSON.stringify(EXPECT.recs));
  g.ok('[api] chart totals equal KPIs', d.charts.expenseByCategory.reduce((s, c) => s + c.amountMinor, 0) === 400_000 && d.charts.monthly.reduce((s, m) => s + m.expensesMinor, 0) === 400_000 && d.charts.monthly.reduce((s, m) => s + m.investmentMinor, 0) === 850_000);
  g.ok('[api] pending and voided are excluded', d.counts.notCountedYet === 1 && d.recent.some((r) => r.description === 'Pending laptop' && !r.counted) && !JSON.stringify(d.kpis).includes('999900'));
  const m = (await api('/dashboard?from=2026-05-01&to=2026-05-31')).body;
  g.ok('[api] May period KPIs equal hand-computed', Object.entries(may).every(([k, v]) => m.kpis[k] === v), JSON.stringify(m.kpis));
  g.ok('[api] invalid query rejected', (await api('/dashboard?from=2026-02-30')).status === 400 && (await api('/dashboard?totalBusinessExpensesMinor=1')).status === 400);
}

for (const [vp, width, height] of VIEWPORTS) {
  const ok = (name, cond, extra = '') => g.ok(`[${vp}] ${name}`, cond, extra);
  const ctx = await browser.newContext({ viewport: { width, height }, storageState });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && !/50[0-9]|40[0-9]|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  const noOverflow = async (label) => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(`no horizontal overflow: ${label}`, w[0] <= w[1], `${w}`); };
  const shot = (n) => page.screenshot({ path: `${SHOTS}/dash-${n}-${vp}.png`, fullPage: true });

  // navigate via the real navigation
  await page.goto(B + '/transactions'); await page.waitForSelector('h1');
  if (width < 1024) await page.click('button[aria-label="Open menu"]');
  await page.locator('nav[aria-label=Main]:visible').getByText('Dashboard', { exact: true }).click(); await page.waitForSelector('[aria-label="Key figures"]');
  ok('navigated to the dashboard from the menu', page.url().endsWith('/dashboard'));

  // KPI cards = API = hand-computed
  const kpi = flat(await page.locator('[aria-label="Key figures"]').innerText());
  ok('KPI: total investment', kpi.includes(inr(EXPECT.kpis.totalInvestmentMinor)), kpi);
  ok('KPI: total business expenses + reimbursed hint', kpi.includes(inr(400_000)) && kpi.includes(`${inr(30_000)} reimbursed by the business`), kpi);
  ok('KPI: outstanding settlements', kpi.includes(inr(EXPECT.kpis.outstandingSettlementsMinor)));
  ok('KPI: founder capital', kpi.includes(inr(700_000)));
  ok('KPI: loans, refunds, settled', kpi.includes(inr(150_000)) && kpi.includes(inr(30_000)) && kpi.includes(inr(20_000)));

  // founder cards: displayed == hand-computed == API
  const cards = (await page.locator('[aria-label="Founder cards"] > li').allInnerTexts()).map(flat);
  const find = (n) => cards.find((c) => c.includes(`Founder ${n} `));
  for (const n of ['A', 'B', 'C']) {
    const c = find(n);
    ok(`founder ${n}: fair share ${inr(EXPECT.fair[n])}, net ${inr(Math.abs(EXPECT.net[n]))}`, c.includes(inr(EXPECT.fair[n])) && c.includes(inr(Math.abs(EXPECT.net[n]))) && c.includes(EXPECT.net[n] > 0 ? '+' : '−'), c);
  }
  ok('founder A receives / B and C pay', /To receive/.test(find('A')) && /To pay/.test(find('B')) && /To pay/.test(find('C')));
  ok('reimbursement note uses Option C wording', /reimbursed by the business/.test(find('B')));
  ok('no obsolete external wording anywhere', !/external|PASS_WITH_EXTERNAL/i.test(await page.locator('main').innerText()));

  // settlement summary
  const rec = (await page.locator('[aria-label="Recommended payments"] > li').allInnerTexts()).map(flat);
  ok('settlement: C pays A and B pays A with exact amounts', rec.length === 2 && rec[0].includes(inr(113_333)) && /Founder C/.test(rec[0]) && rec[1].includes(inr(23_333)) && /Founder B/.test(rec[1]), rec.join(' | '));
  // transaction activity
  const recentText = flat(await page.locator('#recent-h').locator('xpath=ancestor::section').innerText());
  ok('recent transactions: newest first incl. pending flagged', /Voided purchase|Pending laptop/.test(recentText) && /Pending approval/.test(recentText) && /Vendor refund/.test(recentText));
  // charts present with accessible data tables
  ok('three charts drawn (bars, donut, line)', await page.locator('svg[role=img]').count() === 2 && await page.locator('[aria-label="Contribution by founder"]').count() === 1);
  const donutRows = flat(await page.locator('[aria-label="Expense categories"]').innerText());
  ok('category chart values equal API', donutRows.includes(inr(300_000)) || donutRows.includes(inr(100_000)), donutRows);
  await shot('all-time'); await noOverflow('dashboard all-time');

  // period filter: May only
  await page.fill('input[type=date] >> nth=0', '2026-05-01'); await page.fill('input[type=date] >> nth=1', '2026-05-31');
  await page.waitForFunction(() => document.querySelector('[data-testid=scope-note]')?.textContent?.includes('2026-05-01 to 2026-05-31'));
  await page.waitForFunction(() => !document.querySelector('[aria-busy=true]'));
  const k2 = flat(await page.locator('[aria-label="Key figures"]').innerText());
  ok('May period: expenses 1,000.00 / investment 3,500.00 (server-calculated)', k2.includes(inr(may.totalBusinessExpensesMinor)) && k2.includes(inr(may.totalInvestmentMinor)), k2);
  ok('May period: outstanding settlements unchanged (cumulative balance)', k2.includes(inr(136_666)));
  ok('scope note explains period vs cumulative', /cumulative up to 2026-05-31/.test(await page.getByTestId('scope-note').innerText()));
  await shot('may'); await noOverflow('dashboard May');
  // founder + category filters
  await page.selectOption('select >> nth=1', fid.B);
  await page.waitForFunction(() => document.querySelectorAll('[aria-label="Founder cards"] > li').length === 1);
  ok('founder filter: only that founder card', (await page.locator('[aria-label="Founder cards"] > li').count()) === 1);
  await page.click('button:has-text("Reset")');
  await page.waitForFunction(() => document.querySelectorAll('[aria-label="Founder cards"] > li').length === 4 || document.querySelectorAll('[aria-label="Founder cards"] > li').length === 3);
  ok('reset restores all-time figures', flat(await page.locator('[aria-label="Key figures"]').innerText()).includes(inr(850_000)));

  // empty period
  await page.goto(B + '/dashboard?from=2030-01-01&to=2030-01-31'); await page.waitForSelector('text=No transactions match this period');
  ok('empty period message + zero KPIs from the server', /Total business expenses ₹0\.00/i.test(flat(await page.locator('[aria-label="Key figures"]').innerText())));
  await shot('empty-period'); await noOverflow('dashboard empty period');

  // loading + error behaviour (route interception only changes what the browser sees; nothing server-side is weakened)
  await page.route('**/api/dashboard*', async (route) => { await new Promise((r) => setTimeout(r, 800)); await route.continue(); });
  await page.goto(B + '/dashboard');
  ok('loading state shown while fetching', await page.waitForSelector('[role=status][aria-label="Loading dashboard"]', { timeout: 3000 }).then(() => true, () => false));
  await page.waitForSelector('[aria-label="Key figures"]'); await page.unroute('**/api/dashboard*');
  await page.route('**/api/dashboard*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL', message: 'Something went wrong' } }) }));
  await page.goto(B + '/dashboard'); await page.waitForSelector('[role=alert]');
  ok('error state: friendly message, no stack trace, filters still usable', /Something went wrong/.test(await page.locator('[role=alert]').innerText()) && await page.locator('[aria-label="Filters"]').count() === 1 && !/at .*\.(ts|js):\d+/.test(await page.locator('main').innerText()));
  await shot('error'); await noOverflow('dashboard error state');
  await page.unroute('**/api/dashboard*');
  await page.click('[role=alert] button'); await page.waitForSelector('[aria-label="Key figures"]');
  ok('retry recovers', true);

  // Settle action prefills a settlement (validated by the server on submit)
  await page.goto(B + '/dashboard'); await page.waitForSelector('[aria-label="Recommended payments"]');
  await page.click('[aria-label="Recommended payments"] > li >> nth=0 >> text=Settle');
  await page.waitForSelector('#amount');
  ok('Settle opens a prefilled Settlement form', (await page.inputValue('#amount')) === '1133.33' && await page.locator('[role=radio][aria-checked=true]:has-text("Settlement")').count() === 1);
  await noOverflow('settle form');

  // dashboard numbers == API numbers (rendered vs fetched, same filters)
  await page.goto(B + '/dashboard?from=2026-05-01&to=2026-05-31'); await page.waitForSelector('[aria-label="Key figures"]');
  const apiMay = (await api('/dashboard?from=2026-05-01&to=2026-05-31')).body;
  const k3 = flat(await page.locator('[aria-label="Key figures"]').innerText());
  ok('rendered KPIs equal the API response', ['totalInvestmentMinor', 'founderCapitalMinor', 'loansMinor', 'totalBusinessExpensesMinor', 'reimbursedByBusinessMinor', 'refundsMinor', 'settledMinor', 'outstandingSettlementsMinor'].every((k) => k3.includes(inr(apiMay.kpis[k]))));
  ok('no console errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(`browser checks: ${total - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
