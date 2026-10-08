# Phase 4 — Dashboard (specification and decisions)

The Dashboard is a **read-only presentation layer** over the verified Phase 3 engine. The backend remains the single source of truth; React formats and draws what `GET /api/dashboard` returns and never computes a financial figure.

Labels used below: **PRODUCT PLAN** (stated in the PDF) · **PHASE 3 RULE** (already approved and unchanged, including Option C) · **IMPLEMENTATION ASSUMPTION** (the PDF is silent; needs product-owner confirmation) · **UI DECISION** (presentation only, no accounting effect) · **LIMITATION**.

## 1. Product Plan requirements used

| Requirement (PDF) | Where | Delivered |
|---|---|---|
| KPI cards: Total Investment, Total Business Expenses, Outstanding Settlements, Founder Capital | §6 | 4 KPI cards + a strip of 4 supporting figures |
| Founder contribution bar chart | §6 | `ContributionBars` |
| Expense-by-category donut/pie | §6 | `CategoryDonut` |
| Monthly expense and investment line chart | §6 | `MonthlyLines` |
| Founder cards: Invested, Fair Share, Net Position, To Pay/To Receive | §6 | Founder cards (engine values) |
| Recent transactions table | §6 | table ≥ md, card list on small screens |
| Settlement summary with direct Settle action | §6 | recommendations + **Settle** button |
| Date/month filters and founder/category filters | §6 | period presets + custom from/to, founder, category |
| All numbers calculated from the database | §6, §18 | single server endpoint; no client totals |
| Phase 4 = "KPIs, pie chart, bar charts, line charts and recent transactions" | §21 | yes |
| Charts: Recharts or Chart.js (recommended) | §16 | **UI DECISION:** hand-drawn accessible SVG/CSS instead (no new dependency, no jsdom sizing hacks, each chart ships a data table). The PDF says "recommended"; swapping later is isolated in `charts.tsx`. |

Not built (strict boundary): approvals, recurring, reports/exports, audit log, new accounting rules.

## 2. API — `GET /api/dashboard`

Authenticated (founder or admin; same visibility as the ledger, Phase 3 IA-15). Query (Zod `.strict()`): `from`, `to` (real `YYYY-MM-DD` dates, `from ≤ to`), `founderId`, `categoryId` (canonical ObjectIds; unknown but well-formed ids → 404). Anything else — including any financial field — is a 400. No write method exists. The response contains `kpis`, `founders`, `charts{contributionByFounder, expenseByCategory, monthly}`, `settlement`, `recent`, `counts`, `reconciliation`, `warnings`, `filters`, `currency`. All amounts are integer minor units.

Implementation: `server/src/modules/dashboard/dashboard.routes.ts` (validation, loading) and the pure `server/src/domain/dashboard.ts` (selection + summing of **engine results**). The engine runs once per request (`loadCalculation({asOf})`); there is no second calculation path.

## 3. Semantics (the Product Plan lists widgets, not definitions)

| Item | Definition | Label |
|---|---|---|
| Official records | Only `approved` and engine-valid; draft/pending/rejected/voided/"Other" never count | PHASE 3 RULE |
| **Balances** (founder cards, outstanding settlements, recommendations) | The engine run over transactions dated **≤ `to`** ("cumulative as of the period end"). Not narrowed by `from` or by the category filter | IMPLEMENTATION ASSUMPTION |
| **Period figures** (KPIs, charts, recent list) | Official transactions with `transactionDate` in `[from, to]` (inclusive) | IMPLEMENTATION ASSUMPTION |
| Total Business Expenses | Σ gross amount of approved expenses in the period; shown with "reimbursed by the business" (Option C) and founder-funded = amount − reimbursed | IMPLEMENTATION ASSUMPTION (formula) on PHASE 3 RULE data |
| Reimbursed by the business | Σ valid linked reimbursements **of the expenses in the period** (as of `to`) | IMPLEMENTATION ASSUMPTION |
| Total Investment | capital contributions + founder-loan principal in the period ("money founders put in") | IMPLEMENTATION ASSUMPTION |
| Founder Capital | capital contributions only (loans are expected to be repaid, PDF §7) | IMPLEMENTATION ASSUMPTION |
| Outstanding Settlements | engine `totalPayable` (= `totalReceivable`) after settlements, all founders | PHASE 3 RULE (value), label = assumption |
| Founder card "Invested" | `contributionMinor + loanOutstandingMinor` (the same two engine fields) | IMPLEMENTATION ASSUMPTION |
| Net position | `Paid − Fair share`, unchanged | INFERRED FROM PDF EXAMPLE (Phase 3) |
| Founder filter | a transaction matches if the founder is its payer or counterparty; cards and recommendations narrow to that founder | UI DECISION |
| Category filter | only transactions carrying that category are counted in period figures (so contributions without a category drop out) | UI DECISION |
| Donut | at most 7 slices; the long tail is merged **on the server** as "Other categories"; `shareBp` (basis points) is a display helper | UI DECISION |
| Monthly chart | calendar months; empty months between the first and last month are returned as zeros so the line is continuous (max 60) | UI DECISION |
| Recent | newest 10 matching transactions of any status; not-yet-counted ones are flagged | UI DECISION |
| Settle button | opens Add Transaction prefilled as a Settlement (suggested values only; the server validates on submit; it is **not** auto-recorded and needs Phase 5 approval) | UI DECISION |

Reimbursement wording follows Option C: "reimbursed by the business". `externalMinor`, IA-5 and `PASS_WITH_EXTERNAL` do not appear anywhere (tested).

## 4. Worked reconciliation (used by the tests and the browser suite)

Fixtures (₹): E1 3,000 paid by A (Apr 15, Cloud); E2 1,000 paid by B (May 5, Travel); reimbursement 300 of E2; capital C 5,000 (Apr 2), A 2,000 (May 2); loan B 1,500 (May 3); refund 300 to A split equally (May 8); settlement B→A 200 (May 9); plus a pending 9,999 expense and a voided 8,888 expense (excluded).

* E2 founder-funded 700 → 233.34 / 233.33 / 233.33 (largest remainder, earliest entry first). Refund 300 → 100 each.
* Paid: A 3,000 − 300 = **2,700**, B 1,000 − 300 = **700**, C 0. Fair share: A 1,000 + 233.34 − 100 = **1,133.34**; B 1,000 + 233.33 − 100 = **1,133.33**; C **1,133.33** (Σ 3,400 = 4,000 − 300 − 300).
* Net: A **+1,566.66**, B **−433.33**, C **−1,133.33** (Σ = 0). After B's 200 settlement: outstanding A +1,366.66, B −233.33, C −1,133.33.
* Recommendations: C→A 1,133.33, B→A 233.33. KPIs (all time): expenses 4,000; reimbursed 300; capital 7,000; loans 1,500; investment 8,500; refunds 300; settled 200; outstanding 1,366.66. May only: expenses 1,000; investment 3,500; outstanding unchanged (cumulative).

Each figure was checked at four points: fixture data → hand calculation → `GET /api/dashboard` (also equal to `GET /api/founders/financial-positions`) → rendered text.

## 5. States
Loading skeleton (`role=status`), error box with retry (no internals; filters stay usable), empty messages per section ("No contributions in this period", …) and a page-level empty state. Zero KPIs are shown only when the server returns zero. Filter lists (`/founders`, `/categories`) load independently: if they fail the dashboard still renders. **LIMITATION:** the dashboard itself is one request, so if it fails the whole figure area shows the error (chosen over several competing calculation calls).

## 6. Limitations
Approval is Phase 5, so a real deployment shows zeros until records can be approved (end-to-end tests approve with a controlled DB write). Charts are not interactive (no tooltips); values are printed next to every mark and in data tables. Founder filter ignores split participation by design. Period presets are computed in the browser's local calendar; the server treats dates as plain `YYYY-MM-DD`.
