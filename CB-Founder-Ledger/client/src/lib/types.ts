export type TransactionType = 'business_expense' | 'founder_contribution' | 'founder_loan' | 'reimbursement' | 'settlement' | 'refund' | 'other';
export type TransactionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'voided';
export type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares' | 'custom';
export type Need = 'required' | 'optional' | 'forbidden';

export interface TypeRules { category: Need; paidBy: Need; counterparty: Need; split: Need; notes: Need }

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
  id: string; txnNumber: string; type: TransactionType; amountMinor: number; description: string; notes: string | null;
  category: Named | null; paidBy: Named | null; counterparty: Named | null; transactionDate: string; status: TransactionStatus;
  split: Split | null; receiptCount: number; void: { reason: string; voidedAt: string; voidedBy: Named | null } | null;
  version: number; createdBy: Named | null; updatedBy: Named | null; createdAt: string; updatedAt: string;
}

export interface Receipt { id: string; transactionId: string; fileName: string; mimeType: string; sizeBytes: number; sha256: string; uploadedAt: string; uploadedBy: Named }
export interface HistoryItem { id: string; version: number; action: string; at: string; reason: string | null; actor: Named }
export interface TransactionList { items: Transaction[]; page: number; pageSize: number; total: number }
