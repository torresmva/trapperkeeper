import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { config } from '../config';
import { Link } from '../types';

const router = Router();

async function readLinks(): Promise<Link[]> {
  try {
    const data = await fs.readFile(config.linksFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLinks(links: Link[]): Promise<void> {
  await fs.writeFile(config.linksFile, JSON.stringify(links, null, 2));
}

// List links (optionally filter by status or tag)
router.get('/', async (req: Request, res: Response) => {
  const links = await readLinks();
  const status = req.query.status as string | undefined;
  const tag = req.query.tag as string | undefined;
  let filtered = links;
  if (status) filtered = filtered.filter(l => l.status === status);
  if (tag) filtered = filtered.filter(l => l.tags.includes(tag));
  filtered.sort((a, b) => b.created.localeCompare(a.created));
  res.json(filtered);
});

// Create link
router.post('/', async (req: Request, res: Response) => {
  const { url, title, note, tags, status } = req.body;
  const links = await readLinks();
  const link: Link = {
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    title: title || url,
    note: note || undefined,
    tags: tags || [],
    status: status || 'unread',
    created: new Date().toISOString(),
  };
  links.push(link);
  await writeLinks(links);
  res.status(201).json(link);
});

// Update link
router.put('/:id', async (req: Request, res: Response) => {
  const links = await readLinks();
  const idx = links.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  links[idx] = { ...links[idx], ...req.body, id: links[idx].id };
  await writeLinks(links);
  res.json(links[idx]);
});

// Mark as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  const links = await readLinks();
  const idx = links.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  links[idx].status = 'read';
  await writeLinks(links);
  res.json(links[idx]);
});

// Archive link
router.patch('/:id/archive', async (req: Request, res: Response) => {
  const links = await readLinks();
  const idx = links.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  links[idx].status = 'archived';
  await writeLinks(links);
  res.json(links[idx]);
});

// Delete link
router.delete('/:id', async (req: Request, res: Response) => {
  let links = await readLinks();
  links = links.filter(l => l.id !== req.params.id);
  await writeLinks(links);
  res.json({ success: true });
});

export default router;
