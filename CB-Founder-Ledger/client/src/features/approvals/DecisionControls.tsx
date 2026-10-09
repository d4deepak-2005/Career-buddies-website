import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Label } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useAppConfig } from '../../lib/AppConfigContext';
import type { Transaction } from '../../lib/types';

/**
 * Approve / Reject for a pending transaction (Product Plan §11). The server decides who may (including the self-approval rule in
 * Settings → Approval rules); the UI only shows the buttons and displays the server's answer.
 */
export function DecisionControls({ tx, onDone, compact }: { tx: Transaction; onDone: () => void; compact?: boolean }) {
  const cfg = useAppConfig();
  const [outcome, setOutcome] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (tx.status !== 'pending_approval') return null;
  const needReason = outcome === 'reject' && cfg.settings.approvals.requireRejectionReason;

  async function submit() {
    if (!outcome) return;
    setBusy(true); setError(null);
    try {
      await api(`/transactions/${tx.id}/${outcome}`, { method: 'POST', body: { expectedVersion: tx.version, ...(comment.trim() ? { comment: comment.trim() } : {}) } });
      setOutcome(null); setComment('');
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? (e.code === 'VERSION_CONFLICT' ? 'Someone else changed this transaction. It has been reloaded — please check and try again.' : e.message) : 'Something went wrong');
      if (e instanceof ApiError && e.code === 'VERSION_CONFLICT') onDone();
    } finally { setBusy(false); }
  }

  const size = compact ? '!min-h-9 !px-3' : '';
  return (
    <>
      <button className={`btn bg-cb-green text-white hover:bg-cb-green-dark ${size}`} onClick={() => { setError(null); setOutcome('approve'); }} aria-label={`Approve ${tx.txnNumber}`}><Check className="h-4 w-4" aria-hidden />Approve</button>
      <button className={`btn border border-danger text-danger hover:bg-danger-soft ${size}`} onClick={() => { setError(null); setOutcome('reject'); }} aria-label={`Reject ${tx.txnNumber}`}><X className="h-4 w-4" aria-hidden />Reject</button>
      {outcome && (
        <ConfirmDialog
          title={outcome === 'approve' ? `Approve ${tx.txnNumber}?` : `Reject ${tx.txnNumber}?`}
          confirmLabel={outcome === 'approve' ? 'Approve' : 'Reject'}
          danger={outcome === 'reject'}
          busy={busy}
          disabled={needReason && comment.trim().length < 3}
          onConfirm={() => void submit()}
          onCancel={() => setOutcome(null)}
        >
          <p>{outcome === 'approve' ? 'Once approved, this transaction counts in every balance, report and settlement. It can then only be reversed by an admin (void).' : 'A rejected transaction never counts in any total and cannot be edited.'}</p>
          <div className="mt-4">
            <Label htmlFor="decision-comment" hint={needReason ? '(required)' : '(optional)'}>Comment</Label>
            <textarea id="decision-comment" className="field min-h-20 py-2" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          {error && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
