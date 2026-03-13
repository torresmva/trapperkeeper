import { Router, Request, Response } from 'express';
import { listEntries, createEntry } from '../services/fileStore';
import { markPendingWrite } from '../services/watcher';
import { addToIndex } from '../services/searchIndex';
import { EntryMeta } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let entries = await listEntries('notes');
  const showArchived = req.query.archived === 'true';
  if (!showArchived) {
    entries = entries.filter(e => !e.meta.archived);
  }
  const space = req.query.space as string | undefined;
  if (space) entries = entries.filter(e => (e.meta as any).space === space);
  res.json(entries);
});

router.post('/quick', async (req: Request, res: Response) => {
  const { title, body, tags, collections, space } = req.body;
  const now = new Date();
  const meta: EntryMeta = {
    title: title || `Quick Note - ${now.toLocaleString()}`,
    date: now.toISOString().split('T')[0],
    type: 'note',
    category: 'notes',
    tags: tags || [],
    collections: collections || [],
    created: now.toISOString(),
    modified: now.toISOString(),
    pinned: false,
  };
  if (space) (meta as any).space = space;
  const entry = await createEntry('notes', meta, body || '');
  markPendingWrite(entry.filePath);
  addToIndex(entry);
  res.status(201).json(entry);
});

export default router;
