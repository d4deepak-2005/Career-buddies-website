import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { getEnv } from '../config/env';
import { AppError } from '../lib/errors';
import { verifyAccessToken } from '../lib/tokens';
import { User, type Role } from '../models/User';

export const ACCESS_COOKIE = 'cb_access';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthUser;
  }
}

/** Require a valid access token cookie AND an active account (role is re-read from the database). */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token: unknown = req.cookies?.[ACCESS_COOKIE];
    if (typeof token !== 'string') throw AppError.unauthorized();
    const claims = verifyAccessToken(token, getEnv().JWT_ACCESS_SECRET);
    if (!claims || !Types.ObjectId.isValid(claims.sub)) throw AppError.unauthorized('Session expired');

    // The session must still exist: logout, disabling the account or a role change deletes it.
    const user = await User.findOne({ _id: claims.sub, status: 'active', 'sessions.sid': claims.sid })
      .select('email name role status')
      .lean();
    if (!user) throw AppError.unauthorized('Session expired');

    req.auth = { id: String(user._id), email: user.email, name: user.name, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

/** Server-side role check. Must run after `authenticate`. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(AppError.unauthorized());
    if (!roles.includes(req.auth.role)) return next(AppError.forbidden());
    next();
  };
}
