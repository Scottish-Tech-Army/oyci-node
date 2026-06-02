import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../../config';
import { AuthService } from './auth.service';
import { loginSchema, changePasswordSchema } from './auth.schemas';
import { validateBody } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  message: { error: 'Too many login attempts. Please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authService = new AuthService();

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/logout  (client must discard token; route is semantic)
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ data: req.user });
});

// POST /api/v1/auth/change-password
authRouter.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  },
);
