import { Router, Request, Response } from 'express';
import { generateToken, isValidToken } from '../middleware/auth';

const router = Router();
const TK_PASSWORD = process.env.TK_PASSWORD ?? 'rocco';

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body || {};

  if (password === TK_PASSWORD) {
    const token = generateToken(password);
    res.cookie('tk-auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'wrong password' });
  }
});

// GET /api/auth/check
router.get('/check', (req: Request, res: Response) => {
  if (TK_PASSWORD === '') {
    return res.json({ authenticated: true });
  }

  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    for (const pair of cookieHeader.split(';')) {
      const [key, ...rest] = pair.trim().split('=');
      if (key) cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  }

  const token = cookies['tk-auth'];
  res.json({ authenticated: !!(token && isValidToken(token)) });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('tk-auth', { path: '/' });
  res.json({ success: true });
});

export default router;
