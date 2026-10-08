import { describe, expect, it } from 'vitest';
import { RULES, TRANSACTION_TYPES, canTransition, checkTypeRules } from '../src/domain/transactionRules';

const base = { hasSplit: false } as const;

describe('transaction type rules', () => {
  it('defines a rule for every one of the 7 plan types', () => {
    expect([...TRANSACTION_TYPES].sort()).toEqual(['business_expense', 'founder_contribution', 'founder_loan', 'other', 'refund', 'reimbursement', 'settlement']);
    for (const t of TRANSACTION_TYPES) expect(RULES[t]).toBeDefined();
  });
  it('business expense needs category, paid-by and a split', () => {
    const codes = checkTypeRules({ type: 'business_expense', ...base }).map((i) => i.path);
    expect(codes).toEqual(expect.arrayContaining(['categoryId', 'paidByFounderId', 'split']));
  });
  it('contribution/loan/reimbursement/settlement forbid splits', () => {
    for (const type of ['founder_contribution', 'founder_loan', 'reimbursement', 'settlement'] as const) {
      const issues = checkTypeRules({ type, paidByFounderId: 'a', counterpartyFounderId: type === 'settlement' ? 'b' : undefined, hasSplit: true });
      expect(issues.map((i) => i.path)).toContain('split');
    }
  });
  it('settlement needs a different receiving founder', () => {
    expect(checkTypeRules({ type: 'settlement', paidByFounderId: 'a', ...base }).map((i) => i.path)).toContain('counterpartyFounderId');
    expect(checkTypeRules({ type: 'settlement', paidByFounderId: 'a', counterpartyFounderId: 'a', ...base }).map((i) => i.code)).toContain('SAME_FOUNDER');
    expect(checkTypeRules({ type: 'settlement', paidByFounderId: 'a', counterpartyFounderId: 'b', ...base })).toEqual([]);
  });
  it('"other" requires notes', () => {
    expect(checkTypeRules({ type: 'other', ...base }).map((i) => i.path)).toContain('notes');
    expect(checkTypeRules({ type: 'other', notes: 'why', ...base })).toEqual([]);
  });
});

describe('status lifecycle', () => {
  it('allows the documented transitions only', () => {
    expect(canTransition('draft', 'pending_approval')).toBe(true);
    expect(canTransition('draft', 'approved')).toBe(false);
    expect(canTransition('pending_approval', 'approved')).toBe(true);
    expect(canTransition('approved', 'voided')).toBe(true);
    expect(canTransition('approved', 'draft')).toBe(false);
    expect(canTransition('voided', 'draft')).toBe(false);
    expect(canTransition('voided', 'voided')).toBe(false);
  });
});
