/**
 * Pure date/amount helpers for recurring payments (Product Plan §14). Dates are plain YYYY-MM-DD strings (no time zones inside).
 * A recurring payment is a scheduled obligation; nothing here records money.
 */
export const FREQUENCY_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 } as const;
export type Frequency = keyof typeof FREQUENCY_MONTHS;

const pad = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based

export function isRealDate(s: string): boolean {
  const d = new Date(`${s}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** The due date after `due`, keeping the schedule on `anchorDay` (clamped to the month length, so 31st -> Feb 28 -> Mar 31). */
export function advanceDueDate(due: string, anchorDay: number, frequency: Frequency): string {
  const [y, m] = due.split('-').map(Number) as [number, number, number];
  const total = y * 12 + (m - 1) + FREQUENCY_MONTHS[frequency];
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  return `${ny}-${pad(nm)}-${pad(Math.min(anchorDay, daysInMonth(ny, nm)))}`;
}

export type DueState = 'overdue' | 'due_soon' | 'upcoming';

export function addDays(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** overdue: due before today · due_soon: due within `reminderDays` (inclusive of today) · upcoming: later. */
export function dueState(nextDueDate: string, today: string, reminderDays: number): DueState {
  if (nextDueDate < today) return 'overdue';
  return nextDueDate <= addDays(today, reminderDays) ? 'due_soon' : 'upcoming';
}

/** Today's date in an IANA time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Total monthly commitment of the active items (Product Plan §14). Computed exactly: sum the yearly cost of every item
 * (monthly x12, quarterly x4, yearly x1), then divide by 12 once, rounding half up to a whole minor unit.
 */
export function monthlyCommitmentMinor(items: Array<{ amountMinor: number; frequency: Frequency }>): number {
  const perYear = { monthly: 12, quarterly: 4, yearly: 1 } as const;
  const yearly = items.reduce((s, i) => s + i.amountMinor * perYear[i.frequency], 0);
  return Math.floor((yearly * 2 + 12) / 24);
}
