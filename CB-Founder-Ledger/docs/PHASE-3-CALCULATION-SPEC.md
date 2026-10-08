# Phase 3 — Calculation Specification (accounting review revision)

Scope (product plan §21): *fair share, founder balances, net positions and settlement calculations.*

Every rule in this document carries **exactly one** of four labels. They are not interchangeable:

| Label | Meaning |
|---|---|
| **PDF REQUIREMENT** | The Product Plan PDF states it (section cited). |
| **INFERRED FROM PDF EXAMPLE** | Not stated as a rule; it is what the PDF's worked example implies. |
| **IMPLEMENTATION ASSUMPTION** | The PDF is silent. A decision was needed to make the engine well-defined. Needs product-owner confirmation. |
| **PHASE 3 LIMITATION** | Something the system deliberately does *not* model yet. |

> **Phase 4+ is not built.** No dashboard KPIs/charts, approval workflow or approve/reject UI, recurring expenses, reports, hardening or launch work.

---

## 1. What changed in this review

An accounting review of the first Phase 3 version found one real flaw and several unclear statements.

**Flaw (reproduced, then fixed): reimbursements made founder balances misleading.** The first version offset the reimbursed founder's *paid* amount and left the rest as a leftover, so founders' net positions no longer summed to zero. Two demonstrated symptoms:

* A paid a 3,000 expense shared equally; the business reimbursed A 3,000. All three founders showed **"To pay 1,000"**, although there is nobody to pay.
* A paid 3,000; the business reimbursed A 1,000. B and C are in *identical* positions, yet the recommendation made B pay A 1,000 and left C's identical 1,000 "unresolved". Which of the two was settled depended only on the tie-break by id: **arbitrary**.

**Fix:** the engine now keeps two layers apart.

1. **Founder-to-founder balance** — what founders owe *each other*. Always sums to exactly 0. Settlement recommendations use only this layer.
2. **External (business-funded) amount** — money paid from business funds (reimbursements). Reported explicitly, never owed to or by a founder, never part of a payment between founders.

Other changes: an explicit over-settlement flag; refund diagnostics; "Other" clarified as diagnostics-only; a stronger reconciliation block with a named status and per-check results. **Net position is unchanged** (`paid − fair share`).

No fake founder and no capital pool was introduced.

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
| IA-4 | **Reimbursement is business-funded.** It reduces the reimbursed founder's *paid* by the amount, adds **no** expense and changes **no** fair share, so the expense is counted once. The business-funded total is the **external amount**. | PDF-6 says "business/founder" without saying which; Phase 2 stores no reimbursing party. A *founder* reimbursing another founder is a **Settlement**. |
| IA-5 | **Attribution of the external amount.** To keep founder-to-founder balances zero-sum, the external total *R* is attributed to founders **in proportion to their fair share** (largest-remainder rounding, the Phase 2 helper; if no founder has a positive fair share, to the reimbursed founders themselves). Founder-to-founder balance = net position + that share. This equals "each founder's fair share of the amount the founders themselves funded". | Without an attribution the recommendation is arbitrary (§1). Pro-rata is the neutral choice; it is isolated in one block of `calculationEngine.ts` and easy to change. |
| IA-6 | **Refund** of F received by founder P with split S: reduces P's *paid* by F and each split founder's *fair share* by their allocation. The original expense is never edited and keeps its own effects. Phase 2 now requires a refund to have the receiving founder and a split. | PDF-6 gives only the definition; no link to an original expense exists. |
| IA-7 | **Contribution** is reported as `contributionMinor` only. It is not in paid, fair share, net position or any settlement. | PDF-5/PDF-6 list it as a separate metric; mixing capital with expense responsibility is explicitly avoided. |
| IA-8 | **Loan principal** is reported as `loanOutstandingMinor` only (sum of approved loan principal). It is never in paid, fair share, net position or settlement. | PDF-5 lists "founder loan outstanding". |
| IA-9 | **Settlement mechanics.** Payer: `settledPaid += S`; receiver: `settledReceived += S`; outstanding = founder-to-founder balance + settledPaid − settledReceived. Settlements never touch paid, fair share, contribution or loan, so a settlement is never an expense and cannot loop. | PDF-6 defines purpose only. |
| IA-10 | **Over-settlement is allowed and explicit.** If settlements move a founder past zero (they paid or received more than was due), `overSettledMinor` is set, an `OVER_SETTLED` warning is raised and reconciliation status becomes `REVIEW`. The sign is never hidden or clamped. | A payment cannot be rejected after the fact; hiding it would misstate balances. |
| IA-11 | **`Other` transactions are diagnostics only.** Each approved `Other` is reported once as an `info` diagnostic (`OTHER_NOT_CALCULATED`) and counted in `excluded.unclassifiedOther`. **That count is not a financial total**; their amounts are never summed, never in any figure, and never affect reconciliation status. | PDF §7 gives "Other" no accounting meaning (only "controlled fallback with mandatory notes"). |
| IA-12 | **Invalid approved transactions are excluded and reported, never repaired.** Invalid = non-positive/non-integer amount, split not summing to the amount, unknown/duplicate founder in a split, missing paid-by, settlement with equal or unknown parties. Each yields a `warning` with the transaction id. Status becomes `REVIEW`. | Data may predate a rule; guessing would invent numbers. |
| IA-13 | **Diagnostics that do not exclude anything** (the records are valid but look inconsistent): `REFUNDS_EXCEED_EXPENSES`, `NEGATIVE_FAIR_SHARE` (a founder's refunds exceed their share; the value is **kept**, not clamped, so zero-sum holds), `REIMBURSEMENTS_EXCEED_EXPENSES`, `REIMBURSED_MORE_THAN_PAID`, `OVER_SETTLED`. | Cannot be prevented without a link between a refund/reimbursement and an expense (L-3). |
| IA-14 | Every founder profile is listed (active or not); inactive founders keep their balances. | A leaver can still owe or be owed. |
| IA-15 | All signed-in founders and admins can read all figures and all diagnostics. | Same visibility as the transactions themselves (Phase 2 A8). |
| IA-16 | Everything is recomputed from the database on each request; no cache. | PDF-3: never stale. |
| IA-17 | **Settlement algorithm:** exact-match pass, then greedy largest-debtor → largest-creditor, deterministic tie-breaks (§7). | PDF-4 asks for the "simplest" path; true minimum is NP-hard. |

### 2.4 PHASE 3 LIMITATION

| ID | Limitation |
|---|---|
| L-1 | **No business capital pool or business account is modelled.** Contributions are informational (IA-7). The external amount is shown, not tied to a pool. |
| L-2 | **Loan repayment is not modelled** (the PDF defines no repayment record). Outstanding = principal. |
| L-3 | Refunds and reimbursements are **not linked** to a specific expense, so over-refunding / over-reimbursing can only be flagged globally (IA-13), not prevented. |
| L-4 | Nothing can become **approved** through the app until Phase 5, so a real deployment reads zero until then. Tests approve with a controlled database write; authorization was not weakened. |
| L-5 | The settlement path is not guaranteed to use the minimum number of transfers. |
| L-6 | The business-funded attribution (IA-5) is pro-rata by fair share; another policy (e.g. only to the payer) would give different founder-to-founder amounts. |
| L-7 | A settlement's `method` is free text (≤50 chars). There is no dedicated mark-as-settled workflow yet. |
| L-8 | No "as of date" filter, caching, or per-period views (reports, Phase 7). |

---

## 3. Review decisions (what was asked, what was decided)

| Topic | Decision |
|---|---|
| **Reimbursement** | Internally inconsistent before (§1). Now: external amount + founder-to-founder balance (IA-4, IA-5). No fake founder, no capital pool. Net position keeps its formula; the split into "between founders" and "external" is shown in the API and UI. |
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
expensePaid(f)     = Σ amount of business_expense  paidBy = f
refundReceived(f)  = Σ amount of refund            paidBy = f
reimbursed(f)      = Σ amount of reimbursement     paidBy = f
paid(f)            = expensePaid − refundReceived − reimbursed                  # "Paid"
fairShare(f)       = Σ allocated(f) over expense splits − Σ allocated(f) over refund splits

net(f)             = paid(f) − fairShare(f)                                     # INF-1 (includes any business-funded effect)

R                  = Σ_f reimbursed(f)                                          # EXTERNAL amount
businessFundedShare(f) = allocate(R, weights = fairShare(f) if > 0)             # Σ = R exactly (IA-5)
founderBalance(f)  = net(f) + businessFundedShare(f)                            # Σ_f = 0, always

settledPaid(f), settledReceived(f) = Σ settlements paid / received by f
outstanding(f)     = founderBalance(f) + settledPaid(f) − settledReceived(f)    # signed; Σ_f = 0
receivable = max(outstanding, 0)   payable = max(−outstanding, 0)
action = receive | pay | settled          (from outstanding; INF-2)

overSettled(f)     = amount by which settlements moved f past zero (IA-10), else 0
contribution(f), loanOutstanding(f)  — separate metrics only (IA-7, IA-8)
```

## 5. Reconciliation (returned with every result)

Separates the two layers:

| Field | Meaning |
|---|---|
| `status` | `PASS` — balances reconcile, no external amount, no warnings · `PASS_WITH_EXTERNAL` — balances reconcile; an external amount exists and is explained · `REVIEW` — arithmetic reconciles but warnings need attention · `FAIL` — an internal check failed (a bug) |
| `explanation` | Plain-language reason for the status |
| `checks[]` | `FOUNDER_BALANCES_ZERO_SUM`, `SETTLEMENTS_ZERO_SUM`, `RECEIVABLE_EQUALS_PAYABLE`, `EXTERNAL_RECONCILES`, `FAIR_SHARE_RECONCILES`, `PAID_RECONCILES`, `RECOMMENDATIONS_CLEAR_BALANCES`, each with `ok` and `detail` |
| `sumGrossNetPositionMinor` | Σ (paid − fair share) = **−externalMinor** |
| `externalMinor` | Business-funded amount: never owed to or by a founder; never in a recommendation |
| `founderBalanceSumMinor` | Always 0 |
| `totalReceivableMinor` / `totalPayableMinor` | Founder-to-founder, after settlements; equal when reconciled |
| `recommendedTotalMinor`, `unresolved*` | Recommendations total; any remainder (0 in practice) |

**Invariant A (strengthened, not weakened).** Founder-to-founder balances sum to exactly 0 in *every* scenario, reimbursements included. The only quantity that is not zero-sum is the explicitly reported external amount: Σ(paid − fair share) = −external.

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
| `GET /api/settlements/summary` | `{calculatedAt, currency, totals{settledMinor, outstandingPayableMinor, outstandingReceivableMinor, recommendedTransfersMinor, externalMinor}, counts, history[], reconciliation, warnings}` |

`position` adds, in this revision: `businessFundedShareMinor`, `founderBalanceMinor`, `overSettledMinor`. `warnings[]` entries: `{code, level: 'warning' | 'info', transactionId | null, founderId?, message}`. The reconciliation field `unallocatedMinor` was replaced by `externalMinor` and `sumGrossNetPositionMinor`.

## 9. Test strategy

* **Unit** (`calculationEngine`, `settlementAlgorithm`, `accountingReview`): every transaction type, hand-computed expectations, rounding, validity, over-settlement, external amount, diagnostics.
* **Randomized invariants** (`calcInvariants`): hundreds of random scenarios over 4 founders and every type; founder-to-founder zero-sum with and without reimbursements; external = Σ reimbursed; no money created/lost; excluded statuses change nothing; applying recommendations settles fully.
* **API** (`financials`, real MongoDB): authentication, authorization, invalid ids, no data, multiple types, edit/void/settlement reflected immediately, external amount, over-settlement, "Other".
* **Client**: displays server values verbatim (deliberately inconsistent data), names the external amount and every reconciliation status in words, no arithmetic on money values in the financial views.
* **Browser**: end-to-end against Docker with hand-computed expectations.
