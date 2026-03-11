import { Router, Request, Response } from 'express';
import { listEntries, getEntry, createEntry, updateEntry, deleteEntry } from '../services/fileStore';
import { markPendingWrite } from '../services/watcher';
import { addToIndex, removeFromIndex } from '../services/searchIndex';
import path from 'path';
import { config } from '../config';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const category = (req.query.category as 'journal' | 'notes') || 'journal';
  const type = req.query.type as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const tag = req.query.tag as string | undefined;
  const collection = req.query.collection as string | undefined;

  let entries = await listEntries(category);

  const showArchived = req.query.archived === 'true';
  if (!showArchived) {
    entries = entries.filter(e => !e.meta.archived);
  }

  if (type) entries = entries.filter(e => e.meta.type === type);
  if (from) entries = entries.filter(e => e.meta.date >= from);
  if (to) entries = entries.filter(e => e.meta.date <= to);
  if (tag) entries = entries.filter(e => e.meta.tags.includes(tag));
  if (collection) entries = entries.filter(e => (e.meta.collections || []).includes(collection));

  res.json(entries);
});

router.get('/:id(*)', async (req: Request, res: Response) => {
  const entry = await getEntry(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

router.post('/', async (req: Request, res: Response) => {
  const { meta, body, category, filename } = req.body;
  const entry = await createEntry(category || 'journal', meta, body || '', filename);
  markPendingWrite(entry.filePath);
  addToIndex(entry);
  res.status(201).json(entry);
});

router.put('/:id(*)', async (req: Request, res: Response) => {
  const { meta, body } = req.body;
  const filePath = path.join(config.dataDir, req.params.id);
  markPendingWrite(filePath);
  const entry = await updateEntry(req.params.id, meta, body);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  addToIndex(entry);
  res.json(entry);
});

router.patch('/:id(*)/archive', async (req: Request, res: Response) => {
  const entry = await getEntry(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  entry.meta.archived = !entry.meta.archived;
  entry.meta.modified = new Date().toISOString();
  const updated = await updateEntry(req.params.id, entry.meta, entry.body);
  res.json(updated);
});

router.delete('/:id(*)', async (req: Request, res: Response) => {
  removeFromIndex(req.params.id);
  const deleted = await deleteEntry(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Entry not found' });
  res.json({ success: true });
});

export default router;
