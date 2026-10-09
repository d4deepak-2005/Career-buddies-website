import { BarChart3, Building2, CalendarClock, Coins, Handshake, ImageIcon, LayoutDashboard, ListTree, Scale, ShieldCheck, UserCog, Users, type LucideIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useConfirmLeave } from '../../lib/dirty';
import { CategoriesSection } from './CategoriesSection';
import { FoundersSection } from './FoundersSection';
import { ApprovalsSection, BrandingSection, BusinessSection, DashboardSection, PolicySection, RecurringSection, RegionalSection, ReportingSection, SettlementsSection } from './sections';
import { UsersSection } from './UsersSection';

const SECTIONS: Array<{ id: string; label: string; icon: LucideIcon; render: () => JSX.Element }> = [
  { id: 'business', label: 'Business profile', icon: Building2, render: () => <BusinessSection /> },
  { id: 'branding', label: 'Branding and logo', icon: ImageIcon, render: () => <BrandingSection /> },
  { id: 'founders', label: 'Founders', icon: Users, render: () => <FoundersSection /> },
  { id: 'categories', label: 'Expense categories', icon: ListTree, render: () => <CategoriesSection /> },
  { id: 'regional', label: 'Currency and regional', icon: Coins, render: () => <RegionalSection /> },
  { id: 'approvals', label: 'Approval rules', icon: ShieldCheck, render: () => <ApprovalsSection /> },
  { id: 'reimbursement', label: 'Reimbursement rules', icon: Scale, render: () => <PolicySection which="reimbursement" /> },
  { id: 'settlements', label: 'Settlement preferences', icon: Handshake, render: () => <SettlementsSection /> },
  { id: 'recurring', label: 'Recurring payments', icon: CalendarClock, render: () => <RecurringSection /> },
  { id: 'dashboard', label: 'Dashboard display', icon: LayoutDashboard, render: () => <DashboardSection /> },
  { id: 'users', label: 'User access', icon: UserCog, render: () => <UsersSection /> },
  { id: 'reporting', label: 'Calculation and reporting', icon: BarChart3, render: () => <ReportingSection /> },
];

/** Admin-only (enforced by the API). Every control here is backed by a persisted, validated server setting. */
export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const confirmLeave = useConfirmLeave();
  const current = SECTIONS.find((s) => s.id === params.get('section')) ?? SECTIONS[0]!;
  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[15rem_1fr]">
      <nav aria-label="Settings sections" className="card h-fit p-2 lg:sticky lg:top-24">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0 lg:shrink">
              <button
                aria-current={current.id === id ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 text-left text-sm font-semibold transition ${current.id === id ? 'bg-cb-navy text-white' : 'text-ink-muted hover:bg-surface-alt hover:text-cb-navy'}`}
                onClick={() => { if (current.id !== id && confirmLeave()) setParams({ section: id }, { replace: true }); }}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />{label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 space-y-5" key={current.id}>{current.render()}</div>
    </div>
  );
}
