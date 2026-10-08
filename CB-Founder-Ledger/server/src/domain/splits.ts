/**
 * Split definitions (Product Plan §8) — Phase 2.
 *
 * Pure functions, no I/O. They validate a split *definition* and resolve it into the amount each
 * founder is responsible for on ONE transaction. They do NOT compute balances, fair share across
 * transactions, or settlements (Phase 3).
 *
 * All money is an integer count of minor units (e.g. paise). Allocation uses the largest-remainder
 * method so the parts always add up to exactly the transaction amount.
 */

export const SPLIT_METHODS = ['equal', 'percentage', 'exact', 'shares', 'custom'] as const;
export type SplitMethod = (typeof SPLIT_METHODS)[number];

export interface SplitEntryInput {
  founderId: string;
  /** percentage method: percent of the amount, up to 2 decimals (e.g. 33.33) */
  percent?: number;
  /** shares method: positive integer weight (e.g. 2 : 1 : 1) */
  shares?: number;
  /** exact / custom methods: fixed responsibility in minor units */
  amountMinor?: number;
  /** custom method: optional explanation */
  note?: string;
}

export interface SplitInput {
  method: SplitMethod;
  entries: SplitEntryInput[];
}

export interface SplitEntryResolved extends SplitEntryInput {
  /** This founder's responsibility for this transaction, in minor units. Sum === transaction amount. */
  allocatedMinor: number;
}

export interface SplitIssue {
  path: string;
  code: string;
  message: string;
}

export type SplitResult =
  | { ok: true; entries: SplitEntryResolved[] }
  | { ok: false; issues: SplitIssue[] };

export const MAX_SPLIT_ENTRIES = 20;
export const MAX_SHARES = 1_000_000;

/** Percent -> basis points (1% = 100). Returns null if it has more than 2 decimals or is out of range. */
export function percentToBasisPoints(percent: number): number | null {
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return null;
  const bp = Math.round(percent * 100);
  return Math.abs(percent * 100 - bp) < 1e-6 ? bp : null;
}

function formatPercentFromBp(bp: number): string {
  return `${(bp / 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}

/** Largest-remainder allocation of `amount` across `weights` (all positive integers). BigInt avoids overflow. */
export function allocateByWeights(amount: number, weights: number[]): number[] {
  const total = weights.reduce((s, w) => s + BigInt(w), 0n);
  const amt = BigInt(amount);
  const base = weights.map((w) => (amt * BigInt(w)) / total);
  const rems = weights.map((w, i) => ({ i, rem: (amt * BigInt(w)) % total }));
  let left = amt - base.reduce((s, b) => s + b, 0n);
  rems.sort((a, b) => (a.rem === b.rem ? a.i - b.i : a.rem > b.rem ? -1 : 1));
  const out = base.map(Number);
  for (const r of rems) {
    if (left <= 0n) break;
    out[r.i] = (out[r.i] ?? 0) + 1;
    left -= 1n;
  }
  return out;
}

const isPosInt = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0;

export function resolveSplit(split: SplitInput, amountMinor: number): SplitResult {
  const issues: SplitIssue[] = [];
  const add = (path: string, code: string, message: string) => issues.push({ path, code, message });
  const { method, entries } = split;

  if (!isPosInt(amountMinor)) add('amountMinor', 'INVALID_AMOUNT', 'Enter the amount before defining a split');
  if (entries.length === 0) add('split.entries', 'NO_FOUNDERS', 'Select at least one founder');
  if (entries.length > MAX_SPLIT_ENTRIES) add('split.entries', 'TOO_MANY_FOUNDERS', `A split can include at most ${MAX_SPLIT_ENTRIES} founders`);

  const seen = new Set<string>();
  entries.forEach((e, i) => {
    if (seen.has(e.founderId)) add(`split.entries.${i}.founderId`, 'DUPLICATE_FOUNDER', 'Each founder can appear only once in a split');
    seen.add(e.founderId);
  });
  if (issues.length > 0) return { ok: false, issues };

  let weights: number[] | null = null;
  let fixed: number[] | null = null;

  switch (method) {
    case 'equal':
      weights = entries.map(() => 1);
      break;
    case 'percentage': {
      let sumBp = 0;
      const bps = entries.map((e, i) => {
        const bp = e.percent === undefined ? null : percentToBasisPoints(e.percent);
        if (bp === null) add(`split.entries.${i}.percent`, 'INVALID_PERCENT', 'Percentage must be greater than 0 and at most 100, with up to 2 decimals');
        else sumBp += bp;
        return bp ?? 0;
      });
      if (issues.length === 0 && sumBp !== 10_000) {
        add('split.entries', 'PERCENT_TOTAL_MISMATCH', `Percentages must add up to 100% (currently ${formatPercentFromBp(sumBp)})`);
      }
      weights = bps;
      break;
    }
    case 'shares': {
      weights = entries.map((e, i) => {
        if (!isPosInt(e.shares) || e.shares > MAX_SHARES) {
          add(`split.entries.${i}.shares`, 'INVALID_SHARES', `Shares must be a whole number from 1 to ${MAX_SHARES}`);
          return 1;
        }
        return e.shares;
      });
      break;
    }
    case 'exact':
    case 'custom': {
      let sum = 0;
      fixed = entries.map((e, i) => {
        const a = e.amountMinor;
        const minOk = a !== undefined && (method === 'exact' ? isPosInt(a) : Number.isSafeInteger(a) && a >= 0);
        if (a === undefined || !minOk) {
          add(`split.entries.${i}.amountMinor`, 'INVALID_ENTRY_AMOUNT',
            method === 'exact' ? 'Each founder amount must be greater than 0' : 'Each founder amount must be 0 or more');
          return 0;
        }
        sum += a;
        return a;
      });
      if (issues.length === 0) {
        if (sum !== amountMinor) {
          add('split.entries', 'AMOUNT_TOTAL_MISMATCH', `Founder amounts must add up to the transaction amount (difference: ${amountMinor - sum} minor units)`);
        } else if (method === 'custom' && sum === 0) {
          add('split.entries', 'NO_RESPONSIBILITY', 'At least one founder must have a non-zero amount');
        }
      }
      break;
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  const allocated = fixed ?? allocateByWeights(amountMinor, weights as number[]);
  return { ok: true, entries: entries.map((e, i) => ({ ...e, allocatedMinor: allocated[i] ?? 0 })) };
}
