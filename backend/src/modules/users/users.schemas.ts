import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(10).max(128),
  roleId: z.enum(['role_admin', 'role_staff']),
});

export const updateUserSchema = z.object({
  roleId: z.enum(['role_admin', 'role_staff']).optional(),
  isActive: z.boolean().optional(),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(10).max(128),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type AdminResetPasswordDto = z.infer<typeof adminResetPasswordSchema>;
