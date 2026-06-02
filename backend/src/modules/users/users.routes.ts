import { Router, Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { createUserSchema, updateUserSchema, adminResetPasswordSchema } from './users.schemas';
import { validateBody } from '../../middleware/validate.middleware';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';

export const usersRouter = Router();
const svc = new UsersService();

// All users routes require authentication
usersRouter.use(requireAuth);

// GET /api/v1/users  [admin only]
usersRouter.get('/', requireAdmin, (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: svc.listUsers() });
  } catch (err) { next(err); }
});

// POST /api/v1/users  [admin only]
usersRouter.post('/', requireAdmin, validateBody(createUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await svc.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id  [admin or own account]
usersRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'admin' && req.user!.id !== req.params.id) {
      return next(new (require('../../errors/AppError').ForbiddenError)());
    }
    res.json({ data: svc.getUser(req.params.id) });
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/:id  [admin only]
usersRouter.patch('/:id', requireAdmin, validateBody(updateUserSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = svc.updateUser(req.params.id, req.body);
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// POST /api/v1/users/:id/reset-password  [admin only]
usersRouter.post('/:id/reset-password', requireAdmin, validateBody(adminResetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.adminResetPassword(req.params.id, req.body.newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
});
