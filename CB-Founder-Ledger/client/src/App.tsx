import { useEffect, type ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApprovalsPage } from './features/approvals/ApprovalsPage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { FounderLedgerPage } from './features/financials/FounderLedgerPage';
import { FoundersPage } from './features/financials/FoundersPage';
import { SettlementsPage } from './features/financials/SettlementsPage';
import { RecurringPage } from './features/recurring/RecurringPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { EditTransactionPage } from './features/transactions/TransactionFormPages';
import { TransactionDetailPage } from './features/transactions/TransactionDetailPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { AppConfigProvider } from './lib/AppConfigContext';
import { MODULES } from './lib/modules';
import { LoginPage } from './pages/LoginPage';

const PAGES: Record<string, ReactElement> = {
  '/dashboard': <DashboardPage />,
  '/transactions': <TransactionsPage />,
  '/transactions/new': <TransactionsPage addOpen />,
  '/founders': <FoundersPage />,
  '/settlements': <SettlementsPage />,
  '/approvals': <ApprovalsPage />,
  '/recurring': <RecurringPage />,
  '/reports': <ReportsPage />,
  '/audit-log': <AuditLogPage />,
  '/settings': <SettingsPage />,
};

/**
 * Portal entry points. The Ledger is its own application; a link such as https://<site>/#ledger (or <ledger-host>/ledger)
 * lands here and is sent to the dashboard — or to the sign-in page first, then back (ProtectedRoute remembers the target).
 * See docs/WEBSITE-INTEGRATION.md.
 */
function HashEntry() {
  const { hash, pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { if (hash === '#ledger' && pathname === '/') navigate('/dashboard', { replace: true }); }, [hash, pathname, navigate]);
  return null;
}

export function App() {
  return (
    <>
      <HashEntry />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ledger" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppConfigProvider><AppShell /></AppConfigProvider>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {MODULES.filter((m) => m.roles.length === 2).map((m) => <Route key={m.path} path={m.path} element={PAGES[m.path]} />)}
            <Route path="/founders/:id" element={<FounderLedgerPage />} />
            <Route path="/transactions/:id" element={<TransactionDetailPage />} />
            <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
            <Route element={<ProtectedRoute roles={['admin']} />}>
              {MODULES.filter((m) => m.roles.length === 1).map((m) => <Route key={m.path} path={m.path} element={PAGES[m.path]} />)}
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
