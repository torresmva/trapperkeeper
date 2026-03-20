import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';

const TK_PASSWORD = process.env.TK_PASSWORD ?? 'rocco';

// Persist the token secret so sessions survive container restarts
function getTokenSecret(): string {
  if (process.env.TK_SECRET) return process.env.TK_SECRET;
  const secretFile = path.join(process.cwd(), 'data', '.tk-secret');
  try {
    return fs.readFileSync(secretFile, 'utf-8').trim();
  } catch {
    const secret = crypto.randomBytes(32).toString('hex');
    try {
      fs.mkdirSync(path.dirname(secretFile), { recursive: true });
      fs.writeFileSync(secretFile, secret);
    } catch {}
    return secret;
  }
}

const TOKEN_SECRET = getTokenSecret();

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
