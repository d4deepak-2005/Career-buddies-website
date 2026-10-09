import { calculate, type CalcTransaction, type CalculationResult, type FounderFinancialPosition, type LedgerEffect } from '../../domain/calculationEngine';
import type { TransactionStatus, TransactionType } from '../../domain/transactionRules';
import { FOUNDER_ORDER, Founder } from '../../models/Founder';
import { Transaction } from '../../models/Transaction';

interface StoredTx {
  _id: unknown; txnNumber: string; type: TransactionType; status: TransactionStatus; amountMinor: number; description: string;
  transactionDate: Date; method?: string | null; paidByFounderId?: unknown; counterpartyFounderId?: unknown; categoryId?: unknown; reimbursesTransactionId?: unknown;
  split?: { entries: Array<{ founderId: unknown; allocatedMinor: number }> } | null;
}

export interface FounderMeta { role: string | null; photoUrl: string | null; displayOrder: number; active: boolean }

export interface Loaded {
  calculatedAt: string;
  founderMeta: Map<string, FounderMeta>;
  result: CalculationResult;
  names: Map<string, string>;
  stored: StoredTx[];
}

const idOrNull = (v: unknown) => (v ? String(v) : null);

/**
 * `asOf` (dashboard period end, YYYY-MM-DD) feeds the engine only transactions dated on or before it, so balances are "as of" that day.
 * Recomputes everything from the database on every call (spec C-13): no cache to invalidate, so edits,
 * voids and new settlements are visible immediately. Only the fields the engine needs are read.
 */
export async function loadCalculation(opts: { asOf?: string } = {}): Promise<Loaded> {
  const [founders, stored] = await Promise.all([
    Founder.find().sort(FOUNDER_ORDER).select('name active role displayOrder photo').lean(),
    Transaction.find()
      .select('txnNumber type status amountMinor description transactionDate method paidByFounderId counterpartyFounderId categoryId reimbursesTransactionId split.entries.founderId split.entries.allocatedMinor')
      .sort({ transactionDate: 1, _id: 1 })
      .lean<StoredTx[]>(),
  ]);

  const calcTxs: CalcTransaction[] = stored.filter((t) => !opts.asOf || t.transactionDate.toISOString().slice(0, 10) <= opts.asOf).map((t) => ({
    id: String(t._id),
    txnNumber: t.txnNumber,
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    type: t.type,
    status: t.status,
    amountMinor: t.amountMinor,
    reimbursesTransactionId: idOrNull(t.reimbursesTransactionId),
    paidByFounderId: idOrNull(t.paidByFounderId),
    counterpartyFounderId: idOrNull(t.counterpartyFounderId),
    split: t.split ? { entries: t.split.entries.map((e) => ({ founderId: String(e.founderId), allocatedMinor: e.allocatedMinor })) } : null,
  }));

  const result = calculate({ founders: founders.map((f) => ({ id: String(f._id), name: f.name, active: f.active })), transactions: calcTxs });
  const founderMeta = new Map(founders.map((f) => [String(f._id), { role: f.role ?? null, displayOrder: f.displayOrder ?? 1000, active: f.active, photoUrl: f.photo ? `/api/founders/${String(f._id)}/photo?v=${f.photo.updatedAt.getTime()}` : null }]));
  return { calculatedAt: new Date().toISOString(), founderMeta, result, names: new Map(founders.map((f) => [String(f._id), f.name])), stored };
}

const named = (names: Map<string, string>, id: string | null) => (id ? { id, name: names.get(id) ?? 'Unknown' } : null);

function effectsByTx(effects: LedgerEffect[], founderId?: string) {
  const m = new Map<string, Array<{ kind: string; amountMinor: number }>>();
  for (const e of effects) {
    if (founderId && e.founderId !== founderId) continue;
    const list = m.get(e.transactionId) ?? [];
    list.push({ kind: e.kind, amountMinor: e.amountMinor });
    m.set(e.transactionId, list);
  }
  return m;
}

/** Every transaction involving the founder (any status) with the effects it had on this founder's figures. */
export function founderHistory(l: Loaded, founderId: string) {
  const fx = effectsByTx(l.result.effects, founderId);
  return l.stored
    .filter((t) => String(t.paidByFounderId) === founderId || String(t.counterpartyFounderId) === founderId || (t.split?.entries ?? []).some((e) => String(e.founderId) === founderId))
    .map((t) => {
      const id = String(t._id);
      const effects = fx.get(id) ?? [];
      return {
        id, txnNumber: t.txnNumber, transactionDate: t.transactionDate.toISOString().slice(0, 10), type: t.type, status: t.status,
        description: t.description, amountMinor: t.amountMinor, counted: effects.length > 0, effects,
      };
    })
    .reverse();
}

export function recommendationsView(l: Loaded) {
  return l.result.recommendations.map((r) => ({
    payer: named(l.names, r.payerFounderId)!, receiver: named(l.names, r.receiverFounderId)!, amountMinor: r.amountMinor,
  }));
}

export function settlementSummary(l: Loaded) {
  const official = new Map(l.result.effects.filter((e) => e.kind === 'settlement_paid').map((e) => [e.transactionId, e.amountMinor]));
  const history = l.stored
    .filter((t) => t.type === 'settlement')
    .map((t) => ({
      id: String(t._id), txnNumber: t.txnNumber, transactionDate: t.transactionDate.toISOString().slice(0, 10), status: t.status,
      payer: named(l.names, idOrNull(t.paidByFounderId)), receiver: named(l.names, idOrNull(t.counterpartyFounderId)),
      amountMinor: t.amountMinor, method: t.method ?? null, counted: official.has(String(t._id)),
    }))
    .reverse();
  const r = l.result.reconciliation;
  const countedTotal = [...official.values()].reduce((s, n) => s + n, 0);
  return {
    totals: {
      settledMinor: countedTotal,
      outstandingPayableMinor: r.totalPayableMinor,
      outstandingReceivableMinor: r.totalReceivableMinor,
      recommendedTransfersMinor: r.recommendedTotalMinor,
      /** Reimbursed by the business (linked reimbursements). Business-borne: not recoverable from founders and not a balance. */
      businessBorneMinor: r.businessBorneMinor,
    },
    counts: {
      official: official.size,
      awaitingApproval: history.filter((h) => h.status === 'draft' || h.status === 'pending_approval').length,
      voidedOrRejected: history.filter((h) => h.status === 'voided' || h.status === 'rejected').length,
      recommendedTransfers: l.result.recommendations.length,
    },
    history,
  };
}

export type PositionView = FounderFinancialPosition;
