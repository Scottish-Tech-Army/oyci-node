import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenPayload } from '../types/auth.types';
import { AuthenticationError, ForbiddenError } from '../errors/AppError';

/**
 * requireAuth — verifies the Bearer JWT and attaches req.user.
 * The token is read from the Authorization header only.
 * Cookies are not used for auth tokens (avoids CSRF surface).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AuthenticationError());
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new AuthenticationError('Invalid or expired token'));
  }
}

/**
 * requireRole — must be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AuthenticationError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}

/** Convenience shortcut for admin-only routes. */
export const requireAdmin = requireRole('admin');
