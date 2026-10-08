import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FounderLedgerPage } from './features/financials/FounderLedgerPage';
import { FoundersPage } from './features/financials/FoundersPage';
import { SettlementsPage } from './features/financials/SettlementsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AddTransactionPage, EditTransactionPage } from './features/transactions/TransactionFormPages';
import { TransactionDetailPage } from './features/transactions/TransactionDetailPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { AppConfigProvider } from './lib/AppConfigContext';
import { MODULES } from './lib/modules';
import { LoginPage } from './pages/LoginPage';

/** Modules with a real implementation. Everything else renders a placeholder until its phase. */
const IMPLEMENTED: Record<string, ReactElement> = {
  '/transactions': <TransactionsPage />,
  '/transactions/new': <AddTransactionPage />,
  '/founders': <FoundersPage />,
  '/settlements': <SettlementsPage />,
  '/settings': <SettingsPage />,
};

const page = (m: (typeof MODULES)[number]) => IMPLEMENTED[m.path] ?? <ModulePlaceholder module={m} />;

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppConfigProvider><AppShell /></AppConfigProvider>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {MODULES.filter((m) => m.roles.length === 2).map((m) => <Route key={m.path} path={m.path} element={page(m)} />)}
          <Route path="/founders/:id" element={<FounderLedgerPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            {MODULES.filter((m) => m.roles.length === 1).map((m) => <Route key={m.path} path={m.path} element={page(m)} />)}
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
