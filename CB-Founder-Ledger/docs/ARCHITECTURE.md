# Architecture

Source of truth for requirements: *CareerBuddies Founder Finance — Full Web App Product Plan* (PDF). This document covers what exists after Phase 2 (Phase 2 details: [PHASE-2.md](PHASE-2.md)).

## Layout

```
CB-Founder-Ledger/
  client/   React + TypeScript + Vite + Tailwind SPA
  server/   Node + Express + TypeScript API, Mongoose models
  docker/   Dockerfiles, nginx config, docker-compose.yml
  docs/     This file, PHASE-1.md
  tests/    Cross-package smoke test
```

The two packages are independent (own `package.json` and lockfile); the root `package.json` only holds convenience scripts.

## Request flow

```
Browser ──► nginx (client container, serves SPA)
              └─ /api/*  ──► Express (server container) ──► MongoDB (internal network only)
```

The API is same-origin from the browser's point of view (nginx in Docker, Vite proxy in dev). This keeps the auth cookies first-party so `SameSite=Strict` works. The API is also usable directly by a future mobile client (API-first: JSON in/out, no server-rendered pages).

## Server (`server/src`)

| Path | Responsibility |
|---|---|
| `config/env.ts` | Zod-validated environment; fails fast; production guards |
| `db/connect.ts` | Mongoose connection, `sanitizeFilter`, DB state for health |
| `models/` | `User`, `Founder`, `Category` |
| `middleware/` | `authenticate`, `requireRole`, `validate` (Zod), `rejectUnsafeKeys`, `originCheck`, rate limiter, error handler |
| `modules/<name>/*.routes.ts` | One router per module (`auth`, `users`, `founders`, `categories`, `health`, `config`, `transactions`, `receipts`) |
| `modules/transactions/*.service.ts` | Create / edit / submit / void with validation, optimistic locking and history |
| `domain/` | **Pure business rules**, no I/O: `splits.ts` (split validation + per-transaction allocation), `transactionRules.ts` (type rules, status lifecycle). Phase 3 will add the calculation/settlement engine here |
| `storage/receiptStorage.ts` | `ReceiptStorage` interface + local private-directory implementation (swap for object storage) |
| `lib/` | Password hashing, token helpers, `AppError`, `asyncHandler` |
| `scripts/seedAdmin.ts` | Creates the first admin only. **No financial data.** |

**Business logic location:** all financial rules live in `server/src/domain/` and are called by services; the client never calculates amounts (it formats and parses input only, and asks the server to preview splits). Phase 3's fair-share / net-position / settlement engine will be added to `domain/` — it does **not** exist yet.

### Error contract

Every error is `{ "error": { "code", "message", "details?" } }`. Validation failures are `400 VALIDATION_ERROR` with `details: [{path, message}]`. Unexpected errors return a generic `500` and are logged server-side only.

## Authentication & sessions

- Email + password. Passwords hashed with bcrypt (cost 12 by default; min length 12).
- Login sets two **httpOnly, SameSite=Strict** cookies (`Secure` in production):
  - `cb_access` — short-lived (default 15 min) HS256 JWT `{sub, role, sid}`, path `/api`.
  - `cb_refresh` — opaque random 48-byte token, path `/api/auth`, default 7 days. Only its SHA-256 is stored.
- `sid` ties the access token to a server-side session stored on the user (`sessions[]`). `authenticate` requires that session to exist and the account to be `active`, so **logout, disabling a user, or changing their role/status takes effect immediately** even for unexpired JWTs. Role is always re-read from MongoDB, never trusted from the token.
- Refresh rotates the refresh token atomically (single use; replay → 401). At most 10 concurrent sessions per user.
- Login is timing-equalised (dummy bcrypt compare for unknown emails) and returns one generic error.

## Authorization (RBAC)

Roles: `admin`, `founder`. Enforced server-side by `authenticate` then `requireRole(...)`.

| Resource | founder | admin |
|---|---|---|
| `GET /api/founders`, `/api/categories` | ✔ | ✔ |
| `POST/PATCH` founders, categories | ✘ 403 | ✔ |
| `/api/users` (list/create/update) | ✘ 403 | ✔ |
| Own session (`/api/auth/*`) | ✔ | ✔ |

An admin cannot demote or disable their own account (prevents lock-out). Client-side route guards and hidden nav items are UX only.

## Security measures

Helmet headers · strict CORS (single origin, credentials) · Origin check on state-changing requests · SameSite=Strict cookies · rate limit on `/auth/login` and `/auth/refresh` · 100 kB JSON body limit · Zod `.strict()` schemas (unknown fields rejected) · rejection of `$`/dotted/`__proto__` keys in body/query/params + Mongoose `sanitizeFilter` · `Cache-Control: no-store` on API · secrets only from environment (validated, never bundled into the client) · non-root API container, MongoDB with auth and not published to the host · nginx CSP, `X-Frame-Options: DENY`.

## Client (`client/src`)

React 19 + React Router. `AuthProvider` loads the session from `/api/auth/me`; `api()` retries once through a single-flight `/auth/refresh` on 401. `ProtectedRoute` guards the app area; `AppShell` provides sidebar (desktop), drawer (mobile/tablet) and header. Modules are declared once in `lib/modules.ts` and rendered as `ModulePlaceholder` pages. No financial numbers exist in the client.

### Brand

Tokens in `tailwind.config.js` come from the official logo/website palette: navy `#002869`, blue `#0052a3`/`#0055b3`, green `#00a63f`/`#008040`, white cards (rounded 1.25rem, soft shadow), Plus Jakarta Sans (self-hosted via `@fontsource`, same family as the website). The logo is used unmodified from `client/public/brand/careerbuddies-logo.png`.

## Data model

- **users** — email (unique), name, passwordHash (not selected by default), role, status, sessions[], lastLoginAt.
- **founders** — name, email?, userId? (unique link to a user), defaultSharePercent? (0–100), active.
- **categories** — name, slug (unique, derived), description?, active.

- **transactions** (embedded split), **transaction_revisions** (append-only), **receipts** (metadata only), **counters** — see PHASE-2.md.
- categories also carry `isDevSeed`.

Founders, categories and transactions are deactivated / voided, never deleted. Receipt bytes are never stored in MongoDB.
