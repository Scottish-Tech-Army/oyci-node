import { Router, Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { createStaffSchema, updateStaffSchema } from './staff.schemas';
import { validateBody } from '../../middleware/validate.middleware';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';

export const staffRouter = Router();
const svc = new StaffService();

staffRouter.use(requireAuth);

// GET /api/v1/staff [admin only]
staffRouter.get('/', requireAdmin, (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: svc.listStaff() });
  } catch (err) { next(err); }
});

// POST /api/v1/staff [admin only]
staffRouter.post('/', requireAdmin, validateBody(createStaffSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await svc.createStaffMember(req.body);
    res.status(201).json({ data: member });
  } catch (err) { next(err); }
});

// GET /api/v1/staff/:id [admin only]
staffRouter.get('/:id', requireAdmin, (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: svc.getStaffMember(req.params.id) });
  } catch (err) { next(err); }
});

// PATCH /api/v1/staff/:id [admin only]
staffRouter.patch('/:id', requireAdmin, validateBody(updateStaffSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = svc.updateStaffMember(req.params.id, req.body);
    res.json({ data: updated });
  } catch (err) { next(err); }
});
