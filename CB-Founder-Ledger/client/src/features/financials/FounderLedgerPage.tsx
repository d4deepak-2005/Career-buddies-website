import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, ErrorBox, StatusBadge } from '../../components/ui';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor, formatSignedMinor } from '../../lib/money';
import type { FounderLedgerResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { ActionBadge, CalcNotes, Stat } from './parts';

const KIND: Record<string, string> = {
  expense_paid: 'Paid for expense', expense_share: 'Share of expense', refund_received: 'Refund received', refund_share: 'Share of refund',
  reimbursement_received: 'Reimbursed', contribution: 'Contribution', loan: 'Loan', settlement_paid: 'Settlement paid', settlement_received: 'Settlement received',
};

export function FounderLedgerPage() {
  const { id = '' } = useParams();
  const cfg = useAppConfig();
  const { user } = useAuth();
  const res = useResource<FounderLedgerResponse>(`/founders/${id}/financial-position`);
  if (res.loading && !res.data) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Calculating…</p>;
  if (res.error) return <div className="space-y-4"><ErrorBox error={res.error.status === 404 ? 'Founder not found.' : res.error} onRetry={res.reload} /><Link to="/founders" className="btn-ghost">Back to founders</Link></div>;
  if (!res.data) return null;
  const { position: p, history, reconciliation, warnings } = res.data;
  const m = (n: number) => formatMinor(n, cfg.currency);
  const typeLabel = (v: string) => cfg.transactionTypes.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link to="/founders" className="inline-flex items-center gap-1 text-sm font-semibold text-cb-blue hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />All founders</Link>
      <section className="card p-5 sm:p-6" aria-labelledby="led-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={p.founderName} photoUrl={p.photoUrl} size="xl" />
            <div className="min-w-0">
              <h2 id="led-h" className="break-words text-xl font-extrabold text-cb-navy">{p.founderName}</h2>
              {p.role && <p className="text-ink-muted">{p.role}</p>}
              {!p.active && <span className="badge bg-surface-alt text-ink-muted">inactive</span>}
              {user?.role === 'admin' && <p className="mt-1 text-xs"><Link to={`/settings?section=founders`} className="font-semibold text-cb-blue underline">Edit profile and photograph</Link></p>}
            </div>
          </div>
          <ActionBadge action={p.action} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
          <Stat label="Total paid" value={m(p.paidMinor)} />
          <Stat label="Total contribution" value={m(p.contributionMinor)} hint="Capital, tracked separately" />
          <Stat label="Loan outstanding" value={m(p.loanOutstandingMinor)} />
          <Stat label="Allocated expense share (fair share)" value={m(p.fairShareMinor)} hint="Share of the founder-funded expenses, net of refunds" />
          {p.founderFundedExpenseMinor !== undefined && <Stat label="Founder-funded expenses" value={m(p.founderFundedExpenseMinor)} hint="Expenses this founder paid, after business reimbursements" />}
          {p.refundReceivedMinor > 0 && <Stat label="Refunds received" value={m(p.refundReceivedMinor)} hint="Vendor refunds received by this founder" />}
          <Stat label="Net position" value={formatSignedMinor(p.grossNetPositionMinor, cfg.currency)} tone={p.grossNetPositionMinor > 0 ? 'receive' : p.grossNetPositionMinor < 0 ? 'pay' : undefined} hint="Paid − fair share" />
          {p.reimbursedMinor > 0 && <Stat label="Reimbursed by business" value={m(p.reimbursedMinor)} hint="Part of your expenses the business paid back; not shared between founders" />}
          <Stat label="Settled so far" value={`${m(p.settledPaidMinor)} paid · ${m(p.settledReceivedMinor)} received`} />
          <Stat label="Amount receivable" value={m(p.outstandingReceivableMinor)} tone={p.outstandingReceivableMinor > 0 ? 'receive' : undefined} />
          <Stat label="Amount payable" value={m(p.outstandingPayableMinor)} tone={p.outstandingPayableMinor > 0 ? 'pay' : undefined} />
          {p.overSettledMinor > 0 && <Stat label="Over-settled by" value={m(p.overSettledMinor)} tone="pay" hint="Paid or received more than was due" />}
          <Stat label="Outstanding" value={formatSignedMinor(p.outstandingMinor, cfg.currency)} tone={p.outstandingMinor > 0 ? 'receive' : p.outstandingMinor < 0 ? 'pay' : undefined} />
        </dl>
      </section>
      <CalcNotes reconciliation={reconciliation} warnings={warnings} currency={cfg.currency} />

      {history.some((h) => h.type === 'settlement') && (
        <section className="card p-5 sm:p-6" aria-labelledby="set-h">
          <h3 id="set-h" className="mb-3 text-base font-extrabold text-cb-navy">Settlement history</h3>
          <ul className="divide-y divide-surface-line">
            {history.filter((h) => h.type === 'settlement').map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link to={`/transactions/${h.id}`} className="font-semibold text-cb-navy hover:underline">{h.txnNumber} · {h.transactionDate}</Link>
                <span className="flex items-center gap-2"><StatusBadge status={h.status} /><span className="font-bold tabular-nums">{m(h.amountMinor)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 sm:p-6" aria-labelledby="hist-h">
        <h3 id="hist-h" className="mb-3 text-base font-extrabold text-cb-navy">Transaction history</h3>
        {history.length === 0 ? <p className="text-sm text-ink-muted">No transactions involve this founder yet.</p> : (
          <ul className="divide-y divide-surface-line">
            {history.map((h) => (
              <li key={h.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/transactions/${h.id}`} className="font-semibold text-cb-navy hover:underline">{h.description}</Link>
                    <p className="text-xs text-ink-muted">{h.txnNumber} · {h.transactionDate} · {typeLabel(h.type)}</p>
                  </div>
                  <div className="flex items-center gap-2"><StatusBadge status={h.status} /><span className="font-bold tabular-nums">{m(h.amountMinor)}</span></div>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {h.counted ? h.effects.map((e) => `${KIND[e.kind] ?? e.kind}: ${m(e.amountMinor)}`).join(' · ') : 'Not counted in the figures above (only approved transactions are).'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
