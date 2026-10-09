import { Banknote } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmDialog, FieldError, Label, detailsByPath } from '../../components/ui';
import { ApiError, api } from '../../lib/api';
import { useAppConfig } from '../../lib/AppConfigContext';
import { formatMinor, minorToInput, parseMajorToMinor } from '../../lib/money';
import type { Named, Transaction } from '../../lib/types';
import { DecisionControls } from '../approvals/DecisionControls';

const today = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

/**
 * Record a settlement payment from a suggestion. A suggestion is not a payment: this creates a PENDING settlement that only counts
 * once it is confirmed (approved). The server rejects self-settlement, duplicates and amounts above what is still owed.
 */
export function RecordPaymentButton({ payer, receiver, suggestedMinor, onDone }: { payer: Named; receiver: Named; suggestedMinor: number; onDone: (msg: string) => void }) {
  const cfg = useAppConfig();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const minor = parseMajorToMinor(amount, cfg.currency.minorUnits);
  const server = detailsByPath(error);

  function show() { setAmount(minorToInput(suggestedMinor, cfg.currency.minorUnits)); setDate(today()); setError(null); setRequestId(crypto.randomUUID()); setOpen(true); }
  async function submit() {
    if (minor === null || minor < 1) { setError(new ApiError(400, 'VALIDATION_ERROR', 'Enter a valid amount greater than 0', [{ path: 'amountMinor', message: 'Enter a valid amount greater than 0' }])); return; }
    setBusy(true); setError(null);
    try {
      await api('/settlements/record', { method: 'POST', body: { payerFounderId: payer.id, receiverFounderId: receiver.id, amountMinor: minor, transactionDate: date, ...(method ? { method } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}), clientRequestId: requestId } });
      setOpen(false);
      onDone(`Payment of ${formatMinor(minor, cfg.currency)} from ${payer.name} to ${receiver.name} recorded. It counts once it is confirmed.`);
    } catch (e) { setError(e instanceof ApiError ? e : new ApiError(0, 'NETWORK', 'Could not reach the server')); } finally { setBusy(false); }
  }

  return (
    <>
      <button className="btn-primary !min-h-9 !px-3 text-sm" onClick={show} aria-label={`Record payment from ${payer.name} to ${receiver.name}`}><Banknote className="h-4 w-4" aria-hidden />Record payment</button>
      {open && (
        <ConfirmDialog title="Record a settlement payment" confirmLabel="Record payment" busy={busy} onConfirm={() => void submit()} onCancel={() => setOpen(false)}>
          <p><strong>{payer.name}</strong> pays <strong>{receiver.name}</strong>. This is recorded as <em>pending</em> and changes no balance until it is confirmed.</p>
          <div className="mt-4 space-y-3">
            <div><Label htmlFor="rp-amount">Amount ({cfg.currency.code})</Label><input id="rp-amount" inputMode="decimal" className="field font-bold tabular-nums" value={amount} onChange={(e) => setAmount(e.target.value)} /><FieldError message={server['amountMinor']} /></div>
            <div><Label htmlFor="rp-date">Payment date</Label><input id="rp-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /><FieldError message={server['transactionDate']} /></div>
            <div><Label htmlFor="rp-method" hint="(optional)">Payment method</Label>
              <select id="rp-method" className="field" value={method} onChange={(e) => setMethod(e.target.value)}><option value="">Not specified</option>{cfg.settings.settlements.paymentMethods.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div><Label htmlFor="rp-notes" hint="(optional)">Notes</Label><input id="rp-notes" className="field" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          {error && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error.message}{typeof (error.details as Array<{ remainingMinor?: number }> | undefined)?.[0]?.remainingMinor === 'number' ? ` (still owed: ${formatMinor((error.details as Array<{ remainingMinor: number }>)[0]!.remainingMinor, cfg.currency)})` : ''}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}

type HistoryItem = { id: string; version?: number; txnNumber: string; status: Transaction['status'] };

/** Confirm / reject a pending settlement, or (admin) reverse an approved one by voiding it. Nothing is deleted. */
export function SettlementRowActions({ item, onDone }: { item: HistoryItem; onDone: () => void }) {
  const { user } = useAuth();
  const [reversing, setReversing] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tx = { id: item.id, version: item.version ?? 1, txnNumber: item.txnNumber, status: item.status } as Transaction;
  async function reverse() {
    setBusy(true); setError(null);
    try { await api(`/transactions/${item.id}/void`, { method: 'POST', body: { expectedVersion: item.version ?? 1, reason: reason.trim() } }); setReversing(false); setReason(''); onDone(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong'); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {item.status === 'pending_approval' && <DecisionControls tx={tx} onDone={onDone} compact />}
      {user?.role === 'admin' && (item.status === 'approved' || item.status === 'pending_approval') && (
        <button className="btn-ghost !min-h-9 border border-danger/40 !px-3 text-danger" onClick={() => { setError(null); setReversing(true); }}>{item.status === 'approved' ? 'Reverse' : 'Void'}</button>
      )}
      {reversing && (
        <ConfirmDialog title={`${item.status === 'approved' ? 'Reverse' : 'Void'} ${item.txnNumber}?`} confirmLabel={item.status === 'approved' ? 'Reverse settlement' : 'Void'} danger busy={busy} disabled={reason.trim().length < 5} onConfirm={() => void reverse()} onCancel={() => setReversing(false)}>
          <p>The settlement stays in the history marked voided, and the suggested payments are recalculated.</p>
          <div className="mt-3"><Label htmlFor="rev-reason">Reason (required)</Label><textarea id="rev-reason" className="field min-h-20 py-2" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
