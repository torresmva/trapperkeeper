import MiniSearch from 'minisearch';
import { Entry } from '../types';
import { getAllEntries } from './fileStore';

let search: MiniSearch;

function createIndex(): MiniSearch {
  return new MiniSearch({
    fields: ['title', 'body', 'tags'],
    storeFields: ['id'],
    searchOptions: {
      boost: { title: 3, tags: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
}

export async function buildIndex(): Promise<void> {
  search = createIndex();
  const entries = await getAllEntries();
  const docs = entries.map(e => ({
    id: e.id,
    title: e.meta.title,
    body: e.body,
    tags: e.meta.tags.join(' '),
  }));
  search.addAll(docs);
  console.log(`Search index built: ${docs.length} documents`);
}

export function addToIndex(entry: Entry): void {
  try { search.discard(entry.id); } catch {}
  search.add({
    id: entry.id,
    title: entry.meta.title,
    body: entry.body,
    tags: entry.meta.tags.join(' '),
  });
}

export function removeFromIndex(id: string): void {
  try { search.discard(id); } catch {}
}

export function searchEntries(query: string): string[] {
  const results = search.search(query);
  return results.map(r => r.id as string);
}
