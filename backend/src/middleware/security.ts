import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';

export const securityHeaders = helmet({
  crossOriginEmbedderPolicy: false,
});

// Build list of allowed origins. Supports comma-separated CORS_ORIGIN and adds common dev ports.
const allowedOrigins = (() => {
  const list = (env.corsOrigin ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (env.nodeEnv !== 'production') {
    // Ensure typical Vite ports are permitted during local development
    for (const url of ['http://localhost:3000', 'http://localhost:3001']) {
      if (!list.includes(url)) list.push(url);
    }
  }
  return list;
})();

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser tools with no origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, be forgiving and allow all localhost origins
    if (env.nodeEnv !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    // In development, also allow 127.0.0.1 on any port (IDE preview proxy)
    if (env.nodeEnv !== 'production' && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});

// In development, disable rate limiting to avoid 429 during local testing
// (e.g., pages that perform multiple parallel requests for data like averages/trends).
export const rateLimiter =
  env.nodeEnv === 'production'
    ? rateLimit({
        windowMs: env.rateLimitWindowMs,
        max: env.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
      })
    : (_req: Request, _res: Response, next: NextFunction) => next();
