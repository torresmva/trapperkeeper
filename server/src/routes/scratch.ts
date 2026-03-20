import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { validate, sprintSchema } from '../schemas';

const router = Router();
const sprintFile = path.join(config.dataDir, 'sprint.json');

// === Sprint ===

interface Sprint {
  name: string;
  startDate: string;
  endDate: string;
  major: string;
  minor: string;
}

router.get('/sprint', async (_req: Request, res: Response) => {
  try {
    const data = await fs.readFile(sprintFile, 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.json(null);
  }
});

router.put('/sprint', async (req: Request, res: Response) => {
  const sprint = validate(sprintSchema, req.body);
  await fs.writeFile(sprintFile, JSON.stringify(sprint, null, 2));
  res.json(sprint);
});

// === Slogans ===

router.get('/slogans', async (_req: Request, res: Response) => {
  try {
    const data = await fs.readFile(config.slogansFile, 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.json({ slogans: [] });
  }
});

router.put('/slogans', async (req: Request, res: Response) => {
  const { slogans } = req.body;
  if (!Array.isArray(slogans)) {
    return res.status(400).json({ error: 'slogans must be an array of strings' });
  }
  const clean = slogans.filter((s: any) => typeof s === 'string' && s.trim()).map((s: string) => s.trim());
  await fs.writeFile(config.slogansFile, JSON.stringify({ slogans: clean }, null, 2));
  res.json({ slogans: clean });
});

export default router;
