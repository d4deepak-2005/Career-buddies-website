// Option C browser verification (Playwright + Chromium) against a RUNNING Docker stack. Runs the full reimbursement flow at
// desktop, tablet and mobile sizes. Approval belongs to Phase 5, so fixtures are approved with a direct MongoDB write through
// `docker compose exec mongo` (MongoDB is never published). Usage (from CB-Founder-Ledger/):
//   SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs SHOTS=/tmp/shots node tests/browser/optionc-browser.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const B = process.env.BASE_URL ?? 'http://localhost:8080', ROOT = process.cwd(), SHOTS = process.env.SHOTS ?? '/tmp/optionc-shots';
const EMAIL = process.env.SMOKE_ADMIN_EMAIL, PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;
fs.mkdirSync(SHOTS, { recursive: true });
const env = Object.fromEntries(fs.readFileSync(ROOT + '/.env', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1)]));
const mongo = (js) => execSync(`docker compose --env-file .env -f docker/docker-compose.yml exec -T mongo mongosh --quiet -u '${env.MONGO_ROOT_USERNAME}' -p '${env.MONGO_ROOT_PASSWORD}' --authenticationDatabase admin --eval '${js}'`, { cwd: ROOT }).toString().trim();
const approve = (id) => mongo(`db.getSiblingDB("cb_founder_ledger").transactions.updateOne({_id:ObjectId("${id}")},{$set:{status:"approved"}}).modifiedCount`);
const rawExpense = (id) => JSON.parse(mongo(`JSON.stringify(db.getSiblingDB("cb_founder_ledger").transactions.findOne({_id:ObjectId("${id}")},{reimbursedMinor:1,status:1,amountMinor:1}))`));

let total = 0, failed = 0;
let storageState;
const VIEWPORTS = [['desktop', 1366, 900], ['tablet', 820, 1180], ['mobile', 390, 844]];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });

for (const [vp, width, height] of VIEWPORTS) {
  const ok = (name, cond, extra = '') => { total++; if (!cond) failed++; console.log(cond ? 'PASS' : 'FAIL', `[${vp}]`, name, cond ? '' : extra); };
  const ctx = await browser.newContext({ viewport: { width, height }, ...(storageState ? { storageState } : {}) });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && !/40[0-9]|409/.test(m.text()) && errs.push(m.text()));
  const api = async (path, method = 'GET', data) => { const r = await page.request.fetch(B + '/api' + path, { method, data, headers: data ? { 'Content-Type': 'application/json' } : {} }); const t = await r.text(); return { status: r.status(), body: t ? JSON.parse(t) : null }; };
  const noOverflow = async (label) => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(`no horizontal overflow: ${label}`, w[0] <= w[1], `${w}`); };
  const shot = (name) => page.screenshot({ path: `${SHOTS}/oc-${name}-${vp}.png`, fullPage: true });
  const tag = `OC-${vp}-${Date.now() % 1000000}`;

  // 1. login through the real UI
  if (!storageState) {
    await page.goto(B + '/login'); await page.fill('#email', EMAIL); await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]'); await page.waitForURL('**/dashboard');
    storageState = await ctx.storageState();
    ok('login through the UI', true);
  } else {
    await page.goto(B + '/dashboard'); await page.waitForSelector('main');
    ok('signed-in session reused (login is rate limited to 10 / 15 min)', !page.url().includes('/login'));
  }
  await shot('dashboard');

  // fixtures (API, as the signed-in admin); the expense is approved by a DB write because Phase 5 owns approval
  const fid = {};
  for (const n of ['A', 'B', 'C']) fid[n] = (await api('/founders', 'POST', { name: `[${tag}] ${n}` })).body.founder.id;
  const cat = (await api('/categories', 'POST', { name: `[${tag}] cat` })).body.category.id;
  const e1 = (await api('/transactions', 'POST', { type: 'business_expense', amountMinor: 300_000, transactionDate: '2026-05-01', description: `[${tag}] Hosting`, categoryId: cat, paidByFounderId: fid.A, split: { method: 'equal', entries: ['A', 'B', 'C'].map((n) => ({ founderId: fid[n] })) } })).body.transaction.id;
  ok('expense approved (fixture)', approve(e1) === '1');
  const card = async (n) => (await page.locator(`[aria-label="Founder positions"] li:has-text("[${tag}] ${n}")`).innerText()).replace(/\s+/g, ' ');

  // 2. reimbursement creation with the Expense Picker
  await page.goto(B + '/transactions/new'); await page.waitForSelector('#amount');
  await page.click('[role=radio]:has-text("Reimbursement")');
  ok('picker asks for the payer first', await page.locator('text=Choose who is being reimbursed first').count() === 1);
  await page.click(`[role=radiogroup][aria-label="Who is being reimbursed?"] >> text=[${tag}] A`);
  await page.waitForSelector(`[role=radiogroup][aria-label="Expense being reimbursed"] [role=radio]:has-text("[${tag}] Hosting")`);
  const opt = (await page.locator(`[aria-label="Expense being reimbursed"] [role=radio]:has-text("[${tag}] Hosting")`).innerText()).replace(/\s+/g, ' ');
  ok('picker shows the approved expense with its reimbursable amount', /3,000\.00/.test(opt) && /Up to/.test(opt), opt);
  await page.fill('#amount', '1000'); await page.fill('#description', `[${tag}] reimbursed 1,000`);
  await page.click('button:has-text("Submit for approval")');
  ok('submitting without choosing an expense shows a message', await page.locator('text=Choose the expense this reimburses').count() >= 1);
  await shot('picker-invalid');
  await noOverflow('add reimbursement form');
  await page.click(`[aria-label="Expense being reimbursed"] [role=radio]:has-text("[${tag}] Hosting")`);
  await page.click('button:has-text("Submit for approval")'); await page.waitForURL(/\/transactions\/[a-f0-9]{24}$/);
  await page.waitForSelector('text=Reimburses');
  const r1 = page.url().split('/').pop();
  ok('reimbursement created and shows the expense it reimburses', /Hosting/.test(await page.locator('main').innerText()));
  await shot('reimbursement-detail');
  await noOverflow('reimbursement detail');
  ok('capacity reserved on the expense (DB)', rawExpense(e1).reimbursedMinor === 100_000);
  ok('reimbursement approved (fixture)', approve(r1) === '1');

  // 3. founder positions: the business bears 1,000; founders share 2,000
  await page.goto(B + '/founders'); await page.waitForSelector('[aria-label="Founder positions"]');
  const [A1, B1, C1] = [await card('A'), await card('B'), await card('C')];
  ok('A: paid 2,000.00 / fair 666.67 / net +1,333.33 / receives', /2,000\.00/.test(A1) && /666\.67/.test(A1) && /\+.*1,333\.33/.test(A1) && /To receive/.test(A1), A1);
  ok('B: fair 666.67 / net −666.67 / pays', /666\.67/.test(B1) && /−.*666\.67/.test(B1) && /To pay/.test(B1), B1);
  ok('C: fair 666.66 / net −666.66 / pays', /666\.66/.test(C1) && /−.*666\.66/.test(C1) && /To pay/.test(C1), C1);
  ok('reconciliation names the 1,000.00 reimbursed by the business', /1,000\.00 reimbursed by the business/.test((await page.getByLabel('Reconciliation').innerText()).replace(/\s+/g, ' ')));
  const pos = (await api('/founders/financial-positions')).body;
  const mine = pos.positions.filter((p) => p.founderName.startsWith(`[${tag}]`));
  const fmt = (m) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(m / 100);
  let same = true;
  for (const p of mine) { const t = await card(p.founderName.slice(-1)); for (const v of [p.paidMinor, p.fairShareMinor, Math.abs(p.grossNetPositionMinor)]) if (!t.includes(fmt(v).replace(/^-/, ''))) same = false; }
  ok('API values equal displayed values', same);
  ok('API: Σ net positions = 0 and business-borne = 100000', pos.positions.reduce((s, p) => s + p.grossNetPositionMinor, 0) === 0 && pos.reconciliation.businessBorneMinor === 100_000);
  await shot('founders'); await noOverflow('founders page');

  // 4. settlement recommendations
  await page.goto(B + '/settlements'); await page.waitForSelector('[aria-label="Recommended payments"]');
  const rec = (await page.locator('[aria-label="Recommended payments"]').innerText()).replace(/\s+/g, ' ');
  ok('recommends B→A 666.67 and C→A 666.66', new RegExp(`\\[${tag}\\] B pays \\[${tag}\\] A ₹666\\.67`).test(rec) && new RegExp(`\\[${tag}\\] C pays \\[${tag}\\] A ₹666\\.66`).test(rec), rec);
  ok('page states the business-borne amount separately', await page.locator('text=Reimbursed by the business').count() >= 1);
  await shot('settlements'); await noOverflow('settlements page');

  // 5. invalid / over-reimbursement through the UI
  await page.goto(B + '/transactions/new'); await page.waitForSelector('#amount');
  await page.click('[role=radio]:has-text("Reimbursement")');
  await page.click(`[role=radiogroup][aria-label="Who is being reimbursed?"] >> text=[${tag}] B`);
  await page.waitForSelector('text=no approved expenses left to reimburse');
  ok('founder with no approved expenses sees an explanation', true);
  await page.click(`[role=radiogroup][aria-label="Who is being reimbursed?"] >> text=[${tag}] A`);
  await page.click(`[aria-label="Expense being reimbursed"] [role=radio]:has-text("[${tag}] Hosting")`);
  await page.fill('#amount', '2500'); await page.fill('#description', `[${tag}] too much`);
  await page.click('button:has-text("Submit for approval")');
  await page.waitForSelector('[role=alert]');
  ok('over-reimbursement (2,500 > 2,000 remaining) is rejected with a clear message', /above the expense amount/.test(await page.locator('[role=alert]').first().innerText()));
  await shot('over-reimbursement'); await noOverflow('over-reimbursement form');
  ok('rejected attempt reserved nothing (DB)', rawExpense(e1).reimbursedMinor === 100_000);

  // 6. expense void guard
  await page.goto(B + `/transactions/${e1}`); await page.waitForSelector('[data-testid=reimbursed-summary]');
  ok('expense shows reimbursed 1,000.00 / founders share 2,000.00', /1,000\.00 reimbursed.*2,000\.00/.test(await page.getByTestId('reimbursed-summary').innerText()));
  await page.click('button:has-text("Void transaction")'); await page.fill('#void-reason', 'checking the guard');
  await page.locator('button:has-text("Void transaction")').last().click();
  await page.waitForSelector('text=Void the linked reimbursement');
  ok('voiding an expense with active reimbursements is blocked', true);
  ok('expense is still approved (DB)', rawExpense(e1).status === 'approved');
  await shot('expense-void-blocked'); await noOverflow('expense detail');

  // 7. void the reimbursement: founder-funded amount restored
  await page.goto(B + `/transactions/${r1}`); await page.waitForSelector('text=Reimburses');
  await page.click('button:has-text("Void transaction")'); await page.fill('#void-reason', 'restoring the founder-funded amount');
  await page.locator('button:has-text("Void transaction")').last().click();
  await page.waitForSelector('text=Voided');
  ok('reimbursement voided, record kept', /voided/i.test(await page.locator('main').innerText()));
  ok('capacity released (DB)', rawExpense(e1).reimbursedMinor === 0);
  await page.goto(B + '/founders'); await page.waitForSelector('[aria-label="Founder positions"]');
  const A2 = await card('A');
  ok('after void: A paid 3,000.00 / fair 1,000.00 / net +2,000.00', /3,000\.00/.test(A2) && /1,000\.00/.test(A2) && /\+.*2,000\.00/.test(A2), A2);
  await shot('founders-after-void');

  // 8. expense can now be voided; tidy up
  await page.goto(B + `/transactions/${e1}`); await page.waitForSelector('button:has-text("Void transaction")');
  await page.click('button:has-text("Void transaction")'); await page.fill('#void-reason', 'cleanup after browser test');
  await page.locator('button:has-text("Void transaction")').last().click(); await page.waitForSelector('text=Voided');
  ok('expense voided after the reimbursement was voided', rawExpense(e1).status === 'voided');
  for (const n of ['A', 'B', 'C']) await api(`/founders/${fid[n]}`, 'PATCH', { active: false });
  await api(`/categories/${cat}`, 'PATCH', { active: false });
  ok('no unexpected browser console errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(`browser checks: ${total - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
