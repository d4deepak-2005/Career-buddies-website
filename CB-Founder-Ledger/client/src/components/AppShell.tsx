import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useBrand } from '../lib/brand';
import { DirtyProvider, useConfirmLeave } from '../lib/dirty';
import { MODULES, modulesFor } from '../lib/modules';
import type { ApprovalsResponse } from '../lib/types';
import { useResource } from '../lib/useResource';
import { BrandLogo } from './BrandLogo';

function NavList({ onNavigate, pending }: { onNavigate?: () => void; pending: number }) {
  const { user } = useAuth();
  const location = useLocation();
  const confirmLeave = useConfirmLeave();
  const items = user ? modulesFor(user.role) : [];
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3 pb-6">
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path !== '/transactions' && path !== '/founders'}
          onClick={(e) => { if (!confirmLeave()) { e.preventDefault(); return; } onNavigate?.(); }}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
              isActive && !(path === '/transactions' && location.pathname === '/transactions/new') ? 'bg-white text-cb-navy shadow-card' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {path === '/approvals' && pending > 0 && <span className="badge bg-cb-green text-white" aria-label={`${pending} pending approvals`}>{pending}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate, pending }: { onNavigate?: () => void; pending: number }) {
  const brand = useBrand();
  return (
    <>
      <div className="px-5 pb-3 pt-5">
        <div className="rounded-2xl bg-white p-3 shadow-card"><BrandLogo className="mx-auto h-20" /></div>
        <div className="mt-3 h-1 rounded-full bg-brand-accent" aria-hidden />
        <p className="mt-3 break-words text-sm font-extrabold leading-tight text-white" data-testid="brand-name">{brand.displayName}</p>
      </div>
      <div className="flex-1 overflow-y-auto pt-2">
        <NavList onNavigate={onNavigate} pending={pending} />
      </div>
    </>
  );
}

function titleFor(pathname: string): string {
  if (pathname.startsWith('/founders/')) return 'Founder Ledger';
  if (pathname.startsWith('/transactions/') && pathname !== '/transactions/new') return pathname.endsWith('/edit') ? 'Edit Transaction' : 'Transaction';
  return MODULES.find((m) => m.path === pathname)?.label ?? 'Dashboard';
}

function Shell() {
  const { user, logout } = useAuth();
  const brand = useBrand();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const title = titleFor(pathname);
  const approvals = useResource<ApprovalsResponse>('/approvals?pageSize=1');
  const pending = approvals.data?.counts.pending_approval ?? 0;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.title = `${title} · ${brand.displayName}`; }, [title, brand.displayName]);
  // Refresh the pending badge whenever the user moves around (decisions happen on other pages).
  useEffect(() => { approvals.reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Desktop / tablet-landscape sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-brand-gradient lg:flex">
        <SidebarBody pending={pending} />
      </aside>

      {/* Mobile / tablet drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="absolute inset-0 bg-cb-navy-deep/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-brand-gradient shadow-pop">
            <button className="btn absolute right-2 top-2 !min-h-10 !px-2 text-white hover:bg-white/10" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" aria-hidden />
            </button>
            <SidebarBody pending={pending} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-surface-line bg-white px-4 text-cb-navy shadow-card sm:px-6">
        <button className="btn !min-h-10 !px-2 text-cb-navy hover:bg-surface-alt lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold">{title}</h1>
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="flex items-center justify-end gap-1 text-xs capitalize text-ink-muted">
                <ShieldCheck className="h-3 w-3" aria-hidden /> {user.role}
              </p>
            </div>
            <button className="btn !min-h-10 border border-surface-line !px-3 text-cb-navy hover:bg-surface-alt" onClick={() => void logout()}>
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

export function AppShell() {
  return <DirtyProvider><Shell /></DirtyProvider>;
}
