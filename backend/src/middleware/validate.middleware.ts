import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Returns a middleware that validates req.body against a Zod schema.
 * Assigns the parsed (type-safe) value back to req.body.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      result.error.errors.forEach(e => {
        const key = e.path.join('.') || 'value';
        details[key] = details[key] ?? [];
        details[key].push(e.message);
      });
      return next(new ValidationError('Validation failed', details));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      result.error.errors.forEach(e => {
        const key = e.path.join('.') || 'value';
        details[key] = details[key] ?? [];
        details[key].push(e.message);
      });
      return next(new ValidationError('Invalid query parameters', details));
    }
    req.query = result.data as any;
    next();
  };
}
