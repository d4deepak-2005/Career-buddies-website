import { createContext, useContext, type ReactNode } from 'react';
import type { AppConfig } from './types';
import { useResource } from './useResource';

interface Ctx { config: AppConfig; reload: () => void }
const C = createContext<Ctx | null>(null);

/**
 * Loads server-owned configuration once for the signed-in area: currency formatting, type rules, receipt limits AND the
 * persisted settings (product name, logo, preferences). It is the single source for every heading, title and format, so a saved
 * setting reaches the whole UI by reloading this one resource (`useReloadConfig`).
 */
export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { data, error, loading, reload } = useResource<AppConfig>('/config');
  if (loading && !data) return <div role="status" className="p-8 text-center text-sm text-ink-muted">Loading…</div>;
  if (error && !data) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md rounded-card bg-danger-soft p-6 text-center text-danger">
        Could not load application settings. <button className="underline" onClick={reload}>Try again</button>
      </div>
    );
  }
  if (!data) return null;
  return <C.Provider value={{ config: data, reload }}>{children}</C.Provider>;
}

export function useAppConfig(): AppConfig {
  const c = useContext(C);
  if (!c) throw new Error('useAppConfig must be used inside <AppConfigProvider>');
  return c.config;
}

/** Re-fetch the configuration after a setting was saved, so every screen shows the new value. */
export function useReloadConfig(): () => void {
  const c = useContext(C);
  if (!c) throw new Error('useReloadConfig must be used inside <AppConfigProvider>');
  return c.reload;
}

/** Same context, but null outside the provider (the login page). */
export function useAppConfigOptional(): AppConfig | null {
  return useContext(C)?.config ?? null;
}
