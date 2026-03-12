import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const router = Router();
const snippetsFile = path.join(config.dataDir, 'snippets.json');

export interface Snippet {
  id: string;
  code: string;
  language: string;
  title: string;
  tags: string[];
  created: string;
  copyCount: number;
}

async function readSnippets(): Promise<Snippet[]> {
  try {
    const data = await fs.readFile(snippetsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSnippets(snippets: Snippet[]): Promise<void> {
  await fs.writeFile(snippetsFile, JSON.stringify(snippets, null, 2));
}

// List snippets
router.get('/', async (req: Request, res: Response) => {
  const snippets = await readSnippets();
  const lang = req.query.language as string | undefined;
  const tag = req.query.tag as string | undefined;
  let filtered = snippets;
  if (lang) filtered = filtered.filter(s => s.language === lang);
  if (tag) filtered = filtered.filter(s => s.tags.includes(tag));
  // Most used first, then newest
  filtered.sort((a, b) => b.copyCount - a.copyCount || b.created.localeCompare(a.created));
  res.json(filtered);
});

// Create snippet
router.post('/', async (req: Request, res: Response) => {
  const { code, language, title, tags } = req.body;
  const snippets = await readSnippets();
  const snippet: Snippet = {
    id: `snip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code,
    language: language || 'text',
    title: title || '',
    tags: tags || [],
    created: new Date().toISOString(),
    copyCount: 0,
  };
  snippets.push(snippet);
  await writeSnippets(snippets);
  res.status(201).json(snippet);
});

// Update snippet
router.put('/:id', async (req: Request, res: Response) => {
  const snippets = await readSnippets();
  const idx = snippets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  snippets[idx] = { ...snippets[idx], ...req.body, id: snippets[idx].id };
  await writeSnippets(snippets);
  res.json(snippets[idx]);
});

// Bump copy count
router.patch('/:id/copy', async (req: Request, res: Response) => {
  const snippets = await readSnippets();
  const idx = snippets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  snippets[idx].copyCount++;
  await writeSnippets(snippets);
  res.json(snippets[idx]);
});

// Delete snippet
router.delete('/:id', async (req: Request, res: Response) => {
  let snippets = await readSnippets();
  snippets = snippets.filter(s => s.id !== req.params.id);
  await writeSnippets(snippets);
  res.json({ success: true });
});

export default router;
