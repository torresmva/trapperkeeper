import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const TK_PASSWORD = process.env.TK_PASSWORD ?? 'changeme';
const TOKEN_SECRET = process.env.TK_SECRET || crypto.randomBytes(32).toString('hex');

export function generateToken(password: string): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(password).digest('hex');
}

export function isValidToken(token: string): boolean {
  return token === generateToken(TK_PASSWORD);
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(';')) {
    const [key, ...rest] = pair.trim().split('=');
    if (key) cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
  }
  return cookies;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only gate /api/* routes (not static files / client HTML)
  if (!req.path.startsWith('/api/')) return next();

  // Skip auth routes
  if (req.path.startsWith('/api/auth')) return next();

  // Skip if no password is set (TK_PASSWORD explicitly empty)
  if (TK_PASSWORD === '') return next();

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['tk-auth'];

  if (token && isValidToken(token)) {
    return next();
  }

  res.status(401).json({ error: 'unauthorized' });
}
