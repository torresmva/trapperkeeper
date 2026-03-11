import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { format, dateRange, tags, category } = req.body;
  let entries = await getAllEntries();

  if (dateRange?.start) entries = entries.filter(e => e.meta.date >= dateRange.start);
  if (dateRange?.end) entries = entries.filter(e => e.meta.date <= dateRange.end);
  if (tags?.length) entries = entries.filter(e => e.meta.tags.some((t: string) => tags.includes(t)));
  if (category && category !== 'all') entries = entries.filter(e => e.meta.category === category);

  entries.sort((a, b) => b.meta.date.localeCompare(a.meta.date));

  let output = '';

  switch (format) {
    case 'resume-bullets':
      output = entries
        .filter(e => e.meta.category === 'journal')
        .map(e => {
          const lines = e.body.split('\n').filter(l => l.trim().startsWith('-'));
          return `### ${e.meta.title} (${e.meta.date})\n${lines.join('\n')}`;
        })
        .join('\n\n');
      break;

    case 'blog-draft':
      output = entries
        .map(e => `## ${e.meta.title}\n*${e.meta.date}*\n\n${e.body}`)
        .join('\n\n---\n\n');
      break;

    case 'markdown-bundle':
    default:
      output = entries
        .map(e => `# ${e.meta.title}\n**Date:** ${e.meta.date} | **Tags:** ${e.meta.tags.join(', ')}\n\n${e.body}`)
        .join('\n\n---\n\n');
      break;
  }

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="trapperkeeper-export-${format}.md"`);
  res.send(output);
});

export default router;
