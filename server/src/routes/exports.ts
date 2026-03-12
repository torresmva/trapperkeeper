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

    case 'brag-doc': {
      // Group entries by collection, then extract accomplishments
      const collectionMap = new Map<string, typeof entries>();
      const uncategorized: typeof entries = [];

      for (const e of entries) {
        if (e.meta.category !== 'journal') continue;
        if (e.meta.collections?.length) {
          for (const c of e.meta.collections) {
            if (!collectionMap.has(c)) collectionMap.set(c, []);
            collectionMap.get(c)!.push(e);
          }
        } else {
          uncategorized.push(e);
        }
      }

      const dateRange = entries.length
        ? `${entries[entries.length - 1].meta.date} — ${entries[0].meta.date}`
        : 'n/a';

      output = `# Self-Review / Brag Document\n`;
      output += `**Period:** ${dateRange}\n`;
      output += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n---\n\n`;

      for (const [collection, collEntries] of collectionMap) {
        output += `## ${collection.charAt(0).toUpperCase() + collection.slice(1)}\n\n`;
        for (const e of collEntries) {
          const bullets = e.body.split('\n').filter(l => l.trim().startsWith('-'));
          if (bullets.length) {
            output += `### ${e.meta.title} (${e.meta.date})\n`;
            output += bullets.join('\n') + '\n\n';
          } else {
            output += `### ${e.meta.title} (${e.meta.date})\n`;
            output += e.body.trim().split('\n').slice(0, 5).join('\n') + '\n\n';
          }
        }
      }

      if (uncategorized.length) {
        output += `## Other Accomplishments\n\n`;
        for (const e of uncategorized) {
          const bullets = e.body.split('\n').filter(l => l.trim().startsWith('-'));
          if (bullets.length) {
            output += `### ${e.meta.title} (${e.meta.date})\n`;
            output += bullets.join('\n') + '\n\n';
          }
        }
      }

      // Tag summary
      const allTags = entries.flatMap(e => e.meta.tags || []);
      const tagCounts = allTags.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {} as Record<string, number>);
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

      if (topTags.length) {
        output += `---\n\n## Key Themes\n\n`;
        output += topTags.map(([tag, count]) => `- **#${tag}** — ${count} entries`).join('\n');
        output += '\n';
      }

      break;
    }

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
