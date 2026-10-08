import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorBox } from '../../components/ui';
import { formatMinor, formatSignedMinor } from '../../lib/money';
import type { PositionsResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { ActionBadge, CalcNotes, Stat } from './parts';

export function FoundersPage() {
  const res = useResource<PositionsResponse>('/founders/financial-positions');
  if (res.loading && !res.data) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Calculating…</p>;
  if (res.error) return <ErrorBox error={res.error} onRetry={res.reload} />;
  if (!res.data) return null;
  const { positions, currency, reconciliation, warnings, excluded } = res.data;
  const m = (n: number) => formatMinor(n, currency);
  const pending = (excluded.byStatus['draft'] ?? 0) + (excluded.byStatus['pending_approval'] ?? 0);

  if (positions.length === 0) return <div className="card p-8 text-center"><p className="font-bold text-cb-navy">No founders yet</p><p className="mt-1 text-sm text-ink-muted">An admin needs to add founder profiles first.</p></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">Paid, fair share and net position for each founder, calculated from approved transactions only.</p>
      <CalcNotes reconciliation={reconciliation} warnings={warnings} excludedPending={pending} currency={currency} />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Founder positions">
        {positions.map((p) => (
          <li key={p.founderId} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold text-cb-navy"><Link to={`/founders/${p.founderId}`} className="hover:underline">{p.founderName}</Link></h2>
                {!p.active && <span className="badge bg-surface-alt text-ink-muted">inactive</span>}
              </div>
              <ActionBadge action={p.action} />
            </div>
            {p.overSettledMinor > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-danger"><AlertTriangle className="h-3.5 w-3.5" aria-hidden />Over-settled by {m(p.overSettledMinor)}: paid or received more than was due</p>}
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <Stat label="Paid" value={m(p.paidMinor)} />
              <Stat label="Fair share" value={m(p.fairShareMinor)} />
              <Stat label="Net position" value={formatSignedMinor(p.grossNetPositionMinor, currency)} tone={p.grossNetPositionMinor > 0 ? 'receive' : p.grossNetPositionMinor < 0 ? 'pay' : undefined} hint="Paid − fair share" />
              <Stat label={p.action === 'pay' ? 'Still to pay' : p.action === 'receive' ? 'Still to receive' : 'Outstanding'} value={m(Math.abs(p.outstandingMinor))} tone={p.action === 'receive' ? 'receive' : p.action === 'pay' ? 'pay' : undefined} hint="Between founders, after settlements" />
              {p.businessFundedShareMinor > 0 && <Stat label="Business-funded share" value={m(p.businessFundedShareMinor)} hint="External: paid from business funds, not owed to a founder" />}
              <Stat label="Contributed" value={m(p.contributionMinor)} />
              <Stat label="Loan outstanding" value={m(p.loanOutstandingMinor)} />
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
