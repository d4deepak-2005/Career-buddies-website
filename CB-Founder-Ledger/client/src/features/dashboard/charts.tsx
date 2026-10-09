/**
 * Dashboard charts. They DRAW server-provided aggregates only: no totals are computed here. The only arithmetic is
 * pixel geometry (scaling a bar or point against the largest value). Each chart has a visible legend/labels and an
 * accessible data table so values are never conveyed by colour or shape alone.
 */
import { formatCompactMinor, formatMinor, type CurrencyConfig } from '../../lib/money';
import type { DashboardResponse } from '../../lib/types';
import { monthLabel } from './periods';

import { brandTokens } from '../../theme/brandTokens';

const c = brandTokens.colors;
export const COLORS = { capital: c.green, loan: c.blue, expense: c.navy, invest: c.green, slices: brandTokens.chart };

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    // The wrapper clips the table: an absolutely-positioned bare <table> keeps its content width and widens the page on mobile.
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">{items.map((i) => <li key={i.label} className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} aria-hidden />{i.label}</li>)}</ul>;
}

export function ContributionBars({ rows, currency }: { rows: DashboardResponse['charts']['contributionByFounder']; currency: CurrencyConfig }) {
  const peak = Math.max(...rows.map((r) => Math.max(r.contributionMinor + r.loanMinor, 1)));
  return (
    <div>
      <ul className="space-y-3" aria-label="Contribution by founder">
        {rows.map((r) => (
          <li key={r.founderId}>
            <div className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 break-words font-semibold text-cb-navy">{r.name}</span><span className="shrink-0 font-bold tabular-nums text-cb-navy">{formatMinor(r.contributionMinor + r.loanMinor, currency)}</span></div>
            <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-surface-alt" aria-hidden>
              <span style={{ width: `${(r.contributionMinor / peak) * 100}%`, background: COLORS.capital }} />
              <span style={{ width: `${(r.loanMinor / peak) * 100}%`, background: COLORS.loan }} />
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">Capital {formatMinor(r.contributionMinor, currency)} · Loans {formatMinor(r.loanMinor, currency)}</p>
          </li>
        ))}
      </ul>
      <Legend items={[{ label: 'Capital contribution', color: COLORS.capital }, { label: 'Founder loan', color: COLORS.loan }]} />
      <DataTable caption="Contribution by founder" head={['Founder', 'Capital', 'Loans']} rows={rows.map((r) => [r.name, formatMinor(r.contributionMinor, currency), formatMinor(r.loanMinor, currency)])} />
    </div>
  );
}

const R = 15.9155; // circumference 100 → stroke-dasharray values are percentages
export function CategoryDonut({ rows, currency }: { rows: DashboardResponse['charts']['expenseByCategory']; currency: CurrencyConfig }) {
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 42 42" className="h-44 w-44 shrink-0" role="img" aria-label="Expenses by category, donut chart">
        <circle cx="21" cy="21" r={R} fill="none" stroke={c.tint100} strokeWidth="6" />
        {rows.map((r, i) => {
          const len = r.shareBp / 100;
          const el = <circle key={`${r.name}-${i}`} cx="21" cy="21" r={R} fill="none" stroke={COLORS.slices[i % COLORS.slices.length]} strokeWidth="6" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={25 - offset} />;
          offset += len;
          return el;
        })}
      </svg>
      <ul className="w-full min-w-0 space-y-1.5 text-sm" aria-label="Expense categories">
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: COLORS.slices[i % COLORS.slices.length] }} aria-hidden />
            <span className="min-w-0 flex-1 break-words text-ink">{r.name}</span>
            <span className="shrink-0 text-xs text-ink-muted">{(r.shareBp / 100).toFixed(1)}%</span>
            <span className="shrink-0 font-bold tabular-nums text-cb-navy">{formatMinor(r.amountMinor, currency)}</span>
          </li>
        ))}
      </ul>
      <DataTable caption="Expenses by category" head={['Category', 'Amount', 'Share']} rows={rows.map((r) => [r.name, formatMinor(r.amountMinor, currency), `${(r.shareBp / 100).toFixed(1)}%`])} />
    </div>
  );
}

const W = 640, H = 240, PAD = { l: 56, r: 12, t: 12, b: 28 };
export function MonthlyLines({ rows, currency }: { rows: DashboardResponse['charts']['monthly']; currency: CurrencyConfig }) {
  const peak = Math.max(...rows.flatMap((r) => [r.expensesMinor, r.investmentMinor]), 1);
  const x = (i: number) => PAD.l + (rows.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (rows.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / peak) * (H - PAD.t - PAD.b);
  const line = (pick: (r: (typeof rows)[number]) => number) => rows.map((r, i) => `${x(i)},${y(pick(r))}`).join(' ');
  const step = Math.ceil(rows.length / 6);
  const ticks = [0, 0.5, 1];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Monthly expenses and investment, line chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(peak * t)} y2={y(peak * t)} stroke={c.tint300} />
            <text x={PAD.l - 6} y={y(peak * t) + 4} textAnchor="end" fontSize="11" fill={c.inkMuted}>{formatCompactMinor(Math.round(peak * t), currency)}</text>
          </g>
        ))}
        {rows.map((r, i) => (i % step === 0 || i === rows.length - 1) && <text key={r.month} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={c.inkMuted}>{monthLabel(r.month)}</text>)}
        <polyline points={line((r) => r.expensesMinor)} fill="none" stroke={COLORS.expense} strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={line((r) => r.investmentMinor)} fill="none" stroke={COLORS.invest} strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" />
        {rows.map((r, i) => <g key={r.month}><circle cx={x(i)} cy={y(r.expensesMinor)} r="3.5" fill={COLORS.expense} /><rect x={x(i) - 3.5} y={y(r.investmentMinor) - 3.5} width="7" height="7" fill={COLORS.invest} /></g>)}
      </svg>
      <Legend items={[{ label: 'Business expenses (solid, round markers)', color: COLORS.expense }, { label: 'Investment: capital + loans (dashed, square markers)', color: COLORS.invest }]} />
      <DataTable caption="Monthly expenses and investment" head={['Month', 'Expenses', 'Investment']} rows={rows.map((r) => [r.month, formatMinor(r.expensesMinor, currency), formatMinor(r.investmentMinor, currency)])} />
    </div>
  );
}
