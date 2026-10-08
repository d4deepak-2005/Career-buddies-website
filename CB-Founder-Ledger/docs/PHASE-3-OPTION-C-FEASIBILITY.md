# Phase 3 — Option C Feasibility Review (expense-linked reimbursement)

**Status: design review only. Nothing is implemented, no policy is chosen.**
No source code, tests, data model or database was changed for this document (commit base `a9ee81d`).
Phase 4 is not started.

All figures were produced by a **throwaway prototype** that reused the unmodified Phase 2/3 helpers (`allocateByWeights`, `recommendSettlements`) and ran the **current** engine for the IA-5 side of every comparison. The prototype was deleted afterwards; `git status` was clean before and after. Amounts are in ₹.

Labels as in the spec: **PDF REQUIREMENT**, **INFERRED FROM PDF EXAMPLE**, **IMPLEMENTATION ASSUMPTION**, **PHASE 3 LIMITATION**.

---

## 1. Short answers to the ten questions

| # | Question | Answer |
|---|---|---|
| 1 | Can a reimbursement be linked to its expense without breaking the accounting model? | **Yes.** The link is additive; the engine change is local; founder balances become zero-sum *by construction* (no external layer needed). What does change is the **meaning of "fair share"** (see §5 and §11). |
| 2 | Which field(s)? | One new field on the transaction: `reimbursesTransactionId` (reference to an expense transaction), required for type *reimbursement*, forbidden for every other type. §4. |
| 3 | What should it reference? | The **expense's transaction `_id`** alone. "Expense + founder id" is unnecessary because an expense has exactly one payer. §4.2. |
| 4 | Edge cases (less / equal / greater / multiple / multiple payers / expense voided / reimbursement voided) | §6, with exact numbers. |
| 5 | Scenarios A, B, C | §7. |
| 6 | Compare with IA-5 | §8. In single-expense cases balances are identical (±₹0.01 rounding). They **differ materially** when several expenses with different splits exist (Scenario C2: up to **₹333.33**). |
| 7 | Existing tests that would change | §10: **23 server + 3 client tests** touched (16 rewritten, 7 adjusted), plus 2 out-of-repo browser scripts. |
| 8 | Phase 2 or Phase 3? | **A genuine Phase 2 data-model change** (new persisted reference, validation, void guard, form field) **plus** a Phase 3 engine change. It can be delivered inside the current Phase 3 work as a documented *Phase 2 amendment* (as was done for the refund rule and settlement method) — but only with explicit approval. §9. |
| 9 | Implement now? | **No.** |
| 10 | Choose a policy? | **No.** §12 lists what remains yours to decide. |

---

## 2. Current architecture (verified by inspection)

* **Reimbursement today** (`server/src/domain/transactionRules.ts`): requires *paid-by* (the founder being reimbursed); category optional; counterparty, split and method forbidden. **It carries no reference to anything else.**
* **No transaction references another transaction anywhere** in the model (`server/src/models/Transaction.ts`). Fields: `txnNumber, type, amountMinor, categoryId, description, notes, paidByFounderId, counterpartyFounderId, method, transactionDate, status, split, receiptCount, void, version, createdBy, updatedBy`.
* **An expense has exactly one payer** (`paidByFounderId`) and one stored, resolved split (`allocatedMinor` per founder).
* **Approved records are immutable** (only draft/pending are editable). An **approved expense can still be voided** (admin, with reason).
* **Engine** (`calculationEngine.ts`): a reimbursement reduces the reimbursed founder's *paid* by the amount, adds no expense and leaves fair share unchanged. The total is the *external amount*; **IA-5** then attributes it to founders pro-rata by fair share to keep founder balances zero-sum. Extra fields exist only because of that: `businessFundedShareMinor`, `founderBalanceMinor`, `externalMinor`, status `PASS_WITH_EXTERNAL`, check `EXTERNAL_RECONCILES`.
* **PDF**: §7 defines Reimbursement in one sentence ("Business/founder reimburses a founder who paid a business expense personally"); **nothing** says how it affects balances, whether it must be linked, or where business money comes from (see `PHASE-3-OPEN-DECISIONS.md`).

---

## 3. What Option C is — and the policy it silently embeds

**Option C:** a reimbursement is recorded **against one specific expense**. The business has then borne that part of that expense:

* The reimbursed founder's *paid* falls by the reimbursement (cash came back) — unchanged from today.
* The expense's **founder-funded portion** becomes `amount − Σ reimbursements`. Each founder's responsibility for *that expense* is the stored split **scaled to the founder-funded portion** (largest-remainder rounding, the Phase 2 helper, using the stored `allocatedMinor` as weights; the split definition is never re-resolved).

**The policy this embeds (must be confirmed — see §12):** *the reimbursed portion of an expense is borne by the business and is not any founder's responsibility.* IA-5, by contrast, keeps the founders' fair share at the full expense and reports the business-funded part separately as an "external" amount attributed pro-rata. Both produce the same founder-to-founder balances for a single expense; they differ in what **"fair share"** means and in multi-expense cases.

Option C does **not** answer where business money comes from or whether founders owe the business anything (that is the capital-pool question, Decision 3). It simply treats the reimbursed portion as "paid by the business, not recoverable from founders".

---

## 4. Required data-model change

### 4.1 Fields

| Where | Change |
|---|---|
| `Transaction` model | `reimbursesTransactionId: ObjectId (ref 'Transaction')`, optional at DB level, index `{ reimbursesTransactionId: 1 }` (for "all reimbursements of expense E") |
| Zod schemas (create/patch) | `reimbursesTransactionId: objectIdString.optional()`; nullable in PATCH |
| `RULES` / `/api/config` | new need `linkedExpense`: **required** for *reimbursement*, **forbidden** for all other types (the client reads the rule from the server; nothing hard-coded) |
| Create/edit snapshot + history | link included in `contentFromStored` / `fieldsFor` / `hydrate` so edits and revisions carry it |
| API output | reimbursement shows `reimbursesTransaction: {id, txnNumber, description, amountMinor}`; expense detail may show derived `reimbursements[]` and `reimbursedMinor` (display only) |

### 4.2 What should the reference be?

**The expense's transaction `_id` — nothing else.**

* "Expense ID + founder ID" is redundant: an expense has one payer, so the expense id determines the founder. The reimbursement's existing `paidByFounderId` is **validated to equal the expense's payer** (the PDF says a reimbursement is *for a founder who paid personally*).
* Using `txnNumber` (e.g. `TXN-000042`) would be a second identifier for the same record; the stable `_id` is already what every other relation in the system uses. `txnNumber` is shown in the UI only.
* Expenses paid by several founders cannot exist in the current model (one payer). If the business wants them natively, that is a **separate** Phase 2 change; today they are entered as separate expenses, and each is reimbursed separately.

### 4.3 Validation (server-side, authoritative)

On create/edit of a reimbursement:

1. Target exists, is a `business_expense`, and is not `voided`/`rejected`.
2. `paidByFounderId` equals the expense's payer.
3. `Σ(other linked reimbursements that are draft/pending/approved) + this amount ≤ expense amount` (otherwise `400`).
4. No self-reference, no link to another reimbursement/refund/settlement.

On the **expense**: editing a pending expense so its amount drops below the sum of its linked reimbursements is rejected; **voiding** an expense that still has active linked reimbursements is **blocked** (`409 HAS_LINKED_REIMBURSEMENTS`; the admin voids the reimbursement first). This guard is a recommendation; the alternative is "allow and warn" (§6).

### 4.4 Migration

**No migration script is required or proposed.** The change is additive (MongoDB is schemaless; Mongoose creates the index on start). The only existing-data concern is any *approved reimbursement without a link*. Today **none can exist in a real deployment** (nothing can become approved through the app until Phase 5), but a pre-deploy check should confirm it:
`db.transactions.countDocuments({ type: 'reimbursement', status: 'approved' })` → expected `0`. If it is not 0, those records would be excluded by the engine with a warning until voided and re-entered with a link.

---

## 5. Accounting model under Option C

Per expense *E* (amount *X*, payer *P*, stored allocations `a_f`), with `R(E) = Σ approved, valid reimbursements linked to E` (cap rule §6):

```
founderFunded(E)  = X − R(E)
effective_f(E)    = allocate(founderFunded(E), weights = a_f over founders with a_f > 0)   # largest remainder; Σ = founderFunded(E)
paid(P)          += X − R(E)                       # replaces: expensePaid − reimbursed
fairShare_f      += effective_f(E)
net_f             = paid_f − fairShare_f           # unchanged formula (INFERRED FROM PDF EXAMPLE)
```

* `Σ paid = Σ fairShare` for every expense, so **`Σ net = 0` always** — no exception, no external layer, no attribution. Net position **is** the founder-to-founder balance.
* `businessBorne = Σ R(E)` is reported as an **informational** line ("paid by the business"). It is not a balance and never enters a recommendation.
* Allocation is done once per expense from the *total* reimbursed, not sequentially (no rounding drift).
* Contributions, loans, refunds, settlements, "Other" and invalid-record handling are **unchanged**.
* Fields that become obsolete: `businessFundedShareMinor`, `founderBalanceMinor`, status `PASS_WITH_EXTERNAL`, check `EXTERNAL_RECONCILES`, warnings `REIMBURSEMENTS_EXCEED_EXPENSES` / `REIMBURSED_MORE_THAN_PAID` (replaced by structural link checks). `externalMinor` becomes `businessBorneMinor` (informational).

---

## 6. Edge cases (all numbers: Option C, expense ₹3,000 paid by A, equal split, unless stated)

| Case | Rule | Result (balances A / B / C) |
|---|---|---|
| **Reimbursement < expense** (₹1,000) | founder-funded ₹2,000 scaled across the split | paid A 2,000; fair 666.67 / 666.67 / 666.66; **+1,333.33 / −666.67 / −666.66**; business-borne 1,000 |
| **Reimbursement = expense** (₹3,000) | founder-funded 0; every effective share 0 | all zero; nobody owes anything; business-borne 3,000 |
| **Reimbursement > expense** (₹3,500) | rejected at creation (`400`). If it ever reaches the engine (race, legacy) it is **excluded with warning** `REIMBURSEMENT_EXCEEDS_EXPENSE`, never clamped | as if absent: **+2,000 / −1,000 / −1,000** |
| **Multiple reimbursements** (₹1,000 + ₹500) | summed, allocated once | paid A 1,500; fair 500 each; **+1,000 / −500 / −500**; business-borne 1,500 |
| **Multiple reimbursements exceeding in total** (₹2,000 then ₹1,500) | processed in deterministic order (transaction date, then id); the one that would push the cumulative total over *X* is excluded with a warning | accepted 2,000, excluded 1,500: paid A 1,000; fair 333.34 / 333.33 / 333.33; **+666.66 / −333.33 / −333.33**. *Note: which one is excluded depends on that order.* |
| **Multiple founders paid the same expense** | **Not representable today**: an expense has one payer. Enter two expenses (one per payer, each with its own split) and reimburse each separately | n/a — separate Phase 2 change if native multi-payer expenses are wanted |
| **Original expense voided** | A reimbursement whose target is not an approved expense has nothing to offset → **excluded with a warning** `REIMBURSEMENT_TARGET_NOT_OFFICIAL`. Recommended guard: **block voiding** an expense while it has active linked reimbursements (void the reimbursement first) | if the guard were bypassed: nothing counts, all zero |
| **Reimbursement voided** | it simply stops being official; the expense returns to full founder responsibility | **+2,000 / −1,000 / −1,000** (same as no reimbursement) |
| **Reimbursement pending / draft / rejected** | not official (same as every other type); does not reduce the expense | as if absent |
| **Payer mismatch** (reimbursing B for A's expense) | rejected at creation; excluded with `REIMBURSEMENT_PAYER_MISMATCH` if it ever reaches the engine | as if absent |
| **Reimbursement without a link** (legacy/test data) | excluded with warning `REIMBURSEMENT_NOT_LINKED`; never guessed | as if absent |
| **Uneven split** (₹10,000 by A, 50/30/20; ₹2,000 reimbursed) | stored allocations are the weights | paid A 8,000; fair 4,000 / 2,400 / 1,600; **+4,000 / −2,400 / −1,600** |
| **Refund and reimbursement on the same expense** | independent: the refund keeps its own split (unlinked, as today); only the reimbursement reduces the expense | each effect computed separately; global refund diagnostics unchanged |

---

## 7. Worked examples (Option C vs. current IA-5)

All balances are **founder-to-founder, before any settlement**; "recs" are the recommended payments.

### Scenario A — A pays ₹3,000, 3 founders equal, business reimburses A ₹1,000 against that expense

| | A | B | C | Σ |
|---|---:|---:|---:|---:|
| **Option C** paid | 2,000.00 | 0.00 | 0.00 | 2,000.00 |
| fair share (founder-funded 2,000) | 666.67 | 666.67 | 666.66 | 2,000.00 |
| **net = founder balance** | **+1,333.33** | **−666.67** | **−666.66** | **0.00** |
| recs | | B → A 666.67 | C → A 666.66 | |
| business-borne (informational) | 1,000.00 | | | |
| **IA-5 (current)** net (paid − fair) | +1,000.00 | −1,000.00 | −1,000.00 | −1,000.00 |
| external share | 333.34 | 333.33 | 333.33 | 1,000.00 |
| founder balance | +1,333.34 | −666.67 | −666.67 | 0.00 |
| recs | | B → A 666.67 | C → A 666.67 | |

**Difference: ₹0.01** (which founder receives the odd minor unit).

### Scenario B — full ₹3,000 reimbursed

| | A | B | C |
|---|---:|---:|---:|
| **Option C** paid / fair share / net | 0 / 0 / **0.00** | 0 / 0 / **0.00** | 0 / 0 / **0.00** |
| business-borne | 3,000.00 | | |
| recs | none | | |
| **IA-5** net (paid − fair) | −1,000.00 | −1,000.00 | −1,000.00 |
| external share | 1,000.00 | 1,000.00 | 1,000.00 |
| founder balance | **0.00** | **0.00** | **0.00** |

**Founder-to-founder result is identical (all zero, no payments).** The difference is presentation: under C the fair share is 0 and the net position is 0; under IA-5 the fair share stays 1,000 and net position shows −1,000 with a separate "business-funded share" of 1,000.

### Scenario C — A pays ₹3,000 for E1; B pays ₹3,000 for E2; business reimburses A ₹1,000 **specifically against E1**

The brief does not state the splits, so both readings are shown.

**C1 — both expenses split equally among A, B, C**

| | A | B | C | Σ |
|---|---:|---:|---:|---:|
| **Option C** paid | 2,000.00 | 3,000.00 | 0.00 | |
| fair share (E1 founder-funded 666.67 each + E2 1,000 each) | 1,666.67 | 1,666.67 | 1,666.66 | |
| **net = founder balance** | **+333.33** | **+1,333.33** | **−1,666.66** | 0.00 |
| recs | | | C → B 1,333.33; C → A 333.33 | |
| **IA-5** net (paid − fair) | 0.00 | +1,000.00 | −2,000.00 | −1,000.00 |
| external share | 333.34 | 333.33 | 333.33 | |
| founder balance | +333.34 | +1,333.33 | −1,666.67 | 0.00 |
| recs | | | C → B 1,333.33; C → A 333.34 | |

**Difference: ₹0.01.**

**C2 — E1 is A's own cost only (split A 100%); E2 split equally**

| | A | B | C | Σ |
|---|---:|---:|---:|---:|
| **Option C** paid | 2,000.00 | 3,000.00 | 0.00 | |
| fair share (E1: A bears the founder-funded 2,000; E2: 1,000 each) | 3,000.00 | 1,000.00 | 1,000.00 | |
| **net = founder balance** | **−1,000.00** | **+2,000.00** | **−1,000.00** | 0.00 |
| recs | A → B 1,000.00 | | C → B 1,000.00 | |
| **IA-5** net (paid − fair) | −2,000.00 | +2,000.00 | −1,000.00 | −1,000.00 |
| external share (pro-rata 4,000 : 1,000 : 1,000) | 666.67 | 166.67 | 166.66 | |
| founder balance | −1,333.33 | +2,166.67 | −833.34 | 0.00 |
| recs | A → B 1,333.33 | | C → B 833.34 | |

**Difference: A −₹333.33, B +₹166.67, C −₹166.66.** This is the case that distinguishes the two policies: under C the reimbursement benefits only the founder who bore the reimbursed cost (A); under IA-5 it is spread by overall fair share, so C ends up paying ₹166.66 less and A ₹333.33 more.

---

## 8. Comparison with IA-5

| Aspect | IA-5 (current) | Option C |
|---|---|---|
| Founder-to-founder balance, single expense | same as C (± ₹0.01) | same as IA-5 (± ₹0.01) |
| Several expenses, different splits | reimbursement spread by overall fair share | reimbursement stays with the expense it was linked to — **can differ by hundreds of rupees** (C2) |
| Meaning of "fair share" | full share of every expense | share of the **founder-funded** portion; shrinks when the business reimburses |
| Net position (paid − fair) | includes the business-funded effect; needs an extra "founder balance" field to be the real amount owed | **is** the amount owed between founders |
| Zero-sum invariant | holds only for `founderBalance`; `Σ net = −external` | holds for `net` itself, always |
| Extra fields / statuses | `businessFundedShare`, `founderBalance`, `externalMinor`, `PASS_WITH_EXTERNAL`, `EXTERNAL_RECONCILES` | `businessBorneMinor` (informational) only |
| Unproven attribution rule | yes (IA-5, pro-rata) | **none** — uses the link the user enters |
| Data entry | reimbursement needs only founder + amount | reimbursement must also pick its expense |
| Phase 2 data model | unchanged | **changed** (new link) |
| Risk of misusing it | low (no link) | user can link the wrong expense (mitigated by payer/amount validation) |

---

## 9. Phase 2 vs Phase 3

* **Genuinely a Phase 2 data-model change.** It adds a persisted reference to the transaction, new server validation (target type/status/payer/cap), a void guard on expenses, an index, a new field in the API and in the Add/Edit form (an expense picker). None of that is "calculation".
* **Also a Phase 3 engine change** (replace the IA-5 block with per-expense scaling; simplify the contract).
* **It can safely be done within the current Phase 3 work** as a clearly labelled *Phase 2 amendment*, exactly as the refund rule (payee + split) and the settlement `method` field were — because the change is **additive**, needs **no migration**, and no official reimbursement can exist yet. It should still be **approved explicitly** and recorded in `PHASE-2.md`, since it changes what a Reimbursement *is*.
* It must not wait for Phase 5: the approval workflow will need the link (e.g. re-check the cap at approval time).

---

## 10. Existing tests that would change

Exact counts from the current suite (server 249, client 48).

### Server — 23 tests touched (16 rewritten, 7 adjusted)

| File | Test | Action |
|---|---|---|
| `transactions.test.ts` | "4. Reimbursement" (creates an unlinked reimbursement) | **Rewrite** — needs a linked expense; plus new validation tests |
| `calculationEngine.test.ts` | "14. reimbursement does not double-count the expense…" | **Rewrite** (IA-5 expectations: `reimbursedMinor`, `unallocated…`, fair share unchanged) |
| `calculationEngine.test.ts` | "a business-funded reimbursement is external: it is never recommended…" | **Rewrite** |
| `accountingReview.test.ts` | the 7 tests in "5, 12. reimbursement: external amount is separate…" (full / partial / uneven / never part of a recommendation / never a second expense / paid nothing / wrong amount) | **Rewrite** (all assert external share / founder balance / `PASS_WITH_EXTERNAL`) |
| `accountingReview.test.ts` | "settlements also work for the founder-to-founder balance of a reimbursed scenario" | **Rewrite** |
| `accountingReview.test.ts` | "lists every check with a plain-language detail…" (check list contains `EXTERNAL_RECONCILES`) | **Rewrite** |
| `accountingReview.test.ts` | "15-17. voided, pending, rejected change nothing" (builds a reimbursement fixture) | **Adjust** (fixture signature) |
| `calcInvariants.test.ts` | "A1. founder-to-founder balances sum to exactly 0…" (asserts `founderBalanceMinor`) | **Rewrite** (assert `net` sums to 0) |
| `calcInvariants.test.ts` | "A2. external amount: Σ(paid − fair share) = −external…" | **Rewrite** (becomes: `Σ net = 0` and `businessBorne = Σ valid reimbursements`) |
| `calcInvariants.test.ts` | A3, B-D, E, F, "applying the recommendations…", "results do not depend on transaction order…" (6 tests) | **Adjust** (shared scenario generator must create a linked expense for each generated reimbursement) |
| `financials.test.ts` (API) | "reimbursement and refund through the API do not double count" | **Rewrite** |
| `financials.test.ts` (API) | "partial reimbursement: founders are treated symmetrically and the external amount is explicit" | **Rewrite** |

Also: `calcFixtures.ts` — the `reimbursement()` helper gains a link argument (support file, not a test). `transactionRules.test.ts` needs **no** change but should gain new rule tests.

### Client — 3 tests rewritten, fixtures adjusted

| File | Test | Action |
|---|---|---|
| `financials.test.tsx` | "names the EXTERNAL (business-funded) amount separately…" | **Rewrite** (becomes "business-borne" informational line) |
| `financials.test.tsx` | "every reconciliation status is spelled out in words…" (includes `PASS_WITH_EXTERNAL`) | **Rewrite** |
| `financials.test.tsx` | "shows the external amount in the summary, separate from the payments" | **Rewrite** |
| `financials.test.tsx`, `test/utils.tsx` | fixtures (`businessFundedShareMinor`, `founderBalanceMinor`, rules shape) | **Adjust** (no test logic change) |

### Not in the repo

* `/tmp/.../browser3.mjs` (section 7b) and `browser3b.mjs` create unlinked reimbursements → must be **rewritten**.
* `tests/smoke-docker.sh` does not use reimbursements → **unchanged**.

### Tests that must be **added** (estimate 25–30)
Link validation (target type/status/payer/cap/self-reference), void guard, expense-edit guard, engine: linked scaling (A/B/C1/C2), multiple reimbursements, cumulative cap and order, unlinked/orphan/mismatch exclusions, voided reimbursement, uneven split, rounding, zero-sum invariant with linked reimbursements in the random generator, API round-trip, form (expense picker, remaining reimbursable), detail pages (linked expense shown).

---

## 11. Risks

1. **"Fair share" changes meaning.** After a business reimbursement the fair share *shrinks* (666.67 instead of 1,000). The PDF's §20 wording ("₹30,000 split equally → ₹10,000 each") holds only until a reimbursement exists. The Phase 4 dashboard's "Total Business Expenses" will then exceed Σ fair shares by exactly the business-borne amount and must show that line to reconcile.
2. **Embedded policy** (§3): the reimbursed portion is not recoverable from founders. If the product owner instead wants founders to remain responsible (IA-5 style) the link can still be kept, with the per-expense attribution shown as a *presentation* — same balances, different fair-share display.
3. **Order-dependent exclusion** when cumulative reimbursements exceed an expense (which one is excluded depends on date/id order). Creation-time validation makes this rare; a concurrent race can still produce it, so the engine defends and warns.
4. **Concurrency:** two simultaneous reimbursements can each pass the cap check. Needs a conditional write or a re-check at approval (Phase 5).
5. **Wrong-link entry error:** user links the wrong expense. Mitigated by payer/amount validation and by showing the remaining reimbursable amount, but not eliminated.
6. **Workflow friction:** every reimbursement now needs its expense first; expenses paid by several founders must be split into separate expenses.
7. **Void guard friction:** admins must void reimbursements before voiding an expense (safer, but one more step); the alternative (allow + warn) leaves an orphan.
8. **Contract break:** the removed fields change the API/UI and ~26 tests; any consumer written against IA-5 must change.
9. **Does not settle the other open decisions:** capital pool, loan repayment, refund linking, founder-to-founder reimbursement remain as documented.
10. **Rounding:** odd minor units can move by ₹0.01 versus today's figures.

---

## 12. Decisions that remain with the product owner (none are made here)

1. **Policy:** is the reimbursed portion of an expense **borne by the business** (fair share shrinks — Option C as defined), or should founders stay responsible with the link only used for attribution (same balances, fair share unchanged)?
2. **Linking is mandatory** for every reimbursement (and unlinked ones are rejected/excluded), or optional?
3. **Void rule:** block voiding an expense that has active linked reimbursements, or allow and warn?
4. **Cap rule:** reject any reimbursement that would exceed the expense (recommended), or allow with a warning?
5. **Multi-payer expenses:** keep "one payer per expense" (enter several expenses), or add native multi-payer support (separate Phase 2 change)?
6. **Capital pool** (still open): does business money need to be modelled?
7. Approve this as a **Phase 2 amendment** delivered inside Phase 3?

---

## 13. Technical recommendation (not a policy decision)

**Option C is technically feasible and technically cleaner than IA-5:** it removes the unproven attribution rule and the whole external layer, makes `net position` equal the real founder-to-founder balance, keeps the zero-sum invariant exceptionless, and uses information the user supplies instead of an assumption. If you accept the policy in §3, I recommend approving it **with** the server-side guards in §4.3 (payer match, cap, void guard) and **without** any data migration.

If you prefer to keep founders responsible for the reimbursed portion, the same link can be used with the identical balances and an unchanged fair share (decision 1); that variant is a small change to the same implementation plan.

---

## 14. Implementation plan if Option C is approved

1. **Spec first:** update `PHASE-3-CALCULATION-SPEC.md` (replace IA-5; update IA-4, L-3, L-6; formulas; reconciliation) and `PHASE-2.md` (the amendment); keep `PHASE-3-OPEN-DECISIONS.md` as the history.
2. **Rules & schema:** add `linkedExpense` need to `RULES` and `/api/config`; add `reimbursesTransactionId` to the model (+ index), Zod create/patch, snapshots/history and API output.
3. **Server validation:** target type/status/payer/cap on create and edit; expense-edit guard; void guard; deterministic error codes.
4. **Engine:** link input; per-expense scaling with `allocateByWeights`; cumulative cap in (date, id) order; new exclusion warnings; remove IA-5 block and obsolete fields/status/check; add `businessBorneMinor`; effects ledger entry for the business-borne portion.
5. **Financial API/service:** pass the link; update response contracts.
6. **Client:** types; expense picker in the form (search by number/description, shows remaining reimbursable); linked-expense display on reimbursement and expense detail; replace "external" wording with "paid by the business"; update the three financial views.
7. **Tests:** rewrite/adjust the 23 + 3 listed above; add ~25–30 new tests; extend the random-invariant generator.
8. **Verification:** typecheck, all server/client tests, production builds, Docker build/run, smoke (add linked reimbursement flow), browser suites (rewrite the two reimbursement scenarios), MongoDB inspection, pre-deploy count query.
9. **Report** with exact counts, then await approval before Phase 4.

---

## 15. Verification performed for this review

* Read-only inspection of the model, rules, schemas, service, engine, tests and the PDF text.
* Throwaway prototype of Option C (deleted) cross-checked against the current engine for IA-5.
* Current full suites (unchanged): **server 249 passed / 0 failed (16 files); client 48 passed / 0 failed (5 files).**
* Repository: no source, test, schema or database changes; working tree clean before the document was added.
