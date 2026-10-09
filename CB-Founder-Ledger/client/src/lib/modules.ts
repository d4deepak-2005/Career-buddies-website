import { BarChart3, CalendarClock, CheckSquare, Handshake, LayoutDashboard, PlusCircle, ReceiptText, ScrollText, Settings, Users, type LucideIcon } from 'lucide-react';

export type Role = 'admin' | 'founder';

export interface AppModule {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Short description (used for tooltips / the page subtitle). */
  summary: string;
  /** Roles that see this module in navigation. Server-side checks remain authoritative. */
  roles: Role[];
}

const both: Role[] = ['admin', 'founder'];

export const MODULES: AppModule[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, summary: 'Overall investment, expenses, settlements, founder positions and charts.', roles: both },
  { path: '/founders', label: 'Founders', icon: Users, summary: 'Founder profiles, contribution, fair share, net position and individual ledger.', roles: both },
  { path: '/transactions', label: 'Transactions', icon: ReceiptText, summary: 'Complete transaction ledger with search, filters, status and receipts.', roles: both },
  { path: '/transactions/new', label: 'Add Transaction', icon: PlusCircle, summary: 'Add an expense, contribution, loan, reimbursement, settlement or other transaction.', roles: both },
  { path: '/settlements', label: 'Settlements', icon: Handshake, summary: 'Who owes whom, recorded payments and their confirmation.', roles: both },
  { path: '/approvals', label: 'Approvals', icon: CheckSquare, summary: 'Pending, approved and rejected transactions with who decided and when.', roles: both },
  { path: '/recurring', label: 'Recurring & Subscriptions', icon: CalendarClock, summary: 'Monthly, quarterly and yearly recurring payments, renewals and reminders.', roles: both },
  { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, summary: 'Monthly and annual spend, category analysis, founder summaries and exports.', roles: both },
  { path: '/audit-log', label: 'Audit Log', icon: ScrollText, summary: 'Who changed what and when (append-only).', roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: Settings, summary: 'Business, branding, founders, categories, rules and access.', roles: ['admin'] },
];

export function modulesFor(role: Role): AppModule[] {
  return MODULES.filter((m) => m.roles.includes(role));
}
