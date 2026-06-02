import { z } from 'zod';

export const createStaffSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(10).max(128),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional().nullable(),
  contractType: z.enum(['salaried', 'sessional']).default('salaried'),
  contractedHoursPerWeek: z.number().min(0).max(168).optional().nullable(),
  skills: z.array(z.enum(['standard', 'mentoring', 'workshop', 'outreach'])).optional().default([]),
  notes: z.string().max(500).optional().nullable(),
});

export const updateStaffSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(20).optional().nullable(),
  contractType: z.enum(['salaried', 'sessional']).optional(),
  contractedHoursPerWeek: z.number().min(0).max(168).optional().nullable(),
  skills: z.array(z.enum(['standard', 'mentoring', 'workshop', 'outreach'])).optional(),
  notes: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateStaffDto = z.infer<typeof createStaffSchema>;
export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;
