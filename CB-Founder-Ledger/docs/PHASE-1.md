# Phase 1 — Foundation

Scope follows section 21 of the product plan: *project setup, authentication, founder setup, database and brand UI.*

## Delivered

Project scaffold (client, server, Docker, docs, tests) · env validation · MongoDB/Mongoose layer · `User`, `Founder`, `Category` models · email/password auth with rotating refresh sessions · founder/admin RBAC middleware · Zod validation foundation · central error handling · CareerBuddies brand foundation · login page, protected shell, sidebar, header, responsive drawer · placeholder pages for all ten modules · Docker Compose (MongoDB + API + web) · automated tests.

## Deliberately NOT built

Transactions, splits, calculation engine, settlements, approvals, recurring, reports, dashboard figures, receipts, audit-log recording, notifications. Placeholder pages show no numbers.

## Plan ambiguities and the decision taken

The PDF does not specify these; nothing below is an accounting rule. Please confirm or correct before the relevant phase.

1. **Roles.** The plan says "founder/admin" without defining the difference. Phase 1: `admin` = manages users, founders, categories; `founder` = read access. Approval rights ("authorized founders") are Phase 5.
2. **Admin vs founder identity.** Treated as separate concepts: a *user* (login, role) and a *founder* (financial party, optionally linked by `userId`). An admin may or may not be one of the three founders.
3. **Default share.** Plan lists "default share" on founders but not its form. Stored as an optional percent (0–100); **not** required to total 100 and **not** used in any calculation yet.
4. **Categories.** "Controlled categories" but no list is given. **None are seeded**; admins create them via API (a Settings UI is later).
5. **Auth method.** Plan allows "email/password or OTP". Email/password only (as instructed). Self-registration does not exist; admins create accounts.
6. **First admin.** Bootstrapped by `npm run seed:admin` from environment variables; creates a user only.
7. **Navigation visibility.** All modules are visible to both roles except **Settings (admin only)**. Audit Log is visible to founders (accountability); the plan gives no rule.
8. **Phase for Audit Log / Settings screens.** Plan puts audit-log hardening in Phase 8 and does not schedule a Settings UI; placeholders say "Phase 8" and "Later phase".
9. **Login/logout audit events.** Listed in section 15; the audit collection is not part of Phase 1, so they are not recorded yet.
10. **Charts library.** Plan allows Recharts or Chart.js. Not installed in Phase 1 (no charts yet) to avoid an unused dependency.
11. **File storage / notifications / OTP.** Out of scope for Phase 1.
12. **Currency.** Plan examples use ₹ but never state a currency policy. No currency handling exists yet.

## Running the checks

See the root `README.md` for exact commands.
