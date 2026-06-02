import dotenv from 'dotenv';
dotenv.config();

const isDevelopment = (process.env.NODE_ENV ?? 'development') !== 'production';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

function requireEnvOrDevDefault(name: string, devDefault: string): string {
  const val = process.env[name];
  if (val) return val;
  if (isDevelopment) {
    console.warn(`[config] ${name} is not set. Using development fallback value.`);
    return devDefault;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  jwtSecret: requireEnvOrDevDefault('JWT_SECRET', 'local-dev-insecure-jwt-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  dbFile: process.env.DB_FILE ?? './data/oyci.db',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map(s => s.trim()),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10', 10),
  isDevelopment,
};
