import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
