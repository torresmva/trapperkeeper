import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { listTemplates, getTemplate, expandTemplate } from '../services/templateEngine';
import { config } from '../config';

const router = Router();

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

function sanitizeName(name: string): boolean {
  return VALID_NAME.test(name);
}

router.get('/', async (_req: Request, res: Response) => {
  const templates = await listTemplates();
  res.json(templates);
});

router.get('/:name', async (req: Request, res: Response) => {
  const raw = await getTemplate(req.params.name);
  if (!raw) return res.status(404).json({ error: 'Template not found' });
  const expanded = expandTemplate(raw);
  res.json({ name: req.params.name, raw, expanded });
});

router.put('/:name', async (req: Request, res: Response) => {
  const { name } = req.params;
  if (!sanitizeName(name)) {
    return res.status(400).json({ error: 'Invalid template name. Only alphanumeric characters, hyphens, and underscores are allowed.' });
  }
  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string.' });
  }
  const filePath = path.join(config.templatesDir, `${name}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  const expanded = expandTemplate(content);
  res.json({ name, raw: content, expanded });
});

router.delete('/:name', async (req: Request, res: Response) => {
  const { name } = req.params;
  if (!sanitizeName(name)) {
    return res.status(400).json({ error: 'Invalid template name. Only alphanumeric characters, hyphens, and underscores are allowed.' });
  }
  const filePath = path.join(config.templatesDir, `${name}.md`);
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Template not found' });
    }
    throw err;
  }
  res.json({ success: true });
});

export default router;
