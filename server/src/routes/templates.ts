import { Router, Request, Response } from 'express';
import { listTemplates, getTemplate, expandTemplate } from '../services/templateEngine';

const router = Router();

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

export default router;
