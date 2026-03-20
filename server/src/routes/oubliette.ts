import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { paginate, parsePagination } from '../services/pagination';

const router = Router();

const PURGE_DAYS = 30;

export interface OublietteItem {
  id: string;
  originalPath: string;
  originalType: 'entry' | 'wiki' | 'note';
  deletedAt: string;
  content: string;
  meta: Record<string, any>;
}

async function readAllItems(): Promise<OublietteItem[]> {
  const items: OublietteItem[] = [];
  try {
    const files = await fs.readdir(config.oublietteDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(config.oublietteDir, file), 'utf-8');
        const item: OublietteItem = JSON.parse(raw);
        items.push(item);
      } catch {
        // skip corrupt files
      }
    }
  } catch {
    // dir doesn't exist yet
  }
  return items;
}

function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
  return Math.max(0, PURGE_DAYS - elapsed);
}

function extractTitle(item: OublietteItem): string {
  return item.meta?.title || path.basename(item.originalPath, path.extname(item.originalPath));
}

/**
 * Move a file to the oubliette instead of permanently deleting it.
 * Exported so other routes can use it.
 */
export async function moveToOubliette(
  filePath: string,
  originalType: 'entry' | 'wiki' | 'note',
  meta: Record<string, any> = {}
): Promise<OublietteItem> {
  await fs.mkdir(config.oublietteDir, { recursive: true });

  const content = await fs.readFile(filePath, 'utf-8');
  const id = uuidv4();
  const originalPath = path.relative(config.dataDir, filePath);

  const item: OublietteItem = {
    id,
    originalPath,
    originalType,
    deletedAt: new Date().toISOString(),
    content,
    meta,
  };

  await fs.writeFile(
    path.join(config.oublietteDir, `${id}.json`),
    JSON.stringify(item, null, 2)
  );

  await fs.unlink(filePath);

  return item;
}

// GET /api/oubliette — list all items, sorted by deletedAt desc
router.get('/', async (_req: Request, res: Response) => {
  const items = await readAllItems();
  items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const list = items.map(item => ({
    id: item.id,
    title: extractTitle(item),
    originalType: item.originalType,
    deletedAt: item.deletedAt,
    daysRemaining: daysRemaining(item.deletedAt),
  }));

  if (_req.query.page) {
    const { page, pageSize } = parsePagination(_req.query as any, 50);
    return res.json(paginate(list, page, pageSize));
  }
  res.json(list);
});

// POST /api/oubliette/:id/restore — restore item to original location
router.post('/:id/restore', async (req: Request, res: Response) => {
  const { id } = req.params;
  const itemPath = path.join(config.oublietteDir, `${id}.json`);

  try {
    const raw = await fs.readFile(itemPath, 'utf-8');
    const item: OublietteItem = JSON.parse(raw);
    const restorePath = path.join(config.dataDir, item.originalPath);

    // Ensure the target directory exists
    await fs.mkdir(path.dirname(restorePath), { recursive: true });

    // Write original content back
    await fs.writeFile(restorePath, item.content, 'utf-8');

    // Remove from oubliette
    await fs.unlink(itemPath);

    res.json({ success: true, restoredTo: item.originalPath });
  } catch {
    res.status(404).json({ error: 'item not found in oubliette' });
  }
});

// DELETE /api/oubliette/:id — permanently delete from oubliette
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const itemPath = path.join(config.oublietteDir, `${id}.json`);

  try {
    await fs.unlink(itemPath);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'item not found in oubliette' });
  }
});

// POST /api/oubliette/purge — permanently delete all items older than 30 days
router.post('/purge', async (_req: Request, res: Response) => {
  const items = await readAllItems();
  let purged = 0;

  for (const item of items) {
    if (daysRemaining(item.deletedAt) === 0) {
      try {
        await fs.unlink(path.join(config.oublietteDir, `${item.id}.json`));
        purged++;
      } catch {
        // already gone
      }
    }
  }

  res.json({ success: true, purged });
});

export default router;
