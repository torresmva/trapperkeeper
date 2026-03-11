import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getAllEntries, getEntry, createEntry, listEntries } from './services/fileStore';
import { buildIndex, searchEntries } from './services/searchIndex';
import { format, subDays } from 'date-fns';

const server = new McpServer({ name: 'trapperkeeper', version: '1.0.0' });

server.tool('search_entries', 'Search your TrapperKeeper journal and notes', { query: z.string().describe('Search query'), tag: z.string().optional().describe('Filter by tag') }, async ({ query, tag }) => {
  const results = searchEntries(query);
  const entries = [];
  for (const id of results.slice(0, 10)) {
    const entry = await getEntry(id);
    if (entry && (!tag || entry.meta.tags.includes(tag))) {
      entries.push({ id: entry.id, title: entry.meta.title, date: entry.meta.date, type: entry.meta.type, snippet: entry.body.slice(0, 200) });
    }
  }
  return { content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }] };
});

server.tool('create_quick_note', 'Create a quick note in TrapperKeeper', { title: z.string().describe('Note title'), body: z.string().describe('Note content in markdown'), tags: z.array(z.string()).optional().describe('Tags for the note') }, async ({ title, body, tags }) => {
  const now = new Date().toISOString();
  const meta = { title, date: format(new Date(), 'yyyy-MM-dd'), type: 'note' as const, category: 'notes' as const, tags: tags || [], collections: [], pinned: false, pinnedInCollections: [], links: [], created: now, modified: now };
  const entry = await createEntry('notes', meta, body);
  return { content: [{ type: 'text' as const, text: `Created note: ${entry.meta.title} (${entry.id})` }] };
});

server.tool('list_recent_entries', 'List recent TrapperKeeper entries', { days: z.number().optional().describe('Number of days to look back (default 7)'), category: z.enum(['journal', 'notes']).optional().describe('Filter by category') }, async ({ days = 7, category }) => {
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
  let all = category ? await listEntries(category) : await getAllEntries();
  const recent = all.filter(e => e.meta.date >= cutoff && !e.meta.archived).sort((a, b) => b.meta.date.localeCompare(a.meta.date));
  const summary = recent.map(e => ({ id: e.id, title: e.meta.title, date: e.meta.date, type: e.meta.type, tags: e.meta.tags }));
  return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] };
});

server.tool('read_entry', 'Read the full content of a TrapperKeeper entry', { id: z.string().describe('Entry ID (file path like journal/2024/03/daily-2024-03-11.md)') }, async ({ id }) => {
  const entry = await getEntry(id);
  if (!entry) return { content: [{ type: 'text' as const, text: 'Entry not found' }] };
  return { content: [{ type: 'text' as const, text: `# ${entry.meta.title}\nDate: ${entry.meta.date} | Type: ${entry.meta.type} | Tags: ${entry.meta.tags.join(', ')}\n\n${entry.body}` }] };
});

async function main() {
  await buildIndex();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch(console.error);
