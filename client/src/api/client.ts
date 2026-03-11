import { Entry, EntryMeta, TagCount, CollectionInfo, Stats } from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Entries
  listEntries: (category: string, params?: Record<string, string>) => {
    const qs = new URLSearchParams({ category, ...params }).toString();
    return request<Entry[]>(`/entries?${qs}`);
  },
  getEntry: (id: string) => request<Entry>(`/entries/${encodeURIComponent(id)}`),
  createEntry: (data: { meta: EntryMeta; body: string; category: string; filename?: string }) =>
    request<Entry>('/entries', { method: 'POST', body: JSON.stringify(data) }),
  updateEntry: (id: string, meta: EntryMeta, body: string) =>
    request<Entry>(`/entries/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ meta, body }),
    }),
  deleteEntry: (id: string) =>
    request<{ success: boolean }>(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Notes
  listNotes: () => request<Entry[]>('/notes'),
  quickNote: (data: { title?: string; body?: string; tags?: string[]; collections?: string[] }) =>
    request<Entry>('/notes/quick', { method: 'POST', body: JSON.stringify(data) }),

  // Search
  search: (q: string, tag?: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (tag) qs.set('tag', tag);
    return request<Entry[]>(`/search?${qs.toString()}`);
  },
  getTags: () => request<TagCount[]>('/search/tags'),

  // Collections
  listCollections: () => request<CollectionInfo[]>('/collections'),
  getCollection: (name: string) => request<Entry[]>(`/collections/${encodeURIComponent(name)}`),
  getBacklinks: (id: string) => request<Entry[]>(`/collections/backlinks/${encodeURIComponent(id)}`),

  // Stats
  getStats: () => request<Stats>('/stats'),

  // Templates
  listTemplates: () => request<string[]>('/templates'),
  getTemplate: (name: string) =>
    request<{ name: string; raw: string; expanded: string }>(`/templates/${name}`),

  // Assets
  uploadImage: async (file: File | Blob): Promise<{ filename: string; path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/assets`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  uploadBase64: (data: string, filename?: string) =>
    request<{ filename: string; path: string }>('/assets', {
      method: 'POST',
      body: JSON.stringify({ data, filename }),
    }),

  // Archive
  archiveEntry: async (id: string) => {
    const res = await fetch(`${BASE}/entries/${encodeURIComponent(id)}/archive`, { method: 'PATCH' });
    return res.json();
  },

  // Digest
  getWeeklyDigest: () => request<any>('/digest/weekly'),

  // History
  getHistory: (id: string) => request<{ commits: { hash: string; date: string; message: string }[]; message?: string }>(
    `/history/${encodeURIComponent(id)}`
  ),
  getHistoryDiff: (id: string, hash: string) => request<{ content: string }>(
    `/history/${encodeURIComponent(id)}/diff/${hash}`
  ),

  // Import
  importFiles: async (files: File[], category: string = 'notes') => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('category', category);
    const res = await fetch(`${BASE}/import`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Import failed');
    return res.json();
  },

  // Duplicate
  duplicateEntry: async (id: string) => {
    const entry = await api.getEntry(id);
    if (!entry) throw new Error('Entry not found');
    const now = new Date().toISOString();
    const meta = { ...entry.meta, title: `${entry.meta.title} (copy)`, created: now, modified: now };
    return api.createEntry({ meta, body: entry.body, category: entry.meta.category });
  },

  // Audio upload
  uploadAudio: async (file: File | Blob): Promise<{ filename: string; path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/assets`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // Exports
  exportEntries: async (options: {
    format: string;
    dateRange?: { start: string; end: string };
    tags?: string[];
    category?: string;
  }) => {
    const res = await fetch(`${BASE}/exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.text();
  },
};
