# Phase 3 — Calculation Specification (Option C: expense-linked reimbursement)

Scope (product plan §21): *fair share, founder balances, net positions and settlement calculations.*

Every rule in this document carries **exactly one** of four labels. They are not interchangeable:

| Label | Meaning |
|---|---|
| **PDF REQUIREMENT** | The Product Plan PDF states it (section cited). |
| **INFERRED FROM PDF EXAMPLE** | Not stated as a rule; it is what the PDF's worked example implies. |
| **IMPLEMENTATION ASSUMPTION** | The PDF is silent. A decision was needed to make the engine well-defined. Needs product-owner confirmation. |
| **PHASE 3 LIMITATION** | Something the system deliberately does *not* model yet. |

> **Product decision taken: Option C.** Reimbursement is linked to the one approved business expense it reimburses; the reimbursed part is *business-borne* and founders share only the founder-funded remainder. This replaces the earlier IA-4/IA-5 "external amount" treatment entirely (no attribution rule remains). Other open decisions (founder-to-founder reimbursement, capital pool, loan repayment, refund linking) stay open — see [PHASE-3-OPEN-DECISIONS.md](PHASE-3-OPEN-DECISIONS.md) and [PHASE-3-OPTION-C-FEASIBILITY.md](PHASE-3-OPTION-C-FEASIBILITY.md).

> **Phase 4+ is not built.** No dashboard KPIs/charts, approval workflow or approve/reject UI, recurring expenses, reports, hardening or launch work.

---

## 1. What changed in Option C

History: the first Phase 3 version made reimbursements distort balances; the accounting review (commit `60c43a6`) kept a separate *external amount* and attributed it to founders pro-rata (IA-5), which the product owner then chose to replace with Option C (see Open Decisions). **Option C removes the need for any attribution rule**: because a reimbursement now names the expense it pays back, the engine knows exactly whose responsibility shrank.

* Per expense: `founderFunded = amount − Σ valid linked reimbursements`. The expense's *stored* split is scaled to `founderFunded` with the Phase 2 largest-remainder rounding. The reimbursed portion is **business-borne** (shown, informational, never a balance).
* The paying founder's *paid* for that expense is `amount − reimbursed`, so **Σ net positions = 0 exactly**, with or without reimbursements. There is no external remainder, no fake founder, no capital pool.
* The cap (Σ active reimbursements ≤ expense) is enforced at write time, atomically, and re-checked by the engine.

**Net position is unchanged** (`paid − fair share`, labelled INFERRED FROM PDF EXAMPLE).

---

## 2. Rule register

### 2.1 PDF REQUIREMENT

| ID | Rule | PDF |
|---|---|---|
| PDF-1 | **Approved** transactions affect official calculations. | §11 |
| PDF-2 | **Rejected** transactions do not affect official totals. | §11 |
| PDF-3 | Amount change → calculations → balances → settlements update automatically. | §1, §8, §20 |
| PDF-4 | The system calculates **net positions** and recommends the **simplest settlement path**; it shows who owes whom. | §1, §9 |
| PDF-5 | A founder ledger shows: total paid; contribution; loan outstanding; fair share; amount receivable; amount payable; settled amount; outstanding amount; complete transaction history. | §10 |
| PDF-6 | Type meanings — *Founder Contribution*: personal money into the business as capital; *Founder Loan*: lends money, expects repayment; *Reimbursement*: business/founder reimburses a founder who paid a business expense personally; *Settlement*: one founder pays another to settle an outstanding balance; *Refund*: money returned from a vendor or expense. | §7 |
| PDF-7 | One **centralised** calculation layer, used by dashboard, ledger, settlements and reports; **no hard-coded financial calculations in the frontend**; production values come from stored transactions (the §9 figures are illustrative). | §9, §18, §20 |
| PDF-8 | Approved transactions are never silently deleted; reversal/void with history. | §11 |
| PDF-9 | Responsibility for an expense follows its split (equal, percentage, exact, shares, custom). | §8 |

### 2.2 INFERRED FROM PDF EXAMPLE

| ID | Rule | Evidence |
|---|---|---|
| INF-1 | **Net position = Paid − Fair share.** | §9 table: 80,000 − 61,667 = +18,333; 65,000 − 61,667 = +3,333; 55,000 − 61,667 = −6,667. All three rows check out. *The PDF never states this as a formula.* |
| INF-2 | Positive net → **Receive**; negative → **Pay**. | same table |
| INF-3 | The fair share of an equal split is amount ÷ number of founders. | §20: 30,000 ÷ 3 = 10,000; 45,000 → 15,000 |

**Observation (not a rule).** The §9 example does not reconcile as a whole: paid totals 200,000, but the three fair shares total 185,001, so its net positions sum to +15,000. The PDF labels the figures illustrative. They are used only to infer INF-1/INF-2 and are not reproduced.

### 2.3 IMPLEMENTATION ASSUMPTION

| ID | Assumption | Why it was needed |
|---|---|---|
| IA-1 | A `settlement` **transaction is the settlement record** (payer = paid-by, receiver = counterparty, amount, status, date, optional method). No separate `settlements` collection. | PDF lists both a Settlement type (§7) and a settlements collection (§17); two sources would double-count. |
| IA-2 | **Official = status `approved` only.** Draft, pending, rejected and voided never affect a figure. | PDF-1/PDF-2 name approved/rejected only; excluding draft/pending/voided follows from "approved transactions affect official calculations" and PDF-8. |
| IA-3 | Business expense: the paid-by founder paid the full amount; each split founder bears their **stored** `allocatedMinor` (the Phase 2 resolver is not re-run). | PDF-9 defines splits but not how they feed *paid*. |
| IA-4 | **Reimbursement is business-funded and expense-linked (Option C — product-owner decision).** A reimbursement must reference exactly one **approved** business expense with exactly one payer (`reimbursesTransactionId`); the reimbursed founder must be that payer; the field is forbidden on every other type. The reimbursed amount is **business-borne**. For the linked expense the engine uses `founderFunded = amount − Σ valid linked reimbursements`, allocates it over the expense's **stored** split (largest remainder), and the payer's *paid* for it is `amount − reimbursed`. A *founder* reimbursing another founder is still a **Settlement**. | PDF-6 says "business/founder" and never says which expense. The link is what makes the effect on responsibility exact instead of attributed. |
| IA-5 | ~~Attribution of the external amount~~ — **REMOVED by Option C.** No attribution rule, `businessFundedShare`, `founderBalance`, `externalMinor` or `PASS_WITH_EXTERNAL` status exists any more. | The link makes it unnecessary. |
| IA-5b | **Cap and concurrency.** Σ of active reimbursements (draft, pending, approved) of one expense may not exceed its amount. Capacity is **reserved atomically** on the expense (`reimbursedMinor`, a conditional `$expr` update) before the reimbursement is written, and released when the reimbursement is voided, edited down/away, moved, or its write fails. An expense cannot be voided while it holds active reimbursements (void them first). The engine **never reads the counter**: it recomputes from the linked records in (date, number, id) order and excludes any over-cap record with `REIMBURSEMENT_EXCEEDS_EXPENSE`. `npm --prefix server run reconcile:reimbursements` detects counter drift. | Two concurrent requests must not both pass an application-level check. |
| IA-5c | **Engine exclusions (each a named `warning`, record excluded, never repaired):** `REIMBURSEMENT_NOT_LINKED`, `_TARGET_MISSING`, `_TARGET_INVALID` (not a business expense), `_TARGET_NOT_OFFICIAL` (not approved), `_PAYER_MISMATCH`, `_EXCEEDS_EXPENSE`. Status becomes `REVIEW`. | Legacy or raw-written data may predate the rule. |
| IA-6 | **Refund** of F received by founder P with split S: reduces P's *paid* by F and each split founder's *fair share* by their allocation. The original expense is never edited and keeps its own effects. Phase 2 now requires a refund to have the receiving founder and a split. | PDF-6 gives only the definition; no link to an original expense exists. |
| IA-7 | **Contribution** is reported as `contributionMinor` only. It is not in paid, fair share, net position or any settlement. | PDF-5/PDF-6 list it as a separate metric; mixing capital with expense responsibility is explicitly avoided. |
| IA-8 | **Loan principal** is reported as `loanOutstandingMinor` only (sum of approved loan principal). It is never in paid, fair share, net position or settlement. | PDF-5 lists "founder loan outstanding". |
| IA-9 | **Settlement mechanics.** Payer: `settledPaid += S`; receiver: `settledReceived += S`; outstanding = founder-to-founder balance + settledPaid − settledReceived. Settlements never touch paid, fair share, contribution or loan, so a settlement is never an expense and cannot loop. | PDF-6 defines purpose only. |
| IA-10 | **Over-settlement is allowed and explicit.** If settlements move a founder past zero (they paid or received more than was due), `overSettledMinor` is set, an `OVER_SETTLED` warning is raised and reconciliation status becomes `REVIEW`. The sign is never hidden or clamped. | A payment cannot be rejected after the fact; hiding it would misstate balances. |
| IA-11 | **`Other` transactions are diagnostics only.** Each approved `Other` is reported once as an `info` diagnostic (`OTHER_NOT_CALCULATED`) and counted in `excluded.unclassifiedOther`. **That count is not a financial total**; their amounts are never summed, never in any figure, and never affect reconciliation status. | PDF §7 gives "Other" no accounting meaning (only "controlled fallback with mandatory notes"). |
| IA-12 | **Invalid approved transactions are excluded and reported, never repaired.** Invalid = non-positive/non-integer amount, split not summing to the amount, unknown/duplicate founder in a split, missing paid-by, settlement with equal or unknown parties. Each yields a `warning` with the transaction id. Status becomes `REVIEW`. | Data may predate a rule; guessing would invent numbers. |
| IA-13 | **Diagnostics that do not exclude anything** (the records are valid but look inconsistent): `REFUNDS_EXCEED_EXPENSES`, `NEGATIVE_FAIR_SHARE` (a founder's refunds exceed their share; the value is **kept**, not clamped, so zero-sum holds), `OVER_SETTLED`. (The reimbursement diagnostics `REIMBURSEMENTS_EXCEED_EXPENSES` and `REIMBURSED_MORE_THAN_PAID` were removed: the link prevents and names those cases, IA-5c.) | Refunds are still not linked to an expense (L-3). |
| IA-14 | Every founder profile is listed (active or not); inactive founders keep their balances. | A leaver can still owe or be owed. |
| IA-15 | All signed-in founders and admins can read all figures and all diagnostics. | Same visibility as the transactions themselves (Phase 2 A8). |
| IA-16 | Everything is recomputed from the database on each request; no cache. | PDF-3: never stale. |
| IA-17 | **Settlement algorithm:** exact-match pass, then greedy largest-debtor → largest-creditor, deterministic tie-breaks (§7). | PDF-4 asks for the "simplest" path; true minimum is NP-hard. |

### 2.4 PHASE 3 LIMITATION

| ID | Limitation |
|---|---|
| L-1 | **No business capital pool or business account is modelled.** Contributions are informational (IA-7). The business-borne amount is shown, not tied to a pool. |
| L-2 | **Loan repayment is not modelled** (the PDF defines no repayment record). Outstanding = principal. |
| L-3 | **Refunds are not linked** to a specific expense, so over-refunding can only be flagged globally (IA-13). Reimbursements *are* linked (Option C). |
| L-3b | **One expense, one payer.** Multi-payer expenses cannot be reimbursed (the link needs one payer). |
| L-4 | Nothing can become **approved** through the app until Phase 5, so a real deployment reads zero until then. Tests approve with a controlled database write; authorization was not weakened. |
| L-5 | The settlement path is not guaranteed to use the minimum number of transfers. |
| L-6 | Only **approved** expenses can be reimbursed, and nothing can be approved through the app until Phase 5 (L-4), so the reimbursement flow can only be exercised end-to-end with fixture approvals until then. |
| L-7 | A settlement's `method` is free text (≤50 chars). There is no dedicated mark-as-settled workflow yet. |
| L-8 | No "as of date" filter, caching, or per-period views (reports, Phase 7). |

---

## 3. Review decisions (what was asked, what was decided)

| Topic | Decision |
|---|---|
| **Reimbursement** | Option C (IA-4, IA-5b, IA-5c): linked to one approved expense, business-borne, founders share only the funded remainder, zero-sum without any attribution rule. No fake founder, no capital pool. |
| **Refund** | Reviewed for double counting and distortion. The original expense is untouched; the refund has its own ledger effects; a refund received by a different founder correctly leaves that founder holding cash owed back (negative *paid* is legitimate there); an over-large refund is flagged, not clamped (IA-6, IA-13). |
| **Contribution** | Kept separate (IA-7). Capital pool not modelled (L-1). |
| **Loan** | Verified by tests to be absent from fair share, paid, net, and settlement. Repayment not modelled (L-2). |
| **Settlement** | Architecture kept (IA-1, IA-9). Verified: never an expense, never raises fair share, never creates or destroys money, partial / multiple / full / over-settlement all handled (IA-10). |
| **Net position** | `Paid − Fair share` kept; labelled **INFERRED FROM PDF EXAMPLE** (INF-1). |
| **"Other"** | Diagnostics only (IA-11). The code path increments a counter and emits an `info` entry; no amount reaches any figure. |
| **Invalid records** | Safe behaviour kept (IA-12). |

## 4. Formulas (integers, minor units)

For founder *f*, over official, valid transactions (IA-2, IA-12):

```
for each valid approved business_expense E (amount X, payer P, stored allocations a_i):
    R(E)          = Σ valid linked reimbursements (approved, same payer, in cap order)      # IA-4, IA-5c
    founderFunded = X − R(E)
    share_i       = a_i                         if R(E) = 0
                  = allocate(founderFunded, weights = a_i)   (largest remainder; 0s if founderFunded = 0)
    paid(P)      += X − R(E)         fairShare(i) += share_i         businessBorne += R(E)

refundReceived(f)  = Σ amount of refund paidBy = f                    fairShare(i) −= refund allocation(i)    paid(f) −= refund
paid(f)            = Σ (X − R(E)) over f's expenses − refundReceived                  # "Paid"
reimbursed(f)      = Σ valid reimbursements paid to f                                  # informational

net(f)             = paid(f) − fairShare(f)                           # INF-1.   Σ_f net(f) = 0 EXACTLY, always
settledPaid(f), settledReceived(f) = Σ settlements paid / received by f
outstanding(f)     = net(f) + settledPaid(f) − settledReceived(f)     # signed; Σ_f = 0
receivable = max(outstanding, 0)   payable = max(−outstanding, 0)
action = receive | pay | settled          (from outstanding; INF-2)
overSettled(f)     = amount by which settlements moved f past zero (IA-10), else 0
contribution(f), loanOutstanding(f)  — separate metrics only (IA-7, IA-8)
```

Worked examples (₹; 3,000 expense paid by A, equal split of A, B, C):

| Case | Paid A/B/C | Fair share A/B/C | Net A/B/C | Recommendations |
|---|---|---|---|---|
| no reimbursement | 3,000 / 0 / 0 | 1,000 each | +2,000 / −1,000 / −1,000 | B→A 1,000, C→A 1,000 |
| ₹1,000 reimbursed | 2,000 / 0 / 0 | 666.67 / 666.67 / 666.66 | +1,333.33 / −666.67 / −666.66 | B→A 666.67, C→A 666.66 |
| fully reimbursed | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | none |
| ₹1,000 + ₹500 | 1,500 / 0 / 0 | 500 each | +1,000 / −500 / −500 | B→A 500, C→A 500 |

## 5. Reconciliation (returned with every result)

| Field | Meaning |
|---|---|
| `status` | `PASS` — balances reconcile, no warnings · `REVIEW` — arithmetic reconciles but warnings need attention · `FAIL` — an internal check failed (a bug) |
| `explanation` | Plain-language reason for the status (names the business-borne amount when there is one) |
| `checks[]` | `NET_POSITIONS_ZERO_SUM`, `SETTLEMENTS_ZERO_SUM`, `RECEIVABLE_EQUALS_PAYABLE`, `FAIR_SHARE_RECONCILES`, `PAID_RECONCILES`, `REIMBURSEMENTS_WITHIN_EXPENSES`, `RECOMMENDATIONS_CLEAR_BALANCES`, each with `ok` and `detail` |
| `sumGrossNetPositionMinor` | Σ (paid − fair share) — **always 0** |
| `businessBorneMinor` | Σ of valid reimbursements: borne by the business, informational, never owed by or to a founder |
| `totalPaidMinor`, `totalFairShareMinor` | Both equal expenses − business-borne − refunds |
| `totalReceivableMinor` / `totalPayableMinor` | After settlements; equal when reconciled |
| `recommendedTotalMinor`, `unresolved*` | Recommendations total; any remainder (0 in practice) |

**Invariant A.** Net positions sum to exactly 0 in *every* scenario, reimbursements included (the earlier "= −external" weakening is gone).

## 6. Settlement algorithm (IA-17)

Input: each founder's signed `outstanding`. Debtors (payers) and creditors (receivers) sorted by amount descending, ties by founder id ascending.

1. **Exact-match pass** — a debtor and a creditor with identical remaining amounts settle with one transfer.
2. **Greedy pass** — largest debtor pays largest creditor `min(c, d)`; one party is exhausted per step.
3. Any remainder on only one side is returned as `unresolved*`, never forced onto someone.

Tested properties: no money created or lost; no transfer exceeds what the payer owes or the receiver is due; at most n − 1 transfers; deterministic and order-independent; applying the recommendations as settlements always yields all-zero outstanding.

## 7. Transaction inclusion

| Status | Counted |
|---|---|
| `approved` (valid, supported type) | **Yes** |
| `draft`, `pending_approval`, `rejected`, `voided` | No — counted in `excluded.byStatus` only |
| approved `other` | No — diagnostic (IA-11) |
| approved but invalid | No — warning (IA-12) |

## 8. API contract (read-only; any signed-in user; empty query string only)

| Endpoint | Returns |
|---|---|
| `GET /api/founders/financial-positions` | `{calculatedAt, currency, positions[], reconciliation, included, excluded, warnings}` |
| `GET /api/founders/:id/financial-position` | `{calculatedAt, currency, position, history[], reconciliation, warnings}` |
| `GET /api/settlements/recommendations` | `{calculatedAt, currency, recommendations[{payer, receiver, amountMinor}], unresolvedPayableMinor, unresolvedReceivableMinor, reconciliation}` |
| `GET /api/settlements/summary` | `{calculatedAt, currency, totals{settledMinor, outstandingPayableMinor, outstandingReceivableMinor, recommendedTransfersMinor, businessBorneMinor}, counts, history[], reconciliation, warnings}` |

`position` includes `expensePaidMinor`, `refundReceivedMinor`, `reimbursedMinor`, `paidMinor`, `fairShareMinor`, `grossNetPositionMinor`, `overSettledMinor`, `outstanding*`. `warnings[]` entries: `{code, level: 'warning' | 'info', transactionId | null, founderId?, message}`. Removed by Option C: `businessFundedShareMinor`, `founderBalanceMinor`, `externalMinor`, `founderBalanceSumMinor`.

Reimbursement endpoints live in [PHASE-2.md](PHASE-2.md) (amended): `reimbursesTransactionId` on create/edit, `GET /api/transactions/reimbursable-expenses?paidByFounderId=…[&forReimbursementId=…]` (picker), expense detail returns `reimbursedMinor`, `remainingReimbursableMinor` and `linkedReimbursements[]`. Errors: `REIMBURSEMENT_EXCEEDS_EXPENSE` (400, with `remainingMinor`), `HAS_LINKED_REIMBURSEMENTS` (409).

## 9. Test strategy

* **Unit** (`calculationEngine`, `settlementAlgorithm`, `accountingReview`): every transaction type, hand-computed expectations, rounding, validity, over-settlement, business-borne amount, diagnostics.
* **Randomized invariants** (`calcInvariants`): hundreds of random scenarios over 4 founders and every type (reimbursements linked to earlier expenses, some over the cap); Σ net = 0 with and without reimbursements; business-borne = Σ valid reimbursements; no money created/lost; excluded statuses change nothing; applying recommendations settles fully.
* **API** (`financials`, `reimbursements`, real MongoDB): authentication, authorization, invalid ids, no data, multiple types, edit/void/settlement reflected immediately, the 25 Option C reimbursement cases (link rules, cap, concurrency, void guard, picker), over-settlement, "Other".
* **Client**: displays server values verbatim (deliberately inconsistent data), names the business-borne amount and every reconciliation status in words, expense picker, server error display, no arithmetic on money values in the financial views.
* **Browser**: `tests/browser/optionc-browser.mjs` end-to-end against Docker at desktop / tablet / mobile with hand-computed expectations and API-equals-display checks. `tests/docker-reimbursement-e2e.sh` runs the same business flow over HTTP.

## 10. Phase 4 consumers

The Phase 4 dashboard reads these results through `GET /api/dashboard` without changing any rule above (see [PHASE-4-DASHBOARD.md](PHASE-4-DASHBOARD.md)). The engine may now be run over transactions dated on or before a period end (`loadCalculation({asOf})`) to present balances "as of" that date; that is a view parameter, not a new accounting rule. KPI definitions that the PDF does not give (Total Investment, Founder Capital, period attribution of reimbursements) are implementation assumptions listed there.
