import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { config } from '../config';

const execAsync = promisify(exec);
const router = Router();

// GET /api/history/:id(*) — get git log for a file
router.get('/:id(*)', async (req: Request, res: Response) => {
  const filePath = path.join(config.dataDir, req.params.id);
  const dataDir = config.dataDir;

  try {
    const { stdout } = await execAsync(
      `git log --follow --format="%H|%ai|%s" -- "${path.relative(dataDir, filePath)}"`,
      { cwd: dataDir }
    );

    if (!stdout.trim()) {
      return res.json({ commits: [], message: 'No git history found. Is the data directory a git repo?' });
    }

    const commits = stdout.trim().split('\n').map(line => {
      const [hash, date, ...msgParts] = line.split('|');
      return { hash: hash.trim(), date: date.trim(), message: msgParts.join('|').trim() };
    });

    res.json({ commits });
  } catch (err: any) {
    // Git not initialized or file not tracked
    res.json({ commits: [], message: 'Git history unavailable' });
  }
});

// GET /api/history/:id(*)/diff/:hash — get diff for a specific commit
router.get('/:id(*)/diff/:hash', async (req: Request, res: Response) => {
  const filePath = path.join(config.dataDir, req.params.id);
  const dataDir = config.dataDir;
  const hash = req.params.hash;

  // Validate hash format to prevent injection
  if (!/^[a-f0-9]{7,40}$/.test(hash)) {
    return res.status(400).json({ error: 'Invalid commit hash' });
  }

  try {
    const { stdout } = await execAsync(
      `git show ${hash}:"${path.relative(dataDir, filePath)}"`,
      { cwd: dataDir }
    );
    res.json({ content: stdout });
  } catch {
    res.status(404).json({ error: 'Version not found' });
  }
});

export default router;
