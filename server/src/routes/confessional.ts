import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const router = Router();
const confessionalFile = path.join(config.dataDir, 'confessional.json');

// Entries are encrypted client-side. Server only stores ciphertext.
export interface ConfessionalEntry {
  id: string;
  ciphertext: string; // Base64 AES-GCM encrypted content
  iv: string;         // Base64 initialization vector
  salt: string;       // Base64 PBKDF2 salt
  hint?: string;      // Optional plaintext hint (NOT the content)
  created: string;
  modified: string;
}

async function readEntries(): Promise<ConfessionalEntry[]> {
  try {
    const data = await fs.readFile(confessionalFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeEntries(entries: ConfessionalEntry[]): Promise<void> {
  await fs.writeFile(confessionalFile, JSON.stringify(entries, null, 2));
}

// List entries (metadata only — ciphertext included but unreadable without key)
router.get('/', async (_req: Request, res: Response) => {
  const entries = await readEntries();
  entries.sort((a, b) => b.created.localeCompare(a.created));
  res.json(entries);
});

// Create encrypted entry
router.post('/', async (req: Request, res: Response) => {
  const { ciphertext, iv, salt, hint } = req.body;
  if (!ciphertext || !iv || !salt) {
    return res.status(400).json({ error: 'ciphertext, iv, and salt are required' });
  }
  const entries = await readEntries();
  const now = new Date().toISOString();
  const entry: ConfessionalEntry = {
    id: `conf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ciphertext,
    iv,
    salt,
    hint: hint || undefined,
    created: now,
    modified: now,
  };
  entries.push(entry);
  await writeEntries(entries);
  res.status(201).json(entry);
});

// Update encrypted entry
router.put('/:id', async (req: Request, res: Response) => {
  const entries = await readEntries();
  const idx = entries.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const { ciphertext, iv, salt, hint } = req.body;
  if (ciphertext) entries[idx].ciphertext = ciphertext;
  if (iv) entries[idx].iv = iv;
  if (salt) entries[idx].salt = salt;
  if (hint !== undefined) entries[idx].hint = hint || undefined;
  entries[idx].modified = new Date().toISOString();
  await writeEntries(entries);
  res.json(entries[idx]);
});

// Delete entry
router.delete('/:id', async (req: Request, res: Response) => {
  let entries = await readEntries();
  entries = entries.filter(e => e.id !== req.params.id);
  await writeEntries(entries);
  res.json({ success: true });
});

export default router;
