import { describe, expect, it } from 'vitest';
import { allocateByWeights, percentToBasisPoints, resolveSplit, type SplitInput } from '../src/domain/splits';

const sum = (xs: { allocatedMinor: number }[]) => xs.reduce((s, e) => s + e.allocatedMinor, 0);
const ok = (s: SplitInput, amt: number) => {
  const r = resolveSplit(s, amt);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.entries;
};
const codes = (s: SplitInput, amt: number) => {
  const r = resolveSplit(s, amt);
  return r.ok ? [] : r.issues.map((i) => i.code);
};

describe('equal split', () => {
  it('divides the plan example: 30,000 among 3 founders = 10,000 each (in minor units)', () => {
    const e = ok({ method: 'equal', entries: [{ founderId: 'a' }, { founderId: 'b' }, { founderId: 'c' }] }, 3_000_000);
    expect(e.map((x) => x.allocatedMinor)).toEqual([1_000_000, 1_000_000, 1_000_000]);
  });
  it('recalculates when the amount changes (30,000 -> 45,000 = 15,000 each)', () => {
    const split: SplitInput = { method: 'equal', entries: [{ founderId: 'a' }, { founderId: 'b' }, { founderId: 'c' }] };
    expect(ok(split, 4_500_000).map((x) => x.allocatedMinor)).toEqual([1_500_000, 1_500_000, 1_500_000]);
  });
  it('distributes the remainder deterministically so parts always sum to the amount', () => {
    const e = ok({ method: 'equal', entries: [{ founderId: 'a' }, { founderId: 'b' }, { founderId: 'c' }] }, 100);
    expect(e.map((x) => x.allocatedMinor)).toEqual([34, 33, 33]);
    expect(sum(e)).toBe(100);
  });
  it('requires at least one founder and rejects duplicates', () => {
    expect(codes({ method: 'equal', entries: [] }, 100)).toContain('NO_FOUNDERS');
    expect(codes({ method: 'equal', entries: [{ founderId: 'a' }, { founderId: 'a' }] }, 100)).toContain('DUPLICATE_FOUNDER');
  });
});

describe('percentage split', () => {
  it('allocates by percent and sums exactly', () => {
    const e = ok({ method: 'percentage', entries: [{ founderId: 'a', percent: 50 }, { founderId: 'b', percent: 30 }, { founderId: 'c', percent: 20 }] }, 1_000_000);
    expect(e.map((x) => x.allocatedMinor)).toEqual([500_000, 300_000, 200_000]);
  });
  it('must total exactly 100%', () => {
    const s: SplitInput = { method: 'percentage', entries: [{ founderId: 'a', percent: 50 }, { founderId: 'b', percent: 30 }] };
    expect(codes(s, 1000)).toContain('PERCENT_TOTAL_MISMATCH');
    const r = resolveSplit(s, 1000);
    expect(!r.ok && r.issues[0]?.message).toMatch(/currently 80%/);
    expect(codes({ method: 'percentage', entries: [{ founderId: 'a', percent: 60 }, { founderId: 'b', percent: 50 }] }, 1000)).toContain('PERCENT_TOTAL_MISMATCH');
  });
  it('accepts 33.33 + 33.33 + 33.34 and rejects >2 decimals', () => {
    ok({ method: 'percentage', entries: [{ founderId: 'a', percent: 33.33 }, { founderId: 'b', percent: 33.33 }, { founderId: 'c', percent: 33.34 }] }, 999);
    expect(codes({ method: 'percentage', entries: [{ founderId: 'a', percent: 33.333 }, { founderId: 'b', percent: 66.667 }] }, 999)).toContain('INVALID_PERCENT');
    expect(percentToBasisPoints(0)).toBeNull();
    expect(percentToBasisPoints(100.01)).toBeNull();
  });
  it('percentages stay reusable when the amount changes', () => {
    const s: SplitInput = { method: 'percentage', entries: [{ founderId: 'a', percent: 70 }, { founderId: 'b', percent: 30 }] };
    expect(ok(s, 1000).map((x) => x.allocatedMinor)).toEqual([700, 300]);
    expect(ok(s, 4500).map((x) => x.allocatedMinor)).toEqual([3150, 1350]);
  });
});

describe('exact amount split', () => {
  it('must equal the transaction amount', () => {
    const s: SplitInput = { method: 'exact', entries: [{ founderId: 'a', amountMinor: 600 }, { founderId: 'b', amountMinor: 400 }] };
    expect(ok(s, 1000).map((x) => x.allocatedMinor)).toEqual([600, 400]);
    expect(codes(s, 1001)).toContain('AMOUNT_TOTAL_MISMATCH'); // amount changed -> revalidated
    expect(codes(s, 999)).toContain('AMOUNT_TOTAL_MISMATCH');
  });
  it('rejects zero or missing amounts', () => {
    expect(codes({ method: 'exact', entries: [{ founderId: 'a', amountMinor: 0 }, { founderId: 'b', amountMinor: 1000 }] }, 1000)).toContain('INVALID_ENTRY_AMOUNT');
    expect(codes({ method: 'exact', entries: [{ founderId: 'a' }] }, 1000)).toContain('INVALID_ENTRY_AMOUNT');
  });
});

describe('shares split', () => {
  it('2:1:1 of 1000 = 500/250/250', () => {
    const e = ok({ method: 'shares', entries: [{ founderId: 'a', shares: 2 }, { founderId: 'b', shares: 1 }, { founderId: 'c', shares: 1 }] }, 1000);
    expect(e.map((x) => x.allocatedMinor)).toEqual([500, 250, 250]);
  });
  it('rejects zero, negative, fractional and missing shares', () => {
    for (const shares of [0, -1, 1.5, undefined]) {
      expect(codes({ method: 'shares', entries: [{ founderId: 'a', shares }, { founderId: 'b', shares: 1 }] }, 1000)).toContain('INVALID_SHARES');
    }
  });
});

describe('custom split', () => {
  it('allows zero for a founder, but totals must match and someone must be responsible', () => {
    expect(ok({ method: 'custom', entries: [{ founderId: 'a', amountMinor: 1000 }, { founderId: 'b', amountMinor: 0, note: 'not involved' }] }, 1000).map((x) => x.allocatedMinor)).toEqual([1000, 0]);
    expect(codes({ method: 'custom', entries: [{ founderId: 'a', amountMinor: 500 }, { founderId: 'b', amountMinor: 0 }] }, 1000)).toContain('AMOUNT_TOTAL_MISMATCH');
    expect(codes({ method: 'custom', entries: [{ founderId: 'a', amountMinor: -5 }] }, 1000)).toContain('INVALID_ENTRY_AMOUNT');
  });
});

describe('allocation invariants', () => {
  it('parts always sum to the amount, for many amounts and weights', () => {
    const weightSets = [[1, 1, 1], [2, 1, 1], [3333, 3333, 3334], [1, 999_999], [7, 11, 13, 17]];
    for (const w of weightSets) {
      for (const amount of [1, 2, 3, 7, 99, 100, 101, 12_345, 999_999_999_999]) {
        const parts = allocateByWeights(amount, w);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(amount);
        expect(parts.every((p) => Number.isInteger(p) && p >= 0)).toBe(true);
      }
    }
  });
  it('rejects an invalid amount', () => {
    expect(codes({ method: 'equal', entries: [{ founderId: 'a' }] }, 0)).toContain('INVALID_AMOUNT');
  });
});
