import { createContext, useContext, type ReactNode } from 'react';
import type { AppConfig } from './types';
import { useResource } from './useResource';

const Ctx = createContext<AppConfig | null>(null);

/** Loads server-owned configuration (currency, type rules, receipt limits) once for the signed-in area. */
export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { data, error, loading, reload } = useResource<AppConfig>('/config');
  if (loading) return <div role="status" className="p-8 text-center text-sm text-ink-muted">Loading…</div>;
  if (error || !data) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md rounded-card bg-danger-soft p-6 text-center text-danger">
        Could not load application settings. <button className="underline" onClick={reload}>Try again</button>
      </div>
    );
  }
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useAppConfig(): AppConfig {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAppConfig must be used inside <AppConfigProvider>');
  return c;
}
