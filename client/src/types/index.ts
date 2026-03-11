export interface EntryMeta {
  title: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'note' | 'meeting' | 'incident' | 'decision' | '1on1' | 'project-update';
  category: 'journal' | 'notes';
  tags: string[];
  collections: string[];
  pinned?: boolean;
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
