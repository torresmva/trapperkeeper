import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';
import { differenceInDays, parseISO } from 'date-fns';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const all = await getAllEntries();
  const today = new Date();

  const ghosts = all
    .map(entry => {
      const entryDate = parseISO(entry.meta.date);
      const age = differenceInDays(today, entryDate);
      if (age < days) return null;

      // Strip markdown headers and check remaining content
      const strippedBody = entry.body
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          // Remove header lines
          if (/^#{1,6}\s/.test(trimmed)) return false;
          // Remove empty template placeholders
          if (trimmed === '-' || trimmed === '- ' || trimmed === '>') return false;
          // Remove empty lines
          if (trimmed === '') return false;
          return true;
        })
        .join('\n')
        .trim();

      if (strippedBody.length < 100) {
        return {
          id: entry.id,
          title: entry.meta.title,
          date: entry.meta.date,
          type: entry.meta.type,
          category: entry.meta.category,
          bodyLength: entry.body.length,
          age,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Sort by age descending (oldest first)
  ghosts.sort((a: any, b: any) => b.age - a.age);

  res.json(ghosts);
});

export default router;
