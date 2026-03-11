import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { parseFrontmatter, serializeFrontmatter } from './frontmatter';
import { Entry, EntryMeta } from '../types';

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function findMdFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await findMdFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
  return files;
}

export async function listEntries(category: 'journal' | 'notes'): Promise<Entry[]> {
  const baseDir = category === 'journal' ? config.journalDir : config.notesDir;
  const files = await findMdFiles(baseDir);
  const entries: Entry[] = [];

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      const id = path.relative(config.dataDir, filePath);
      entries.push({ id, meta, body, filePath });
    } catch {
      // Skip unreadable files
    }
  }

  entries.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
  return entries;
}

export async function getEntry(id: string): Promise<Entry | null> {
  const filePath = path.join(config.dataDir, id);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    return { id, meta, body, filePath };
  } catch {
    return null;
  }
}

export async function createEntry(
  category: 'journal' | 'notes',
  meta: EntryMeta,
  body: string,
  filename?: string
): Promise<Entry> {
  const baseDir = category === 'journal' ? config.journalDir : config.notesDir;
  let filePath: string;

  if (category === 'journal') {
    const [year, month] = meta.date.split('-');
    const dir = path.join(baseDir, year, month);
    await ensureDir(dir);
    const name = filename || `${meta.date}.md`;
    filePath = path.join(dir, name);
  } else {
    await ensureDir(baseDir);
    const slug = meta.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    const name = filename || `${slug}-${Date.now()}.md`;
    filePath = path.join(baseDir, name);
  }

  const content = serializeFrontmatter(meta, body);
  await fs.writeFile(filePath, content, 'utf-8');
  const id = path.relative(config.dataDir, filePath);
  return { id, meta, body, filePath };
}

export async function updateEntry(id: string, meta: EntryMeta, body: string): Promise<Entry | null> {
  const filePath = path.join(config.dataDir, id);
  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  meta.modified = new Date().toISOString();
  const content = serializeFrontmatter(meta, body);
  await fs.writeFile(filePath, content, 'utf-8');
  return { id, meta, body, filePath };
}

export async function deleteEntry(id: string): Promise<boolean> {
  const filePath = path.join(config.dataDir, id);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getAllEntries(): Promise<Entry[]> {
  const journal = await listEntries('journal');
  const notes = await listEntries('notes');
  return [...journal, ...notes];
}
