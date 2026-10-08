import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2, Info } from 'lucide-react';
import { ErrorBox } from '../../components/ui';
import type { CurrencyConfig } from '../../lib/money';
import { formatMinor } from '../../lib/money';
import type { CalcWarning, PositionAction, Reconciliation } from '../../lib/types';

const ACTION: Record<PositionAction, { label: string; cls: string; Icon: typeof ArrowDownLeft }> = {
  receive: { label: 'To receive', cls: 'bg-cb-green/10 text-cb-green-dark', Icon: ArrowDownLeft },
  pay: { label: 'To pay', cls: 'bg-danger-soft text-danger', Icon: ArrowUpRight },
  settled: { label: 'Settled', cls: 'bg-surface-alt text-ink-muted ring-1 ring-surface-line', Icon: CheckCircle2 },
};

/** Positive (receivable) and negative (payable) are distinct by icon + wording + colour, not colour alone. */
export function ActionBadge({ action }: { action: PositionAction }) {
  const { label, cls, Icon } = ACTION[action];
  return <span className={`badge gap-1 ${cls}`}><Icon className="h-3.5 w-3.5" aria-hidden />{label}</span>;
}

export function Stat({ label, value, tone, hint }: { label: string; value: string; tone?: 'receive' | 'pay'; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 break-words text-base font-bold tabular-nums ${tone === 'receive' ? 'text-cb-green-dark' : tone === 'pay' ? 'text-danger' : 'text-cb-navy'}`}>{value}</dd>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

const STATUS_TEXT: Record<Reconciliation['status'], string> = {
  PASS: 'Balanced',
  PASS_WITH_EXTERNAL: 'Balanced, with an external amount',
  REVIEW: 'Needs review',
  FAIL: 'Error — figures may be wrong',
};

/** States the reconciliation result in words. The external (business-funded) amount is named, not folded into founders' balances. */
export function ReconciliationNote({ reconciliation, currency }: { reconciliation: Reconciliation; currency: CurrencyConfig }) {
  const r = reconciliation;
  const Icon = r.status === 'PASS' || r.status === 'PASS_WITH_EXTERNAL' ? CheckCircle2 : AlertTriangle;
  return (
    <div className="rounded-xl border border-surface-line bg-white px-4 py-3 text-sm" aria-label="Reconciliation">
      <p className="flex items-center gap-2 font-semibold text-cb-navy"><Icon className="h-4 w-4 shrink-0" aria-hidden />Reconciliation: {STATUS_TEXT[r.status]}</p>
      {r.externalMinor > 0 && (
        <p className="mt-1 text-ink-muted">
          <strong className="text-cb-navy">{formatMinor(r.externalMinor, currency)} external</strong> — paid from business funds (reimbursements). It is shown separately and is never owed to, or by, a founder.
        </p>
      )}
      {r.status === 'FAIL' && <p className="mt-1 text-danger">{r.explanation}</p>}
    </div>
  );
}

export function CalcNotes({ reconciliation, warnings, excludedPending, currency }: { reconciliation: Reconciliation; warnings: CalcWarning[]; excludedPending?: number; currency: CurrencyConfig }) {
  const attention = [...new Set(warnings.filter((w) => w.level === 'warning').map((w) => w.message))];
  const notCalculated = warnings.filter((w) => w.code === 'OTHER_NOT_CALCULATED').length;
  return (
    <div className="space-y-2">
      <ReconciliationNote reconciliation={reconciliation} currency={currency} />
      {excludedPending ? <p className="flex items-start gap-2 rounded-xl bg-cb-blue/5 px-4 py-3 text-sm text-cb-navy"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{excludedPending} transaction{excludedPending === 1 ? ' is' : 's are'} not counted yet because {excludedPending === 1 ? 'it has' : 'they have'} not been approved.</p> : null}
      {notCalculated > 0 && <p className="flex items-start gap-2 rounded-xl bg-surface-alt px-4 py-3 text-sm text-ink-muted"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{notCalculated} “Other” transaction{notCalculated === 1 ? ' is' : 's are'} not included in any figure, because the Product Plan does not say how to account for them.</p>}
      {attention.length > 0 && <ErrorBox error={`Needs attention: ${attention.join('; ')}.`} />}
    </div>
  );
}
