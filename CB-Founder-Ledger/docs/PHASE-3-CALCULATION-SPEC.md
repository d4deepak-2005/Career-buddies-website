# Phase 3 — Calculation Specification

Scope (product plan §21): *fair share, founder balances, net positions and settlement calculations.*

This note separates three kinds of statement. **Do not read B or C as "the PDF says so".**

* **A — Stated explicitly by the PDF** (quoted or closely paraphrased, with section).
* **B — Directly implied by the PDF's worked example** (§9 table, §20 example).
* **C — Implementation assumptions** the PDF does not specify. These are decisions I took so the engine is well-defined. They need confirmation by the founders / product owner.

> **Phase 4+ is not built.** No dashboard KPIs or charts, no approval workflow or approve/reject UI, no recurring expenses, no reports, no hardening or launch work. The only UI added is a minimal Founders / Founder-ledger / Settlements view that *displays* numbers returned by the server.

---

## 1. Audit of the Phase 2 model (what the engine reads)

| Item | Phase 2 reality |
|---|---|
| Types | `business_expense`, `founder_contribution`, `founder_loan`, `reimbursement`, `settlement`, `refund`, `other` |
| Statuses | `draft`, `pending_approval`, `approved`, `rejected`, `voided` |
| Split | embedded on the transaction: definition + `allocatedMinor` per founder, resolved by `domain/splits.ts`, `Σ allocatedMinor === amountMinor` |
| `paidByFounderId` | business_expense: payer · contribution/loan: the founder who put money in · reimbursement: the founder being reimbursed · settlement: payer · refund: (Phase 2: optional) |
| `counterpartyFounderId` | settlement receiver only |
| Amount | integer minor units |
| Void | status `voided`, record kept, reason + actor stored |
| Reachability | `approved` / `rejected` cannot be reached through the API until Phase 5. Tests set `approved` with a raw DB write. **Authorization was not weakened.** |

**Gaps found in the audit and the Phase 3 changes they forced** (all minimal, all documented):

1. *Refund* allowed no payee and no split, so its effect on fair share and paid could not be computed. **Change:** Refund now requires `paidBy` (the founder who received the returned money) and a split (how the refunded cost is shared back). Existing refunds that lack them are reported as warnings and excluded rather than guessed at.
2. *Settlement* had no `method` (PDF §17 lists "payer, receiver, amount, status, date and method"). **Change:** optional `method` field (≤50 chars), allowed for settlements only. It is optional because the PDF lists it but does not say it is mandatory.
3. *Reimbursement* carries no link to the expense it reimburses and no "who reimbursed". Left as is; the treatment is an assumption (C-4).
4. The PDF lists both a *Settlement transaction type* (§7) and a `settlements` *collection* (§17). Keeping both would double-count payments. **Decision (C-1):** the settlement transaction **is** the settlement record; there is no second collection.

**Existing logic reused, not duplicated:** the engine reads the stored `allocatedMinor` produced by `domain/splits.ts`. It never re-resolves a split. Rounding in Phase 3 (the settlement algorithm) uses integer arithmetic only.

---

## 2. A — Rules stated explicitly by the PDF

| # | Statement | Where |
|---|---|---|
| A1 | Amount change → calculations change automatically → balances → settlements → charts/reports. | §1, §8, §20 |
| A2 | Calculate each founder's **fair share**; show who owes whom. | §1 |
| A3 | The system should calculate **net positions** and recommend the **simplest settlement path**. | §9 |
| A4 | Founder ledger shows: total amount paid; founder contribution; founder loan outstanding; fair share of expenses; amount receivable; amount payable; settled amount; outstanding amount; complete transaction history. | §10 |
| A5 | **Approved** transactions affect official calculations. **Rejected** transactions do not affect official totals. | §11 |
| A6 | Approved transactions are not silently deleted; reversal/void with audit history. | §11 |
| A7 | Calculations must come from stored data; the §9 figures are illustrative; **no hard-coded financial calculations in the frontend**. | §6, §9, §18 |
| A8 | One **centralized calculation/business-logic layer** used by dashboard, ledger, settlements and reports. | §20 |
| A9 | MongoDB is the source of truth; calculations are in the backend. | §26 |
| A10 | Type meanings: *Founder Contribution* — founder puts personal money into the business as capital; *Founder Loan* — founder lends money and expects repayment; *Reimbursement* — business/founder reimburses a founder who paid a business expense personally; *Settlement* — one founder pays another to settle an outstanding balance; *Refund* — money returned from a vendor or expense. | §7 |
| A11 | Split methods (equal, percentage, exact, shares, custom) define each founder's responsibility for a transaction. | §8 |
| A12 | The "Pending Approval" status exists; large expenses may need two approvals (Phase 5). | §11 |

## 3. B — Rules directly implied by the PDF's example

| # | Rule | Evidence |
|---|---|---|
| B1 | **Net position = Paid − Fair share.** | §9 table: 80,000 − 61,667 = +18,333; 65,000 − 61,667 = +3,333; 55,000 − 61,667 = −6,667 (all three rows check out) |
| B2 | Positive net position → **Receive**; negative → **Pay**. | same table |
| B3 | Fair share for an equal split is amount ÷ number of selected founders. | §20: 30,000 ÷ 3 = 10,000 each → 45,000 gives 15,000 |
| B4 | Positive = receivable and negative = payable are shown distinctly. | §19 |

**The §9 example does not reconcile as a whole**: paid totals 200,000 while the three fair shares total 185,001 (3 × 61,667), so the net positions sum to +15,000, not 0. The PDF marks the figures as illustrative, so I treat them as showing the *formula*, not a data set. The engine is tested on internally consistent data and the discrepancy is **not** reproduced. (If the paid total includes spending that is not split among the three founders, that would explain it, but the PDF does not say.)

## 4. C — Implementation assumptions (need confirmation)

| # | Assumption | Why it was necessary |
|---|---|---|
| **C-1** | A `settlement` transaction is the settlement record (payer = `paidBy`, receiver = `counterparty`, amount, status, date, optional method). There is no separate `settlements` collection. | PDF lists both; two sources would double-count. |
| **C-2** | **Official = status `approved` only.** `draft`, `pending_approval`, `rejected`, `voided` never affect any figure. | A5 covers approved/rejected; draft/pending/voided exclusion is implied by "approved transactions affect official calculations" and A6. |
| **C-3** | Business-expense payer: `paidBy` paid the full `amountMinor`; each split founder bears their stored `allocatedMinor`. | PDF defines splits (A11) but not how they feed paid/fair share beyond B1/B3. |
| **C-4** | **Reimbursement** of founder P by amount R is business-funded: it **reduces P's net-paid by R**, does **not** add an expense and does **not** change anyone's fair share. The underlying expense stays counted once (in P's paid and in the split), and the reimbursement offsets P's out-of-pocket. Because the money came from the business rather than another founder, founders' positions then sum to **−R** instead of 0. That remainder is reported as `unallocatedMinor` ("owed to / funded by the business"). | A10 says "business/founder" without saying which; Phase 2 stores no payer for a reimbursement. If a *founder* reimbursed another founder, that is a **Settlement**. |
| **C-5** | **Refund** of amount F received by founder P (stored as `paidBy`) with split S: **reduces P's net-paid by F** and **reduces each founder's fair share by their allocation in S**. The original expense is not edited, and the refund is not a negative "payment" by anyone else. Net effect is zero-sum like an expense. | A10 gives only the definition; Phase 2 stores no link to the original expense. |
| **C-6** | **Founder contribution** is shown as `contributionMinor` only. It is **not** added to paid, fair share or net position. | A10/A4 list it as a separate ledger metric. |
| **C-7** | **Founder loan:** `loanOutstandingMinor` = sum of approved loan principal. It is separate from expenses/fair share. **Repayment is not modelled** (no repayment type exists in the PDF), so outstanding = principal until a later phase defines repayment. | A10 says "expects repayment" but defines no repayment record. |
| **C-8** | **Settlement of S from payer X to receiver Y:** `settledPaid(X) += S`, `settledReceived(Y) += S`; outstanding(f) = grossNet(f) + settledPaid(f) − settledReceived(f). It never changes paid, fair share or contribution, so a settlement cannot be mistaken for an expense and cannot loop. Over-settlement is allowed and simply flips the sign. | A3/A10 define the purpose only. |
| **C-9** | **`other` transactions are excluded** from all figures and counted in `excluded.unclassifiedOther`. | The PDF gives no accounting meaning for "Other" beyond "controlled fallback with mandatory notes". |
| **C-10** | **Invalid official records are excluded with a warning**, never guessed at: non-positive / non-integer amount, split not summing to the amount, unknown founder, settlement with payer = receiver, refund or expense missing payer/split. | Production data may predate a rule; silent repair would be inventing numbers. |
| **C-11** | Founders list = every founder profile (active or not). | Inactive founders can still hold outstanding balances. |
| **C-12** | All founders and admins can read all positions (same as transactions, Phase 2 A8). | PDF §9 has no per-founder privacy rule. |
| **C-13** | No stored/cached results; everything is recomputed from the database on every request. | Avoids stale numbers (A1, A7). |

---

## 5. Transaction inclusion / exclusion

| Status | Counted? |
|---|---|
| `approved` | **Yes** (if valid and of a supported type) |
| `draft`, `pending_approval` | No |
| `rejected` | No (A5) |
| `voided` | No |

Within `approved`: `other` is excluded (C-9); invalid records are excluded with a warning (C-10). Excluded transactions are *counted* (`excluded.byStatus`, `unclassifiedOther`, `invalid`) but their amounts are never summed or exposed as totals.

## 6. Formulas (all integers, minor units)

For founder *f*, over official, valid transactions:

```
expensePaid(f)       = Σ amount            of business_expense where paidBy = f
refundReceived(f)    = Σ amount            of refund            where paidBy = f
reimbursed(f)        = Σ amount            of reimbursement     where paidBy = f
paid(f)              = expensePaid(f) − refundReceived(f) − reimbursed(f)         # "Paid"

fairShare(f)         = Σ allocatedMinor(f) over business_expense splits
                     − Σ allocatedMinor(f) over refund splits                      # "Fair share"

contribution(f)      = Σ amount of founder_contribution paidBy = f
loanOutstanding(f)   = Σ amount of founder_loan         paidBy = f   (no repayment model, C-7)

grossNet(f)          = paid(f) − fairShare(f)                                      # B1
settledPaid(f)       = Σ amount of settlement where paidBy = f
settledReceived(f)   = Σ amount of settlement where counterparty = f
outstanding(f)       = grossNet(f) + settledPaid(f) − settledReceived(f)           # signed

outstandingReceivable(f) = max(outstanding, 0)    action = "receive"   (B2)
outstandingPayable(f)    = max(−outstanding, 0)   action = "pay"
outstanding = 0                                   action = "settled"
```

`settlementStatus`: `settled` (outstanding = 0), `partially_settled` (outstanding ≠ 0 and the founder has settlement activity), `open` (no settlement activity).

**Reconciliation** (returned with every result):

* Σ grossNet = −Σ reimbursed = `unallocatedMinor` (≤ 0). It is **0 whenever no reimbursement exists**, which is the "sum of net positions = 0" invariant; reimbursements are the documented exception (C-4).
* Σ outstanding = Σ grossNet (settlements are zero-sum transfers).
* Σ outstandingReceivable − Σ outstandingPayable = Σ outstanding.

**Rounding.** Phase 3 introduces no new division of money. Fair shares come from the stored largest-remainder allocations (Phase 2: ties go to earlier entries, parts always sum to the amount exactly). The §9 example's "61,667" is exactly such a rounding. All sums use safe integers and throw on overflow. No floating point is used anywhere.

## 7. Settlement recommendation algorithm

Input: each founder's signed `outstanding`. Payers are negative, receivers positive.

1. Split into debtors (amount = −outstanding) and creditors, each sorted by amount **descending**, ties by founder id **ascending** (deterministic).
2. **Exact-match pass:** for each debtor in order, if some remaining creditor has exactly the same remaining amount, emit one transfer and remove both.
3. **Greedy pass:** repeat — take the largest remaining creditor and largest remaining debtor, transfer `min(c, d)`, subtract; at least one party is exhausted per step.
4. Whatever remains on only one side (possible only when `unallocatedMinor ≠ 0`) is returned as `unresolvedPayable` / `unresolvedReceivable` — **never** forced onto another founder.

Properties (all tested): money is neither created nor lost; no transfer exceeds what its payer owes or its receiver should get; Σ transfers ≤ min(Σ payable, Σ receivable) and equals both when positions sum to 0; at most *n − 1* transfers for *n* non-zero founders; identical input → identical output. Finding the true minimum number of transfers is NP-hard (it is a subset-sum partition problem); this heuristic is "simplest practical", as the task allows, and is optimal for 2 parties and for exact pairs.

Recommendations are *suggestions only*. They are not stored. A settlement is recorded by creating a `settlement` transaction; once approved (Phase 5), the recommendations shrink automatically.

## 8. API contract (all authenticated; read-only; query strings must be empty)

| Endpoint | Returns |
|---|---|
| `GET /api/founders/financial-positions` | `{calculatedAt, currency, positions[], reconciliation, excluded, warnings}` |
| `GET /api/founders/:id/financial-position` | `{calculatedAt, currency, position, history[], reconciliation, warnings}` (404 for unknown founder, 400 for a malformed id) |
| `GET /api/settlements/recommendations` | `{calculatedAt, currency, recommendations[{payer, receiver, amountMinor}], unresolvedPayableMinor, unresolvedReceivableMinor, reconciliation}` |
| `GET /api/settlements/summary` | `{calculatedAt, currency, totals, counts, history[], reconciliation, warnings}` |

`position` = `FounderFinancialPosition`:
`founderId, founderName, active, expensePaidMinor, refundReceivedMinor, reimbursedMinor, paidMinor, contributionMinor, loanOutstandingMinor, fairShareMinor, grossNetPositionMinor, settledPaidMinor, settledReceivedMinor, outstandingMinor, outstandingReceivableMinor, outstandingPayableMinor, action, settlementStatus`.

`history[]` = every transaction that involves the founder (any status) with `counted` (official?) and the `effects` it contributed. The server never accepts financial values from the client: there are no write endpoints and unknown query parameters are rejected.

## 9. Test strategy

* **Unit (pure, no DB):** every item in the Phase 3 brief against `calculationEngine.ts` and `settlementAlgorithm.ts`, including seeded random property tests of the invariants.
* **API (real MongoDB):** authentication, authorisation, invalid ids, empty data, multi-transaction data, edit / void / settlement reflected immediately.
* **Invariants (A–G in the brief):** run against random scenarios and against the live API; the client test renders deliberately *inconsistent* server numbers and asserts the UI shows the server's values (no client arithmetic).
* **Fixtures:** `approved` is set with a raw database write inside isolated tests (Phase 5 owns approval). No financial rows are left behind.

## 10. Known limitations

1. Nothing can become `approved` through the app until Phase 5, so in a real deployment the engine currently reports zeros until approvals exist. This is by design.
2. Business funds are not modelled (no capital pool / business account). Reimbursements surface the difference as `unallocatedMinor`; contributions are informational (C-4, C-6).
3. Loan repayment is not modelled (C-7). `other` is excluded (C-9). Refunds and reimbursements are not linked to specific expenses (C-4, C-5).
4. The settlement heuristic is not guaranteed to use the minimum possible number of transfers (§7).
5. Calculations are recomputed per request; fine at founder-ledger scale, not cached.
6. Recording a settlement is done through *Add Transaction* (type Settlement); a dedicated mark-as-settled flow belongs to later phases.
7. There is no "as of date" filter yet (reports, Phase 7).
