import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { leaveRouter } from './modules/leave/leave.routes';
import { usersRouter } from './modules/users/users.routes';
import { sessionsRouter } from './modules/sessions/sessions.routes';
import { staffRouter } from './modules/staff/staff.routes';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // HTTP request logging (skip in test)
  if (config.nodeEnv !== 'test') {
    app.use(morgan('combined'));
  }

  // Global rate limiting
  app.use(rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  }));

  // Health check (unauthenticated)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes (versioned)
  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/leave', leaveRouter);
  api.use('/users', usersRouter);
  api.use('/sessions', sessionsRouter);
  api.use('/staff', staffRouter);

  app.use('/api/v1', api);

  // 404 for unknown API routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}
