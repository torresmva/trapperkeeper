import { Router, Request, Response } from 'express';
import { getAllEntries } from '../services/fileStore';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { Stats, ActivityDay } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const space = req.query.space as string | undefined;
  const allRaw = await getAllEntries();
  const all = space ? allRaw.filter(e => (e.meta as any).space === space) : allRaw;
  const journal = all.filter(e => e.meta.category === 'journal');
  const notes = all.filter(e => e.meta.category === 'notes');

  // Activity map — last 365 days
  const today = new Date();
  const activityMap: Record<string, number> = {};
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    activityMap[d] = 0;
  }
  for (const entry of all) {
    const d = entry.meta.date;
    if (activityMap[d] !== undefined) {
      activityMap[d]++;
    }
  }
  const activity: ActivityDay[] = Object.entries(activityMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Streaks — consecutive days with at least one entry
  const datesWithEntries = new Set(all.map(e => e.meta.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    if (datesWithEntries.has(d)) {
      streak++;
      if (i === 0 || currentStreak > 0) currentStreak = streak;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      if (i === 0) currentStreak = 0;
      streak = 0;
    }
  }

  // This week / month counts
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const thisWeek = all.filter(e => e.meta.date >= weekStart).length;
  const thisMonth = all.filter(e => e.meta.date >= monthStart).length;

  // Top tags
  const tagCounts: Record<string, number> = {};
  for (const entry of all) {
    for (const tag of entry.meta.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Top collections
  const collCounts: Record<string, number> = {};
  for (const entry of all) {
    for (const coll of entry.meta.collections || []) {
      collCounts[coll] = (collCounts[coll] || 0) + 1;
    }
  }
  const topCollections = Object.entries(collCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const stats: Stats = {
    totalEntries: all.length,
    totalJournal: journal.length,
    totalNotes: notes.length,
    currentStreak,
    longestStreak,
    thisWeek,
    thisMonth,
    activity,
    topTags,
    topCollections,
  };

  res.json(stats);
});

// Radar endpoint — entry distribution across tags or collections
router.get('/radar', async (req: Request, res: Response) => {
  const window = parseInt(req.query.window as string) || 30;
  const by = (req.query.by as string) || 'collections';
  const space = req.query.space as string | undefined;
  const allRaw = await getAllEntries();
  const all = space ? allRaw.filter(e => (e.meta as any).space === space) : allRaw;
  const today = new Date();
  const cutoff = format(subDays(today, window), 'yyyy-MM-dd');

  const filtered = all.filter(e => e.meta.date >= cutoff);
  const counts: Record<string, number> = {};

  for (const entry of filtered) {
    const items = by === 'tags' ? entry.meta.tags : (entry.meta.collections || []);
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
  }

  // Sort by count descending, take top 8
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const max = sorted.length > 0 ? sorted[0][1] : 1;
  const axes = sorted.map(([name, value]) => ({
    name,
    value: value / max,
  }));

  res.json({ axes, window, by });
});

export default router;
