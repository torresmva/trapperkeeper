import { Entry, EntryMeta, TagCount, CollectionInfo, Stats, Task, Receipt, Link, TKPromise, Snippet, Runbook, RunbookExecution, WallItem, ConfessionalEntry, GhostEntry, RadarData, Trophy, WikiPage, WikiTreeNode, Capsule } from '../types';

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
  listNotes: (space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<Entry[]>(`/notes${qs}`);
  },
  quickNote: (data: { title?: string; body?: string; tags?: string[]; collections?: string[]; space?: string }) =>
    request<Entry>('/notes/quick', { method: 'POST', body: JSON.stringify(data) }),

  // Search
  search: (q: string, tag?: string, space?: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (tag) qs.set('tag', tag);
    if (space) qs.set('space', space);
    return request<Entry[]>(`/search?${qs.toString()}`);
  },
  getTags: (space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<TagCount[]>(`/search/tags${qs}`);
  },

  // Collections
  listCollections: (space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<CollectionInfo[]>(`/collections${qs}`);
  },
  getCollection: (name: string, space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<Entry[]>(`/collections/${encodeURIComponent(name)}${qs}`);
  },
  getBacklinks: (id: string) => request<Entry[]>(`/collections/backlinks/${encodeURIComponent(id)}`),

  // Spaces
  getSpaces: () => request<{ spaces: string[] }>('/spaces'),

  // Stats
  getStats: (space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<Stats>(`/stats${qs}`);
  },

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

  // Tasks
  listTasks: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<Task[]>(`/tasks${qs}`);
  },
  createTask: (data: { title: string; deadline?: string; priority?: string }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  completeTask: (id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: 'PATCH' }),
  archiveTask: (id: string) =>
    request<Task>(`/tasks/${id}/archive`, { method: 'PATCH' }),
  reopenTask: (id: string) =>
    request<Task>(`/tasks/${id}/reopen`, { method: 'PATCH' }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  // Receipts
  listReceipts: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request<Receipt[]>(`/receipts${qs}`);
  },
  createReceipt: (data: Partial<Receipt>) =>
    request<Receipt>('/receipts', { method: 'POST', body: JSON.stringify(data) }),
  updateReceipt: (id: string, data: Partial<Receipt>) =>
    request<Receipt>(`/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReceipt: (id: string) =>
    request<{ success: boolean }>(`/receipts/${id}`, { method: 'DELETE' }),

  // Links
  listLinks: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request<Link[]>(`/links${qs}`);
  },
  createLink: (data: Partial<Link>) =>
    request<Link>('/links', { method: 'POST', body: JSON.stringify(data) }),
  updateLink: (id: string, data: Partial<Link>) =>
    request<Link>(`/links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markLinkRead: (id: string) =>
    request<Link>(`/links/${id}/read`, { method: 'PATCH' }),
  archiveLink: (id: string) =>
    request<Link>(`/links/${id}/archive`, { method: 'PATCH' }),
  deleteLink: (id: string) =>
    request<{ success: boolean }>(`/links/${id}`, { method: 'DELETE' }),

  // Promises
  listPromises: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request<TKPromise[]>(`/promises${qs}`);
  },
  createPromise: (data: Partial<TKPromise>) =>
    request<TKPromise>('/promises', { method: 'POST', body: JSON.stringify(data) }),
  updatePromise: (id: string, data: Partial<TKPromise>) =>
    request<TKPromise>(`/promises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  keepPromise: (id: string) =>
    request<TKPromise>(`/promises/${id}/keep`, { method: 'PATCH' }),
  breakPromise: (id: string) =>
    request<TKPromise>(`/promises/${id}/break`, { method: 'PATCH' }),
  reopenPromise: (id: string) =>
    request<TKPromise>(`/promises/${id}/reopen`, { method: 'PATCH' }),
  deletePromise: (id: string) =>
    request<{ success: boolean }>(`/promises/${id}`, { method: 'DELETE' }),

  // Snippets
  listSnippets: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return request<Snippet[]>(`/snippets${qs}`);
  },
  createSnippet: (data: Partial<Snippet>) =>
    request<Snippet>('/snippets', { method: 'POST', body: JSON.stringify(data) }),
  updateSnippet: (id: string, data: Partial<Snippet>) =>
    request<Snippet>(`/snippets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  copySnippet: (id: string) =>
    request<Snippet>(`/snippets/${id}/copy`, { method: 'PATCH' }),
  deleteSnippet: (id: string) =>
    request<{ success: boolean }>(`/snippets/${id}`, { method: 'DELETE' }),

  // Runbooks
  listRunbooks: () => request<Runbook[]>('/runbooks'),
  getRunbook: (id: string) => request<Runbook>(`/runbooks/${id}`),
  createRunbook: (data: Partial<Runbook>) =>
    request<Runbook>('/runbooks', { method: 'POST', body: JSON.stringify(data) }),
  updateRunbook: (id: string, data: Partial<Runbook>) =>
    request<Runbook>(`/runbooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRunbook: (id: string) =>
    request<{ success: boolean }>(`/runbooks/${id}`, { method: 'DELETE' }),
  startRunbook: (id: string) =>
    request<RunbookExecution>(`/runbooks/${id}/run`, { method: 'POST' }),
  getRunbookLogs: (id: string) =>
    request<RunbookExecution[]>(`/runbooks/${id}/logs`),
  updateExecution: (execId: string, data: { stepId: string; completed: boolean; notes?: string }) =>
    request<RunbookExecution>(`/runbooks/exec/${execId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Wall
  getWallItems: () => request<WallItem[]>('/wall'),
  createWallItem: (data: Partial<WallItem>) =>
    request<WallItem>('/wall', { method: 'POST', body: JSON.stringify(data) }),
  updateWallItem: (id: string, data: Partial<WallItem>) =>
    request<WallItem>(`/wall/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bringToFront: (id: string) =>
    request<WallItem>(`/wall/${id}/front`, { method: 'PATCH' }),
  deleteWallItem: (id: string) =>
    request<{ success: boolean }>(`/wall/${id}`, { method: 'DELETE' }),

  // Confessional
  listConfessional: () => request<ConfessionalEntry[]>('/confessional'),
  createConfessional: (data: { ciphertext: string; iv: string; salt: string; hint?: string }) =>
    request<ConfessionalEntry>('/confessional', { method: 'POST', body: JSON.stringify(data) }),
  updateConfessional: (id: string, data: { ciphertext: string; iv: string; salt: string; hint?: string }) =>
    request<ConfessionalEntry>(`/confessional/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConfessional: (id: string) =>
    request<{ success: boolean }>(`/confessional/${id}`, { method: 'DELETE' }),

  // Ghosts
  getGhosts: (days?: number) => request<GhostEntry[]>(`/ghosts${days ? `?days=${days}` : ''}`),

  // Radar
  getRadar: (window?: number, by?: string, space?: string) => {
    const params = new URLSearchParams();
    if (window) params.set('window', String(window));
    if (by) params.set('by', by);
    if (space) params.set('space', space);
    return request<RadarData>(`/stats/radar?${params}`);
  },

  // Trophies
  getTrophies: () => request<Trophy[]>('/trophies'),
  checkTrophies: () => request<{ unlocked: Trophy[] }>('/trophies/check', { method: 'POST' }),

  // Wiki
  listWikiPages: (space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<WikiPage[]>(`/wiki${qs}`);
  },
  getWikiTree: (space?: string) => {
    const qs = space ? `?space=${encodeURIComponent(space)}` : '';
    return request<WikiTreeNode[]>(`/wiki/tree${qs}`);
  },
  getWikiPage: (slug: string) => request<WikiPage>(`/wiki/${encodeURIComponent(slug)}`),
  createWikiPage: (data: { title: string; body?: string; parent?: string; tags?: string[]; space?: string }) =>
    request<WikiPage>('/wiki', { method: 'POST', body: JSON.stringify(data) }),
  updateWikiPage: (slug: string, data: { title?: string; body?: string; parent?: string; tags?: string[]; order?: number }) =>
    request<WikiPage>(`/wiki/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWikiPage: (slug: string) =>
    request<{ success: boolean }>(`/wiki/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  bulkWikiAction: (data: { action: string; ids: string[]; parent?: string; tag?: string }) =>
    request<{ success: boolean; updated: number }>('/wiki/bulk', { method: 'POST', body: JSON.stringify(data) }),

  // Capsules
  listCapsules: () => request<Capsule[]>('/capsules'),
  createCapsule: (data: { title: string; content: string; unlockDate: string }) =>
    request<Capsule>('/capsules', { method: 'POST', body: JSON.stringify(data) }),
  openCapsule: (id: string) =>
    request<Capsule>(`/capsules/${id}/open`, { method: 'POST' }),
  deleteCapsule: (id: string) =>
    request<{ success: boolean }>(`/capsules/${id}`, { method: 'DELETE' }),

  // Standup
  getStandup: () => request<{ standup: string; yesterdayCount: number; taskCount: number }>('/standup'),
  getOnThisDay: () => request<{ label: string; date: string; entries: { id: string; title: string; type: string; category: string }[] }[]>('/standup/on-this-day'),

  // Parking lot
  getParkingLot: () => request<{ content: string }>('/scratch/parking-lot'),
  saveParkingLot: (content: string) =>
    request<{ success: boolean }>('/scratch/parking-lot', { method: 'PUT', body: JSON.stringify({ content }) }),

  // Sprint
  getSprint: () => request<{ name: string; startDate: string; endDate: string; major: string; minor: string } | null>('/scratch/sprint'),
  saveSprint: (data: { name: string; startDate: string; endDate: string; major: string; minor: string }) =>
    request<any>('/scratch/sprint', { method: 'PUT', body: JSON.stringify(data) }),

  // Git sync
  gitStatus: () => request<{
    initialized: boolean;
    branch: string | null;
    changes: number;
    hasRemote: boolean;
    ahead: number;
    lastCommit: { hash: string; date: string; message: string } | null;
    dirty: boolean;
  }>('/git/status'),
  gitSync: (message?: string) => request<{
    success: boolean;
    message: string;
    pushed: boolean;
    commit?: { hash: string; date: string; message: string };
  }>('/git/sync', { method: 'POST', body: JSON.stringify({ message }) }),

  // Oubliette
  listOubliette: () => request<{ id: string; title: string; originalType: string; deletedAt: string; daysRemaining: number }[]>('/oubliette'),
  restoreFromOubliette: (id: string) =>
    request<{ success: boolean; restoredTo: string }>(`/oubliette/${id}/restore`, { method: 'POST' }),
  deleteFromOubliette: (id: string) =>
    request<{ success: boolean }>(`/oubliette/${id}`, { method: 'DELETE' }),
  purgeOubliette: () =>
    request<{ success: boolean; purged: number }>('/oubliette/purge', { method: 'POST' }),

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
