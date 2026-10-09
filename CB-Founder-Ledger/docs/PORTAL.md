# CareerBuddies Founder Ledger — portal guide

Product name: **CareerBuddies Founder Ledger** (compact label **CB Founder Ledger**). Private, independently deployable
portal for the three founders. It lives entirely in `CB-Founder-Ledger/` and never touches the public marketing site.

## Screens (all connected to the API and MongoDB)
| Route | Screen | Who |
|---|---|---|
| `/login` | Sign in (show/hide password, validation, brand from `/api/branding/public`) | everyone |
| `/dashboard` | KPIs (total business expenses, founder contributions, net business position, pending approvals), monthly trend, category breakdown, recent transactions, founder overview, upcoming recurring, settlement summary, shortcuts | signed-in |
| `/founders`, `/founders/:id` | Founder cards and per-founder ledger (mandatory order) | signed-in |
| `/transactions`, `/transactions/new`, `/transactions/:id` | List/filters, add/edit, detail with approve/reject/void | signed-in (edit: owner or admin) |
| `/settlements` | Who pays whom, record payment, approve/reverse, history | signed-in (reverse: admin) |
| `/approvals` | Pending / approved / rejected queue with counts | signed-in |
| `/recurring` | Recurring and subscriptions: add, edit, pause, resume, cancel, record payment | signed-in |
| `/reports` | Filters, totals, annual/monthly/category/founder views, CSV export | signed-in |
| `/audit-log` | Append-only audit trail with filters | **admin only** |
| `/settings` | 12 sections (below) | read: signed-in · change: **admin only** |
| `/ledger`, `/#ledger` | Entry route for the future website link; sends signed-in users to the dashboard, others to login | everyone |

## Founder order (mandatory, everywhere)
1. Nishant Sharma — Founder · 2. Deepak Sah — Co-founder · 3. Divyanshu Gautam — Co-founder.
Stored as `displayOrder` + `role` on the founder document. `npm --prefix server run seed:founders` (also run
automatically at start-up by `runMigrations` for the order backfill) renames the existing founder records **in place**
(same ids, no duplicates, no change to any transaction). Order, name and role are editable in *Settings → Founders*; edits
change presentation only — historical accounting is keyed by founder id and never changes.

## Logo and photographs (you supply them — nothing is generated)
Drop files in, or upload in Settings (PNG/JPG/WebP, type verified by file signature, max `IMAGE_MAX_BYTES`, default 2 MB):
- Logo: `assets/brand/careerbuddies-logo.png` (or `.jpg` / `.webp`)
- Photos: `assets/founders/nishant-sharma.*`, `assets/founders/deepak-sah.*`, `assets/founders/divyanshu-gautam.*`

Then run `docker compose --env-file .env -f docker/docker-compose.yml exec server node dist/scripts/importBrandAssets.js`
(idempotent). Until then the UI shows neutral initial placeholders and the default logo. `assets/` is git-ignored for
image files. Uploaded files live in the `branding-data` volume with server-generated names; founder photos are served only
to signed-in users, the logo is public (needed on the login page).

## Settings (12 sections, persisted in MongoDB `app_settings`)
Business profile · Branding/logo · Founders · Categories · Currency & regional · Approval rules · Reimbursement rules
(read-only) · Settlement preferences · Recurring preferences · Dashboard preferences · User access · Calculation &
reporting (read-only). Saved server-side (Zod strict validation, optimistic `expectedVersion`, audit `SETTINGS_CHANGED`),
merged over code defaults, delivered through `GET /api/config` and applied without restart (`AppConfigProvider`).
Save / Cancel / loading / success / validation messages and an unsaved-changes prompt are built in. Only settings the
code actually honours are exposed; the reimbursement and calculation policy is shown but **not editable**, because
changing it would silently rewrite history (it would require an audited migration — not built).

## Financial rules (unchanged engine)
Integer minor units, largest-remainder allocation, only `approved` transactions count, Net = Paid − Fair share, Σ net = 0.
**Option C reimbursement** is preserved: a reimbursement links to an approved expense (`reimbursesTransactionId`);
founder-funded = expense − active approved linked reimbursements; an expense with active reimbursements cannot be voided;
voiding a reimbursement restores the amount; no capital pool, no multi-payer. Approve/reject, settlement payments,
recurring records and CSV reports all read the same engine, so dashboard, founder ledger, settlements and reports reconcile.

## Security and data safety
Cookie sessions (HttpOnly), role checks on every mutation (admin / founder), Zod validation on every body/query,
rate-limited login/uploads/writes, append-only audit log and revisions (hard deletes blocked in the model), secrets
redacted from audit data, CSV cells guarded against formula injection, idempotent create via `clientRequestId`,
recurring duplicates prevented by a unique `recurringKey`. Migrations are additive and idempotent; no collection is
dropped or reset. No `.env`, uploads or production data are committed.

## Known limitations / unresolved rules (isolated, not guessed)
- **Loan repayment** and **refund linking**: the Product Plan does not define how they interact with Option C; they are
  recorded and reported as their own types but not netted against expenses. Needs a product decision.
- Two-founder approval, an "Ask a question" action and PDF export of reports are **not built** (CSV only).
- Approval self-approval is a setting (default allowed, matching a 3-person partnership).
- The reference mock-up image "CareerBuddies Founder Ledger UI Showcase(1).png" was **not available** to the build; the
  visual design follows the written brief and the website's colour tokens.
- Verified on the sandbox's Docker only — not on the user's Windows PC. No public URL is deployed.
