import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';
import { MODULES } from './lib/modules';
import { adminUser, founderUser, mockFetch, renderApp, unauth } from './test/utils';

describe('route protection', () => {
  it('redirects anonymous visitors to the login page', async () => {
    mockFetch({ 'GET /auth/me': unauth, 'POST /auth/refresh': unauth });
    renderApp('/transactions');
    expect(await screen.findByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
  });

  it('shows the app shell with logo and navigation to a signed-in founder', async () => {
    mockFetch({ 'GET /auth/me': { status: 200, body: { user: founderUser } } });
    renderApp('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getAllByAltText(/CareerBuddies/)[0]).toHaveAttribute('src', '/brand/careerbuddies-logo.png');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const m of MODULES.filter((x) => x.roles.includes('founder'))) {
      expect(nav).toHaveTextContent(m.label);
    }
  });

  it('hides Settings from founders and bounces them off the URL', async () => {
    mockFetch({ 'GET /auth/me': { status: 200, body: { user: founderUser } } });
    renderApp('/settings');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).not.toHaveTextContent('Settings');
  });

  it('shows Settings to admins', async () => {
    mockFetch({ 'GET /auth/me': { status: 200, body: { user: adminUser } } });
    renderApp('/settings');
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toHaveTextContent('Settings');
  });

  it('module placeholders contain no financial figures', async () => {
    mockFetch({ 'GET /auth/me': { status: 200, body: { user: adminUser } } });
    renderApp('/dashboard');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(screen.getByRole('main').textContent).not.toMatch(/[₹$€]|\d{2,}/);
  });

  it('opens and closes the mobile navigation drawer', async () => {
    mockFetch({ 'GET /auth/me': { status: 200, body: { user: founderUser } } });
    renderApp('/dashboard');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('login flow', () => {
  it('signs in and lands on the dashboard', async () => {
    let authed = false;
    mockFetch({
      'GET /auth/me': () => (authed ? { status: 200, body: { user: founderUser } } : unauth),
      'POST /auth/refresh': unauth,
      'POST /auth/login': () => ((authed = true), { status: 200, body: { user: founderUser } }),
    });
    renderApp('/login');
    await userEvent.type(await screen.findByLabelText('Email'), 'f@cb.test');
    await userEvent.type(screen.getByLabelText('Password'), 'a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows a generic error on invalid credentials', async () => {
    mockFetch({
      'GET /auth/me': unauth,
      'POST /auth/refresh': unauth,
      'POST /auth/login': { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } } },
    });
    renderApp('/login');
    await userEvent.type(await screen.findByLabelText('Email'), 'f@cb.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('shows a rate-limit message on 429', async () => {
    mockFetch({
      'GET /auth/me': unauth,
      'POST /auth/refresh': unauth,
      'POST /auth/login': { status: 429, body: { error: { code: 'RATE_LIMITED', message: 'slow down' } } },
    });
    renderApp('/login');
    await userEvent.type(await screen.findByLabelText('Email'), 'f@cb.test');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many attempts/);
  });
});


describe('session handling', () => {
  it('goes back to the login page, with a message, when the session expires and cannot be refreshed', async () => {
    let expired = false;
    mockFetch({
      'GET /auth/me': { status: 200, body: { user: founderUser } },
      'GET /founders/financial-positions': () => (expired ? { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } } : { status: 200, body: { positions: [], excluded: { byStatus: {} }, warnings: [], reconciliation: { status: 'PASS', checks: [] }, currency: { code: 'INR', minorUnits: 2 } } }),
      'POST /auth/refresh': unauth,
    });
    renderApp('/dashboard');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expired = true; // the cookie lapses while the app is open
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Founders' }));
    expect(await screen.findByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
  });

  it('does not show the "session expired" message to a visitor who was never signed in', async () => {
    mockFetch({ 'GET /auth/me': unauth, 'POST /auth/refresh': unauth });
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Welcome Back' });
    expect(screen.queryByText(/session has expired/)).not.toBeInTheDocument();
  });

  it('makes no failing probe requests on the login page when this browser has never signed in', async () => {
    const calls = mockFetch({});
    localStorage.removeItem('cb.signedIn');
    window.history.pushState({}, '', '/login');
    render(<MemoryRouter initialEntries={['/login']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(calls.filter((c) => c.includes('/auth/'))).toEqual([]);
  });

  it('still asks the server on protected pages even without the hint (existing sessions keep working); a gone session leaves no hint', async () => {
    const calls = mockFetch({ 'GET /auth/me': unauth, 'POST /auth/refresh': unauth });
    renderApp('/transactions');
    expect(await screen.findByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(calls).toContain('GET /auth/me');
    expect(localStorage.getItem('cb.signedIn')).toBeNull();
  });

  it('remembers a successful sign-in so the next visit can restore it', async () => {
    mockFetch({ 'POST /auth/login': { status: 200, body: { user: adminUser } } });
    localStorage.removeItem('cb.signedIn');
    window.history.pushState({}, '', '/login');
    render(<MemoryRouter initialEntries={['/login']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    await userEvent.type(await screen.findByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'passphrase-123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(localStorage.getItem('cb.signedIn')).toBe('1'));
  });

  it('restores an existing session on a protected page when the browser has no hint yet (no forced re-login after the update)', async () => {
    mockFetch({ 'GET /auth/me': { status: 200, body: { user: founderUser } } });
    renderApp('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(localStorage.getItem('cb.signedIn')).toBe('1');
  });
});
