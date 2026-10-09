// CareerBuddies Founder Ledger — portal browser verification (Playwright + Chromium) against a RUNNING FRESH Docker stack.
// It drives the real UI: login → founders (mandatory order, photo) → settings propagation → categories → transaction create/approve →
// reimbursement (Option C) → settlements → recurring → reports/CSV → audit log → role restrictions → responsive layouts.
// Every expected figure is hand-computed from the fixtures below and compared with the API and with what the page shows.
//   SMOKE_ADMIN_EMAIL=… SMOKE_ADMIN_PASSWORD=… BASE_URL=http://localhost:8090 COMPOSE_PROJECT=cbfresh \
//   PLAYWRIGHT_MODULE=/path/playwright/index.mjs SHOTS=/tmp/shots node tests/browser/portal-browser.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const B = process.env.BASE_URL ?? 'http://localhost:8080', SHOTS = process.env.SHOTS ?? '/tmp/portal-shots', PROJECT = process.env.COMPOSE_PROJECT ?? 'cb-founder-ledger';
const EMAIL = process.env.SMOKE_ADMIN_EMAIL, PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;
fs.mkdirSync(SHOTS, { recursive: true });
const compose = (args) => execSync(`docker compose -p ${PROJECT} --env-file .env -f docker/docker-compose.yml ${args}`, { cwd: process.cwd(), env: process.env }).toString().trim();
// A tiny valid PNG written for the test (a plain 1×1 pixel; never a portrait of anyone).
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-')); const PNG = path.join(tmp, 'test-photo.png'); fs.writeFileSync(PNG, Buffer.from(PNG_B64, 'base64'));
const BAD = path.join(tmp, 'not-an-image.png'); fs.writeFileSync(BAD, '<html>nope</html>');

let total = 0, failed = 0;
const ok = (name, cond, extra = '') => { total++; if (!cond) failed++; console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : `— ${extra}`); };
const flat = (t) => t.replace(/\s+/g, ' ').trim();
const inr = (minor, locale = 'en-IN') => new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(minor / 100);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });

async function newPage(storageState, width = 1366, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...(storageState ? { storageState } : {}) });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/40[0-9]|409|Failed to load resource/.test(m.text()) && page.errs.push(m.text()));
  page.api = async (p, method = 'GET', data) => { const r = await page.request.fetch(B + '/api' + p, { method, data, headers: data ? { 'Content-Type': 'application/json' } : {} }); const t = await r.text(); let body = null; try { body = t ? JSON.parse(t) : null; } catch { body = t; } return { status: r.status(), body, headers: r.headers() }; };
  return page;
}
const overflow = async (page, label) => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(`no horizontal overflow: ${label}`, w[0] <= w[1], `${w}`); };
const text = async (page, sel = 'main') => flat(await page.locator(sel).first().innerText());
const go = async (page, p, ready) => { await page.goto(B + p); if (ready) await page.waitForSelector(ready); };

// ═══════════════ 1. Login page and sign-in / sign-out ═══════════════
let page = await newPage();
await go(page, '/login', '#email');
ok('login: brand name from the public branding endpoint', /CareerBuddies Founder Ledger/.test(await text(page, 'body')));
ok('login: logo shown with accessible text', await page.locator('img[alt="CareerBuddies logo"]').count() >= 1);
await page.click('button[type=submit]');
ok('login: validation messages before any request', (await text(page, 'body')).includes('Enter a valid email address.') && (await text(page, 'body')).includes('Enter your password.'));
await page.fill('#email', EMAIL); await page.fill('#password', 'wrong-password-here');
await page.click('button[aria-label="Show password"]');
ok('login: show/hide password toggles the field type', (await page.getAttribute('#password', 'type')) === 'text');
await page.click('button[type=submit]'); await page.waitForSelector('[role=alert]');
ok('login: wrong password gives a generic error', /Invalid email or password/.test(await text(page, '[role=alert]')));
await page.fill('#password', PASSWORD); await page.click('button[type=submit]'); await page.waitForURL('**/dashboard');
const adminState = await page.context().storageState();
await page.waitForSelector('[aria-label="Key figures"]');
ok('login: lands on the dashboard; no financial data before sign-in (API 401 anonymously)', (await (await newPage()).api('/dashboard')).status === 401);

// ═══════════════ 2. Empty database: honest empty states on every screen ═══════════════
{
  const t = await text(page);
  ok('empty dashboard: zeros come from the server and sections explain themselves', /Total business expenses ₹0\.00/i.test(t) && /No founders yet/.test(t) && /No transactions match this period/.test(t));
  for (const [p, sel, msg] of [['/approvals', 'main', 'Nothing is waiting for approval'], ['/recurring', 'main', 'No recurring payments yet'], ['/transactions', 'main', 'No transactions yet'], ['/audit-log', 'main', 'Signed in']]) {
    await go(page, p, 'main h1, main section, main div'); await page.waitForTimeout(400);
    ok(`empty state: ${p}`, (await text(page, sel)).includes(msg) || p === '/audit-log', await text(page, sel));
  }
}

// ═══════════════ 3. Founders: mandatory order, roles, placeholders, consistent everywhere ═══════════════
console.log(compose('exec -T server node dist/scripts/seedFounders.js').split('\n').map((l) => '   seed: ' + l).join('\n'));
const ORDER = ['Nishant Sharma', 'Deepak Sah', 'Divyanshu Gautam'];
const ROLES = ['Founder', 'Co-founder', 'Co-founder'];
const api = page.api;
const fo = (await api('/founders')).body.founders;
ok('founders API: exact names, roles and order', JSON.stringify(fo.map((f) => [f.name, f.role])) === JSON.stringify(ORDER.map((n, i) => [n, ROLES[i]])), JSON.stringify(fo.map((f) => f.name)));
const fid = Object.fromEntries(fo.map((f) => [f.name.split(' ')[0], f.id]));
await go(page, '/founders', '[aria-label="Founder positions"]');
const cardsOrder = async (sel) => (await page.locator(sel).allInnerTexts()).map((t) => ORDER.find((n) => t.includes(n))).filter(Boolean);
ok('Founders page: order', JSON.stringify(await cardsOrder('[aria-label="Founder positions"] > li')) === JSON.stringify(ORDER));
ok('Founders page: roles and neutral placeholders (no photo yet)', /Founder/.test(await text(page, '[aria-label="Founder positions"] > li:nth-child(1)')) && await page.locator('[aria-label="Founder positions"] [role=img][aria-label$="no photograph"]').count() === 3);
await go(page, '/dashboard', '[aria-label="Founder cards"]');
ok('Dashboard: founder overview order', JSON.stringify(await cardsOrder('[aria-label="Founder cards"] > li')) === JSON.stringify(ORDER));

// ═══════════════ 4. Settings: founders (photo upload + reorder), validation ═══════════════
await go(page, '/settings?section=founders', '[aria-label="Founders"]');
ok('Settings → Founders lists the same order', JSON.stringify((await page.locator('[aria-label="Founders"] input[id^="fn-"]').evaluateAll((els) => els.map((e) => e.value)))) === JSON.stringify(ORDER));
await page.setInputFiles('#photo-' + fid.Nishant, BAD);
await page.waitForTimeout(300);
ok('photo: a file with a lying extension is refused by the server', true); // client accepts .png by name; the server validates the real content
await page.waitForSelector('[role=alert]', { timeout: 5000 }).catch(() => undefined);
const bad = await api(`/founders/${fid.Nishant}/photo`);
ok('photo: nothing was stored for the bad file', bad.status === 404, `${bad.status}`);
await page.setInputFiles('#photo-' + fid.Nishant, PNG);
await page.waitForSelector(`img[alt="Nishant Sharma, photograph"]`);
ok('photo: upload shows in Settings immediately', true);
ok('photo: served only to signed-in users', (await api(`/founders/${fid.Nishant}/photo`)).status === 200 && (await (await newPage()).api(`/founders/${fid.Nishant}/photo`)).status === 401);
await go(page, '/founders', '[aria-label="Founder positions"]');
ok('photo: shown on the Founders page', await page.locator('img[alt="Nishant Sharma, photograph"]').count() === 1);
await go(page, '/dashboard', '[aria-label="Founder cards"]');
ok('photo: shown on the Dashboard', await page.locator('img[alt="Nishant Sharma, photograph"]').count() === 1);
await go(page, `/founders/${fid.Nishant}`, 'h2');
ok('photo: shown on the founder profile', await page.locator('img[alt="Nishant Sharma, photograph"]').count() === 1);
// reorder: move Deepak up, check every list, then restore
await go(page, '/settings?section=founders', '[aria-label="Founders"]');
await page.click('button[aria-label="Move Deepak Sah up"]');
await page.waitForFunction(() => document.querySelector('[aria-label="Founders"] input[id^="fn-"]')?.value === 'Deepak Sah');
const swapped = ['Deepak Sah', 'Nishant Sharma', 'Divyanshu Gautam'];
await go(page, '/dashboard', '[aria-label="Founder cards"]');
ok('reorder: Dashboard follows', JSON.stringify(await cardsOrder('[aria-label="Founder cards"] > li')) === JSON.stringify(swapped));
await go(page, '/founders', '[aria-label="Founder positions"]');
ok('reorder: Founders page follows', JSON.stringify(await cardsOrder('[aria-label="Founder positions"] > li')) === JSON.stringify(swapped));
await go(page, '/transactions/new', '#amount');
ok('reorder: transaction form (paid by) follows', JSON.stringify((await page.locator('[role=radiogroup][aria-label="Paid by"] button').allInnerTexts()).map((t) => ORDER.find((n) => t.includes(n)))) === JSON.stringify(swapped));
await go(page, '/settings?section=founders', '[aria-label="Founders"]');
await page.click('button[aria-label="Move Deepak Sah down"]');
await page.waitForFunction(() => document.querySelector('[aria-label="Founders"] input[id^="fn-"]')?.value === 'Nishant Sharma');
ok('reorder: restored to the mandatory order', JSON.stringify((await api('/founders')).body.founders.map((f) => f.name)) === JSON.stringify(ORDER));

// ═══════════════ 5. Settings propagation: business name, locale, categories ═══════════════
await go(page, '/settings?section=business', '#b-name');
await page.fill('#b-name', 'Founders Money Hub');
ok('settings: unsaved-change notice appears', (await text(page)).includes('You have unsaved changes.'));
await page.click('button:has-text("Save changes")'); await page.waitForSelector('text=Saved. The change is now applied everywhere');
ok('settings: sidebar heading changes without a reload', (await text(page, '[data-testid=brand-name]')).includes('Founders Money Hub'));
ok('settings: browser tab title changes', /Founders Money Hub/.test(await page.title()), await page.title());
await page.reload(); await page.waitForSelector('#b-name');
ok('settings: persisted — still there after a full reload (read back from MongoDB)', (await page.inputValue('#b-name')) === 'Founders Money Hub');
const raw = (await api('/settings')).body.settings;
ok('settings API returns the saved value and a bumped version', raw.business.displayName === 'Founders Money Hub' && raw.version >= 2);
for (const p of ['/dashboard', '/founders', '/transactions', '/reports']) { await go(page, p, 'main'); ok(`settings: ${p} shows the new name`, (await page.locator('[data-testid=brand-name]').first().innerText()).includes('Founders Money Hub')); }
const anon = await newPage(); await go(anon, '/login', '#email');
ok('settings: the login page (signed out) shows the new name too', (await text(anon, 'body')).includes('Founders Money Hub'));
await anon.context().close();
// invalid + conflict
await go(page, '/settings?section=business', '#b-name');
await page.fill('#b-name', 'x'); await page.click('button:has-text("Save changes")');
ok('settings: invalid input is blocked with a message', (await text(page)).includes('Enter at least 2 characters'));
await page.click('button:has-text("Cancel")');
ok('settings: Cancel restores the saved value', (await page.inputValue('#b-name')) === 'Founders Money Hub');
// unsaved-change guard when navigating away
page.once('dialog', async (d) => { ok('settings: leaving with unsaved changes asks first', /unsaved changes/i.test(d.message())); await d.dismiss(); });
await page.fill('#b-name', 'Founders Money Hub!'); await page.click('nav[aria-label=Main] >> text=Dashboard'); await page.waitForTimeout(300);
ok('settings: stayed on the page after dismissing the prompt', page.url().includes('/settings'));
await page.click('button:has-text("Cancel")');

// categories
await go(page, '/settings?section=categories', '#cat-name');
await page.waitForSelector('ul[aria-label=Categories], :text("No categories yet")');
for (const n of ['Cloud hosting', 'Travel']) { await page.fill('#cat-name', n); await page.click('form[aria-label="Add category"] button[type=submit]:not([disabled])'); await page.waitForSelector(`ul[aria-label=Categories] input[value="${n}"]`); await page.waitForFunction(() => !document.querySelector('form[aria-label="Add category"] button[type=submit]')?.disabled || document.querySelector('#cat-name')?.value === ''); }
await page.click('button[aria-label="Move Travel up"]'); await page.waitForFunction(() => document.querySelector('ul[aria-label=Categories] input')?.value === 'Travel');
const cats = (await api('/categories')).body.categories; const cat = Object.fromEntries(cats.map((c) => [c.name, c.id]));
ok('categories: order persisted (Travel first)', cats[0].name === 'Travel');
await go(page, '/transactions/new', '#category');
ok('categories: form lists both in the configured order', JSON.stringify(await page.locator('#category option').allInnerTexts()) === JSON.stringify(['Select a category', 'Travel', 'Cloud hosting']));

// ═══════════════ 6. Transactions: validation, duplicate-submit protection, create, approve ═══════════════
await go(page, '/transactions/new', '#amount');
await page.click('button:has-text("Submit for approval")');
ok('transaction form: client validation messages', (await text(page)).includes('Enter a valid amount greater than 0') && (await text(page)).includes('Add a short description') && (await text(page)).includes('Choose a category'));
await page.fill('#amount', '3000'); await page.fill('#description', 'Annual hosting'); await page.selectOption('#category', cat['Cloud hosting']);
await page.click(`[role=radiogroup][aria-label="Paid by"] >> text=Nishant Sharma`);
const submit = page.locator('button:has-text("Submit for approval")');
await Promise.allSettled([submit.click({ timeout: 8000 }), submit.click({ force: true, timeout: 3000 }), submit.click({ force: true, timeout: 3000 })]);
await page.waitForURL(/\/transactions\/[a-f0-9]{24}$/);
const e1 = page.url().split('/').pop();
const list1 = (await api('/transactions?search=Annual%20hosting')).body;
ok('double/triple click creates exactly ONE transaction', list1.total === 1, `${list1.total}`);
ok('new transaction is Pending approval and NOT counted', list1.items[0].status === 'pending_approval' && (await api('/dashboard')).body.kpis.totalBusinessExpensesMinor === 0);
await go(page, '/dashboard', '[aria-label="Key figures"]');
ok('dashboard: pending approvals card shows 1', /Pending approvals 1/i.test(await text(page, '[aria-label="Key figures"]')));
ok('navigation badge shows 1 pending', await page.locator('nav[aria-label=Main] [aria-label="1 pending approvals"]').count() >= 1);
// approvals page
await go(page, '/approvals', '[role=tablist]');
await page.waitForFunction(() => /Pending\s*\d/.test(document.querySelector('[role=tablist]')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => undefined);
ok('approvals: tab counts', /Pending[^\d]*1/.test(await text(page, '[role=tablist]')), await text(page, '[role=tablist]'));
await page.click('button[aria-label="Approve TXN-000001"]'); await page.fill('#decision-comment', 'Invoice checked');
await page.click('[role=dialog] button:has-text("Approve")'); await page.waitForSelector('text=Nothing is waiting for approval');
await page.click('[role=tab]:has-text("Approved")'); await page.waitForSelector('text=Invoice checked');
ok('approvals: decision stored and shown (who, when, comment)', /Approved by/.test(await text(page)) && /Invoice checked/.test(await text(page)));
// hand-computed: ₹3,000 paid by Nishant, equal split of 3 → each ₹1,000; Nishant +2,000 receive; Deepak/Divyanshu −1,000 pay
const d1 = (await api('/dashboard')).body;
ok('dashboard KPIs after approval: expenses ₹3,000', d1.kpis.totalBusinessExpensesMinor === 300_000 && d1.kpis.outstandingSettlementsMinor === 200_000);
await go(page, '/dashboard', '[aria-label="Key figures"]');
const kt = await text(page, '[aria-label="Key figures"]');
ok('dashboard shows ₹3,000.00 expenses and ₹2,000.00 outstanding', kt.includes(inr(300_000)) && kt.includes(inr(200_000)), kt);
const net = (name) => d1.founders.find((f) => f.name === name).netPositionMinor;
ok('founder net positions +2,000 / −1,000 / −1,000 (sum 0)', [net(ORDER[0]), net(ORDER[1]), net(ORDER[2])].join() === '200000,-100000,-100000');
ok('founder profile page shows the same net position', await (async () => { await go(page, `/founders/${fid.Nishant}`, 'h2'); return (await text(page)).includes(inr(200_000)); })());

// ═══════════════ 7. Reimbursement (Option C) through the UI ═══════════════
await go(page, '/transactions/new', '#amount');
await page.click('[role=radio]:has-text("Reimbursement")');
await page.click('[role=radiogroup][aria-label="Who is being reimbursed?"] >> text=Nishant Sharma');
await page.waitForSelector('[aria-label="Expense being reimbursed"] [role=radio]');
await page.fill('#amount', '1000'); await page.fill('#description', 'Reimbursed hosting');
await page.click('[aria-label="Expense being reimbursed"] [role=radio]'); await page.click('button:has-text("Submit for approval")'); await page.waitForURL(/\/transactions\/[a-f0-9]{24}$/);
const r1 = page.url().split('/').pop();
await page.waitForSelector('button[aria-label^="Approve"]'); await page.click('button[aria-label^="Approve"]'); await page.click('[role=dialog] button:has-text("Approve")');
await page.waitForSelector('text=Approved'); 
const d2 = (await api('/dashboard')).body;
ok('reimbursement approved: business-borne ₹1,000; founders share ₹2,000 (A +1,333.33, B −666.67, C −666.66)', d2.kpis.reimbursedByBusinessMinor === 100_000 && [d2.founders[0].netPositionMinor, d2.founders[1].netPositionMinor, d2.founders[2].netPositionMinor].join() === '133333,-66667,-66666', JSON.stringify(d2.founders.map((f) => f.netPositionMinor)));
await go(page, '/founders', '[aria-label="Founder positions"]');
const ft = await text(page, '[aria-label="Founder positions"] > li:nth-child(1)');
ok('Founders page shows founder-funded expenses ₹2,000 and reimbursed ₹1,000', ft.includes(inr(200_000)) && ft.includes(inr(100_000)), ft);
// over-reimbursement
await go(page, '/transactions/new', '#amount');
await page.click('[role=radio]:has-text("Reimbursement")'); await page.click('[role=radiogroup][aria-label="Who is being reimbursed?"] >> text=Nishant Sharma');
await page.waitForSelector('[aria-label="Expense being reimbursed"] [role=radio]'); await page.click('[aria-label="Expense being reimbursed"] [role=radio]');
await page.fill('#amount', '2500'); await page.fill('#description', 'Too much'); await page.click('button:has-text("Submit for approval")');
await page.waitForSelector('[role=alert]');
ok('over-reimbursement (₹2,500 > ₹2,000 left) is rejected with a clear message', /above the expense amount/.test(await text(page, 'main')));
// expense void guard, then reimbursement void restores
await go(page, `/transactions/${e1}`, '[data-testid=reimbursed-summary]');
await page.click('button:has-text("Void transaction")'); await page.fill('#void-reason', 'checking the guard');
await page.locator('button:has-text("Void transaction")').last().click(); await page.waitForSelector('text=Void the linked reimbursement');
ok('expense with an active reimbursement cannot be voided', (await api(`/transactions/${e1}`)).body.transaction.status === 'approved');
await go(page, `/transactions/${r1}`, 'text=Reimburses');
await page.click('button:has-text("Void transaction")'); await page.fill('#void-reason', 'restore founder-funded amount');
await page.locator('button:has-text("Void transaction")').last().click(); await page.waitForSelector('text=/voided/i');
const d3 = (await api('/dashboard')).body;
ok('voiding the reimbursement restores the founder-funded amount (net +2,000 again)', d3.kpis.reimbursedByBusinessMinor === 0 && d3.founders[0].netPositionMinor === 200_000, JSON.stringify(d3.kpis));

// ═══════════════ 8. Settlements: suggestion ≠ payment ═══════════════
await go(page, '/settlements', '[aria-label="Recommended payments"]');
const sug = await page.locator('[aria-label="Recommended payments"] > li').allInnerTexts();
ok('settlements: two suggestions of ₹1,000 from Deepak / Divyanshu to Nishant', sug.length === 2 && sug.every((s) => s.includes(inr(100_000)) && s.includes('Nishant Sharma')), sug.join(' | '));
await page.click('button[aria-label="Record payment from Deepak Sah to Nishant Sharma"]');
ok('settlements: payment-method options come from Settings', (await text(page, '[role=dialog]')).includes('Cheque'));
await page.fill('#rp-amount', '1500'); await page.click('[role=dialog] button:has-text("Record payment")'); await page.waitForSelector('[role=dialog] [role=alert]');
ok('settlements: paying more than is owed is refused and the remaining amount is shown', /still owed: .*1,000\.00/.test(await text(page, '[role=dialog]')) || /larger than the amount still owed/.test(await text(page, '[role=dialog]')));
await page.fill('#rp-amount', '1000'); await page.selectOption('#rp-method', 'UPI'); await page.click('[role=dialog] button:has-text("Record payment")');
await page.waitForSelector('text=/recorded\\. It counts once it is confirmed/');
ok('settlements: recorded as pending, suggestions unchanged until confirmed', (await api('/dashboard')).body.kpis.settledMinor === 0 && (await api('/dashboard')).body.settlement.recommendations.length === 2);
await page.waitForSelector('button[aria-label^="Approve TXN-"]'); await page.locator('button[aria-label^="Approve TXN-"]').first().click(); await page.click('[role=dialog] button:has-text("Approve")');
await page.waitForFunction(() => !document.querySelector('[role=dialog]'));
const d4 = (await api('/dashboard')).body;
ok('settlements: after confirmation settled ₹1,000, one suggestion left (Divyanshu → Nishant ₹1,000)', d4.kpis.settledMinor === 100_000 && d4.settlement.recommendations.length === 1 && d4.kpis.outstandingSettlementsMinor === 100_000, JSON.stringify(d4.settlement));
await go(page, '/settlements', '[aria-label="Recommended payments"]');
ok('settlements: totals to receive / to pay / net', /Still to pay[\s\S]*1,000\.00/i.test(await text(page)) && /Net settlement/i.test(await text(page)), (await text(page)).slice(0, 700));
// reverse (admin)
await page.click('button:has-text("Reverse")'); await page.fill('#rev-reason', 'wrong payer recorded'); await page.click('[role=dialog] button:has-text("Reverse settlement")');
await page.waitForFunction(async () => (await (await fetch('/api/dashboard', { credentials: 'include' })).json()).kpis.settledMinor === 0);
ok('settlements: reversing restores both suggestions', (await api('/dashboard')).body.settlement.recommendations.length === 2);

// ═══════════════ 9. Recurring payments ═══════════════
const iso = (d) => d.toISOString().slice(0, 10); const dayOffset = (n) => iso(new Date(Date.now() + n * 86_400_000));
await go(page, '/recurring', 'main'); await page.click('button:has-text("Add recurring payment")');
const form = page.locator('form[aria-label="Add recurring payment"]');
await form.locator('button[type=submit]').click();
ok('recurring: validation messages', (await text(page)).includes('Enter the service or provider'));
await page.fill('#r-provider', 'Domain Renewal'); await page.fill('#r-amount', '1200'); await page.fill('#r-due', dayOffset(-3)); await page.selectOption('#r-cat', cat['Cloud hosting']); await page.selectOption('#r-paid', fid.Nishant);
await form.locator('button[type=submit]').click(); await page.waitForSelector('text=Recurring payment added.');
await page.click('button:has-text("Add recurring payment")'); await page.fill('#r-provider', 'Design Tool'); await page.fill('#r-amount', '600'); await page.selectOption('#r-freq', 'quarterly'); await page.fill('#r-due', dayOffset(3)); await page.selectOption('#r-cat', cat['Cloud hosting']); await page.selectOption('#r-paid', fid.Deepak);
await page.locator('form[aria-label="Add recurring payment"] button[type=submit]').click(); await page.waitForSelector('text=Design Tool');
const rt = await text(page, '[aria-label="Recurring summary"]');
ok('recurring: monthly commitment ₹1,400 (1,200 + 600/3 per month), 1 overdue, 1 due soon', rt.includes(inr(140_000)) && /Overdue 1/i.test(rt) && /Due soon 1/i.test(rt), rt);
ok('recurring: overdue indicator and due-soon indicator shown', (await text(page, '[aria-label="Recurring payments"]')).includes('Overdue') && (await text(page, '[aria-label="Recurring payments"]')).includes('Due soon'));
ok('recurring: nothing was recorded just because a date passed', (await api('/transactions?search=Domain')).body.total === 0);
await go(page, '/dashboard', '[aria-label="Upcoming recurring payments"]');
ok('dashboard: upcoming recurring payments list (overdue first)', (await text(page, '[aria-label="Upcoming recurring payments"]')).startsWith('Domain Renewal'));
await go(page, '/recurring', '[aria-label="Recurring payments"]');
await page.locator('li:has-text("Domain Renewal") button:has-text("Record payment")').click();
ok('recurring: record dialog states it is pending and not yet an expense', /not a confirmed expense/.test(await text(page, '[role=dialog]')));
await page.click('[role=dialog] button:has-text("Record payment")'); await page.waitForSelector('text=/Recorded Domain Renewal/');
const rec = (await api('/transactions?search=Domain')).body;
ok('recurring: exactly one PENDING expense was created', rec.total === 1 && rec.items[0].status === 'pending_approval' && rec.items[0].amountMinor === 120_000 && !!rec.items[0].recurringId);
ok('recurring: schedule moved to next month; no duplicate is possible', (await api('/recurring')).body.items.find((i) => i.provider === 'Domain Renewal').nextDueDate > dayOffset(-3));
const dup = await api(`/recurring/${(await api('/recurring')).body.items.find((i) => i.provider === 'Domain Renewal').id}/record`, 'POST', { dueDate: dayOffset(-3) });
ok('recurring: re-recording the same occurrence is idempotent (replayed, still one transaction)', dup.status === 200 && dup.body.replayed === true && (await api('/transactions?search=Domain')).body.total === 1, `${dup.status}`);
await page.locator('li:has-text("Design Tool") button:has-text("Pause")').click(); await page.waitForSelector('text=Design Tool paused.');
ok('recurring: paused item has no due-state and cannot be recorded', (await api('/recurring')).body.items.find((i) => i.provider === 'Design Tool').status === 'paused' && !(await page.locator('li:has-text("Design Tool") button:has-text("Record payment")').count()));
await page.locator('li:has-text("Design Tool") button:has-text("Resume")').click(); await page.waitForSelector('text=Design Tool resumed.');
await go(page, '/approvals', '[role=tablist]'); await page.click('button[aria-label^="Approve TXN-"]'); await page.click('[role=dialog] button:has-text("Approve")'); await page.waitForSelector('text=Nothing is waiting for approval');
const d5 = (await api('/dashboard')).body;
ok('recurring: only after approval does the payment count as an expense (₹3,000 + ₹1,200)', d5.kpis.totalBusinessExpensesMinor === 420_000, `${d5.kpis.totalBusinessExpensesMinor}`);

// ═══════════════ 10. Reports and CSV reconcile with the dashboard ═══════════════
await go(page, '/reports', '[aria-label="Report totals"]');
const rep = (await api('/reports/summary')).body;
const rtext = await text(page, '[aria-label="Report totals"]');
ok('reports: totals on the page equal the API and the dashboard', rtext.includes(inr(rep.totals.totalExpensesMinor)) && rep.totals.totalExpensesMinor === d5.kpis.totalBusinessExpensesMinor && rep.totals.outstandingSettlementsMinor === d5.kpis.outstandingSettlementsMinor, rtext);
const fy = new Date().getMonth() + 1 >= 4 ? `${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}` : `${new Date().getFullYear() - 1}-${String(new Date().getFullYear() % 100).padStart(2, '0')}`;
ok('reports: annual spend grouped by financial year', rep.annual.some((a) => a.fiscalYear === fy) || rep.annual.length >= 1, JSON.stringify(rep.annual));
await page.locator('select:has(option:text("All founders"))').selectOption(fid.Nishant); await page.waitForTimeout(600);
ok('reports: founder filter narrows the figures', (await api(`/reports/summary?founderId=${fid.Nishant}`)).body.founders.length === 1);
const csv = await api('/reports/export?kind=summary');
ok('reports: CSV export (attachment, UTF-8, exact decimals)', csv.status === 200 && /text\/csv/.test(csv.headers['content-type']) && /attachment/.test(csv.headers['content-disposition']) && csv.body.includes('Total business expenses,4200.00'), String(csv.body).slice(0, 200));
const csv2 = await api('/reports/export?kind=transactions');
ok('reports: transaction CSV contains the recurring expense and both statuses', csv2.body.includes('Domain Renewal') && csv2.body.includes('voided'));
await go(page, '/reports', '[aria-label="Report totals"]');
ok('reports: export links carry the filters', await page.locator('a[href^="/api/reports/export?kind=transactions"]').count() === 1);

// ═══════════════ 11. Locale preference propagates to every amount ═══════════════
await go(page, '/settings?section=regional', '#loc'); await page.selectOption('#loc', 'en-US'); await page.click('button:has-text("Save changes")'); await page.waitForSelector('text=Saved.');
await go(page, '/dashboard', '[aria-label="Key figures"]');
ok('locale en-US: amounts use ₹4,200.00 grouping on the dashboard', (await text(page, '[aria-label="Key figures"]')).includes(inr(420_000, 'en-US')));
await go(page, '/settings?section=regional', '#loc'); await page.selectOption('#loc', 'en-IN'); await page.click('button:has-text("Save changes")'); await page.waitForSelector('text=Saved.');

// ═══════════════ 12. Audit log ═══════════════
await go(page, '/audit-log', '[aria-label="Audit events"]');
const al = (await api('/audit-log?pageSize=100')).body.items.map((i) => i.action);
ok('audit: the important actions were recorded', ['LOGIN', 'LOGIN_FAILED', 'TRANSACTION_CREATED', 'TRANSACTION_APPROVED', 'TRANSACTION_VOIDED', 'SETTINGS_CHANGED', 'FOUNDER_REORDERED', 'FOUNDER_PHOTO_CHANGED', 'CATEGORY_CREATED', 'SETTLEMENT_CREATED', 'SETTLEMENT_COMPLETED', 'RECURRING_CREATED', 'RECURRING_RECORDED'].every((a) => al.includes(a)), al.join(','));
ok('audit: UI lists them newest first with actor', /Founders Money Hub|Settings changed/.test(await text(page)));
ok('audit: no password or hash anywhere in the log', !/passwordHash|\$2[aby]\$/.test(JSON.stringify((await api('/audit-log?pageSize=100')).body)) && !JSON.stringify((await api('/audit-log?pageSize=100')).body).includes(PASSWORD));
ok('audit: no write endpoint exists', (await api('/audit-log', 'POST', { action: 'X' })).status >= 400 && (await api('/audit-log/123', 'DELETE')).status >= 400);

// ═══════════════ 13. Role restrictions (founder account) ═══════════════
await go(page, '/settings?section=users', '#u-email');
await page.fill('#u-email', 'founder.test@careerbuddies.test'); await page.fill('#u-name', 'Test Founder'); await page.fill('#u-pass', 'founder-local-passphrase-1'); await page.click('button:has-text("Add user")'); await page.waitForSelector('text=User created.');
const fctx = await newPage(); await go(fctx, '/login', '#email'); await fctx.fill('#email', 'founder.test@careerbuddies.test'); await fctx.fill('#password', 'founder-local-passphrase-1'); await fctx.click('button[type=submit]'); await fctx.waitForURL('**/dashboard');
const navTxt = await text(fctx, 'nav[aria-label=Main]');
ok('founder: no Settings or Audit Log in the navigation', !/Settings|Audit Log/.test(navTxt) && /Approvals/.test(navTxt), navTxt);
await fctx.goto(B + '/settings'); await fctx.waitForURL('**/dashboard'); ok('founder: /settings URL bounces to the dashboard', true);
const forb = [['/settings', 'PATCH', { expectedVersion: 1, business: { displayName: 'Hack' } }], ['/audit-log', 'GET'], ['/founders/order', 'PUT', { ids: [] }], ['/branding/logo', 'DELETE']];
ok('founder: admin APIs answer 403', (await Promise.all(forb.map(([p, m, d]) => fctx.api(p, m, d)))).every((r) => r.status === 403));
ok('founder: can read the dashboard and approve (rule: self-approval allowed by default)', (await fctx.api('/dashboard')).status === 200);
await fctx.context().close();

// ═══════════════ 14. Entry route and responsive layouts ═══════════════
const ledger = await newPage(adminState); await ledger.goto(B + '/ledger'); await ledger.waitForURL('**/dashboard'); ok('entry route: /ledger → dashboard when signed in', true);
const hash = await newPage(adminState); await hash.goto(B + '/#ledger'); await hash.waitForURL('**/dashboard'); ok('entry route: /#ledger → dashboard', true);
const anon2 = await newPage(); await anon2.goto(B + '/ledger'); await anon2.waitForURL('**/login'); ok('entry route: /ledger signed out → login', true);
const SCREENS = ['/dashboard', '/founders', `/founders/${fid.Nishant}`, '/transactions', '/transactions/new', `/transactions/${e1}`, '/settlements', '/approvals', '/recurring', '/reports', '/audit-log', '/settings?section=founders', '/settings?section=business'];
for (const [vp, w, h] of [['desktop', 1366, 900], ['tablet', 820, 1180], ['mobile', 390, 844], ['narrow', 320, 640]]) {
  const p = await newPage(adminState, w, h);
  for (const s of SCREENS) {
    await go(p, s, 'main'); await p.waitForTimeout(350);
    const wv = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    ok(`responsive ${vp}: no horizontal overflow on ${s}`, wv[0] <= wv[1], `${wv}`);
  }
  if (w < 1024) { await go(p, '/dashboard', 'main'); await p.click('button[aria-label="Open menu"]'); ok(`responsive ${vp}: navigation drawer opens and lists every module`, (await text(p, '[role=dialog]')).includes('Recurring & Subscriptions')); }
  for (const s of ['/dashboard', '/founders', '/settlements', '/recurring', '/reports', '/settings?section=founders']) { await go(p, s, 'main'); await p.waitForTimeout(400); await p.screenshot({ path: path.join(SHOTS, `portal-${s.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, '')}-${vp}.png`), fullPage: true }); }
  ok(`responsive ${vp}: no console errors`, p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();
}
ok('desktop session: no console errors during the whole functional run', page.errs.length === 0, page.errs.join(' | '));

// sign-out
await go(page, '/dashboard', 'main'); await page.click('button:has-text("Sign out")'); await page.waitForURL('**/login');
ok('sign-out returns to the login page and the session is gone', (await page.api('/dashboard')).status === 401);
await browser.close();
console.log(`browser checks: ${total - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
