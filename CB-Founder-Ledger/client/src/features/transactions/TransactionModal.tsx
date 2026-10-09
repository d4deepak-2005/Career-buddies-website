import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ui';
import { Modal } from '../../components/Modal';
import { TransactionForm } from './TransactionForm';

/**
 * "Add transaction" dialog, shown over the Transactions page at /transactions/new (so links, the sidebar and the
 * dashboard's "Settle" prefill all keep working). Closing with unsaved input asks first; a successful save closes the
 * dialog and returns to the list with a confirmation.
 */
export function TransactionModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const close = useCallback((notice?: string) => navigate('/transactions', { replace: true, state: notice ? { notice, saved: Date.now() } : null }), [navigate]);
  const requestClose = useCallback(() => { if (dirty) setConfirming(true); else close(); }, [dirty, close]);
  void location;
  return (
    <>
      <Modal title="Add Transaction" onRequestClose={requestClose} escapeEnabled={!confirming} wide>
        <TransactionForm modal={{ onSaved: (_t, notice) => close(notice), onCancel: requestClose, onDirtyChange: setDirty }} />
      </Modal>
      {confirming && (
        <ConfirmDialog title="Discard this transaction?" confirmLabel="Discard" danger onConfirm={() => close()} onCancel={() => setConfirming(false)}>
          You have entered details that have not been saved. If you close now they will be lost.
        </ConfirmDialog>
      )}
    </>
  );
}
