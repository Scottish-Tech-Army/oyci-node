import { z } from 'zod';

const isValidDateTime = (value: string) => !Number.isNaN(Date.parse(value));
const sessionTypeSchema = z.enum(['standard', 'mentoring', 'workshop', 'outreach']);

const sessionBaseSchema = z.object({
  title:        z.string().min(1).max(200),
  description:  z.string().max(1000).optional().nullable(),
  startTime:    z.string().refine(isValidDateTime, 'startTime must be a valid datetime string'),
  endTime:      z.string().refine(isValidDateTime, 'endTime must be a valid datetime string'),
  location:     z.string().max(200).optional().nullable(),
  sessionType:  sessionTypeSchema.optional(),
  notes:        z.string().max(1000).optional().nullable(),
  attendees:    z.number().int().min(0).optional().nullable(),
  staffUserIds: z.array(z.string().uuid()).optional(),
});

export const createSessionSchema = sessionBaseSchema.refine(
  d => Date.parse(d.endTime) > Date.parse(d.startTime),
  { message: 'endTime must be after startTime', path: ['endTime'] },
);

export const updateSessionSchema = sessionBaseSchema
  .partial()
  .refine(
    d => !d.startTime || !d.endTime || Date.parse(d.endTime) > Date.parse(d.startTime),
    { message: 'endTime must be after startTime', path: ['endTime'] },
  );

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;

export const eligibleStaffQuerySchema = z.object({
  startTime: z.string().refine(isValidDateTime, 'startTime must be a valid datetime string').optional(),
  endTime: z.string().refine(isValidDateTime, 'endTime must be a valid datetime string').optional(),
  sessionType: sessionTypeSchema,
}).refine(
  d => (!d.startTime && !d.endTime) || (!!d.startTime && !!d.endTime && Date.parse(d.endTime) > Date.parse(d.startTime)),
  { message: 'endTime must be after startTime', path: ['endTime'] },
);
