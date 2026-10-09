import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { ErrorBox, StatusBadge } from '../../components/ui';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor } from '../../lib/money';
import type { RecommendationsResponse, SettlementSummaryResponse } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { CalcNotes, Stat } from './parts';
import { RecordPaymentButton, SettlementRowActions } from './SettlementActions';

export function SettlementsPage() {
  const cfg = useAppConfig();
  const rec = useResource<RecommendationsResponse>('/settlements/recommendations');
  const sum = useResource<SettlementSummaryResponse>('/settlements/summary');
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = () => { rec.reload(); sum.reload(); };
  if ((rec.loading && !rec.data) || (sum.loading && !sum.data)) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Calculating…</p>;
  const err = rec.error ?? sum.error;
  if (err) return <ErrorBox error={err} onRetry={() => { rec.reload(); sum.reload(); }} />;
  if (!rec.data || !sum.data) return null;
  const m = (n: number) => formatMinor(n, cfg.currency);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {notice && <p role="status" className="rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{notice}</p>}
      <CalcNotes reconciliation={sum.data.reconciliation} warnings={sum.data.warnings} currency={cfg.currency} />

      <section className="card p-5 sm:p-6" aria-labelledby="rec-h">
        <h2 id="rec-h" className="text-lg font-extrabold text-cb-navy">Who pays whom</h2>
        <p className="mb-4 mt-1 text-sm text-ink-muted">The simplest set of payments that clears every balance. A suggestion is not a payment: record it once it has been paid, and it counts when it is confirmed.</p>
        {rec.data.recommendations.length === 0 ? (
          <p className="rounded-xl bg-cb-green/10 px-4 py-3 text-sm font-semibold text-cb-green-dark">{rec.data.unresolvedPayableMinor > 0 ? 'No payments between founders are needed.' : 'Everyone is settled. No payments needed.'}</p>
        ) : (
          <ol className="space-y-2" aria-label="Recommended payments">
            {rec.data.recommendations.map((r, i) => (
              <li key={`${r.payer.id}-${r.receiver.id}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-surface-line p-3">
                <span className="font-semibold text-danger">{r.payer.name}</span>
                <span className="text-xs text-ink-muted">pays</span>
                <ArrowRight className="h-4 w-4 text-ink-faint" aria-hidden />
                <span className="font-semibold text-cb-green-dark">{r.receiver.name}</span>
                <span className="ml-auto text-lg font-extrabold tabular-nums text-cb-navy">{m(r.amountMinor)}</span>
                <RecordPaymentButton payer={r.payer} receiver={r.receiver} suggestedMinor={r.amountMinor} onDone={(msg) => { setNotice(msg); refresh(); }} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="sum-h">
        <h2 id="sum-h" className="mb-4 text-lg font-extrabold text-cb-navy">Summary</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Still to pay" value={m(sum.data.totals.outstandingPayableMinor)} tone={sum.data.totals.outstandingPayableMinor > 0 ? 'pay' : undefined} />
          <Stat label="Still to receive" value={m(sum.data.totals.outstandingReceivableMinor)} tone={sum.data.totals.outstandingReceivableMinor > 0 ? 'receive' : undefined} />
          {sum.data.totals.netSettlementMinor !== undefined && <Stat label="Net settlement" value={m(sum.data.totals.netSettlementMinor)} hint="Receivable − payable; zero when the books balance" />}
          <Stat label="Settled so far" value={m(sum.data.totals.settledMinor)} hint={`${sum.data.counts.official} payment${sum.data.counts.official === 1 ? '' : 's'}`} />
          <Stat label="Payments needed" value={String(sum.data.counts.recommendedTransfers)} />
          {sum.data.totals.businessBorneMinor > 0 && <Stat label="Reimbursed by the business" value={m(sum.data.totals.businessBorneMinor)} hint="Business-borne — not part of any payment above" />}
        </dl>
        {sum.data.counts.awaitingApproval > 0 && <p className="mt-4 text-sm text-ink-muted">{sum.data.counts.awaitingApproval} settlement{sum.data.counts.awaitingApproval === 1 ? ' is' : 's are'} waiting for approval and not counted yet.</p>}
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="hist-h">
        <h2 id="hist-h" className="mb-3 text-lg font-extrabold text-cb-navy">Settlement history</h2>
        {sum.data.history.length === 0 ? <p className="text-sm text-ink-muted">No settlements recorded yet.</p> : (
          <ul className="divide-y divide-surface-line">
            {sum.data.history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <span className="font-semibold">{h.payer?.name ?? '—'} → {h.receiver?.name ?? '—'}</span>
                <StatusBadge status={h.status} />
                <span className="text-xs text-ink-muted">{h.transactionDate}{h.method ? ` · ${h.method}` : ''} · {h.txnNumber}{h.counted ? '' : ' · not counted'}</span>
                <span className="ml-auto font-bold tabular-nums">{m(h.amountMinor)}</span>
                {(h.status === 'pending_approval' || h.status === 'approved') && <div className="w-full"><SettlementRowActions item={h} onDone={refresh} /></div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
