import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';
import { format, subDays } from 'date-fns';

const router = Router();

router.get('/weekly', async (_req: Request, res: Response) => {
  const today = new Date();
  const sevenDaysAgo = format(subDays(today, 7), 'yyyy-MM-dd');
  const all = await getAllEntries();
  const recent = all
    .filter(e => e.meta.date >= sevenDaysAgo && !e.meta.archived)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));

  const grouped: Record<string, { title: string; type: string; id: string; category: string }[]> = {};
  for (const entry of recent) {
    const day = entry.meta.date;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({ title: entry.meta.title, type: entry.meta.type, id: entry.id, category: entry.meta.category });
  }

  const days = Object.entries(grouped)
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => b.date.localeCompare(a.date));

  res.json({ period: { start: sevenDaysAgo, end: format(today, 'yyyy-MM-dd') }, totalEntries: recent.length, days });
});

export default router;
