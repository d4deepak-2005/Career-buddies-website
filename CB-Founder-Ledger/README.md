# CareerBuddies Founder Finance

Private, responsive web app for the three CareerBuddies founders (investment, expenses, settlements). MongoDB is the source of truth; all financial logic will live in the backend. **Current state: Phase 1 — Foundation** (auth, roles, models, brand shell, placeholders). No financial features yet. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/PHASE-1.md`](docs/PHASE-1.md).

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
npm run dev:server                       # API  → http://localhost:4000  (terminal 1)
npm run dev:client                       # Web  → http://localhost:5173  (terminal 2)
```

Open http://localhost:5173 and sign in with the seeded admin. The Vite dev server proxies `/api` to the API. Create further users as admin via `POST /api/users`.

## 2. Docker development (MongoDB + API + web)

```bash
cd CB-Founder-Ledger
cp .env.example .env
# edit .env:  JWT_ACCESS_SECRET, MONGO_ROOT_PASSWORD, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
# For plain-HTTP local use also set:  NODE_ENV=development  and  COOKIE_SECURE=false

docker compose --env-file .env -f docker/docker-compose.yml up --build -d
docker compose --env-file .env -f docker/docker-compose.yml exec server node dist/scripts/seedAdmin.js
# → http://localhost:8080     health: http://localhost:8080/api/health

SMOKE_ADMIN_EMAIL=<seed email> SMOKE_ADMIN_PASSWORD=<seed password> npm run docker:smoke   # optional end-to-end check
docker compose --env-file .env -f docker/docker-compose.yml down        # add -v to also delete the database volume
```

MongoDB is not published to the host. Behind HTTPS in production keep `NODE_ENV=production` and `COOKIE_SECURE=true` (the API refuses insecure cookies in production). If your network re-signs TLS (corporate proxy), build with `NODE_IMAGE=<your node image that trusts the CA>` in `.env`.

## 3. Testing

Server tests need a MongoDB (they use the database `cb_founder_ledger_test` and **drop it**). Point at one with `TEST_MONGO_URI` (default `mongodb://127.0.0.1:27017/cb_founder_ledger_test`).

```bash
npm test                      # server + client
npm --prefix server test      # API, auth, RBAC, validation, config, DB, rate-limit
npm --prefix client test      # routing, login flow, API client, responsive nav
```

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

## API (Phase 1)

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
