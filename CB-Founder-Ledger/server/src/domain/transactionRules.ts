/**
 * Transaction types, per-type field rules and the status lifecycle (Product Plan §7, §11).
 *
 * DEVELOPMENT DECISIONS (the PDF does not say which fields each type needs) are encoded in RULES
 * below and documented in docs/PHASE-2.md. Changing them is a one-table edit.
 */

export const TRANSACTION_TYPES = [
  'business_expense',
  'founder_contribution',
  'founder_loan',
  'reimbursement',
  'settlement',
  'refund',
  'other',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  business_expense: 'Business Expense',
  founder_contribution: 'Founder Contribution',
  founder_loan: 'Founder Loan',
  reimbursement: 'Reimbursement',
  settlement: 'Settlement',
  refund: 'Refund',
  other: 'Other',
};

type Need = 'required' | 'optional' | 'forbidden';

export interface TypeRule {
  category: Need;
  paidBy: Need;
  counterparty: Need;
  split: Need;
  notes: Need;
}

export const RULES: Record<TransactionType, TypeRule> = {
  business_expense:     { category: 'required', paidBy: 'required', counterparty: 'forbidden', split: 'required',  notes: 'optional' },
  founder_contribution: { category: 'optional', paidBy: 'required', counterparty: 'forbidden', split: 'forbidden', notes: 'optional' },
  founder_loan:         { category: 'optional', paidBy: 'required', counterparty: 'forbidden', split: 'forbidden', notes: 'optional' },
  // paidBy = the founder being reimbursed (who paid a business expense personally)
  reimbursement:        { category: 'optional', paidBy: 'required', counterparty: 'forbidden', split: 'forbidden', notes: 'optional' },
  // paidBy = paying founder, counterparty = receiving founder
  settlement:           { category: 'optional', paidBy: 'required', counterparty: 'required',  split: 'forbidden', notes: 'optional' },
  refund:               { category: 'optional', paidBy: 'optional', counterparty: 'forbidden', split: 'optional',  notes: 'optional' },
  other:                { category: 'optional', paidBy: 'optional', counterparty: 'forbidden', split: 'optional',  notes: 'required' },
};

export const TRANSACTION_STATUSES = ['draft', 'pending_approval', 'approved', 'rejected', 'voided'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/** Statuses a new transaction may be created in. Approval itself is Phase 5. */
export const CREATABLE_STATUSES = ['draft', 'pending_approval'] as const;

/** Only these may be edited; approved/rejected/voided records are immutable (correct via void + new entry). */
export const EDITABLE_STATUSES: readonly TransactionStatus[] = ['draft', 'pending_approval'];

const TRANSITIONS: Record<TransactionStatus, readonly TransactionStatus[]> = {
  draft: ['pending_approval', 'voided'],
  // approved / rejected are only reachable through the Phase 5 approval workflow (no endpoint yet)
  pending_approval: ['approved', 'rejected', 'voided'],
  approved: ['voided'],
  rejected: ['voided'],
  voided: [],
};

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export interface RuleIssue { path: string; code: string; message: string }

export interface RuleSubject {
  type: TransactionType;
  categoryId?: string | null;
  paidByFounderId?: string | null;
  counterpartyFounderId?: string | null;
  notes?: string | null;
  hasSplit: boolean;
}

/** Cross-field rules that depend on the transaction type. */
export function checkTypeRules(s: RuleSubject): RuleIssue[] {
  const r = RULES[s.type];
  const issues: RuleIssue[] = [];
  const label = TRANSACTION_TYPE_LABELS[s.type];
  const check = (need: Need, present: boolean, path: string, what: string) => {
    if (need === 'required' && !present) issues.push({ path, code: 'REQUIRED_FOR_TYPE', message: `${what} is required for ${label}` });
    if (need === 'forbidden' && present) issues.push({ path, code: 'NOT_ALLOWED_FOR_TYPE', message: `${what} is not allowed for ${label}` });
  };
  check(r.category, !!s.categoryId, 'categoryId', 'Category');
  check(r.paidBy, !!s.paidByFounderId, 'paidByFounderId', 'Paid-by founder');
  check(r.counterparty, !!s.counterpartyFounderId, 'counterpartyFounderId', 'Receiving founder');
  check(r.split, s.hasSplit, 'split', 'A split');
  check(r.notes, !!s.notes?.trim(), 'notes', 'Notes');
  if (s.counterpartyFounderId && s.counterpartyFounderId === s.paidByFounderId) {
    issues.push({ path: 'counterpartyFounderId', code: 'SAME_FOUNDER', message: 'Paying and receiving founder must be different' });
  }
  return issues;
}
