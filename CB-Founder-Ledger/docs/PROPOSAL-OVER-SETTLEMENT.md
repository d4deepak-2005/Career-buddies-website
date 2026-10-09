# Proposal (needs approval): over-settlement through the generic Add Transaction form

**Status: NOT IMPLEMENTED — accounting policy is unchanged.** This note only documents the QA observation and options.

## Observation (QA audit 2026-10-09, test SET-09)
A *settlement* entered through the generic Add Transaction form for more than the payer still owes can be created and
approved. The guided **Record payment** flow already refuses this (`400 EXCEEDS_OUTSTANDING`) and refuses duplicates.

## What happens today (verified)
* The engine does not hide it: the founder's position gets `overSettledMinor > 0`, an `OVER_SETTLED` warning is raised,
  reconciliation changes from `PASS` to `REVIEW`, the dashboard shows "1 record needs attention", and the founder ledger
  shows the over-payment. Net positions still sum to zero; no money is created or lost.
* This is the **documented, approved behaviour IA-10** in `docs/PHASE-3-CALCULATION-SPEC.md` ("Over-settlement is allowed
  and explicit") and is covered by existing tests (`financials.test.ts` "over-settlement is surfaced through the API",
  `accountingReview.test.ts`). Voiding the settlement restores the balances.
* Why it is not a defect by itself: legitimate cases exist (paying a bit extra, paying before a later expense is approved,
  correcting an earlier under-payment), so IA-10 chose "allow and flag" over "block".

## Options
| Option | Behaviour | Effect on policy |
|---|---|---|
| A. Keep (current) | Allow, flag with warning / REVIEW | none |
| B. Warn in the form | Add Transaction shows a non-blocking notice when a settlement exceeds what is owed | UI only; no accounting change |
| C. Block at approval | Approving a settlement larger than the owed amount fails (`EXCEEDS_OUTSTANDING`), like Record payment | changes IA-10 → needs approval |
| D. Block at creation | Same check when the settlement is created | changes IA-10 → needs approval |

## Recommendation
B now (no policy change), and C only if you decide over-settlement should never be possible. C must keep an explicit
override path (admin + reason) so a real over-payment can still be recorded and audited.

## What was done in the bug-fix phase
Nothing: no code or policy was changed for this item. Awaiting your decision.
