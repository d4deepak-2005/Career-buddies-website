# tests/

Unit and API tests live next to the code they cover so each package runs them with its own toolchain:

| Package | Location | Runner |
|---|---|---|
| Server (unit, API, auth, RBAC, validation, DB) | `server/tests/*.test.ts` | Vitest + Supertest (needs a MongoDB, see README) |
| Client (routing, auth flow, API client) | `client/src/**/*.test.ts(x)` | Vitest + Testing Library |

This folder holds cross-package checks:

- `smoke-docker.sh` — black-box test of a **running** stack (health, login, RBAC, validation, logout).
