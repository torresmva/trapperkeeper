import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';
import fs from 'fs/promises';
import { config } from '../config';
import { Task } from '../types';

const router = Router();

// GET /api/standup — generate standup from yesterday's entries + today's tasks
router.get('/', async (_req: Request, res: Response) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Yesterday (skip weekends: if Monday, look at Friday)
  const dayOfWeek = now.getDay();
  const daysBack = dayOfWeek === 1 ? 3 : dayOfWeek === 0 ? 2 : 1;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - daysBack);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const entries = await getAllEntries();

  // Yesterday's entries
  const yesterdayEntries = entries.filter(e => e.meta.date === yesterdayStr);
  const todayEntries = entries.filter(e => e.meta.date === today);

  // Active tasks
  let tasks: Task[] = [];
  try {
    const data = await fs.readFile(config.tasksFile, 'utf-8');
    tasks = JSON.parse(data).filter((t: Task) => t.status === 'active');
  } catch { /* no tasks */ }

  // Build standup text
  let standup = `**standup — ${today}**\n\n`;

  standup += `### yesterday (${yesterdayStr})\n`;
  if (yesterdayEntries.length === 0) {
    standup += `- (no entries logged)\n`;
  } else {
    for (const e of yesterdayEntries) {
      const bullets = e.body.split('\n').filter(l => l.trim().startsWith('-')).slice(0, 5);
      if (bullets.length) {
        standup += `- **${e.meta.title}**\n`;
        bullets.forEach(b => { standup += `  ${b.trim()}\n`; });
      } else {
        standup += `- ${e.meta.title}\n`;
      }
    }
  }

  standup += `\n### today\n`;
  if (todayEntries.length > 0) {
    for (const e of todayEntries) {
      standup += `- ${e.meta.title}\n`;
    }
  }
  if (tasks.length > 0) {
    const highPri = tasks.filter(t => t.priority === 'high');
    const normal = tasks.filter(t => t.priority !== 'high').slice(0, 3);
    for (const t of [...highPri, ...normal]) {
      const pri = t.priority === 'high' ? ' (!!)' : '';
      const due = t.deadline ? ` [due ${t.deadline}]` : '';
      standup += `- ${t.title}${pri}${due}\n`;
    }
  }
  if (todayEntries.length === 0 && tasks.length === 0) {
    standup += `- (nothing queued yet)\n`;
  }

  standup += `\n### blockers\n- (none)\n`;

  res.json({ standup, yesterdayCount: yesterdayEntries.length, taskCount: tasks.length });
});

// GET /api/standup/on-this-day — entries from 1w, 1m, 1y ago
router.get('/on-this-day', async (_req: Request, res: Response) => {
  const now = new Date();
  const entries = await getAllEntries();

  const targets = [
    { label: '1 week ago', date: offsetDate(now, -7) },
    { label: '1 month ago', date: offsetDate(now, -30) },
    { label: '1 year ago', date: offsetDate(now, -365) },
  ];

  const results = targets.map(t => ({
    label: t.label,
    date: t.date,
    entries: entries
      .filter(e => e.meta.date === t.date)
      .map(e => ({ id: e.id, title: e.meta.title, type: e.meta.type, category: e.meta.category })),
  })).filter(t => t.entries.length > 0);

  res.json(results);
});

function offsetDate(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default router;
