import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { config } from '../config';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach(e => {
      const key = e.path.join('.') || 'value';
      details[key] = details[key] ?? [];
      details[key].push(e.message);
    });
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Application error', { message: err.message, stack: err.stack });
    }
    const body: Record<string, unknown> = {
      error: err.message,
      code: err.code,
    };
    if (err instanceof ValidationError && err.details) {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / unexpected errors
  logger.error('Unhandled error', {
    message: (err as Error)?.message,
    stack: (err as Error)?.stack,
    path: req.path,
  });

  res.status(500).json({
    error: config.isDevelopment ? (err as Error)?.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
