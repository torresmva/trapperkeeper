import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { getEntry, updateEntry } from '../services/fileStore';
import { markPendingWrite } from '../services/watcher';
import { addToIndex } from '../services/searchIndex';

const router = Router();

const storage = multer.diskStorage({
  destination: config.assetsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const audioExts = ['.webm', '.mp3', '.wav', '.ogg'];
    const prefix = audioExts.includes(ext.toLowerCase()) ? 'audio' : 'img';
    const name = `${prefix}-${Date.now()}-${uuid().slice(0, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    // Handle base64 upload
    const { data, filename } = req.body;
    if (!data) return res.status(400).json({ error: 'No file or data provided' });

    const ext = path.extname(filename || '.png') || '.png';
    const audioExts = ['.webm', '.mp3', '.wav', '.ogg'];
    const prefix = audioExts.includes(ext.toLowerCase()) ? 'audio' : 'img';
    const name = `${prefix}-${Date.now()}-${uuid().slice(0, 8)}${ext}`;
    const filePath = path.join(config.assetsDir, name);

    const buffer = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
    await fs.mkdir(config.assetsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return res.json({ filename: name, path: `assets/${name}` });
  }

  res.json({
    filename: req.file.filename,
    path: `assets/${req.file.filename}`,
  });
});

// Attach audio to an existing entry — upload file + append audio link to note body
router.post('/attach', upload.single('file'), async (req: Request, res: Response) => {
  const entryId = req.body.entryId;
  if (!entryId) return res.status(400).json({ error: 'entryId required' });

  let filename: string;

  if (req.file) {
    filename = req.file.filename;
  } else {
    const { data, name } = req.body;
    if (!data) return res.status(400).json({ error: 'No file or data provided' });
    const ext = path.extname(name || '.wav') || '.wav';
    const audioExts = ['.webm', '.mp3', '.wav', '.ogg', '.m4a'];
    const prefix = audioExts.includes(ext.toLowerCase()) ? 'audio' : 'img';
    filename = `${prefix}-${Date.now()}-${uuid().slice(0, 8)}${ext}`;
    const filePath = path.join(config.assetsDir, filename);
    const buffer = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
    await fs.mkdir(config.assetsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  // Append audio link to entry
  const entry = await getEntry(entryId);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  const audioUrl = `/api/assets/files/${filename}`;
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const audioLine = `\n\n**recording** _${timestamp}_ — [${filename}](${audioUrl})`;

  const updatedBody = entry.body + audioLine;
  entry.meta.modified = new Date().toISOString();
  markPendingWrite(path.join(config.dataDir, entryId));
  const updated = await updateEntry(entryId, entry.meta, updatedBody);
  addToIndex(updated!);

  res.json({ filename, url: audioUrl, entryId });
});

export default router;
