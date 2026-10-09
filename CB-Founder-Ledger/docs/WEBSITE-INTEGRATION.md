# Future integration with www.careerbuddies.in/#ledger

**Status: NOT integrated, NOT deployed.** Nothing in the marketing website, its deployment, DNS or production config was
changed. A URL fragment (`#ledger`) cannot mount a separate app by itself, so integration needs one of the following.

## What exists in the portal now
- Independently deployable Docker stack (Mongo + API + nginx client) — `docker/docker-compose.yml`.
- Entry routes `/ledger` and `/#ledger` that land on login / dashboard (tested in `portal.test.tsx` and the browser run).

## Checklist (do in this order, each step verified before the next)
1. Deploy the portal privately (own host or subdomain such as `ledger.careerbuddies.in`) with HTTPS, a strong
   `JWT_ACCESS_SECRET`, `COOKIE_SECURE=true`, `CLIENT_ORIGIN` / `ALLOWED_ORIGINS` set to the final origin, MongoDB with
   auth and backups. Do not expose MongoDB.
2. Decide the hand-off. Recommended: a link on the website (small script reading `location.hash === '#ledger'` →
   `location.assign('https://ledger.careerbuddies.in/ledger')`). Alternative: reverse-proxy `/ledger` on the website host to
   the portal (cookies then become same-site; re-check cookie settings, CORS and CSP).
3. Add that script/link to the website repo in a **separate reviewed change**; no financial data or credentials go in the
   website bundle.
4. Verify: `/#ledger` redirects, login works over HTTPS, cookies are `Secure; HttpOnly`, robots/no-index for the portal,
   no private data reachable unauthenticated (`tests/smoke-docker.sh https://…`).
5. Only then announce the URL.
