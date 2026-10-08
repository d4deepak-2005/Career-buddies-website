# Phase 2 — Transactions

Scope (product plan §21): *add / edit / view transactions, categories, splits and receipts.*

> **The Phase 3 calculation engine is NOT implemented.** There is no fair-share calculation, no founder net position, no payable/receivable, no settlement recommendation, no dashboard KPIs, no charts, no reports, no recurring expenses and no approval workflow. The only arithmetic is *resolving one transaction's split definition into per-founder amounts for that transaction* (needed for the form preview and so Phase 3 can read validated data). Nothing is summed across transactions anywhere.

## Development assumptions (NOT stated by the PDF)

These were chosen so Phase 2 could proceed; please confirm or correct them. None is an accounting rule from the product plan.

| # | Assumption |
|---|---|
| A1 | `admin` and `founder` remain separate roles. A *user* may be linked to a *founder profile* independently (`Founder.userId`). |
| A2 | Founder default share stays `defaultSharePercent` (percent, optional). Not used by any Phase 2 logic. |
| A3 | Currency is configuration (`CURRENCY_CODE`, `CURRENCY_MINOR_UNITS`, default INR / 2). Amounts are stored as **integers of minor units**; no business logic mentions a currency. |
| A4 | Categories are admin-controlled. **No production categories are seeded.** `npm run seed:dev-categories` inserts 4 generic ones flagged `isDevSeed: true` (refuses to run when `NODE_ENV=production`). No logic depends on any category. |
| A5 | Navigation visibility follows server authorization; hiding links in the client is UX only. |
| A6 | **Which fields each type needs** (table below). The PDF names the 7 types but not their required fields. Encoded in one table: `server/src/domain/transactionRules.ts`; the client reads it from `GET /api/config`. |
| A7 | Reimbursement: `paidBy` = the founder being reimbursed. Settlement: `paidBy` = payer, `counterparty` = receiver. |
| A8 | Permissions: any founder/admin can create and read everything; **edit / submit / attach receipt = creator or admin**; **void = admin only**. |
| A9 | "Custom" split = like "exact" but a founder may be set to 0 and may carry a note; "exact" requires every amount > 0. (The PDF does not distinguish them.) |
| A10 | Shares are positive whole numbers (max 1,000,000). Percentages have up to 2 decimals. Rounding uses the largest-remainder method so the parts always sum to the amount exactly. |
| A11 | New transactions default to `pending_approval` (or `draft`). Approve/reject have **no endpoint** until Phase 5; the transition table already contains them. |

### Required fields per type (A6)

| Type | Category | Paid-by | Receiver | Split | Notes |
|---|---|---|---|---|---|
| Business Expense | required | required | – | **required** | optional |
| Founder Contribution | optional | required | – | not allowed | optional |
| Founder Loan | optional | required | – | not allowed | optional |
| Reimbursement | optional | required | – | not allowed | optional |
| Settlement | optional | required | **required** (≠ payer) | not allowed | optional |
| Refund | optional | optional | – | optional | optional |
| Other | optional | optional | – | optional | **required** |

## Transaction schema (`transactions` collection)

| Field | Notes |
|---|---|
| `txnNumber` | unique, human-readable `TXN-000001` from an atomic counter (`counters`); gaps possible, duplicates not |
| `type` | one of the 7 types |
| `amountMinor` | integer ≥ 1, ≤ 10¹² |
| `categoryId`, `paidByFounderId`, `counterpartyFounderId` | references; must exist and be active (unless already on the record) |
| `description` (≤200), `notes` (≤2000) | |
| `transactionDate` | date (UTC midnight), API format `YYYY-MM-DD`, 2000–2100 |
| `status` | see lifecycle |
| `split` | embedded, see below |
| `receiptCount` | denormalised for the list indicator |
| `void` | `{reason, voidedBy, voidedAt}` once voided |
| `version` | optimistic-concurrency token (own field; Mongoose `__v` disabled) |
| `createdBy`, `updatedBy`, `createdAt`, `updatedAt` | |

Indexes: `txnNumber` (unique); `{transactionDate:-1,_id:-1}`; `{status,transactionDate}`; `{type,transactionDate}`; `{categoryId,transactionDate}`; `{paidByFounderId,transactionDate}`; `{createdBy,createdAt}`; `{amountMinor}`.

**Hard deletion is blocked**: the API's `DELETE` returns 405 `HARD_DELETE_DISABLED`, and the Mongoose model throws on `deleteOne/deleteMany/findOneAndDelete`.

`transaction_revisions` — append-only history (one row per create / edit / submit / void / receipt added: version, action, actor, time, reason, snapshot after the change). Update/delete operations on it throw. This is a Phase 2 history trail, **not** the Phase 8 audit log.

## Split schema (embedded in the transaction; no separate collection)

```jsonc
"split": {
  "method": "equal | percentage | exact | shares | custom",
  "entries": [{
    "founderId": "…",
    "percent": 33.33,       // percentage only
    "shares": 2,            // shares only
    "amountMinor": 150000,  // exact / custom only
    "note": "…",            // custom only
    "allocatedMinor": 100000 // resolved responsibility for THIS transaction; sum === amountMinor
  }]
}
```

The **definition** (`percent`/`shares`/`amountMinor`) is stored so Phase 3 can use it; `allocatedMinor` is recomputed by the server on every write. Rules (`server/src/domain/splits.ts`, pure and unit-tested):

* **equal** — ≥1 distinct founders. Remainder minor units go to the first entries (e.g. 100 ÷ 3 → 34/33/33).
* **percentage** — each >0 and ≤100 with ≤2 decimals; must total exactly 100%.
* **exact** — each >0; must total the transaction amount.
* **shares** — positive integers.
* **custom** — each ≥0; must total the amount; at least one >0.
* Duplicate founders, unknown/inactive founders, >20 entries, unknown fields: rejected.

**Amount changes:** equal / percentage / shares are re-resolved automatically (30,000 → 45,000 gives 15,000 each). Exact and custom are **re-validated** and the edit is rejected (400) unless the new amounts are supplied in the same request.

## Status lifecycle

`draft → pending_approval → (approved | rejected)`; `draft | pending_approval | approved | rejected → voided`; `voided` is terminal.

| Status | Editable | Reachable in Phase 2 via API |
|---|---|---|
| draft | yes | create (`status:"draft"`) |
| pending_approval | yes | create (default) or `POST /:id/submit` |
| approved | no | **no** (Phase 5) |
| rejected | no | **no** (Phase 5) |
| voided | no | `POST /:id/void` (admin, reason required) |

Corrections to approved records are made by voiding and entering a new transaction.

## Receipt storage architecture

```
client ──multipart──► API (auth, authz, rate limit, size cap, magic-byte check)
                        ├─► ReceiptStorage.put(key, bytes)   ← interface; LocalReceiptStorage today (private dir / Docker volume)
                        └─► MongoDB `receipts`: metadata only (no bytes)
client ◄──stream────  API  GET …/file  (auth required) ◄─ ReceiptStorage.open(key)
```

* Allowed: PDF, JPG, JPEG, PNG. The type is decided from **magic bytes**; extension and declared MIME must agree with it, otherwise 415.
* Size: `RECEIPT_MAX_BYTES` (default 5 MB) → 413. Empty files rejected. 1 file per request, no extra form fields. Max 10 receipts per transaction.
* Storage key is `uuid.ext`, generated server-side; the user-supplied name is only sanitised for display (path parts, control and odd characters removed). The storage layer rejects any key not matching `uuid.(pdf|jpg|png)` and verifies the resolved path stays inside the root; files are created `0600`, never overwritten.
* **No public URLs**: there is no static route. Files are only served by `GET /api/transactions/:id/receipts/:receiptId/file` behind `authenticate`, with `nosniff`, `Cache-Control: private, no-store`, `Content-Security-Policy: default-src 'none'`, and `inline` / `attachment` (`?download=1`) disposition. `storageKey` is never returned by the API.
* Metadata kept: name, MIME, size, SHA-256, uploader, time. Receipts are not deletable via the API (history is kept).
* Replace `LocalReceiptStorage` with an object-storage implementation of `ReceiptStorage` (private bucket, server-side proxying or short-lived signed URLs) without touching routes.

## API (all under `/api`, all require a signed-in user)

| Endpoint | Who |
|---|---|
| `GET /config` | any — currency, receipt limits, type rules |
| `GET /transactions?search&type&status&categoryId&paidByFounderId&dateFrom&dateTo&hasReceipt&sort&order&page&pageSize` | any |
| `POST /transactions/split-preview` `{amountMinor, split}` | any — resolves/validates, saves nothing |
| `POST /transactions` | any founder/admin |
| `GET /transactions/:id`, `/:id/split`, `/:id/history` | any |
| `PATCH /transactions/:id` `{expectedVersion, …fields}` | creator or admin |
| `POST /transactions/:id/submit` `{expectedVersion}` | creator or admin |
| `POST /transactions/:id/void` `{expectedVersion, reason}` | **admin** |
| `DELETE /transactions/:id` | nobody → 405 |
| `GET /transactions/:id/receipts`, `/:id/receipts/:rid` | any |
| `POST /transactions/:id/receipts` (multipart `file`) | creator or admin |
| `GET /transactions/:id/receipts/:rid/file[?download=1]` | any |
| `GET /categories` · `POST /categories` · `PATCH /categories/:id` | read: any · write: **admin** |

List: sort fields `transactionDate | amountMinor | createdAt | txnNumber`; `pageSize` ≤ 100; response `{items,page,pageSize,total}` only — no totals.

## Validation & security rules

Zod `.strict()` everywhere (unknown fields → 400, including `status`, `version`, `createdBy`, `receiptCount`, `$`-operators); ids must be 24-hex; search text is regex-escaped; `$`/dotted keys rejected in body/query/params; Mongoose `sanitizeFilter` stays on and server-built operators are explicitly `trusted`; PATCH merges onto the stored record and **re-validates the whole document** (type rules, references, split); concurrent edits use `expectedVersion` with a conditional update (loser gets 409 `VERSION_CONFLICT`); write rate limit (120/min/IP) and upload rate limit (30/15 min/IP); nginx `client_max_body_size 8m`.

## Testing strategy

* **Unit** (`server/tests/splits.test.ts`, `transactionRules.test.ts`): every split method, rounding invariants over many amounts/weights, rule table, lifecycle.
* **API integration against real MongoDB** (`transactions.test.ts`, `receipts.test.ts`): all seven types, validation, split rules, edit authorization, optimistic concurrency (parallel requests), injection attempts, hard-delete prevention, list filters/sort/pagination, receipt type/size/filename/path/authorization.
* **Client** (Vitest + Testing Library): list, form (type-driven fields, live preview, validation), detail (void confirmation), settings, money parsing, responsive structure.
* **Black-box** (`tests/smoke-docker.sh`): the same flows against the running Docker stack.

## Known limitations

* Create/edit and the history row are two writes (standalone MongoDB has no multi-document transaction); a crash between them could miss a history row. The record itself is never inconsistent.
* `txnNumber` can skip numbers if an insert fails after allocation.
* No duplicate-submission (idempotency key) protection beyond disabling the button.
* Receipts cannot be removed or replaced; one wrongly attached file stays (void the transaction if needed). Local disk storage is single-node.
* Receipt scanning for malware is not performed (type is verified, content is not scanned).
* Search is an escaped regex scan (fine at founder-ledger scale; use a text index if volumes grow).
* The split preview is a server call (debounced ~250 ms) so rules live in one place, not instantaneous in the browser.
* Category/founder admin UIs: only categories have a UI (Settings). Founder profiles are managed via API.
* Currency is a single global configuration.
