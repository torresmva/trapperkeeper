import matter from 'gray-matter';
import { EntryMeta } from '../types';

export function parseFrontmatter(content: string): { meta: EntryMeta; body: string } {
  const { data, content: body } = matter(content);
  const meta: EntryMeta = {
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().split('T')[0],
    type: data.type || 'note',
    category: data.category || 'notes',
    tags: Array.isArray(data.tags) ? data.tags : [],
    collections: Array.isArray(data.collections) ? data.collections : [],
    pinned: data.pinned || false,
    archived: data.archived || false,
    pinnedInCollections: Array.isArray(data.pinnedInCollections) ? data.pinnedInCollections : [],
    links: Array.isArray(data.links) ? data.links : [],
    created: data.created || new Date().toISOString(),
    modified: data.modified || new Date().toISOString(),
  };

  // Auto-extract [[wiki-links]] from body
  const wikiLinks = body.match(/\[\[([^\]]+)\]\]/g);
  if (wikiLinks) {
    const extracted = wikiLinks.map(l => l.slice(2, -2));
    meta.links = [...new Set([...(meta.links || []), ...extracted])];
  }

  return { meta, body: body.trim() };
}

export function serializeFrontmatter(meta: EntryMeta, body: string): string {
  // Don't serialize empty arrays or computed fields
  const data: Record<string, any> = { ...meta };
  if (!data.collections?.length) delete data.collections;
  if (!data.pinnedInCollections?.length) delete data.pinnedInCollections;
  if (!data.links?.length) delete data.links;
  if (!data.pinned) delete data.pinned;
  if (!data.archived) delete data.archived;
  return matter.stringify('\n' + body, data);
}
