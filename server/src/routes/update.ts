import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import https from 'https';

const execAsync = promisify(exec);
const router = Router();

// ── version info baked at build time ──────────────────────────────
interface VersionInfo {
  version: string;
  commit: string;
  buildDate: string;
  branch: string;
}

let cachedVersion: VersionInfo | null = null;

async function getVersion(): Promise<VersionInfo> {
  if (cachedVersion) return cachedVersion;

  const versionFile = path.resolve(__dirname, '..', '..', '..', 'VERSION.json');
  try {
    const raw = await fs.readFile(versionFile, 'utf-8');
    cachedVersion = JSON.parse(raw);
    return cachedVersion!;
  } catch {
    // Dev mode — read from git directly
    try {
      const { stdout: version } = await execAsync('git describe --tags --always 2>/dev/null || echo "dev"');
      const { stdout: commit } = await execAsync('git rev-parse --short HEAD 2>/dev/null || echo "unknown"');
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"');
      cachedVersion = {
        version: version.trim(),
        commit: commit.trim(),
        buildDate: new Date().toISOString(),
        branch: branch.trim(),
      };
      return cachedVersion!;
    } catch {
      cachedVersion = { version: 'dev', commit: 'unknown', buildDate: '', branch: 'unknown' };
      return cachedVersion!;
    }
  }
}

// ── helpers ───────────────────────────────────────────────────────

function httpGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'trapperkeeper-updater', ...headers } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location, headers).then(resolve, reject);
      }
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/** Parse semver-ish string → comparable parts */
function parseSemver(v: string): { major: number; minor: number; patch: number; raw: string } | null {
  const match = v.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: +match[1], minor: +match[2], patch: +match[3], raw: v };
}

function isNewer(remote: string, local: string): boolean {
  const r = parseSemver(remote);
  const l = parseSemver(local);
  if (!r || !l) return remote !== local;
  if (r.major !== l.major) return r.major > l.major;
  if (r.minor !== l.minor) return r.minor > l.minor;
  return r.patch > l.patch;
}

// ── update config from env ────────────────────────────────────────

interface UpdateConfig {
  provider: 'gitlab' | 'github';
  apiUrl: string;
  repo: string;         // e.g. "mtorres/trapperkeeper" or project ID for gitlab
  image: string;        // docker image, e.g. "registry.gitlab.com/mtorres/trapperkeeper"
  token: string;        // optional auth token for private repos/registries
  composePath: string;  // path to docker-compose.yml inside container
}

function getUpdateConfig(): UpdateConfig {
  return {
    provider: (process.env.TK_UPDATE_PROVIDER as 'gitlab' | 'github') || 'gitlab',
    apiUrl: process.env.TK_UPDATE_API_URL || (process.env.TK_UPDATE_PROVIDER === 'github' ? 'https://api.github.com' : 'http://192.168.0.181:8080'),
    repo: process.env.TK_UPDATE_REPO || '',
    image: process.env.TK_UPDATE_IMAGE || '',
    token: process.env.TK_UPDATE_TOKEN || '',
    composePath: process.env.TK_COMPOSE_PATH || '/app/docker-compose.yml',
  };
}

// ── fetch latest release from remote ──────────────────────────────

interface RemoteRelease {
  version: string;
  tag: string;
  date: string;
  url: string;
  changelog: string;
}

async function fetchLatestRelease(cfg: UpdateConfig): Promise<RemoteRelease> {
  const headers: Record<string, string> = {};

  if (cfg.provider === 'gitlab') {
    if (cfg.token) headers['PRIVATE-TOKEN'] = cfg.token;
    // GitLab API — repo can be project ID or URL-encoded path
    const encodedRepo = encodeURIComponent(cfg.repo);
    const url = `${cfg.apiUrl}/api/v4/projects/${encodedRepo}/releases`;
    const raw = await httpGet(url, headers);
    const releases = JSON.parse(raw);
    if (!releases.length) throw new Error('no releases found');
    const latest = releases[0]; // GitLab returns newest first
    return {
      version: latest.tag_name?.replace(/^v/, '') || latest.tag_name,
      tag: latest.tag_name,
      date: latest.released_at || latest.created_at,
      url: latest._links?.self || '',
      changelog: latest.description || '',
    };
  } else {
    // GitHub API
    if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;
    headers['Accept'] = 'application/vnd.github+json';
    const url = `${cfg.apiUrl}/repos/${cfg.repo}/releases/latest`;
    const raw = await httpGet(url, headers);
    const release = JSON.parse(raw);
    return {
      version: release.tag_name?.replace(/^v/, '') || release.tag_name,
      tag: release.tag_name,
      date: release.published_at || release.created_at,
      url: release.html_url || '',
      changelog: release.body || '',
    };
  }
}

// If no releases, fall back to tags
async function fetchLatestTag(cfg: UpdateConfig): Promise<RemoteRelease> {
  const headers: Record<string, string> = {};

  if (cfg.provider === 'gitlab') {
    if (cfg.token) headers['PRIVATE-TOKEN'] = cfg.token;
    const encodedRepo = encodeURIComponent(cfg.repo);
    const url = `${cfg.apiUrl}/api/v4/projects/${encodedRepo}/repository/tags?order_by=version&sort=desc&per_page=1`;
    const raw = await httpGet(url, headers);
    const tags = JSON.parse(raw);
    if (!tags.length) throw new Error('no tags found');
    const latest = tags[0];
    return {
      version: latest.name?.replace(/^v/, '') || latest.name,
      tag: latest.name,
      date: latest.commit?.committed_date || '',
      url: '',
      changelog: latest.message || latest.release?.description || '',
    };
  } else {
    if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;
    headers['Accept'] = 'application/vnd.github+json';
    const url = `${cfg.apiUrl}/repos/${cfg.repo}/tags?per_page=1`;
    const raw = await httpGet(url, headers);
    const tags = JSON.parse(raw);
    if (!tags.length) throw new Error('no tags found');
    return {
      version: tags[0].name?.replace(/^v/, '') || tags[0].name,
      tag: tags[0].name,
      date: '',
      url: '',
      changelog: '',
    };
  }
}

// ── check if docker socket is available ───────────────────────────

async function hasDockerSocket(): Promise<boolean> {
  try {
    await fs.access('/var/run/docker.sock');
    return true;
  } catch {
    return false;
  }
}

async function hasDockerCLI(): Promise<boolean> {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════

// GET /api/update/version — current version info
router.get('/version', async (_req: Request, res: Response) => {
  const version = await getVersion();
  const cfg = getUpdateConfig();
  const docker = await hasDockerSocket();
  res.json({
    ...version,
    updateConfigured: !!(cfg.repo && cfg.image),
    dockerSocket: docker,
    provider: cfg.provider,
  });
});

// GET /api/update/check — check for new version
router.get('/check', async (_req: Request, res: Response) => {
  const cfg = getUpdateConfig();
  if (!cfg.repo) {
    return res.status(400).json({
      error: 'update not configured',
      detail: 'set TK_UPDATE_REPO and TK_UPDATE_IMAGE environment variables',
    });
  }

  try {
    const current = await getVersion();
    let remote: RemoteRelease;

    try {
      remote = await fetchLatestRelease(cfg);
    } catch {
      // No releases — try tags
      remote = await fetchLatestTag(cfg);
    }

    const updateAvailable = isNewer(remote.version, current.version);

    res.json({
      current: current.version,
      latest: remote.version,
      latestTag: remote.tag,
      updateAvailable,
      releaseDate: remote.date,
      changelog: remote.changelog,
      releaseUrl: remote.url,
    });
  } catch (err: any) {
    res.status(502).json({ error: 'failed to check for updates', detail: err.message });
  }
});

// POST /api/update/apply — pull new image and restart
router.post('/apply', async (req: Request, res: Response) => {
  const cfg = getUpdateConfig();
  const { tag } = req.body; // optional: specific tag to pull

  if (!cfg.image) {
    return res.status(400).json({
      error: 'update not configured',
      detail: 'set TK_UPDATE_IMAGE environment variable',
    });
  }

  const dockerAvailable = await hasDockerSocket() && await hasDockerCLI();
  if (!dockerAvailable) {
    return res.status(400).json({
      error: 'docker not available',
      detail: 'mount /var/run/docker.sock and ensure docker CLI is installed in the container',
      manual: `docker pull ${cfg.image}:${tag || 'latest'} && docker compose up -d`,
    });
  }

  const imageTag = tag ? `${cfg.image}:${tag}` : `${cfg.image}:latest`;
  const authFlag = cfg.token ? '' : ''; // registry auth handled via docker login

  try {
    // Step 1: Pull new image
    const { stdout: pullOutput } = await execAsync(`docker pull ${imageTag}`, { timeout: 120000 });

    // Step 2: Check if compose file exists for automated restart
    let composeAvailable = false;
    try {
      await fs.access(cfg.composePath);
      composeAvailable = true;
    } catch {
      // no compose file mounted
    }

    if (composeAvailable) {
      // Respond before restarting — the client will lose connection briefly
      res.json({
        success: true,
        message: 'image pulled, restarting container...',
        pulled: imageTag,
        pullOutput: pullOutput.trim(),
        restarting: true,
      });

      // Give response time to flush, then restart
      setTimeout(async () => {
        try {
          const composeDir = path.dirname(cfg.composePath);
          await execAsync(`docker compose -f ${cfg.composePath} up -d`, {
            cwd: composeDir,
            timeout: 60000,
          });
        } catch (err: any) {
          console.error('restart failed:', err.message);
        }
      }, 500);
    } else {
      // No compose file — pulled image but can't restart automatically
      res.json({
        success: true,
        message: 'image pulled — restart container manually to apply',
        pulled: imageTag,
        pullOutput: pullOutput.trim(),
        restarting: false,
        manual: 'docker compose up -d',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'update failed', detail: err.message });
  }
});

// GET /api/update/config — return (sanitized) update config
router.get('/config', async (_req: Request, res: Response) => {
  const cfg = getUpdateConfig();
  res.json({
    provider: cfg.provider,
    apiUrl: cfg.apiUrl,
    repo: cfg.repo,
    image: cfg.image,
    hasToken: !!cfg.token,
    composePath: cfg.composePath,
    dockerSocket: await hasDockerSocket(),
    dockerCLI: await hasDockerCLI(),
  });
});

export default router;
