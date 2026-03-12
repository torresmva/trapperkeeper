import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { config } from '../config';
import { Receipt } from '../types';

const router = Router();

async function readReceipts(): Promise<Receipt[]> {
  try {
    const data = await fs.readFile(config.receiptsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeReceipts(receipts: Receipt[]): Promise<void> {
  await fs.writeFile(config.receiptsFile, JSON.stringify(receipts, null, 2));
}

// List receipts (optionally filter by status)
router.get('/', async (req: Request, res: Response) => {
  const receipts = await readReceipts();
  const status = req.query.status as string | undefined;
  const who = req.query.who as string | undefined;
  let filtered = receipts;
  if (status) filtered = filtered.filter(r => r.status === status);
  if (who) filtered = filtered.filter(r => r.who.toLowerCase().includes(who.toLowerCase()));
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  res.json(filtered);
});

// Create receipt
router.post('/', async (req: Request, res: Response) => {
  const { what, who, date, outcome, tags, entryId, status } = req.body;
  const receipts = await readReceipts();
  const now = new Date().toISOString();
  const receipt: Receipt = {
    id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    what,
    who: who || '',
    date: date || now.split('T')[0],
    outcome: outcome || undefined,
    tags: tags || [],
    entryId: entryId || undefined,
    status: status || 'delivered',
    created: now,
    modified: now,
  };
  receipts.push(receipt);
  await writeReceipts(receipts);
  res.status(201).json(receipt);
});

// Update receipt
router.put('/:id', async (req: Request, res: Response) => {
  const receipts = await readReceipts();
  const idx = receipts.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  receipts[idx] = { ...receipts[idx], ...req.body, id: receipts[idx].id, modified: new Date().toISOString() };
  await writeReceipts(receipts);
  res.json(receipts[idx]);
});

// Delete receipt
router.delete('/:id', async (req: Request, res: Response) => {
  let receipts = await readReceipts();
  receipts = receipts.filter(r => r.id !== req.params.id);
  await writeReceipts(receipts);
  res.json({ success: true });
});

export default router;
