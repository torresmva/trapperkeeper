import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { config } from '../config';

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

export default router;
