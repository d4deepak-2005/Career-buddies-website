import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '../models/User';

export interface AccessClaims {
  sub: string;
  role: Role;
  sid: string;
}

export function signAccessToken(claims: AccessClaims, secret: string, ttlMinutes: number): string {
  return jwt.sign({ role: claims.role, sid: claims.sid }, secret, {
    subject: claims.sub,
    expiresIn: ttlMinutes * 60,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string, secret: string): AccessClaims | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) return null;
    const role = payload['role'];
    if (role !== 'admin' && role !== 'founder') return null;
    const sid = payload['sid'];
    if (typeof sid !== 'string' || !sid) return null;
    return { sub: payload.sub, role, sid };
  } catch {
    return null;
  }
}

/** Opaque, random refresh token. Only its SHA-256 hash is stored in the database. */
export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(48).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
