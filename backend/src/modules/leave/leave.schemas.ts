import { z } from 'zod';

const leaveTypeSchema = z.enum(['away', 'sick']);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const leaveBaseSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  leaveType: leaveTypeSchema,
  notes: z.string().max(1000).optional().nullable(),
});

export const createLeaveSchema = leaveBaseSchema.refine(
  (data) => Date.parse(data.endDate) >= Date.parse(data.startDate),
  { message: 'endDate must be on or after startDate', path: ['endDate'] },
);

export const updateLeaveSchema = leaveBaseSchema.partial();

export const listLeaveQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export type CreateLeaveDto = z.infer<typeof createLeaveSchema>;
export type UpdateLeaveDto = z.infer<typeof updateLeaveSchema>;
export type ListLeaveQuery = z.infer<typeof listLeaveQuerySchema>;