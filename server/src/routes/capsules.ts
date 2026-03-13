import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { config } from '../config';

const router = Router();

interface Capsule {
  id: string;
  title: string;
  content: string;
  created: string;
  unlockDate: string;
  openedAt?: string;
  sealed: boolean;
}

async function readCapsules(): Promise<Capsule[]> {
  try {
    const data = await fs.readFile(config.capsulesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeCapsules(capsules: Capsule[]): Promise<void> {
  await fs.writeFile(config.capsulesFile, JSON.stringify(capsules, null, 2));
}

// GET /api/capsules — list all, strip content if still locked
router.get('/', async (_req: Request, res: Response) => {
  const capsules = await readCapsules();
  const today = new Date().toISOString().split('T')[0];

  const result = capsules.map(c => {
    if (c.sealed && c.unlockDate > today) {
      return { ...c, content: '' };
    }
    return c;
  });

  result.sort((a, b) => b.created.localeCompare(a.created));
  res.json(result);
});

// POST /api/capsules — create sealed capsule
router.post('/', async (req: Request, res: Response) => {
  const { title, content, unlockDate } = req.body;
  if (!title || !content || !unlockDate) {
    return res.status(400).json({ error: 'title, content, and unlockDate are required' });
  }

  const capsules = await readCapsules();
  const now = new Date().toISOString();
  const capsule: Capsule = {
    id: `cap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    content,
    created: now,
    unlockDate,
    sealed: true,
  };

  capsules.push(capsule);
  await writeCapsules(capsules);
  res.status(201).json({ ...capsule, content: '' });
});

// POST /api/capsules/:id/open — open a capsule if unlock date has passed
router.post('/:id/open', async (req: Request, res: Response) => {
  const capsules = await readCapsules();
  const idx = capsules.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const today = new Date().toISOString().split('T')[0];
  if (capsules[idx].unlockDate > today) {
    return res.status(403).json({ error: 'capsule is still locked' });
  }

  capsules[idx].sealed = false;
  capsules[idx].openedAt = new Date().toISOString();
  await writeCapsules(capsules);
  res.json(capsules[idx]);
});

// DELETE /api/capsules/:id
router.delete('/:id', async (req: Request, res: Response) => {
  let capsules = await readCapsules();
  capsules = capsules.filter(c => c.id !== req.params.id);
  await writeCapsules(capsules);
  res.json({ success: true });
});

export default router;
