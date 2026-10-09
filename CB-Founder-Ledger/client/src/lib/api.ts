/** Thin API client. All requests are same-origin (`/api`), authenticated by httpOnly cookies. */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight refresh so parallel 401s trigger only one token rotation. */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function toError(res: Response): Promise<ApiError> {
  let body: { error?: { code?: string; message?: string; details?: unknown } } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, body.error?.code ?? 'HTTP_ERROR', body.error?.message ?? `Request failed (${res.status})`, body.error?.details);
}

/** Upload one file (multipart, field "file") — images and receipts. Same auth/refresh behaviour as `api`. */
export async function apiUpload<T>(path: string, file: File, method: 'PUT' | 'POST' = 'PUT'): Promise<T> {
  const send = () => {
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`/api${path}`, { method, credentials: 'include', body: fd });
  };
  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const send = () =>
    fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      credentials: 'include',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  let res = await send();
  if (res.status === 401 && !AUTH_PATHS.includes(path) && (await refreshSession())) {
    res = await send();
  }
  if (!res.ok) throw await toError(res);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
