import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthContext';

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown };

/** Stub global fetch with a route table keyed by "METHOD /path". */
export function mockFetch(routes: Record<string, Handler | { status: number; body?: unknown }>) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const key = `${init?.method ?? 'GET'} ${url.replace('/api', '')}`;
      calls.push(key);
      const r = routes[key] ?? { status: 404, body: { error: { code: 'NOT_FOUND', message: 'nope' } } };
      const { status, body } = typeof r === 'function' ? r(url, init) : r;
      return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
    }),
  );
  return calls;
}

export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

export const founderUser = { id: '2', email: 'f@cb.test', name: 'Founder One', role: 'founder' as const };
export const adminUser = { id: '1', email: 'a@cb.test', name: 'Admin One', role: 'admin' as const };
export const unauth = { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } };
