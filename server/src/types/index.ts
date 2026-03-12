export interface EntryMeta {
  title: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'note' | 'meeting' | 'incident' | 'decision' | '1on1' | 'project-update';
  category: 'journal' | 'notes';
  tags: string[];
  collections: string[];
  pinned?: boolean;
  archived?: boolean;
  pinnedInCollections?: string[];
  links?: string[];
  created: string;
  modified: string;
}

export interface Entry {
  id: string;
  meta: EntryMeta;
  body: string;
  filePath: string;
}

export interface SearchResult {
  entry: Entry;
  matches: { field: string; snippet: string }[];
  score: number;
}

export interface RollupPeriod {
  label: string;
  startDate: string;
  endDate: string;
  entries: Entry[];
}

export interface WeeklyDigest {
  period: { start: string; end: string };
  totalEntries: number;
  days: { date: string; entries: { title: string; type: string; id: string }[] }[];
}

export interface ExportOptions {
  format: 'resume-bullets' | 'blog-draft' | 'markdown-bundle';
  dateRange: { start: string; end: string };
  tags?: string[];
  category?: 'journal' | 'notes' | 'all';
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface Task {
  id: string;
  title: string;
  deadline?: string;
  priority: 'low' | 'normal' | 'high';
  status: 'active' | 'completed' | 'archived';
  created: string;
  completed?: string;
}

export interface Receipt {
  id: string;
  what: string;
  who: string;
  date: string;
  outcome?: string;
  tags: string[];
  entryId?: string;
  status: 'delivered' | 'pending' | 'acknowledged';
  created: string;
  modified: string;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  note?: string;
  tags: string[];
  status: 'unread' | 'read' | 'archived';
  created: string;
}

export interface Promise {
  id: string;
  description: string;
  who: string;
  direction: 'i-owe' | 'they-owe';
  due?: string;
  status: 'open' | 'kept' | 'broken';
  context?: string;
  created: string;
  resolved?: string;
}

export interface Stats {
  totalEntries: number;
  totalJournal: number;
  totalNotes: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  thisMonth: number;
  activity: ActivityDay[];
  topTags: { name: string; count: number }[];
  topCollections: { name: string; count: number }[];
}
