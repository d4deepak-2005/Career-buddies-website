import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../lib/modules';

export function FullScreenLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
      Loading…
    </div>
  );
}

/** Gate for the private application area. `roles` further restricts by role (UX only; the API enforces). */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'anonymous' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
