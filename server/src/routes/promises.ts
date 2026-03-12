import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { config } from '../config';
import { Promise as TKPromise } from '../types';

const router = Router();

async function readPromises(): Promise<TKPromise[]> {
  try {
    const data = await fs.readFile(config.promisesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writePromises(promises: TKPromise[]): Promise<void> {
  await fs.writeFile(config.promisesFile, JSON.stringify(promises, null, 2));
}

// List promises (optionally filter by direction or status)
router.get('/', async (req: Request, res: Response) => {
  const promises = await readPromises();
  const direction = req.query.direction as string | undefined;
  const status = req.query.status as string | undefined;
  const who = req.query.who as string | undefined;
  let filtered = promises;
  if (direction) filtered = filtered.filter(p => p.direction === direction);
  if (status) filtered = filtered.filter(p => p.status === status);
  if (who) filtered = filtered.filter(p => p.who.toLowerCase().includes(who.toLowerCase()));
  // Open first, then by due date, then by created
  filtered.sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (a.status !== 'open' && b.status === 'open') return 1;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return b.created.localeCompare(a.created);
  });
  res.json(filtered);
});

// Create promise
router.post('/', async (req: Request, res: Response) => {
  const { description, who, direction, due, context } = req.body;
  const promises = await readPromises();
  const promise: TKPromise = {
    id: `promise-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description,
    who: who || '',
    direction: direction || 'i-owe',
    due: due || undefined,
    status: 'open',
    context: context || undefined,
    created: new Date().toISOString(),
  };
  promises.push(promise);
  await writePromises(promises);
  res.status(201).json(promise);
});

// Update promise
router.put('/:id', async (req: Request, res: Response) => {
  const promises = await readPromises();
  const idx = promises.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  promises[idx] = { ...promises[idx], ...req.body, id: promises[idx].id };
  await writePromises(promises);
  res.json(promises[idx]);
});

// Keep promise (mark as kept)
router.patch('/:id/keep', async (req: Request, res: Response) => {
  const promises = await readPromises();
  const idx = promises.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  promises[idx].status = 'kept';
  promises[idx].resolved = new Date().toISOString();
  await writePromises(promises);
  res.json(promises[idx]);
});

// Break promise (mark as broken)
router.patch('/:id/break', async (req: Request, res: Response) => {
  const promises = await readPromises();
  const idx = promises.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  promises[idx].status = 'broken';
  promises[idx].resolved = new Date().toISOString();
  await writePromises(promises);
  res.json(promises[idx]);
});

// Reopen promise
router.patch('/:id/reopen', async (req: Request, res: Response) => {
  const promises = await readPromises();
  const idx = promises.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  promises[idx].status = 'open';
  promises[idx].resolved = undefined;
  await writePromises(promises);
  res.json(promises[idx]);
});

// Delete promise
router.delete('/:id', async (req: Request, res: Response) => {
  let promises = await readPromises();
  promises = promises.filter(p => p.id !== req.params.id);
  await writePromises(promises);
  res.json({ success: true });
});

export default router;
