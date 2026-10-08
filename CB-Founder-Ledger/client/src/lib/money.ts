/**
 * Money helpers for DISPLAY and INPUT PARSING only. Amounts travel as integer minor units; every
 * financial rule (splits, totals, validation) is computed by the server.
 */
export interface CurrencyConfig { code: string; minorUnits: number }

export function formatMinor(minor: number, c: CurrencyConfig): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: c.code, minimumFractionDigits: c.minorUnits, maximumFractionDigits: c.minorUnits }).format(minor / 10 ** c.minorUnits);
}

/** "1,234.50" -> 123450. Returns null for anything that is not a plain non-negative amount. */
export function parseMajorToMinor(text: string, minorUnits: number): number | null {
  const t = text.trim().replace(/,/g, '');
  const m = /^(\d+)(?:\.(\d+))?$/.exec(t);
  if (!m) return null;
  const frac = m[2] ?? '';
  if (frac.length > minorUnits) return null;
  const minor = Number(`${m[1]}${frac.padEnd(minorUnits, '0')}`);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** 123450 -> "1234.5" (for editing in a text box). */
export function minorToInput(minor: number, minorUnits: number): string {
  if (minorUnits === 0) return String(minor);
  const s = String(minor).padStart(minorUnits + 1, '0');
  const whole = s.slice(0, -minorUnits);
  const frac = s.slice(-minorUnits).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}
