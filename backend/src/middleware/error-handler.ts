import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { logger } from '@/config/logger';

interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
};

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const response = {
    message: err.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    path: req.originalUrl,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    ...(err.details ? { details: err.details } : {}),
  };

  if (status >= 500) {
    logger.error('Unhandled error', { err, url: req.originalUrl });
  } else {
    logger.warn('Handled error', { err, url: req.originalUrl });
  }

  res.status(status).json(response);
};
