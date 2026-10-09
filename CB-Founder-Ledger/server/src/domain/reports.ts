/** Report helpers: fiscal-year grouping and CSV serialisation (with spreadsheet-formula-injection protection). */

/** "2025-26" for startMonth 4, "2025" for startMonth 1. `month` is YYYY-MM. */
export function fiscalYearLabel(month: string, startMonth: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  if (startMonth === 1) return String(y);
  const start = m >= startMonth ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export function groupByFiscalYear<T extends { month: string }>(rows: T[], startMonth: number, keys: Array<Exclude<keyof T, 'month'>>) {
  const out = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const label = fiscalYearLabel(r.month, startMonth);
    const acc = out.get(label) ?? Object.fromEntries(keys.map((k) => [k as string, 0]));
    for (const k of keys) acc[k as string] = (acc[k as string] ?? 0) + (r[k] as unknown as number);
    out.set(label, acc);
  }
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([fiscalYear, v]) => ({ fiscalYear, ...v }));
}

/**
 * One CSV cell. Cells that start with = + - @ (or a tab/CR) are prefixed with an apostrophe so a spreadsheet can never run them
 * as a formula. Purely numeric cells (our amounts) are written as given.
 */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'number' || typeof v === 'boolean' ? String(v) : String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: string[], rows: Array<Array<unknown>>): string {
  return `﻿${[columns, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

/** Whole minor units -> "1234.50" (plain decimal, no currency symbol, exact). */
export function minorToDecimal(minor: number, minorUnits: number): string {
  const neg = minor < 0, abs = Math.abs(minor);
  const s = String(abs).padStart(minorUnits + 1, '0');
  const body = minorUnits === 0 ? s : `${s.slice(0, -minorUnits)}.${s.slice(-minorUnits)}`;
  return neg ? `-${body}` : body;
}
