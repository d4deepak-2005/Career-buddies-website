import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MODULES, modulesFor } from '../lib/modules';
import { BrandLogo } from './BrandLogo';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const items = user ? modulesFor(user.role) : [];
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3 pb-6">
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path !== '/transactions' && path !== '/founders'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
              isActive && !(path === '/transactions' && location.pathname === '/transactions/new') ? 'bg-cb-navy text-white shadow-card' : 'text-ink-muted hover:bg-surface-alt hover:text-cb-navy'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-5 pb-3 pt-5">
        <BrandLogo className="h-28" />
        <div className="mt-3 h-1 rounded-full bg-brand-accent" aria-hidden />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-cb-blue">Founder Finance</p>
      </div>
      <div className="flex-1 overflow-y-auto pt-2">
        <NavList onNavigate={onNavigate} />
      </div>
    </>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const title = pathname.startsWith('/founders/') ? 'Founder Ledger' : pathname.startsWith('/transactions/') && pathname !== '/transactions/new' ? (pathname.endsWith('/edit') ? 'Edit Transaction' : 'Transaction') : (MODULES.find((m) => m.path === pathname)?.label ?? 'CareerBuddies');

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Desktop / tablet-landscape sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-surface-line bg-white lg:flex">
        <SidebarBody />
      </aside>

      {/* Mobile / tablet drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="absolute inset-0 bg-cb-navy-deep/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-pop">
            <button className="btn-ghost absolute right-2 top-2 !min-h-10 !px-2" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" aria-hidden />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-brand-gradient px-4 text-white shadow-card sm:px-6">
        <button className="btn !min-h-10 !px-2 text-white hover:bg-white/10 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="flex items-center justify-end gap-1 text-xs capitalize text-white/70">
                <ShieldCheck className="h-3 w-3" aria-hidden /> {user.role}
              </p>
            </div>
            <button className="btn !min-h-10 bg-white/10 !px-3 text-white hover:bg-white/20" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
