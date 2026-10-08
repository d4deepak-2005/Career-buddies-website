/**
 * Settlement recommendation algorithm (Phase 3). Pure, deterministic, integer-only.
 * See docs/PHASE-3-CALCULATION-SPEC.md §7.
 */

export interface OutstandingPosition {
  founderId: string;
  /** Signed minor units: positive = should receive, negative = should pay. */
  outstandingMinor: number;
}

export interface SettlementRecommendation {
  payerFounderId: string;
  receiverFounderId: string;
  amountMinor: number;
}

export interface RecommendationResult {
  recommendations: SettlementRecommendation[];
  /** Amount still owed by payers after all transfers (non-zero only if positions do not sum to 0). */
  unresolvedPayableMinor: number;
  /** Amount still due to receivers after all transfers. */
  unresolvedReceivableMinor: number;
}

interface Party { founderId: string; remaining: number }

const byAmountThenId = (a: Party, b: Party) => (b.remaining - a.remaining) || (a.founderId < b.founderId ? -1 : a.founderId > b.founderId ? 1 : 0);

export function recommendSettlements(positions: readonly OutstandingPosition[]): RecommendationResult {
  const seen = new Set<string>();
  for (const p of positions) {
    if (!Number.isSafeInteger(p.outstandingMinor)) throw new RangeError(`Position for ${p.founderId} must be a safe integer of minor units`);
    if (seen.has(p.founderId)) throw new RangeError(`Duplicate founder ${p.founderId}`);
    seen.add(p.founderId);
  }

  const creditors: Party[] = positions.filter((p) => p.outstandingMinor > 0).map((p) => ({ founderId: p.founderId, remaining: p.outstandingMinor }));
  const debtors: Party[] = positions.filter((p) => p.outstandingMinor < 0).map((p) => ({ founderId: p.founderId, remaining: -p.outstandingMinor }));
  creditors.sort(byAmountThenId);
  debtors.sort(byAmountThenId);

  const out: SettlementRecommendation[] = [];
  const transfer = (d: Party, c: Party, amount: number) => {
    out.push({ payerFounderId: d.founderId, receiverFounderId: c.founderId, amountMinor: amount });
    d.remaining -= amount;
    c.remaining -= amount;
  };

  // Pass 1 — exact pairs settle with one transfer.
  for (const d of debtors) {
    if (d.remaining === 0) continue;
    const c = creditors.find((x) => x.remaining === d.remaining);
    if (c) transfer(d, c, d.remaining);
  }

  // Pass 2 — greedy: largest debtor pays largest creditor.
  for (;;) {
    const c = creditors.filter((x) => x.remaining > 0).sort(byAmountThenId)[0];
    const d = debtors.filter((x) => x.remaining > 0).sort(byAmountThenId)[0];
    if (!c || !d) break;
    transfer(d, c, Math.min(c.remaining, d.remaining));
  }

  return {
    recommendations: out,
    unresolvedPayableMinor: debtors.reduce((s, x) => s + x.remaining, 0),
    unresolvedReceivableMinor: creditors.reduce((s, x) => s + x.remaining, 0),
  };
}
