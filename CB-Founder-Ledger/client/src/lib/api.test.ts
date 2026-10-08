import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api';

function res(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

describe('api client', () => {
  it('sends credentials and parses JSON', async () => {
    const f = vi.fn().mockResolvedValue(res(200, { ok: true }));
    vi.stubGlobal('fetch', f);
    expect(await api('/ping')).toEqual({ ok: true });
    expect(f).toHaveBeenCalledWith('/api/ping', expect.objectContaining({ credentials: 'include', method: 'GET' }));
  });

  it('turns error responses into ApiError with code and message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(400, { error: { code: 'VALIDATION_ERROR', message: 'bad' } })));
    await expect(api('/x')).rejects.toMatchObject({ name: 'ApiError', status: 400, code: 'VALIDATION_ERROR', message: 'bad' });
    await expect(api('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('refreshes once on 401 and retries the request', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(res(401, { error: { code: 'UNAUTHORIZED', message: 'expired' } }))
      .mockResolvedValueOnce(res(200, { user: {} })) // refresh
      .mockResolvedValueOnce(res(200, { data: 1 })); // retry
    vi.stubGlobal('fetch', f);
    expect(await api('/founders')).toEqual({ data: 1 });
    expect(f.mock.calls.map((c) => c[0])).toEqual(['/api/founders', '/api/auth/refresh', '/api/founders']);
  });

  it('gives up with 401 when refresh fails, and never refreshes for login', async () => {
    const f = vi.fn().mockResolvedValue(res(401, { error: { code: 'UNAUTHORIZED', message: 'no' } }));
    vi.stubGlobal('fetch', f);
    await expect(api('/founders')).rejects.toMatchObject({ status: 401 });
    f.mockClear();
    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
