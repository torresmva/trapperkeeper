import { Router, Request, Response } from 'express';
import { searchEntries } from '../services/searchIndex';
import { getEntry, getAllEntries } from '../services/fileStore';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const tag = req.query.tag as string | undefined;
  const space = req.query.space as string | undefined;

  const showArchived = req.query.archived === 'true';

  if (!q && !tag) return res.json([]);

  let ids: string[] = [];

  if (q) {
    ids = searchEntries(q);
  }

  if (tag && !q) {
    const all = await getAllEntries();
    const filtered = all.filter(e => e.meta.tags.includes(tag) && (showArchived || !e.meta.archived) && (!space || (e.meta as any).space === space));
    return res.json(filtered);
  }

  const entries = [];
  for (const id of ids) {
    const entry = await getEntry(id);
    if (entry) {
      if (tag && !entry.meta.tags.includes(tag)) continue;
      if (!showArchived && entry.meta.archived) continue;
      if (space && (entry.meta as any).space !== space) continue;
      entries.push(entry);
    }
  }
  res.json(entries);
});

router.get('/tags', async (req: Request, res: Response) => {
  const space = req.query.space as string | undefined;
  const all = await getAllEntries();
  const filtered = space ? all.filter(e => (e.meta as any).space === space) : all;
  const tagCounts: Record<string, number> = {};
  for (const entry of filtered) {
    for (const tag of entry.meta.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  res.json(tags);
});

export default router;
