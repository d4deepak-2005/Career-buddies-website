export type TransactionType = 'business_expense' | 'founder_contribution' | 'founder_loan' | 'reimbursement' | 'settlement' | 'refund' | 'other';
export type TransactionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'voided';
export type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares' | 'custom';
export type Need = 'required' | 'optional' | 'forbidden';

export interface TypeRules { category: Need; paidBy: Need; counterparty: Need; split: Need; notes: Need; method: Need }

export interface AppConfig {
  currency: { code: string; minorUnits: number };
  receipts: { maxBytes: number; allowedExtensions: string[]; maxPerTransaction: number };
  transactionTypes: Array<{ value: TransactionType; label: string; rules: TypeRules }>;
  transactionStatuses: TransactionStatus[];
  splitMethods: SplitMethod[];
}

export interface Named { id: string; name: string }
export interface Founder { id: string; name: string; email: string | null; userId: string | null; defaultSharePercent: number | null; active: boolean }
export interface Category { id: string; name: string; slug: string; description: string | null; active: boolean; isDevSeed: boolean }

export interface SplitEntry { founderId: string; founderName: string; percent?: number; shares?: number; amountMinor?: number; note?: string; allocatedMinor: number }
export interface Split { method: SplitMethod; entries: SplitEntry[] }

export interface Transaction {
  id: string; txnNumber: string; type: TransactionType; amountMinor: number; description: string; notes: string | null; method: string | null;
  category: Named | null; paidBy: Named | null; counterparty: Named | null; transactionDate: string; status: TransactionStatus;
  split: Split | null; receiptCount: number; void: { reason: string; voidedAt: string; voidedBy: Named | null } | null;
  version: number; createdBy: Named | null; updatedBy: Named | null; createdAt: string; updatedAt: string;
}

export interface Receipt { id: string; transactionId: string; fileName: string; mimeType: string; sizeBytes: number; sha256: string; uploadedAt: string; uploadedBy: Named }
export interface HistoryItem { id: string; version: number; action: string; at: string; reason: string | null; actor: Named }
export interface TransactionList { items: Transaction[]; page: number; pageSize: number; total: number }

/** Everything below is calculated by the server (GET /founders/financial-positions etc.). The client only displays it. */
export type PositionAction = 'receive' | 'pay' | 'settled';
export interface FounderPosition {
  founderId: string; founderName: string; active: boolean;
  expensePaidMinor: number; refundReceivedMinor: number; reimbursedMinor: number; paidMinor: number;
  contributionMinor: number; loanOutstandingMinor: number; fairShareMinor: number; grossNetPositionMinor: number;
  businessFundedShareMinor: number; founderBalanceMinor: number; overSettledMinor: number;
  settledPaidMinor: number; settledReceivedMinor: number; outstandingMinor: number;
  outstandingReceivableMinor: number; outstandingPayableMinor: number;
  action: PositionAction; settlementStatus: 'settled' | 'partially_settled' | 'open';
}
export type ReconciliationStatus = 'PASS' | 'PASS_WITH_EXTERNAL' | 'REVIEW' | 'FAIL';
export interface Reconciliation {
  status: ReconciliationStatus; explanation: string; checks: Array<{ code: string; ok: boolean; detail: string }>;
  totalPaidMinor: number; totalFairShareMinor: number; sumGrossNetPositionMinor: number; externalMinor: number; founderBalanceSumMinor: number;
  totalReceivableMinor: number; totalPayableMinor: number; recommendedTotalMinor: number; unresolvedPayableMinor: number; unresolvedReceivableMinor: number; isBalanced: boolean;
}
export interface CalcWarning { code: string; level: 'warning' | 'info'; transactionId: string | null; founderId?: string | null; message: string }
export interface PositionsResponse {
  calculatedAt: string; currency: { code: string; minorUnits: number }; positions: FounderPosition[]; reconciliation: Reconciliation;
  included: Record<string, number>; excluded: { byStatus: Record<string, number>; unclassifiedOther: number; invalid: number }; warnings: CalcWarning[];
}
export interface LedgerHistoryItem {
  id: string; txnNumber: string; transactionDate: string; type: TransactionType; status: TransactionStatus; description: string;
  amountMinor: number; counted: boolean; effects: Array<{ kind: string; amountMinor: number }>;
}
export interface FounderLedgerResponse { calculatedAt: string; position: FounderPosition; history: LedgerHistoryItem[]; reconciliation: Reconciliation; warnings: CalcWarning[] }
export interface RecommendationsResponse {
  calculatedAt: string; recommendations: Array<{ payer: Named; receiver: Named; amountMinor: number }>;
  unresolvedPayableMinor: number; unresolvedReceivableMinor: number; reconciliation: Reconciliation;
}
export interface SettlementSummaryResponse {
  calculatedAt: string;
  totals: { settledMinor: number; outstandingPayableMinor: number; outstandingReceivableMinor: number; recommendedTransfersMinor: number; externalMinor: number };
  counts: { official: number; awaitingApproval: number; voidedOrRejected: number; recommendedTransfers: number };
  history: Array<{ id: string; txnNumber: string; transactionDate: string; status: TransactionStatus; payer: Named | null; receiver: Named | null; amountMinor: number; method: string | null; counted: boolean }>;
  reconciliation: Reconciliation; warnings: CalcWarning[];
}
