import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config';
import { validate, gitSyncSchema } from '../schemas';

const execAsync = promisify(exec);
const router = Router();

// GET /api/git/status — check working tree status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: config.dataDir });
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: config.dataDir });
    const { stdout: remote } = await execAsync('git remote -v', { cwd: config.dataDir }).catch(() => ({ stdout: '' }));
    const { stdout: log } = await execAsync(
      'git log -1 --format="%H|%ai|%s"',
      { cwd: config.dataDir }
    ).catch(() => ({ stdout: '' }));

    const changes = status.trim().split('\n').filter(l => l.trim()).length;
    const hasRemote = remote.includes('origin');

    let lastCommit = null;
    if (log.trim()) {
      const [hash, date, ...msgParts] = log.trim().split('|');
      lastCommit = { hash: hash.trim(), date: date.trim(), message: msgParts.join('|').trim() };
    }

    // Check if ahead of remote
    let ahead = 0;
    if (hasRemote) {
      try {
        const { stdout: aheadStr } = await execAsync(
          'git rev-list --count origin/HEAD..HEAD',
          { cwd: config.dataDir }
        );
        ahead = parseInt(aheadStr.trim()) || 0;
      } catch {
        // remote tracking not set up
        try {
          const { stdout: aheadStr } = await execAsync(
            `git rev-list --count origin/${branch.trim()}..HEAD`,
            { cwd: config.dataDir }
          );
          ahead = parseInt(aheadStr.trim()) || 0;
        } catch {
          // ignore
        }
      }
    }

    res.json({
      initialized: true,
      branch: branch.trim(),
      changes,
      hasRemote,
      ahead,
      lastCommit,
      dirty: changes > 0,
    });
  } catch {
    res.json({
      initialized: false,
      branch: null,
      changes: 0,
      hasRemote: false,
      ahead: 0,
      lastCommit: null,
      dirty: false,
    });
  }
});

// POST /api/git/sync — stage all, commit, and push
router.post('/sync', async (req: Request, res: Response) => {
  const { message } = validate(gitSyncSchema, req.body);
  const commitMsg = message || `trapperkeeper sync — ${new Date().toISOString().split('T')[0]}`;

  try {
    // Stage all changes in data dir
    await execAsync('git add -A', { cwd: config.dataDir });

    // Check if there's anything to commit
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: config.dataDir });
    if (!status.trim()) {
      return res.json({ success: true, message: 'nothing to commit — working tree clean', pushed: false });
    }

    // Commit
    await execAsync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: config.dataDir });

    // Try to push
    let pushed = false;
    try {
      await execAsync('git push', { cwd: config.dataDir, timeout: 30000 });
      pushed = true;
    } catch (pushErr: any) {
      // Push failed but commit succeeded — that's ok
      console.log('Push failed (commit saved locally):', pushErr.message);
    }

    // Get the new commit info
    const { stdout: log } = await execAsync('git log -1 --format="%H|%ai|%s"', { cwd: config.dataDir });
    const [hash, date, ...msgParts] = log.trim().split('|');

    res.json({
      success: true,
      message: pushed ? 'committed and pushed' : 'committed locally (push failed — check remote)',
      pushed,
      commit: { hash: hash.trim(), date: date.trim(), message: msgParts.join('|').trim() },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'sync failed' });
  }
});

export default router;
