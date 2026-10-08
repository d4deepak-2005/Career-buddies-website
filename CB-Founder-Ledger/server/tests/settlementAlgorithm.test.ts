import { describe, expect, it } from 'vitest';
import { recommendSettlements, type OutstandingPosition } from '../src/domain/settlementAlgorithm';
import { rng } from './calcFixtures';

const P = (founderId: string, outstandingMinor: number): OutstandingPosition => ({ founderId, outstandingMinor });

describe('settlement algorithm', () => {
  it('resolves the brief\'s four-founder example in 3 transfers', () => {
    const r = recommendSettlements([P('A', 1_833_300), P('B', 333_300), P('C', -666_600), P('D', -1_500_000)]);
    expect(r.recommendations).toEqual([
      { payerFounderId: 'D', receiverFounderId: 'A', amountMinor: 1_500_000 },
      { payerFounderId: 'C', receiverFounderId: 'A', amountMinor: 333_300 },
      { payerFounderId: 'C', receiverFounderId: 'B', amountMinor: 333_300 },
    ]);
    expect(r.unresolvedPayableMinor + r.unresolvedReceivableMinor).toBe(0);
  });
  it('uses one transfer for an exact pair even when other parties exist', () => {
    const r = recommendSettlements([P('A', 500), P('B', 300), P('C', -300), P('D', -500)]);
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations).toContainEqual({ payerFounderId: 'C', receiverFounderId: 'B', amountMinor: 300 });
  });
  it('is deterministic and independent of input order', () => {
    const input = [P('A', 100), P('B', 100), P('C', -100), P('D', -100)];
    const a = recommendSettlements(input);
    expect(recommendSettlements([...input].reverse())).toEqual(a);
    expect(recommendSettlements(input)).toEqual(a);
  });
  it('handles empty, all-zero and single-sided input', () => {
    expect(recommendSettlements([])).toEqual({ recommendations: [], unresolvedPayableMinor: 0, unresolvedReceivableMinor: 0 });
    expect(recommendSettlements([P('A', 0), P('B', 0)]).recommendations).toEqual([]);
    expect(recommendSettlements([P('A', -70), P('B', -30)])).toEqual({ recommendations: [], unresolvedPayableMinor: 100, unresolvedReceivableMinor: 0 });
  });
  it('never forces an imbalance onto someone: leftover is reported', () => {
    const r = recommendSettlements([P('A', 100), P('B', -150)]);
    expect(r.recommendations).toEqual([{ payerFounderId: 'B', receiverFounderId: 'A', amountMinor: 100 }]);
    expect(r.unresolvedPayableMinor).toBe(50);
  });
  it('rejects fractional / unsafe values and duplicate founders', () => {
    expect(() => recommendSettlements([P('A', 1.5)])).toThrow(RangeError);
    expect(() => recommendSettlements([P('A', Number.NaN)])).toThrow(RangeError);
    expect(() => recommendSettlements([P('A', Number.MAX_SAFE_INTEGER + 2)])).toThrow(RangeError);
    expect(() => recommendSettlements([P('A', 1), P('A', -1)])).toThrow(/Duplicate/);
  });

  it('property: 2,000 random zero-sum scenarios satisfy every invariant (2-8 founders)', () => {
    const rand = rng(20260101);
    for (let run = 0; run < 2000; run++) {
      const n = 2 + Math.floor(rand() * 7);
      const amounts = Array.from({ length: n - 1 }, () => Math.floor((rand() - 0.5) * 2_000_000));
      amounts.push(-amounts.reduce((a, b) => a + b, 0));
      const positions = amounts.map((a, i) => P(`F${i}`, a));
      const { recommendations, unresolvedPayableMinor, unresolvedReceivableMinor } = recommendSettlements(positions);

      const net = new Map(positions.map((p) => [p.founderId, p.outstandingMinor]));
      const paidOut = new Map<string, number>(), received = new Map<string, number>();
      for (const t of recommendations) {
        expect(Number.isSafeInteger(t.amountMinor) && t.amountMinor > 0).toBe(true);
        expect(t.payerFounderId).not.toBe(t.receiverFounderId);
        paidOut.set(t.payerFounderId, (paidOut.get(t.payerFounderId) ?? 0) + t.amountMinor);
        received.set(t.receiverFounderId, (received.get(t.receiverFounderId) ?? 0) + t.amountMinor);
      }
      for (const p of positions) {
        const owes = Math.max(-p.outstandingMinor, 0), due = Math.max(p.outstandingMinor, 0);
        expect(paidOut.get(p.founderId) ?? 0).toBeLessThanOrEqual(owes);      // C: never exceeds payer's payable
        expect(received.get(p.founderId) ?? 0).toBeLessThanOrEqual(due);       // D: never exceeds receiver's receivable
        // applying the transfers brings everyone to exactly zero (nothing created or lost)
        expect(net.get(p.founderId)! + (paidOut.get(p.founderId) ?? 0) - (received.get(p.founderId) ?? 0)).toBe(0);
      }
      expect(unresolvedPayableMinor).toBe(0);
      expect(unresolvedReceivableMinor).toBe(0);
      const nonZero = positions.filter((p) => p.outstandingMinor !== 0).length;
      expect(recommendations.length).toBeLessThanOrEqual(Math.max(nonZero - 1, 0));
    }
  });
});
