import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { config } from '../config';
import { getAllEntries } from '../services/fileStore';
import { format, subDays } from 'date-fns';

const router = Router();

const TROPHY_DEFS = [
  { id: 'first-entry', name: 'first blood', description: 'write your first entry', category: 'volume', threshold: 1, icon: 'sword' },
  { id: 'entries-10', name: 'getting started', description: 'write 10 entries', category: 'volume', threshold: 10, icon: 'scroll' },
  { id: 'entries-50', name: 'chronicler', description: 'write 50 entries', category: 'volume', threshold: 50, icon: 'scroll' },
  { id: 'entries-100', name: 'centurion', description: 'reach 100 entries', category: 'volume', threshold: 100, icon: 'shield' },
  { id: 'entries-500', name: 'lorekeeper', description: 'reach 500 entries', category: 'volume', threshold: 500, icon: 'crown' },
  { id: 'streak-7', name: 'on fire', description: '7-day writing streak', category: 'streak', threshold: 7, icon: 'fire' },
  { id: 'streak-30', name: 'unstoppable', description: '30-day writing streak', category: 'streak', threshold: 30, icon: 'fire' },
  { id: 'streak-100', name: 'legendary', description: '100-day writing streak', category: 'streak', threshold: 100, icon: 'lightning' },
  { id: 'night-owl', name: 'night owl', description: 'write an entry after midnight', category: 'special', threshold: 1, icon: 'ghost' },
  { id: 'early-bird', name: 'early bird', description: 'write an entry before 6am', category: 'special', threshold: 1, icon: 'coffee' },
  { id: 'collector', name: 'collector', description: 'use 5 different collections', category: 'exploration', threshold: 5, icon: 'folder' },
  { id: 'tag-master', name: 'tag master', description: 'use 20 unique tags', category: 'exploration', threshold: 20, icon: 'star' },
  { id: 'runbook-runner', name: 'runbook runner', description: 'complete a runbook execution', category: 'special', threshold: 1, icon: 'rocket' },
  { id: 'wiki-author', name: 'wiki author', description: 'create your first wiki page', category: 'special', threshold: 1, icon: 'scroll' },
];

interface TrophyState {
  [trophyId: string]: { progress: number; unlockedAt?: string };
}

async function readState(): Promise<TrophyState> {
  try {
    const data = await fs.readFile(config.trophiesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeState(state: TrophyState): Promise<void> {
  await fs.writeFile(config.trophiesFile, JSON.stringify(state, null, 2));
}

// GET /api/trophies — all trophy definitions merged with progress
router.get('/', async (_req: Request, res: Response) => {
  const state = await readState();
  const merged = TROPHY_DEFS.map(def => ({
    ...def,
    progress: state[def.id]?.progress || 0,
    unlockedAt: state[def.id]?.unlockedAt || null,
    unlocked: (state[def.id]?.progress || 0) >= def.threshold,
  }));
  res.json(merged);
});

// POST /api/trophies/check — evaluate all trophies, update progress
router.post('/check', async (_req: Request, res: Response) => {
  const all = await getAllEntries();
  const state = await readState();
  const previousState = { ...state };

  // Volume: total entry count
  const totalEntries = all.length;
  for (const def of TROPHY_DEFS.filter(d => d.category === 'volume')) {
    state[def.id] = state[def.id] || { progress: 0 };
    state[def.id].progress = totalEntries;
    if (totalEntries >= def.threshold && !state[def.id].unlockedAt) {
      state[def.id].unlockedAt = new Date().toISOString();
    }
  }

  // Streak: compute current streak (consecutive days going back from today)
  const today = new Date();
  const datesWithEntries = new Set(all.map(e => e.meta.date));
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    if (datesWithEntries.has(d)) {
      currentStreak++;
    } else {
      if (i === 0) {
        currentStreak = 0;
      }
      break;
    }
  }
  for (const def of TROPHY_DEFS.filter(d => d.category === 'streak')) {
    state[def.id] = state[def.id] || { progress: 0 };
    state[def.id].progress = currentStreak;
    if (currentStreak >= def.threshold && !state[def.id].unlockedAt) {
      state[def.id].unlockedAt = new Date().toISOString();
    }
  }

  // Night owl: entry created between 00:00-04:00
  const nightOwlCount = all.filter(e => {
    try {
      const hour = new Date(e.meta.created).getHours();
      return hour >= 0 && hour < 4;
    } catch { return false; }
  }).length;
  state['night-owl'] = state['night-owl'] || { progress: 0 };
  state['night-owl'].progress = nightOwlCount;
  if (nightOwlCount >= 1 && !state['night-owl'].unlockedAt) {
    state['night-owl'].unlockedAt = new Date().toISOString();
  }

  // Early bird: entry created between 04:00-06:00
  const earlyBirdCount = all.filter(e => {
    try {
      const hour = new Date(e.meta.created).getHours();
      return hour >= 4 && hour < 6;
    } catch { return false; }
  }).length;
  state['early-bird'] = state['early-bird'] || { progress: 0 };
  state['early-bird'].progress = earlyBirdCount;
  if (earlyBirdCount >= 1 && !state['early-bird'].unlockedAt) {
    state['early-bird'].unlockedAt = new Date().toISOString();
  }

  // Collector: unique collections
  const uniqueCollections = new Set<string>();
  for (const e of all) {
    for (const c of e.meta.collections || []) uniqueCollections.add(c);
  }
  state['collector'] = state['collector'] || { progress: 0 };
  state['collector'].progress = uniqueCollections.size;
  if (uniqueCollections.size >= 5 && !state['collector'].unlockedAt) {
    state['collector'].unlockedAt = new Date().toISOString();
  }

  // Tag master: unique tags
  const uniqueTags = new Set<string>();
  for (const e of all) {
    for (const t of e.meta.tags) uniqueTags.add(t);
  }
  state['tag-master'] = state['tag-master'] || { progress: 0 };
  state['tag-master'].progress = uniqueTags.size;
  if (uniqueTags.size >= 20 && !state['tag-master'].unlockedAt) {
    state['tag-master'].unlockedAt = new Date().toISOString();
  }

  // Runbook runner: check runbook-logs.json for completed execution
  let runbookCompleted = 0;
  try {
    const logsData = await fs.readFile(config.runbookLogsFile, 'utf-8');
    const logs = JSON.parse(logsData);
    runbookCompleted = Array.isArray(logs) ? logs.filter((l: any) => l.completedAt).length : 0;
  } catch { /* no logs */ }
  state['runbook-runner'] = state['runbook-runner'] || { progress: 0 };
  state['runbook-runner'].progress = runbookCompleted;
  if (runbookCompleted >= 1 && !state['runbook-runner'].unlockedAt) {
    state['runbook-runner'].unlockedAt = new Date().toISOString();
  }

  // Wiki author: check if data/wiki/ has any .md files
  let wikiPages = 0;
  try {
    const files = await fs.readdir(config.wikiDir);
    wikiPages = files.filter(f => f.endsWith('.md')).length;
  } catch { /* no wiki dir */ }
  state['wiki-author'] = state['wiki-author'] || { progress: 0 };
  state['wiki-author'].progress = wikiPages;
  if (wikiPages >= 1 && !state['wiki-author'].unlockedAt) {
    state['wiki-author'].unlockedAt = new Date().toISOString();
  }

  await writeState(state);

  // Find newly unlocked trophies
  const newlyUnlocked = TROPHY_DEFS.filter(def => {
    const prev = previousState[def.id];
    const curr = state[def.id];
    return curr?.unlockedAt && !prev?.unlockedAt;
  }).map(def => ({
    ...def,
    progress: state[def.id].progress,
    unlockedAt: state[def.id].unlockedAt,
  }));

  res.json({ newlyUnlocked, all: TROPHY_DEFS.map(def => ({
    ...def,
    progress: state[def.id]?.progress || 0,
    unlockedAt: state[def.id]?.unlockedAt || null,
    unlocked: (state[def.id]?.progress || 0) >= def.threshold,
  }))});
});

export default router;
