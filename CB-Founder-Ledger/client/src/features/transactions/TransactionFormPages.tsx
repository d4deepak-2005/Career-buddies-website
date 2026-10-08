import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox } from '../../components/ui';
import type { Transaction } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { TransactionForm } from './TransactionForm';

export function AddTransactionPage() {
  return <TransactionForm />;
}

export function EditTransactionPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const res = useResource<{ transaction: Transaction }>(`/transactions/${id}`);
  if (res.loading) return <p role="status" className="py-10 text-center text-sm text-ink-muted">Loading…</p>;
  if (res.error || !res.data) return <ErrorBox error={res.error ?? 'Transaction not found'} onRetry={res.reload} />;
  const t = res.data.transaction;
  const allowed = (user?.role === 'admin' || t.createdBy?.id === user?.id) && (t.status === 'draft' || t.status === 'pending_approval');
  if (!allowed) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="font-bold text-cb-navy">This transaction can't be edited</p>
        <p className="mt-1 text-sm text-ink-muted">Only the creator or an admin can edit, and only while it is a draft or pending approval.</p>
        <Link to={`/transactions/${t.id}`} className="btn-primary mt-5">Back to transaction</Link>
      </div>
    );
  }
  return <TransactionForm key={`${t.id}-${t.version}`} existing={t} />;
}
