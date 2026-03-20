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

export default router;
