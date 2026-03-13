import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { parseFrontmatter } from '../services/frontmatter';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const spaces = new Set<string>();

  // Scan entries
  const entries = await getAllEntries();
  for (const e of entries) {
    if ((e.meta as any).space) spaces.add((e.meta as any).space);
  }

  // Scan wiki pages
  try {
    const files = await fs.readdir(config.wikiDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await fs.readFile(path.join(config.wikiDir, file), 'utf-8');
      const { meta } = parseFrontmatter(content);
      if ((meta as any).space) spaces.add((meta as any).space);
    }
  } catch {}

  res.json({ spaces: Array.from(spaces).sort() });
});

export default router;
