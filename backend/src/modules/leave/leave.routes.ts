import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { LeaveService } from './leave.service';
import { createLeaveSchema, listLeaveQuerySchema, updateLeaveSchema } from './leave.schemas';

export const leaveRouter = Router();
const svc = new LeaveService();

leaveRouter.use(requireAuth);

leaveRouter.get('/', validateQuery(listLeaveQuerySchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: svc.list(req.query as { from?: string; to?: string }) });
  } catch (err) {
    next(err);
  }
});

leaveRouter.post('/', validateBody(createLeaveSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ data: svc.create(req.body, req.user!.id) });
  } catch (err) {
    next(err);
  }
});

leaveRouter.patch('/:id', validateBody(updateLeaveSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: svc.update(req.params.id, req.body, req.user!.id, req.user!.role) });
  } catch (err) {
    next(err);
  }
});

leaveRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    svc.delete(req.params.id, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});