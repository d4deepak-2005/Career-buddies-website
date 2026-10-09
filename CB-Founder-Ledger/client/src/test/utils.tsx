import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthContext';
import type { AppConfig, Category, Founder } from '../lib/types';

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown };

/** Stub global fetch with a route table keyed by "METHOD /path". */
const need = (category: string, paidBy: string, counterparty: string, split: string, notes: string, method = 'forbidden', linkedExpense = 'forbidden') => ({ category, paidBy, counterparty, split, notes, method, linkedExpense });
export const configFixture = {
  currency: { code: 'INR', minorUnits: 2 },
  settings: {
    business: { displayName: 'CareerBuddies Founder Ledger', shortName: 'CB Founder Ledger', organisationName: 'CareerBuddies' },
    branding: { hasCustomLogo: false, logoVersion: 0, logoAlt: 'CareerBuddies logo', logoUrl: null },
    regional: { locale: 'en-US', timeZone: 'Asia/Kolkata' },
    dashboard: { defaultPeriod: 'all', recentTransactionsCount: 10, upcomingRecurringCount: 5 },
    approvals: { allowSelfApproval: true, requireRejectionReason: false },
    settlements: { paymentMethods: ['UPI', 'Bank transfer', 'Cash', 'Cheque'] },
    recurring: { reminderDaysAhead: 7 },
    reports: { fiscalYearStartMonth: 4 },
    version: 1,
  },
  imageMaxBytes: 2 * 1024 * 1024,
  receipts: { maxBytes: 5 * 1024 * 1024, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'], maxPerTransaction: 10 },
  transactionTypes: [
    { value: 'business_expense', label: 'Business Expense', rules: need('required', 'required', 'forbidden', 'required', 'optional') },
    { value: 'founder_contribution', label: 'Founder Contribution', rules: need('optional', 'required', 'forbidden', 'forbidden', 'optional') },
    { value: 'founder_loan', label: 'Founder Loan', rules: need('optional', 'required', 'forbidden', 'forbidden', 'optional') },
    { value: 'reimbursement', label: 'Reimbursement', rules: need('optional', 'required', 'forbidden', 'forbidden', 'optional', 'forbidden', 'required') },
    { value: 'settlement', label: 'Settlement', rules: need('optional', 'required', 'required', 'forbidden', 'optional', 'optional') },
    { value: 'refund', label: 'Refund', rules: need('optional', 'required', 'forbidden', 'required', 'optional') },
    { value: 'other', label: 'Other', rules: need('optional', 'optional', 'forbidden', 'optional', 'required') },
  ],
  transactionStatuses: ['draft', 'pending_approval', 'approved', 'rejected', 'voided'],
  splitMethods: ['equal', 'percentage', 'exact', 'shares', 'custom'],
} as AppConfig;
export const foundersFixture: Founder[] = [
  { id: 'f1', name: 'Asha', email: null, userId: '2', defaultSharePercent: null, active: true },
  { id: 'f2', name: 'Bilal', email: null, userId: null, defaultSharePercent: null, active: true },
  { id: 'f3', name: 'Chen', email: null, userId: null, defaultSharePercent: null, active: true },
];
export const categoriesFixture: Category[] = [{ id: 'c1', name: 'Software', slug: 'software', description: null, active: true, isDevSeed: false }];

export function mockFetch(routes: Record<string, Handler | { status: number; body?: unknown }>) {
  const calls: string[] = [];
  routes = {
    'GET /config': { status: 200, body: configFixture },
    'GET /founders': { status: 200, body: { founders: foundersFixture } },
    'GET /categories': { status: 200, body: { categories: categoriesFixture } },
    ...routes,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const key = `${init?.method ?? 'GET'} ${url.replace('/api', '')}`;
      calls.push(key);
      const r = routes[key] ?? routes[key.split('?')[0] ?? key] ?? { status: 404, body: { error: { code: 'NOT_FOUND', message: 'nope' } } };
      const { status, body } = typeof r === 'function' ? r(url, init) : r;
      return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
    }),
  );
  return calls;
}

export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

export const founderUser = { id: '2', email: 'f@cb.test', name: 'Founder One', role: 'founder' as const };
export const adminUser = { id: '1', email: 'a@cb.test', name: 'Admin One', role: 'admin' as const };
export const unauth = { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } };
