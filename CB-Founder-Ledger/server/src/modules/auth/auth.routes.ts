import { Router, type Response } from 'express';
import { z } from 'zod';
import { getEnv } from '../../config/env';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { verifyPassword } from '../../lib/password';
import { randomUUID } from 'node:crypto';
import { hashRefreshToken, newRefreshToken, signAccessToken } from '../../lib/tokens';
import { ACCESS_COOKIE, authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { User } from '../../models/User';

export const REFRESH_COOKIE = 'cb_refresh';
const MAX_SESSIONS = 10;

// Valid bcrypt hash used to keep login timing equal when the email does not exist.
const DUMMY_HASH = '$2b$12$S9U71lz.4TKnmUznIvapuONMO8SsYRAu/QLRl/3op/zK5PzFxvKKy';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
}).strict();

function cookieBase() {
  const env = getEnv();
  return { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'strict' as const };
}

function setAuthCookies(res: Response, userId: string, role: 'admin' | 'founder', sid: string, refreshToken: string) {
  const env = getEnv();
  const access = signAccessToken({ sub: userId, role, sid }, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL_MINUTES);
  res.cookie(ACCESS_COOKIE, access, { ...cookieBase(), path: '/api', maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60_000 });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieBase(),
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...cookieBase(), path: '/api' });
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase(), path: '/api/auth' });
}

async function addSession(userId: string, sid: string, tokenHash: string, userAgent?: string) {
  const now = new Date();
  await User.updateOne({ _id: userId }, { $pull: { sessions: { expiresAt: { $lte: now } } } });
  await User.updateOne(
    { _id: userId },
    {
      $push: {
        sessions: {
          $each: [{
            sid,
            tokenHash,
            expiresAt: new Date(now.getTime() + getEnv().REFRESH_TOKEN_TTL_DAYS * 86_400_000),
            userAgent: userAgent?.slice(0, 300),
            createdAt: now,
          }],
          $slice: -MAX_SESSIONS,
        },
      },
    },
  );
}

export const authRouter = Router();

authRouter.post(
  '/login',
  authRateLimiter(),
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok || user.status !== 'active') throw AppError.unauthorized('Invalid email or password');

    const refresh = newRefreshToken();
    await user.updateOne({ $set: { lastLoginAt: new Date() } });
    const sid = randomUUID();
    await addSession(String(user._id), sid, refresh.hash, req.get('user-agent'));

    setAuthCookies(res, String(user._id), user.role, sid, refresh.token);
    res.json({ user: { id: String(user._id), email: user.email, name: user.name, role: user.role } });
  }),
);

authRouter.post(
  '/refresh',
  authRateLimiter(10),
  asyncHandler(async (req, res) => {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string') throw AppError.unauthorized();
    const hash = hashRefreshToken(token);
    const now = new Date();
    const user = await User.findOne({ 'sessions.tokenHash': hash }).select('+sessions');
    const session = user?.sessions.find((s) => s.tokenHash === hash);
    if (!user || !session || session.expiresAt <= now || user.status !== 'active') {
      clearAuthCookies(res);
      throw AppError.unauthorized('Session expired');
    }

    // Rotate: atomically consume the presented token so it can only be used once.
    const consumed = await User.updateOne({ _id: user._id }, { $pull: { sessions: { tokenHash: hash } } });
    if (consumed.modifiedCount !== 1) {
      clearAuthCookies(res);
      throw AppError.unauthorized('Session expired');
    }
    const next = newRefreshToken();
    await addSession(String(user._id), session.sid, next.hash, req.get('user-agent'));

    setAuthCookies(res, String(user._id), user.role, session.sid, next.token);
    res.json({ user: { id: String(user._id), email: user.email, name: user.name, role: user.role } });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token === 'string') {
      await User.updateOne({ 'sessions.tokenHash': hashRefreshToken(token) }, { $pull: { sessions: { tokenHash: hashRefreshToken(token) } } });
    }
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.auth });
});
