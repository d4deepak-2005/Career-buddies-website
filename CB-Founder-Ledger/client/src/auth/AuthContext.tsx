import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, SESSION_EXPIRED_EVENT, api } from '../lib/api';
import type { Role } from '../lib/modules';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

type Status = 'loading' | 'anonymous' | 'authenticated';

interface AuthValue {
  status: Status;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** True after a signed-in session ended without the user signing out (shown once on the login page). */
  sessionExpired: boolean;
}

/**
 * A harmless "this browser has signed in before" hint (no token, no personal data). On the login page without it the app
 * does not ask the server who is signed in, so a first-time visitor makes no failing requests and logs no console errors.
 * Everywhere else the server is still asked (a bookmarked page of someone who is already signed in keeps working, with or
 * without the hint). The server remains the only authority: every API call is authenticated by the httpOnly cookies.
 */
const HINT_KEY = 'cb.signedIn';
const hint = {
  has: () => { try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return true; } },
  set: () => { try { localStorage.setItem(HINT_KEY, '1'); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(HINT_KEY); } catch { /* storage unavailable */ } },
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!hint.has() && window.location.pathname.replace(/\/+$/, '') === '/login') {
      setStatus('anonymous');
      return;
    }
    api<{ user: AuthUser }>('/auth/me')
      .then((r) => !cancelled && (hint.set(), setUser(r.user), setStatus('authenticated')))
      .catch((e: unknown) => {
        if (cancelled) return;
        if (!(e instanceof ApiError)) console.error(e);
        hint.clear();
        setUser(null);
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The session ended while the app was open (and could not be refreshed): go back to the login page.
  useEffect(() => {
    const onExpired = () => {
      if (status !== 'authenticated') return; // a signed-out visitor's probe failing is expected, not an expiry
      hint.clear();
      setSessionExpired(true);
      setUser(null);
      setStatus('anonymous');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [status]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: AuthUser }>('/auth/login', { method: 'POST', body: { email, password } });
    hint.set();
    setSessionExpired(false);
    setUser(r.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      hint.clear();
      setSessionExpired(false);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(() => ({ status, user, login, logout, sessionExpired }), [status, user, login, logout, sessionExpired]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
