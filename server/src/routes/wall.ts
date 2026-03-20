import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { validate, createWallItemSchema, updateWallItemSchema, bulkWallUpdateSchema } from '../schemas';

const router = Router();
const wallFile = path.join(config.dataDir, 'wall.json');

export interface WallItem {
  id: string;
  content: string;
  type: 'note' | 'image' | 'link';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  created: string;
  modified: string;
  zIndex: number;
}

async function readWall(): Promise<WallItem[]> {
  try {
    const data = await fs.readFile(wallFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeWall(items: WallItem[]): Promise<void> {
  await fs.writeFile(wallFile, JSON.stringify(items, null, 2));
}

// Get all wall items
router.get('/', async (_req: Request, res: Response) => {
  const items = await readWall();
  res.json(items);
});

// Create wall item
router.post('/', async (req: Request, res: Response) => {
  const { content, type, x, y, width, height, color } = validate(createWallItemSchema, req.body);
  const items = await readWall();
  const maxZ = items.reduce((max, i) => Math.max(max, i.zIndex || 0), 0);
  const now = new Date().toISOString();
  const item: WallItem = {
    id: `wall-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content: content || '',
    type: type || 'note',
    x: x ?? 50,
    y: y ?? 50,
    width: width ?? 200,
    height: height ?? 150,
    color: color || 'var(--accent-primary)',
    created: now,
    modified: now,
    zIndex: maxZ + 1,
  };
  items.push(item);
  await writeWall(items);
  res.status(201).json(item);
});

// Update wall item (position, size, content, color)
router.put('/:id', async (req: Request, res: Response) => {
  const items = await readWall();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const allowed = ['content', 'x', 'y', 'width', 'height', 'color', 'zIndex', 'type'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) (items[idx] as any)[key] = req.body[key];
  }
  items[idx].modified = new Date().toISOString();
  await writeWall(items);
  res.json(items[idx]);
});

// Bring to front
router.patch('/:id/front', async (req: Request, res: Response) => {
  const items = await readWall();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const maxZ = items.reduce((max, i) => Math.max(max, i.zIndex || 0), 0);
  items[idx].zIndex = maxZ + 1;
  await writeWall(items);
  res.json(items[idx]);
});

// Delete wall item
router.delete('/:id', async (req: Request, res: Response) => {
  let items = await readWall();
  items = items.filter(i => i.id !== req.params.id);
  await writeWall(items);
  res.json({ success: true });
});

// Bulk update (for drag operations that move multiple items)
router.put('/', async (req: Request, res: Response) => {
  const updates = validate(bulkWallUpdateSchema, req.body);
  const items = await readWall();
  for (const update of updates) {
    const idx = items.findIndex(i => i.id === update.id);
    if (idx !== -1) {
      if (update.x !== undefined) items[idx].x = update.x;
      if (update.y !== undefined) items[idx].y = update.y;
      if (update.width !== undefined) items[idx].width = update.width;
      if (update.height !== undefined) items[idx].height = update.height;
      items[idx].modified = new Date().toISOString();
    }
  }
  await writeWall(items);
  res.json(items);
});

export default router;
