import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Server error:', err.message, err.stack);

  if (err.status === 400 && err.details) {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}
