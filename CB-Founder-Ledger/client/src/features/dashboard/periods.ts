/** Period presets for the dashboard filter. Only produces YYYY-MM-DD strings that are sent to the server; no money is involved. */
export type PresetId = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year';
export const PRESETS: Array<{ id: PresetId; label: string }> = [
  { id: 'all', label: 'All time' }, { id: 'this_month', label: 'This month' }, { id: 'last_month', label: 'Last month' },
  { id: 'last_3_months', label: 'Last 3 months' }, { id: 'this_year', label: 'This year' },
];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate(); // m is 1-based: day 0 of next month

export function presetRange(id: PresetId, now = new Date()): { from: string; to: string } | null {
  const y = now.getFullYear(), m = now.getMonth() + 1;
  switch (id) {
    case 'all': return null;
    case 'this_month': return { from: iso(y, m, 1), to: iso(y, m, lastDay(y, m)) };
    case 'last_month': { const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1; return { from: iso(py, pm, 1), to: iso(py, pm, lastDay(py, pm)) }; }
    case 'last_3_months': { const d = new Date(y, m - 3, 1); return { from: iso(d.getFullYear(), d.getMonth() + 1, 1), to: iso(y, m, lastDay(y, m)) }; }
    case 'this_year': return { from: iso(y, 1, 1), to: iso(y, 12, 31) };
  }
}

/** Which preset (if any) matches the current from/to — otherwise the filter is a custom range. */
export function detectPreset(from: string, to: string, now = new Date()): PresetId | 'custom' {
  if (!from && !to) return 'all';
  for (const p of PRESETS) { const r = presetRange(p.id, now); if (r && r.from === from && r.to === to) return p.id; }
  return 'custom';
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: '2-digit' });
}
