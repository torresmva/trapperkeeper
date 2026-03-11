import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseFrontmatter } from '../services/frontmatter';
import { createEntry } from '../services/fileStore';
import { format } from 'date-fns';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post('/', upload.array('files', 50), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const results = [];
  const category = (req.body.category as string) || 'notes';

  for (const file of files) {
    try {
      const content = file.buffer.toString('utf-8');
      const { meta, body } = parseFrontmatter(content);

      // Fill in defaults if frontmatter was missing
      const now = new Date().toISOString();
      if (!meta.title || meta.title === 'Untitled') {
        meta.title = file.originalname.replace(/\.md$/i, '');
      }
      if (!meta.date) {
        meta.date = format(new Date(), 'yyyy-MM-dd');
      }
      if (!meta.created) {
        meta.created = now;
      }
      meta.modified = now;

      const entry = await createEntry(category as 'journal' | 'notes', meta, body || content);
      results.push({ success: true, filename: file.originalname, id: entry.id, title: entry.meta.title });
    } catch (err: any) {
      results.push({ success: false, filename: file.originalname, error: err.message });
    }
  }

  res.json({ imported: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results });
});

export default router;
