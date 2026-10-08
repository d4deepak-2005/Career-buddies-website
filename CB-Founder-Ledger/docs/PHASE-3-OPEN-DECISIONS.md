# Phase 3 Open Decisions

Status: **awaiting product-owner decisions.** Nothing in this document changes the calculation engine. The current behaviour is described exactly as implemented (commit `60c43a6`), and **no alternative has been selected**.

Source checked again for this document: the Product Plan PDF text (10 pages) and `docs/PHASE-3-CALCULATION-SPEC.md`. Every quotation below is from the PDF. Section numbers are the PDF's.

Labels are the same as in the spec: **PDF REQUIREMENT**, **INFERRED FROM PDF EXAMPLE**, **IMPLEMENTATION ASSUMPTION**, **PHASE 3 LIMITATION**.

---

## Decision 1: Business-funded reimbursement

### What the PDF explicitly says

* §7, transaction types: **"Reimbursement — Business/founder reimburses a founder who paid a business expense personally."** (**PDF REQUIREMENT** — the definition.)
* §5: Add Transaction can record "expense, investment, founder loan, reimbursement, settlement or other transaction."
* §9, §10: net positions, fair share, receivable/payable and settled/outstanding amounts must be calculated from stored transactions.
* §9 (the illustrative table) implies *Net Position = Paid − Fair Share* (**INFERRED FROM PDF EXAMPLE**).

### What the PDF does NOT say

* Whether a reimbursement is paid **by the business** or **by another founder** ("Business/founder" is not resolved).
* Where **business money comes from**. There is no business account, cash balance or capital pool anywhere in the plan. "Founder Capital" appears only as a dashboard KPI label (§6) and "capital/contribution" in the definition of Founder Contribution (§7).
* **How a reimbursement changes any founder's Paid, Fair Share, Net Position or amount to pay/receive.**
* Whether a reimbursement must be linked to the expense it reimburses.
* Whether the founders collectively owe the business anything after a business reimbursement.

There is **no explicit rule** in the PDF for how a business-funded reimbursement affects founder-to-founder balances.

### Current implementation (commit `60c43a6`)

* **IA-4 (IMPLEMENTATION ASSUMPTION):** a Reimbursement is treated as **business-funded**. It reduces the reimbursed founder's *Paid* by the amount, adds no expense, and changes no one's *Fair Share*. The total of such reimbursements is the **external amount**.
* **IA-5 (IMPLEMENTATION ASSUMPTION):** the external amount is attributed to founders **in proportion to their fair share** (largest-remainder rounding, the same helper Phase 2 uses for splits; if no founder has a positive fair share, to the reimbursed founders themselves). *Founder-to-founder balance = Net Position + that share.*
* Settlement recommendations use **only** the founder-to-founder balance. The external amount is reported separately and is never part of a recommendation.
* Net Position keeps its formula `Paid − Fair Share`.

### Why IA-5 was introduced

The first version of Phase 3 implemented IA-4 only (no attribution). That version left founder balances summing to a non-zero number, and I reproduced two problems:

1. A paid ₹3,000 (equal split) and the business reimbursed A ₹3,000. **All three founders showed "To pay ₹1,000"**, although there was nobody to pay.
2. A paid ₹3,000 and the business reimbursed A ₹1,000. B and C were in identical positions, but the recommendation made B pay A ₹1,000 and left C's identical ₹1,000 "unresolved". **Which founder was settled depended only on the id tie-break.**

A rule for how the business-funded amount reaches each founder is therefore *unavoidable* once business-funded reimbursements are supported. The PDF supplies none, so IA-5 was chosen as the most neutral option and was labelled an assumption. It is isolated in one block of `server/src/domain/calculationEngine.ts`.

### Exact financial effect of IA-5

Example (all amounts in ₹; verified against the current engine):

> A pays ₹3,000. Equal split among A, B, C (₹1,000 each). The business reimburses A ₹1,000.

| | A | B | C | Sum |
|---|---:|---:|---:|---:|
| Paid (after reimbursement) | 2,000.00 | 0.00 | 0.00 | 2,000.00 |
| Fair share | 1,000.00 | 1,000.00 | 1,000.00 | 3,000.00 |
| **Net position (Paid − Fair share)** | **+1,000.00** | **−1,000.00** | **−1,000.00** | **−1,000.00** |
| Business-funded (external) share, IA-5 | 333.34 | 333.33 | 333.33 | 1,000.00 |
| **Founder-to-founder balance** | **+1,333.34** | **−666.67** | **−666.67** | **0.00** |
| Recommended payments | receives | pays A 666.67 | pays A 666.67 | |

External amount reported: **₹1,000.00** (not owed to or by any founder). Reconciliation: *Balanced, with an external amount*.

For comparison, with **no** reimbursement the same expense gives A +2,000.00, B −1,000.00, C −1,000.00 (B and C each pay A 1,000.00).

**A case where the choice matters** (verified against the current engine):

> E1: ₹3,000 paid by A, A's own cost only (split: A 100%). E2: ₹3,000 paid by B, equal split. The business reimburses A ₹1,000.

| Founder-to-founder balance | A | B | C |
|---|---:|---:|---:|
| No reimbursement | −1,000.00 | +2,000.00 | −1,000.00 |
| **Current (IA-5, pro-rata by fair share 4,000 : 1,000 : 1,000)** | **−1,333.33** | **+2,166.67** | **−833.34** |
| If the reimbursement is understood as covering only A's own E1 cost | −1,000.00 | +2,000.00 | −1,000.00 |

In this example IA-5 moves about **₹333** between founders compared with that reading. Neither is "wrong" according to the PDF, because the PDF does not say.

### Alternative accounting treatments (none selected)

| # | Treatment | Effect on the first example (A, B, C) | Risks |
|---|---|---|---|
| **A** | **Current (IA-5):** attribute the business-funded amount to founders in proportion to fair share. | +1,333.34 / −666.67 / −666.67 | Attribution is not in the PDF. Founders are treated as jointly responsible for business-funded amounts regardless of which expense was reimbursed (see the second example). |
| **B** | **Attribute the business-funded amount to the reimbursed founder only** (the reimbursement is treated as covering that founder's own responsibility). | +2,000.00 / −1,000.00 / −1,000.00 (same founder-to-founder amounts as "no reimbursement"; the external amount is still reported) | Business money benefits only the reimbursed founder. If the reimbursement exceeds that founder's own share, the rest has no natural owner. Not in the PDF. |
| **C** | **Link each reimbursement to the expense it reimburses** and reduce that expense's split proportionally. | ≈ +1,333.33 / −666.67 / −666.66 here: the same as A to within ₹0.01 of rounding in this single-expense example, but **different** from A when several expenses with different splits exist (see the second example) | Needs a **new field and a Phase 2 change** (a reimbursement would need an expense reference and validation). The PDF does not require linking. Unlinked history cannot be converted. |
| **D** | **External only, no attribution** (the first version of Phase 3). | +1,000.00 / −1,000.00 / −1,000.00; sum −1,000.00; recommendations are arbitrary (see above) | Misleading "To pay" for founders with no counterparty; tie-break-dependent recommendations. **Demonstrably unsafe** without some attribution rule. |
| **E** | **Model a business capital pool / account** as a party; reimbursements are paid from the pool. | Depends on pool rules (e.g. whether the pool is owed back by founders) | The PDF defines no pool. It is a large new accounting module (contributions, balance, who funds it) and was explicitly out of scope for Phase 3. |
| **F** | **Do not count business reimbursements in balances** (informational only, like "Other"); founder-to-founder repayments are entered as Settlements. | +2,000.00 / −1,000.00 / −1,000.00 | A is paid ₹1,000 by the business **and** ₹2,000 by B and C for the same expense, so the business's payment is effectively ignored. This is the **double-count the reimbursement rule was meant to avoid**. |

(There may be other treatments; the list is not exhaustive.)

### Decision required from the product owner

Please decide, in your own words:

1. **When the business reimburses a founder, how should that affect what the founders owe each other?** (One of A–F above, or another rule.)
2. **Must a reimbursement be linked to the specific expense it reimburses?** (If yes, this is a Phase 2 data change.)
3. **Where does business money come from?** (Is a business account / capital pool wanted, now or later? See Decision 3.)

Until this is decided, the engine keeps behaviour **A**, clearly labelled as an assumption in the spec and surfaced in the UI as an "external" amount.

---

## Decision 2: Founder-to-founder reimbursement

**What the PDF says.** §7: Reimbursement — "Business/founder reimburses a founder who paid a business expense personally." Settlement — "One founder pays another to settle an outstanding balance."

**What the PDF does not say.** Which of these two types to use when *one founder repays another* for an expense the second founder paid personally. Read literally, that case fits **both** definitions ("founder reimburses a founder" and "one founder pays another").

**Current implementation (IMPLEMENTATION ASSUMPTION).** The Reimbursement transaction stores **no reimbursing party** (only the founder being reimbursed), so it cannot represent a founder as the payer. A founder-to-founder payment is therefore entered as a **Settlement** (payer, receiver, amount, date, optional method). The spec states this (IA-4).

**Honest caveat.** The PDF does *not* say a founder-to-founder reimbursement "should" be a Settlement. The statement "founder-to-founder repayments are Settlements" is a **decision taken for Phase 3**, not a PDF rule. It remains in force unless the product owner decides otherwise.

**Decision required:** confirm that founder-to-founder repayment is entered as a **Settlement**, *or* specify that Reimbursement must also be able to record a reimbursing founder (a Phase 2 data change).

---

## Decision 3: Capital pool

**What the PDF says.** Founder Contribution is "personal money into the business as capital/contribution" (§7); the dashboard has a "Founder Capital" KPI card (§6); transactions should keep "business spending … not confused with founder capital" (§7).

**What the PDF does not say.** How capital is held, whether a business account/pool has a balance, how business expenses draw on it, or whether founders owe the business anything.

**Current implementation (PHASE 3 LIMITATION).** **Phase 3 does not model a business capital pool or business account.** A contribution is reported as `contributionMinor` only, and is never part of Paid, Fair Share, Net Position or a settlement. The only trace of "business money" is the explicit **external amount** from business-funded reimbursements (Decision 1).

**Decision required:** confirm that no capital pool is wanted for Phase 3. If one is wanted, it should be specified (contributions in, expenses/reimbursements out, treatment of the balance) as its own phase of work.

---

## Decision 4: Loan repayment

**What the PDF says.** Founder Loan — "Founder lends money to the business and **expects repayment**" (§7). The founder ledger shows "Founder loan **outstanding**" (§10).

**What the PDF does not say.** What a repayment *is* (a transaction type? a settlement? from whom?), whether it is partial, or how it reduces the outstanding amount.

**Current implementation (PHASE 3 LIMITATION).** **Loan repayment is not modelled**, because the PDF defines no repayment record or mechanism. `loanOutstandingMinor` is the sum of approved loan **principal**. Loan principal never enters fair share, paid, net position or any settlement (verified by tests).

**Decision required:** confirm that repayment stays out of Phase 3, and specify the repayment mechanism (type, payer, effect on "outstanding") before it is built.

---

## Decision 5: Refund linking

**What the PDF says.** Refund — "Money returned from a vendor or expense" (§7).

**What the PDF does not say.** That a refund must reference a specific original expense, or that a refund may not exceed it. The phrase "from … expense" is the only hint of a relationship and is not a requirement.

**Current implementation (IMPLEMENTATION ASSUMPTION + PHASE 3 LIMITATION).** A refund is **not linked** to a specific expense. It is a separate approved transaction with the founder who received the money and a split of the refunded cost. The original expense is never edited. Because there is no link, an over-large refund can only be **flagged globally** (`REFUNDS_EXCEED_EXPENSES`, `NEGATIVE_FAIR_SHARE`), not prevented.

**Decision required:** confirm that unlinked refunds are acceptable, *or* require linking a refund to its expense (a Phase 2 data change that would also allow rejecting a refund larger than the expense).

---

## Summary table

| # | Topic | PDF explicit rule? | Current treatment | Label |
|---|---|---|---|---|
| 1 | Business-funded reimbursement → founder balances | **No** | External amount + pro-rata attribution (IA-4, IA-5) | IMPLEMENTATION ASSUMPTION |
| 2 | Founder-to-founder reimbursement | **No** (both definitions could apply) | Entered as Settlement | IMPLEMENTATION ASSUMPTION |
| 3 | Capital pool | **No** | Not modelled | PHASE 3 LIMITATION |
| 4 | Loan repayment | **No** | Not modelled | PHASE 3 LIMITATION |
| 5 | Refund ↔ expense link | **No** | Not linked | IMPLEMENTATION ASSUMPTION / PHASE 3 LIMITATION |
