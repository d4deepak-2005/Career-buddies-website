import { AlertTriangle, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, ErrorBox } from '../../components/ui';
import { formatMinor, formatSignedMinor } from '../../lib/money';
import type { PositionsResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { ActionBadge, CalcNotes, Stat } from './parts';

export function FoundersPage() {
  const res = useResource<PositionsResponse>('/founders/financial-positions');
  const [q, setQ] = useState('');
  if (res.loading && !res.data) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Calculating…</p>;
  if (res.error) return <ErrorBox error={res.error} onRetry={res.reload} />;
  if (!res.data) return null;
  const { positions, currency, reconciliation, warnings, excluded } = res.data;
  const m = (n: number) => formatMinor(n, currency);
  const pending = (excluded.byStatus['draft'] ?? 0) + (excluded.byStatus['pending_approval'] ?? 0);

  const shown = positions.filter((p) => p.founderName.toLowerCase().includes(q.trim().toLowerCase()) || (p.role ?? '').toLowerCase().includes(q.trim().toLowerCase()));
  if (positions.length === 0) return <div className="card p-8 text-center"><p className="font-bold text-cb-navy">No founders yet</p><p className="mt-1 text-sm text-ink-muted">An admin needs to add founder profiles first.</p></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">Paid, fair share and net position for each founder, calculated from approved transactions only.</p>
      <CalcNotes reconciliation={reconciliation} warnings={warnings} excludedPending={pending} currency={currency} />
      <div className="relative max-w-sm">
        <label htmlFor="founder-search" className="sr-only">Search founders</label>
        <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-faint" aria-hidden />
        <input id="founder-search" type="search" className="field !pl-10" placeholder="Search founders" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {shown.length === 0 && <p className="rounded-xl bg-surface-alt px-4 py-6 text-center text-sm text-ink-muted">No founder matches “{q}”.</p>}
      <ul className="grid grid-cols-1 gap-4" aria-label="Founder positions">
        {shown.map((p) => (
          <li key={p.founderId} className="card min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={p.founderName} photoUrl={p.photoUrl} size="xl" />
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-extrabold leading-tight text-cb-navy"><Link to={`/founders/${p.founderId}`} className="hover:underline">{p.founderName}</Link></h2>
                  {p.role && <span className="badge mt-1 bg-cb-green/15 text-cb-green-dark">{p.role}</span>}
                  {!p.active && <span className="badge bg-surface-alt text-ink-muted">inactive</span>}
                </div>
              </div>
              <ActionBadge action={p.action} />
            </div>
            {p.overSettledMinor > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-danger"><AlertTriangle className="h-3.5 w-3.5" aria-hidden />Over-settled by {m(p.overSettledMinor)}: paid or received more than was due</p>}
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              <Stat label="Contributed" value={m(p.contributionMinor)} />
              <Stat label="Paid" value={m(p.paidMinor)} />
              <Stat label="Fair share" value={m(p.fairShareMinor)} />
              <Stat label="Net position" value={formatSignedMinor(p.grossNetPositionMinor, currency)} tone={p.grossNetPositionMinor > 0 ? 'receive' : p.grossNetPositionMinor < 0 ? 'pay' : undefined} hint="Paid − fair share" />
              <Stat label={p.action === 'pay' ? 'Still to pay' : p.action === 'receive' ? 'Still to receive' : 'Outstanding'} value={m(Math.abs(p.outstandingMinor))} tone={p.action === 'receive' ? 'receive' : p.action === 'pay' ? 'pay' : undefined} hint="Between founders, after settlements" />
              {p.reimbursedMinor > 0 && <Stat label="Reimbursed by business" value={m(p.reimbursedMinor)} hint="Part of your expenses the business paid back; not shared between founders" />}
              {p.founderFundedExpenseMinor !== undefined && <Stat label="Founder-funded expenses" value={m(p.founderFundedExpenseMinor)} hint="Expenses you paid, after business reimbursements" />}
              <Stat label="Loan outstanding" value={m(p.loanOutstandingMinor)} />
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
