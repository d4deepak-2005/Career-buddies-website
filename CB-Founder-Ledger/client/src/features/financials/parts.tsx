import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ErrorBox } from '../../components/ui';
import type { Reconciliation, CalcWarning, PositionAction } from '../../lib/types';
import type { CurrencyConfig } from '../../lib/money';
import { formatMinor } from '../../lib/money';

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

export function CalcNotes({ reconciliation, warnings, excludedPending, currency }: { reconciliation: Reconciliation; warnings: CalcWarning[]; excludedPending?: number; currency: CurrencyConfig }) {
  return (
    <div className="space-y-2">
      {excludedPending ? <p className="rounded-xl bg-cb-blue/5 px-4 py-3 text-sm text-cb-navy">{excludedPending} transaction{excludedPending === 1 ? ' is' : 's are'} not counted yet because {excludedPending === 1 ? 'it has' : 'they have'} not been approved.</p> : null}
      {!reconciliation.isBalanced && (
        <p className="rounded-xl bg-surface-alt px-4 py-3 text-sm text-ink-muted">
          {formatMinor(Math.abs(reconciliation.unallocatedMinor), currency)} {reconciliation.unallocatedMinor < 0 ? 'was paid out of business funds (reimbursements), so it is not owed to any single founder.' : 'is unallocated.'}
        </p>
      )}
      {warnings.length > 0 && <ErrorBox error={`${warnings.length} approved record${warnings.length === 1 ? ' was' : 's were'} left out of the figures because the data is incomplete: ${[...new Set(warnings.map((w) => w.message))].join('; ')}.`} />}
    </div>
  );
}
