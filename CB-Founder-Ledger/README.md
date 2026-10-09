# CareerBuddies Founder Ledger

> Full portal guide: [docs/PORTAL.md](docs/PORTAL.md) · website integration plan: [docs/WEBSITE-INTEGRATION.md](docs/WEBSITE-INTEGRATION.md) · Windows setup: [docs/WINDOWS-LOCAL-SETUP.md](docs/WINDOWS-LOCAL-SETUP.md)

Private, responsive web app for the three CareerBuddies founders (investment, expenses, settlements). MongoDB is the source of truth; all financial logic will live in the backend. **Current state: Phase 4 — Dashboard** (KPIs, charts, founder cards, settlement summary with a Settle action, recent transactions, period/founder/category filters; spec and decisions in [`docs/PHASE-4-DASHBOARD.md`](docs/PHASE-4-DASHBOARD.md)) over **Phase 3 — Calculation engine, with Option C expense-linked reimbursements**, on top of Phase 1 (foundation) and Phase 2 (transactions, splits, receipts). The server calculates each founder's paid, fair share, net position, outstanding balance and a settlement recommendation from **approved** transactions only; the client just displays them. **Not built:** the approval workflow and approve/reject UI (Phase 5), recurring (6), reports (7), hardening (8), launch (9). Until Phase 5, nothing can become *approved* through the app, so positions read zero in a real deployment; tests approve records with a controlled database write. A reimbursement must name the one approved expense it pays back; the reimbursed part is borne by the business and founders share only the rest (label: *implementation assumption — product-owner decision*; the PDF is silent). Net position stays `Paid − Fair share` (*inferred from the Product Plan example*). Known limits (*Phase 3 limitation*): approval only via fixtures until Phase 5, one payer per expense, no loan repayment/refund linking/capital pool. See [`docs/PHASE-3-CALCULATION-SPEC.md`](docs/PHASE-3-CALCULATION-SPEC.md) (what is from the PDF vs. assumed), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/PHASE-1.md`](docs/PHASE-1.md), [`docs/PHASE-2.md`](docs/PHASE-2.md).

Stack: React 19 · TypeScript (strict) · Vite · Tailwind CSS 3 · Lucide — Node 22 · Express 4 · Mongoose 8 · Zod · MongoDB 7.

Requires Node ≥ 20 (22 recommended) and a MongoDB (local install or Docker).

## 1. Local development

```bash
cd CB-Founder-Ledger
npm run install:all                      # npm ci in server/ and client/

# MongoDB (skip if you already run one)
docker run -d --name cb-mongo -p 127.0.0.1:27017:27017 mongo:7

cp .env.example server/.env              # then edit server/.env:
#   JWT_ACCESS_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))">
#   SEED_ADMIN_EMAIL=you@example.com   SEED_ADMIN_PASSWORD=<12+ chars>

npm run seed:admin                       # creates the first admin (no financial data)
npm --prefix server run seed:dev-categories   # OPTIONAL, development only: 4 generic categories flagged isDevSeed
npm run dev:server                       # API  → http://localhost:4000  (terminal 1)
npm run dev:client                       # Web  → http://localhost:5173  (terminal 2)
```

Open http://localhost:5173 and sign in with the seeded admin. The Vite dev server proxies `/api` to the API. Create further users as admin via `POST /api/users`.

To record a transaction you need at least one founder profile (`POST /api/founders`, admin) and, for business expenses, a category (Settings page, or the optional dev seed above). Receipts are stored privately in `RECEIPT_STORAGE_DIR` (default `server/data/receipts`, git-ignored).

## 2. Docker development (MongoDB + API + web)

```bash
cd CB-Founder-Ledger
cp .env.example .env
# edit .env:  JWT_ACCESS_SECRET, MONGO_ROOT_PASSWORD, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
# For plain-HTTP local use also set:  NODE_ENV=development  and  COOKIE_SECURE=false

docker compose --env-file .env -f docker/docker-compose.yml up --build -d
docker compose --env-file .env -f docker/docker-compose.yml exec server node dist/scripts/seedAdmin.js
# → http://localhost:8080     health: http://localhost:8080/api/health
# Receipts live in the `receipts-data` volume; MongoDB in `mongo-data`.

SMOKE_ADMIN_EMAIL=<seed email> SMOKE_ADMIN_PASSWORD=<seed password> npm run docker:smoke   # optional end-to-end check
docker compose --env-file .env -f docker/docker-compose.yml down        # add -v to also delete the database volume
```

The app is then at `http://localhost:8080` (Windows users: step-by-step PowerShell guide in [`docs/WINDOWS-LOCAL-SETUP.md`](docs/WINDOWS-LOCAL-SETUP.md)). To also open it as `http://127.0.0.1:8080`, add `ALLOWED_ORIGINS=http://127.0.0.1:8080` to `.env` (state-changing requests are origin-checked, so a second host name must be allowed explicitly; the default allows only `CLIENT_ORIGIN`). The stack runs on the machine where you run these commands — a URL like `localhost:8080` is only reachable from that same machine.

MongoDB is not published to the host. Behind HTTPS in production keep `NODE_ENV=production` and `COOKIE_SECURE=true` (the API refuses insecure cookies in production). If your network re-signs TLS (corporate proxy), build with `NODE_IMAGE=<your node image that trusts the CA>` in `.env`.

## 3. Testing

Server tests need a MongoDB (they use the database `cb_founder_ledger_test` and **drop it**). Point at one with `TEST_MONGO_URI` (default `mongodb://127.0.0.1:27017/cb_founder_ledger_test`).

```bash
npm test                      # server + client
npm --prefix server test      # API, auth, RBAC, validation, config, DB, rate-limit, transactions, splits, receipts, calculation engine, settlement algorithm, invariants, financial API
npm --prefix server run reconcile:reimbursements   # read-only: reports drift between expense reservations and linked reimbursements (add :prod for the built server)
npm --prefix client test      # routing, login flow, API client, transactions list/form/detail, settings, founders / ledger / settlements views
```

### Docker and browser verification (Option C, Phase 4)

```bash
# with the Docker stack up and the admin seeded (section 2):
export SMOKE_ADMIN_EMAIL=<seed email> SMOKE_ADMIN_PASSWORD=<seed password>
npm run docker:smoke                        # 61 HTTP checks incl. reimbursement validation
tests/docker-reimbursement-e2e.sh           # approved-path flow: reimburse, over-reimburse, void guard, restore (approves via a direct DB write — Phase 5 owns approval)
PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node tests/browser/optionc-browser.mjs   # desktop + tablet + mobile browser flow
```

```bash
node tests/browser/dashboard-browser.mjs     # Phase 4: needs a FRESH stack (checks the empty state first); desktop/tablet/mobile/narrow
```

These create throwaway records; run them against a disposable stack and finish with `docker compose ... down -v`.

## 4. Typecheck

```bash
npm run typecheck             # server (tsc --noEmit) + client (tsc -b)
```

## 5. Production build

```bash
npm run build                 # server → server/dist, client → client/dist
NODE_ENV=production node server/dist/server.js   # needs env vars from .env.example
docker compose --env-file .env -f docker/docker-compose.yml build    # container images
```

## API

Transactions, splits and receipts endpoints are listed in [`docs/PHASE-2.md`](docs/PHASE-2.md#api-all-under-api-all-require-a-signed-in-user). **Phase 3 (read-only, any signed-in user, empty query string only):** `GET /api/founders/financial-positions`, `GET /api/founders/:id/financial-position`, `GET /api/settlements/recommendations`, `GET /api/settlements/summary`; **Phase 4:** `GET /api/dashboard?from&to&founderId&categoryId` (read-only aggregate, see PHASE-4-DASHBOARD.md) — contract in [`docs/PHASE-3-CALCULATION-SPEC.md`](docs/PHASE-3-CALCULATION-SPEC.md#8-api-contract-all-authenticated-read-only-query-strings-must-be-empty). Phase 1 endpoints:

| Method & path | Access |
|---|---|
| `GET /api/health` | public (200 ok / 503 db down) |
| `POST /api/auth/login`, `/refresh`, `/logout` | public (login/refresh rate-limited) |
| `GET /api/auth/me` | any signed-in user |
| `GET /api/founders`, `/api/founders/:id`, `GET /api/categories` | founder, admin |
| `POST/PATCH /api/founders`, `/api/categories` | admin |
| `GET/POST /api/users`, `PATCH /api/users/:id` | admin |

## Branding

The official logo is used unmodified from `client/public/brand/careerbuddies-logo.png` (byte-identical copy of the website project's `public/logo.png`).
