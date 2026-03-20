import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { subDays } from 'date-fns';
import { config } from '../config';
import { getAllEntries } from '../services/fileStore';
import { parseFrontmatter } from '../services/frontmatter';
import { paginate, parsePagination } from '../services/pagination';

const router = Router();

interface ActivityEvent {
  type: string;
  action: string;
  timestamp: string;
  title: string;
  detail?: string;
  icon?: string;
  accent?: string;
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function readJsonObject<T extends Record<string, any>>(filePath: string): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {} as T;
  }
}

async function getEntryEvents(): Promise<ActivityEvent[]> {
  const entries = await getAllEntries();
  return entries.map((e) => ({
    type: 'entry',
    action: 'entry-created',
    timestamp: e.meta.created,
    title: e.meta.title,
    detail: e.meta.type,
    icon: 'scroll',
    accent: '#22d3ee',
  }));
}

async function getTaskEvents(): Promise<ActivityEvent[]> {
  const tasks = await readJsonFile<{
    id: string; title: string; status: string; created: string; completed?: string;
  }>(config.tasksFile);
  const events: ActivityEvent[] = [];
  for (const t of tasks) {
    events.push({
      type: 'task',
      action: 'task-created',
      timestamp: t.created,
      title: t.title,
      icon: 'checkbox',
      accent: '#4ade80',
    });
    if (t.completed) {
      events.push({
        type: 'task',
        action: 'task-completed',
        timestamp: t.completed,
        title: t.title,
        icon: 'trophy',
        accent: '#4ade80',
      });
    }
  }
  return events;
}

async function getReceiptEvents(): Promise<ActivityEvent[]> {
  const receipts = await readJsonFile<{
    id: string; what: string; who: string; status: string; created: string; modified: string;
  }>(config.receiptsFile);
  return receipts.map((r) => ({
    type: 'receipt',
    action: 'receipt-created',
    timestamp: r.created,
    title: r.what,
    detail: r.who,
    icon: 'receipt',
    accent: '#fb923c',
  }));
}

async function getLinkEvents(): Promise<ActivityEvent[]> {
  const links = await readJsonFile<{
    id: string; url: string; title: string; status: string; created: string;
  }>(config.linksFile);
  return links.map((l) => ({
    type: 'link',
    action: 'link-saved',
    timestamp: l.created,
    title: l.title,
    detail: l.url,
    icon: 'link',
    accent: '#22d3ee',
  }));
}

async function getPromiseEvents(): Promise<ActivityEvent[]> {
  const promises = await readJsonFile<{
    id: string; description: string; who: string; direction: string;
    status: string; created: string; resolved?: string;
  }>(config.promisesFile);
  const events: ActivityEvent[] = [];
  for (const p of promises) {
    events.push({
      type: 'promise',
      action: 'promise-created',
      timestamp: p.created,
      title: p.description,
      detail: `${p.who} (${p.direction})`,
      icon: 'handshake',
      accent: '#f472b6',
    });
    if (p.resolved) {
      events.push({
        type: 'promise',
        action: 'promise-resolved',
        timestamp: p.resolved,
        title: p.description,
        detail: p.status === 'kept' ? 'kept' : 'broken',
        icon: 'handshake',
        accent: p.status === 'kept' ? '#4ade80' : '#f87171',
      });
    }
  }
  return events;
}

async function getSnippetEvents(): Promise<ActivityEvent[]> {
  const snippetsFile = path.join(config.dataDir, 'snippets.json');
  const snippets = await readJsonFile<{
    id: string; title: string; language: string; created: string;
  }>(snippetsFile);
  return snippets.map((s) => ({
    type: 'snippet',
    action: 'snippet-created',
    timestamp: s.created,
    title: s.title,
    detail: s.language,
    icon: 'code',
    accent: '#22d3ee',
  }));
}

async function getWikiEvents(): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];
  try {
    const files = await fs.readdir(config.wikiDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await fs.readFile(path.join(config.wikiDir, file), 'utf-8');
      const { meta } = parseFrontmatter(content);
      const title = meta.title || file.replace(/\.md$/, '');
      events.push({
        type: 'wiki',
        action: 'wiki-created',
        timestamp: meta.created,
        title,
        icon: 'book',
        accent: '#fb923c',
      });
      if (meta.modified && meta.modified !== meta.created) {
        events.push({
          type: 'wiki',
          action: 'wiki-updated',
          timestamp: meta.modified,
          title,
          icon: 'pencil',
          accent: '#fb923c',
        });
      }
    }
  } catch {
    // wiki dir may not exist
  }
  return events;
}


async function getTrophyEvents(): Promise<ActivityEvent[]> {
  const TROPHY_NAMES: Record<string, string> = {
    'first-entry': 'first blood',
    'entries-10': 'getting started',
    'entries-50': 'chronicler',
    'entries-100': 'centurion',
    'entries-500': 'lorekeeper',
    'streak-7': 'on fire',
    'streak-30': 'unstoppable',
    'streak-100': 'legendary',
    'night-owl': 'night owl',
    'early-bird': 'early bird',
    'collector': 'collector',
    'tag-master': 'tag master',
    'runbook-runner': 'runbook runner',
    'wiki-author': 'wiki author',
    'time-traveler': 'time traveler',
  };
  const state = await readJsonObject<Record<string, { progress: number; unlockedAt?: string }>>(config.trophiesFile);
  const events: ActivityEvent[] = [];
  for (const [id, trophy] of Object.entries(state)) {
    if (trophy.unlockedAt) {
      events.push({
        type: 'trophy',
        action: 'trophy-unlocked',
        timestamp: trophy.unlockedAt,
        title: TROPHY_NAMES[id] || id,
        icon: 'trophy',
        accent: '#fb923c',
      });
    }
  }
  return events;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt(_req.query.days as string) || 30, 1), 365);
    const limit = Math.min(Math.max(parseInt(_req.query.limit as string) || 50, 1), 200);
    const cutoff = subDays(new Date(), days);

    const sources = await Promise.all([
      getEntryEvents(),
      getTaskEvents(),
      getReceiptEvents(),
      getLinkEvents(),
      getPromiseEvents(),
      getSnippetEvents(),
      getWikiEvents(),
      getTrophyEvents(),
    ]);

    const allEvents = sources.flat();

    const filtered = allEvents
      .filter((e) => e.timestamp && new Date(e.timestamp) >= cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    if (_req.query.page) {
      const { page, pageSize } = parsePagination(_req.query as any, 50);
      return res.json(paginate(filtered, page, pageSize));
    }
    res.json(filtered);
  } catch (err) {
    console.error('activity feed error:', err);
    res.status(500).json({ error: 'failed to build activity feed' });
  }
});

export default router;
