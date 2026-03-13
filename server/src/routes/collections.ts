import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';

const router = Router();

// List all collections with counts
router.get('/', async (req: Request, res: Response) => {
  const showArchived = req.query.archived === 'true';
  const space = req.query.space as string | undefined;
  let all = await getAllEntries();
  if (!showArchived) {
    all = all.filter(e => !e.meta.archived);
  }
  if (space) all = all.filter(e => (e.meta as any).space === space);
  const collMap: Record<string, { count: number; pinnedCount: number }> = {};

  for (const entry of all) {
    for (const coll of entry.meta.collections || []) {
      if (!collMap[coll]) collMap[coll] = { count: 0, pinnedCount: 0 };
      collMap[coll].count++;
      if (entry.meta.pinnedInCollections?.includes(coll)) {
        collMap[coll].pinnedCount++;
      }
    }
  }

  const collections = Object.entries(collMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  res.json(collections);
});

// Get entries in a collection
router.get('/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  const showArchived = req.query.archived === 'true';
  const space = req.query.space as string | undefined;
  let all = await getAllEntries();
  if (!showArchived) {
    all = all.filter(e => !e.meta.archived);
  }
  if (space) all = all.filter(e => (e.meta as any).space === space);
  const entries = all.filter(e => (e.meta.collections || []).includes(name));

  // Sort: pinned first, then by date
  entries.sort((a, b) => {
    const aPinned = a.meta.pinnedInCollections?.includes(name) ? 1 : 0;
    const bPinned = b.meta.pinnedInCollections?.includes(name) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return b.meta.date.localeCompare(a.meta.date);
  });

  res.json(entries);
});

// Get backlinks for an entry
router.get('/backlinks/:id(*)', async (req: Request, res: Response) => {
  const targetId = req.params.id;
  const all = await getAllEntries();

  // Find entries that link to this one
  const backlinks = all.filter(e => {
    if (e.id === targetId) return false;
    return (e.meta.links || []).some(link => {
      // Match by filename, title, or full id
      return targetId.includes(link) || e.body.includes(`[[${link}]]`);
    });
  });

  res.json(backlinks);
});

export default router;
