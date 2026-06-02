import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SessionsService } from './sessions.service';
import { createSessionSchema, eligibleStaffQuerySchema, updateSessionSchema } from './sessions.schemas';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';

export const sessionsRouter = Router();
const svc = new SessionsService();

sessionsRouter.use(requireAuth);

const listQuerySchema = z.object({
  sessionType: z.enum(['standard', 'mentoring', 'workshop', 'outreach']).optional(),
  from:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

sessionsRouter.get('/', validateQuery(listQuerySchema), (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: svc.list(req.query as any) }); } catch (e) { next(e); }
});

sessionsRouter.get('/eligible-staff/options', validateQuery(eligibleStaffQuerySchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startTime, endTime, sessionType } = req.query as { startTime?: string; endTime?: string; sessionType: string };
    res.json({ data: svc.listEligibleStaff(startTime, endTime, sessionType) });
  } catch (e) { next(e); }
});

sessionsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ data: svc.get(req.params.id) }); } catch (e) { next(e); }
});

sessionsRouter.post('/', requireAdmin, validateBody(createSessionSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const s = svc.create(req.body, req.user!.id);
    res.status(201).json({ data: s });
  } catch (e) { next(e); }
});

sessionsRouter.patch('/:id', requireAdmin, validateBody(updateSessionSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const s = svc.update(req.params.id, req.body);
    res.json({ data: s });
  } catch (e) { next(e); }
});
