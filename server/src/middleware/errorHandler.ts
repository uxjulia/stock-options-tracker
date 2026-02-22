import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('Unhandled error:', err);

  const isDev = env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { message: err.message, stack: err.stack }),
  });
}
