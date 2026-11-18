import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { readDb, toSafeUser } from '../store/db.ts';
import type { SafeUser, UserRole } from '../types.ts';

const AUTH_SECRET = process.env.AUTH_SECRET || 'campussave_dev_secret_key_essect_2026';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

interface TokenPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

export function signAuthToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!decoded.userId || decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }
  const token = header.slice(7).trim();
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session invalide ou expirée.' });
    return;
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Compte utilisateur introuvable.' });
    return;
  }
  if (!user.active) {
    res.status(403).json({ error: 'Ce compte a été désactivé par un administrateur.' });
    return;
  }
  req.user = toSafeUser(user);
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Accès refusé pour votre rôle.' });
      return;
    }
    next();
  };
}
