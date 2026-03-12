import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const router = Router();
const parkingLotFile = path.join(config.dataDir, 'parking-lot.txt');
const sprintFile = path.join(config.dataDir, 'sprint.json');

// === Parking Lot ===

router.get('/parking-lot', async (_req: Request, res: Response) => {
  try {
    const content = await fs.readFile(parkingLotFile, 'utf-8');
    res.json({ content });
  } catch {
    res.json({ content: '' });
  }
});

router.put('/parking-lot', async (req: Request, res: Response) => {
  const { content } = req.body;
  await fs.writeFile(parkingLotFile, content || '');
  res.json({ success: true });
});

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
  const sprint: Sprint = {
    name: req.body.name || '',
    startDate: req.body.startDate || '',
    endDate: req.body.endDate || '',
    major: req.body.major || '',
    minor: req.body.minor || '',
  };
  await fs.writeFile(sprintFile, JSON.stringify(sprint, null, 2));
  res.json(sprint);
});

export default router;
