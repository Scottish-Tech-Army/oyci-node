import { Request } from 'express';
import { RequestUser } from './auth.types';

// Augment Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
