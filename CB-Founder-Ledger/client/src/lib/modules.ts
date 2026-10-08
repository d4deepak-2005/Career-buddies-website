import { BarChart3, CalendarClock, CheckSquare, Handshake, LayoutDashboard, PlusCircle, ReceiptText, ScrollText, Settings, Users, type LucideIcon } from 'lucide-react';

export type Role = 'admin' | 'founder';

export interface AppModule {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Short description shown on the placeholder page. */
  summary: string;
  /** Delivery phase from the product plan (section 21). */
  phase: string;
  /** Roles that see this module in navigation. Server-side checks remain authoritative. */
  roles: Role[];
}

const both: Role[] = ['admin', 'founder'];

export const MODULES: AppModule[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, summary: 'Overall investment, expenses, settlements, founder positions and charts.', phase: 'Phase 4', roles: both },
  { path: '/transactions', label: 'Transactions', icon: ReceiptText, summary: 'Complete transaction ledger with search, filters, status and receipts.', phase: 'Phase 2', roles: both },
  { path: '/transactions/new', label: 'Add Transaction', icon: PlusCircle, summary: 'Add an expense, investment, founder loan, reimbursement, settlement or other transaction.', phase: 'Phase 2', roles: both },
  { path: '/founders', label: 'Founders', icon: Users, summary: 'Founder profiles, contribution, fair share, net position and individual ledger.', phase: 'Phase 3', roles: both },
  { path: '/settlements', label: 'Settlements', icon: Handshake, summary: 'Who owes whom, settlement amount, settlement history and mark-as-settled.', phase: 'Phase 3', roles: both },
  { path: '/approvals', label: 'Approvals', icon: CheckSquare, summary: 'Pending, approved and rejected transactions with action history.', phase: 'Phase 5', roles: both },
  { path: '/recurring', label: 'Recurring & Subscriptions', icon: CalendarClock, summary: 'Monthly, quarterly and yearly recurring expenses, renewals and reminders.', phase: 'Phase 6', roles: both },
  { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, summary: 'Monthly trends, category analysis, founder comparison and exports.', phase: 'Phase 7', roles: both },
  { path: '/audit-log', label: 'Audit Log', icon: ScrollText, summary: 'Who created, edited, approved, rejected or settled a transaction.', phase: 'Phase 8', roles: both },
  { path: '/settings', label: 'Settings', icon: Settings, summary: 'Founders, categories, split defaults, permissions and business settings.', phase: 'Later phase', roles: ['admin'] },
];

export function modulesFor(role: Role): AppModule[] {
  return MODULES.filter((m) => m.roles.includes(role));
}
