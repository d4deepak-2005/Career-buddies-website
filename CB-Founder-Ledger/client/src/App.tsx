import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MODULES } from './lib/modules';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {MODULES.filter((m) => m.roles.length === 2).map((m) => (
            <Route key={m.path} path={m.path} element={<ModulePlaceholder module={m} />} />
          ))}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            {MODULES.filter((m) => m.roles.length === 1).map((m) => (
              <Route key={m.path} path={m.path} element={<ModulePlaceholder module={m} />} />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
