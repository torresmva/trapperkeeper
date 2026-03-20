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
  space?: string;
  created: string;
  modified: string;
}

export interface Entry {
  id: string;
  meta: EntryMeta;
  body: string;
  filePath: string;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface CollectionInfo {
  name: string;
  count: number;
  pinnedCount: number;
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

export interface TKPromise {
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

export interface Snippet {
  id: string;
  code: string;
  language: string;
  title: string;
  tags: string[];
  created: string;
  copyCount: number;
}

export interface RunbookStep {
  id: string;
  label: string;
  notes?: string;
}

export interface Runbook {
  id: string;
  title: string;
  description?: string;
  steps: RunbookStep[];
  tags: string[];
  created: string;
  modified: string;
  lastRun?: string;
  runCount: number;
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  startedAt: string;
  completedAt?: string;
  steps: { stepId: string; completed: boolean; completedAt?: string; notes?: string }[];
}

export interface WallItem {
  id: string;
  content: string;
  type: 'note' | 'image' | 'link';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  created: string;
  modified: string;
  zIndex: number;
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

export interface Trophy {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'volume' | 'exploration' | 'special';
  threshold: number;
  icon: string;
  progress: number;
  unlockedAt?: string;
}

export interface WikiPage {
  id: string;
  meta: WikiPageMeta;
  body?: string;
}

export interface WikiPageMeta {
  title: string;
  parent?: string;
  tags: string[];
  created: string;
  modified: string;
  order?: number;
}

export interface WikiTreeNode {
  id: string;
  title: string;
  children: WikiTreeNode[];
}


export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RadarData {
  axes: { name: string; value: number }[];
  window: number;
  by: string;
}

export interface GhostEntry {
  id: string;
  title: string;
  date: string;
  type: string;
  category: string;
  bodyLength: number;
  age: number;
}
