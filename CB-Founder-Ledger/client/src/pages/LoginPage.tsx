import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { FullScreenLoader } from '../components/ProtectedRoute';
import { ApiError } from '../lib/api';
import { useBrand } from '../lib/brand';

export function LoginPage() {
  const { status, login, sessionExpired } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const brand = useBrand();
  useEffect(() => { document.title = `Sign in · ${brand.displayName}`; }, [brand.displayName]);

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== '/login' ? from : '/dashboard'} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Please wait a few minutes and try again.'
          : err instanceof ApiError && err.status === 401
            ? 'Invalid email or password.'
            : 'Could not sign in. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-white lg:flex">
        <div className="flex flex-1 items-center justify-center p-10"><BrandLogo className="h-52" /></div>
        <div className="bg-brand-gradient px-12 pb-14 pt-16 text-white [clip-path:ellipse(120%_100%_at_0%_100%)]">
          <h2 className="text-4xl font-extrabold leading-tight">{brand.displayName}</h2>
          <p className="mt-3 text-xl text-white/85">Track. Manage. Settle. Together.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-surface-alt p-6">
        <div className="card w-full max-w-md p-8">
          <div className="mb-6 flex justify-center lg:hidden">
            <BrandLogo className="h-32" />
          </div>
          <h1 className="text-2xl font-extrabold text-cb-navy">Welcome Back</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to access {brand.displayName}.</p>
          {sessionExpired && <p role="status" className="mt-4 rounded-xl bg-surface-alt px-4 py-3 text-sm font-semibold text-cb-navy">Your session has expired. Please sign in again.</p>}

          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-cb-navy">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-faint" aria-hidden />
                <input id="email" type="email" autoComplete="username" required className="field !pl-10" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && !/^\S+@\S+\.\S+$/.test(email.trim())} aria-describedby="email-err" />
              </div>
              {touched && !/^\S+@\S+\.\S+$/.test(email.trim()) && <p id="email-err" className="mt-1 text-xs font-medium text-danger">Enter a valid email address.</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-cb-navy">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-faint" aria-hidden />
                <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="field !pl-10 !pr-12" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={touched && !password} aria-describedby="pw-err" />
                <button type="button" className="absolute right-1 top-1 flex h-9 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((v) => !v)}>
                  {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              {touched && !password && <p id="pw-err" className="mt-1 text-xs font-medium text-danger">Enter your password.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
