import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import https from 'https';
import { config } from '../config';

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

export async function getVersion(): Promise<VersionInfo> {
  if (cachedVersion) return cachedVersion;

  const versionFile = path.resolve(__dirname, '..', '..', '..', 'VERSION.json');
  try {
    const raw = await fs.readFile(versionFile, 'utf-8');
    cachedVersion = JSON.parse(raw);
    return cachedVersion!;
  } catch {
    try {
      const { stdout: version } = await execAsync('git describe --tags --always 2>/dev/null || echo "dev"');
      const { stdout: commit } = await execAsync('git rev-parse --short HEAD 2>/dev/null || echo "unknown"');
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"');
      cachedVersion = {
        version: version.trim().replace(/^v/, ''),
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

function parseSemver(v: string): { major: number; minor: number; patch: number; raw: string } | null {
  const match = v.replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: +match[1], minor: +match[2], patch: +match[3], raw: v };
}

function isNewer(remote: string, local: string): boolean {
  const r = parseSemver(remote);
  const l = parseSemver(local);
  if (!r || !l) return false; // non-semver = never newer
  if (r.major !== l.major) return r.major > l.major;
  if (r.minor !== l.minor) return r.minor > l.minor;
  return r.patch > l.patch;
}

/** Strip v prefix from git tag for docker image tag */
function imageTagFor(gitTag: string | undefined, cfg: UpdateConfig): string {
  if (!gitTag) return `${cfg.image}:latest`;
  const bare = gitTag.replace(/^v/, '');
  return `${cfg.image}:${bare}`;
}

// ── error helpers ─────────────────────────────────────────────────

type ErrorCode =
  | 'CONFIG_MISSING'
  | 'DOCKER_SOCKET_MISSING'
  | 'DOCKER_CLI_MISSING'
  | 'REGISTRY_AUTH_FAILED'
  | 'IMAGE_NOT_FOUND'
  | 'COMPOSE_NOT_FOUND'
  | 'COMPOSE_RESTART_FAILED'
  | 'API_UNREACHABLE'
  | 'PULL_FAILED'
  | 'INVALID_IMAGE';

function errorResponse(res: Response, status: number, code: ErrorCode, detail: string, extra?: Record<string, any>) {
  return res.status(status).json({ error: code, detail, ...extra });
}

// ── update config from env ────────────────────────────────────────

interface UpdateConfig {
  provider: 'gitlab' | 'github';
  apiUrl: string;
  repo: string;
  image: string;
  token: string;
  composePath: string;
}

function getUpdateConfig(): UpdateConfig {
  return {
    provider: (process.env.TK_UPDATE_PROVIDER as 'gitlab' | 'github') || 'github',
    apiUrl: process.env.TK_UPDATE_API_URL || (process.env.TK_UPDATE_PROVIDER === 'gitlab' ? '' : 'https://api.github.com'),
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
    const encodedRepo = encodeURIComponent(cfg.repo);
    const url = `${cfg.apiUrl}/api/v4/projects/${encodedRepo}/releases`;
    const raw = await httpGet(url, headers);
    const releases = JSON.parse(raw);
    if (!releases.length) throw new Error('no releases found');
    const latest = releases[0];
    return {
      version: latest.tag_name?.replace(/^v/, '') || latest.tag_name,
      tag: latest.tag_name,
      date: latest.released_at || latest.created_at,
      url: latest._links?.self || '',
      changelog: latest.description || '',
    };
  } else {
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

// ── warden communication ─────────────────────────────────────────

function getWardenUrl(): string {
  return process.env.TK_WARDEN_URL || 'http://tk-warden:3002';
}

async function wardenRequest(path: string, method = 'GET', body?: any): Promise<any> {
  const url = `${getWardenUrl()}${path}`;
  const payload = body ? JSON.stringify(body) : undefined;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`invalid json from warden: ${data}`)); }
      });
    });
    req.on('error', (err) => reject(new Error(`warden unreachable at ${url}: ${err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error(`warden timeout at ${url}`)); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function isWardenAvailable(): Promise<boolean> {
  try {
    const res = await wardenRequest('/health');
    return res?.ok === true;
  } catch {
    return false;
  }
}

// ── rollback state ────────────────────────────────────────────────

interface RollbackInfo {
  previousImage: string;
  previousVersion: string;
  newImage: string;
  timestamp: string;
}

const rollbackFile = path.join(config.dataDir, '.update-rollback.json');

async function saveRollbackInfo(info: RollbackInfo): Promise<void> {
  await fs.writeFile(rollbackFile, JSON.stringify(info, null, 2));
}

async function getRollbackInfo(): Promise<RollbackInfo | null> {
  try {
    const raw = await fs.readFile(rollbackFile, 'utf-8');
    return JSON.parse(raw);
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════

// GET /api/update/health — unauthenticated, for restart polling
// NOTE: mounted before auth middleware in index.ts
router.get('/health', async (_req: Request, res: Response) => {
  const version = await getVersion();
  res.json({ ok: true, version: version.version, uptime: Math.floor(process.uptime()) });
});

// GET /api/update/version — current version info
router.get('/version', async (_req: Request, res: Response) => {
  const version = await getVersion();
  const cfg = getUpdateConfig();
  const warden = await isWardenAvailable();
  res.json({
    ...version,
    updateConfigured: !!(cfg.repo && cfg.image),
    wardenAvailable: warden,
    provider: cfg.provider,
  });
});

// GET /api/update/check — check for new version
router.get('/check', async (_req: Request, res: Response) => {
  const cfg = getUpdateConfig();

  if (!cfg.repo || !cfg.apiUrl) {
    return errorResponse(res, 400, 'CONFIG_MISSING',
      'set TK_UPDATE_REPO, TK_UPDATE_API_URL, and TK_UPDATE_IMAGE environment variables');
  }

  try {
    const current = await getVersion();
    let remote: RemoteRelease;

    try {
      remote = await fetchLatestRelease(cfg);
    } catch {
      remote = await fetchLatestTag(cfg);
    }

    const updateAvailable = isNewer(remote.version, current.version);

    res.json({
      current: current.version,
      latest: remote.version,
      latestTag: remote.tag,
      imageTag: imageTagFor(remote.tag, cfg),
      updateAvailable,
      releaseDate: remote.date,
      changelog: remote.changelog,
      releaseUrl: remote.url,
    });
  } catch (err: any) {
    const detail = err.message || 'unknown error';
    if (detail.includes('401') || detail.includes('403')) {
      return errorResponse(res, 502, 'REGISTRY_AUTH_FAILED', 'authentication failed — check TK_UPDATE_TOKEN');
    }
    return errorResponse(res, 502, 'API_UNREACHABLE', detail);
  }
});

// POST /api/update/apply — delegate to warden for pull + restart
router.post('/apply', async (req: Request, res: Response) => {
  const cfg = getUpdateConfig();
  const { tag } = req.body;

  if (!cfg.image) {
    return errorResponse(res, 400, 'CONFIG_MISSING', 'set TK_UPDATE_IMAGE environment variable');
  }

  const pullTarget = imageTagFor(tag, cfg);

  // Save rollback info
  try {
    const currentVersion = await getVersion();
    await saveRollbackInfo({
      previousImage: `${cfg.image}:${currentVersion.version}`,
      previousVersion: currentVersion.version,
      newImage: pullTarget,
      timestamp: new Date().toISOString(),
    });
  } catch {}

  // Check if warden is available
  if (!await isWardenAvailable()) {
    return errorResponse(res, 503, 'DOCKER_CLI_MISSING',
      'warden service not available — add the warden container to your docker-compose.yml',
      { manual: `docker pull ${pullTarget} && docker compose up -d` });
  }

  // Fire update to warden without waiting — it will stop this container
  // so we need to respond to the client before that happens
  res.json({
    success: true,
    message: 'warden is updating trapperkeeper...',
    pulled: pullTarget,
    restarting: true,
    expectedVersion: tag ? tag.replace(/^v/, '') : undefined,
  });

  // Fire and forget — warden handles the rest
  wardenRequest('/update', 'POST', { image: pullTarget }).catch(err => {
    console.error('[update] warden request error (expected if container is restarting):', err.message);
  });
});

// GET /api/update/rollback — check if rollback is available
router.get('/rollback', async (_req: Request, res: Response) => {
  const info = await getRollbackInfo();
  res.json({
    available: !!info,
    ...(info || {}),
  });
});

// POST /api/update/rollback — restore previous image via warden
router.post('/rollback', async (_req: Request, res: Response) => {
  const info = await getRollbackInfo();
  if (!info?.previousImage) {
    return errorResponse(res, 400, 'CONFIG_MISSING', 'no rollback info available');
  }

  if (!await isWardenAvailable()) {
    return errorResponse(res, 503, 'DOCKER_CLI_MISSING',
      'warden not available for rollback',
      { manual: `docker pull ${info.previousImage} && docker compose up -d` });
  }

  res.json({
    success: true,
    message: 'warden is rolling back...',
    restarting: true,
    rollingBackTo: info.previousVersion,
  });

  wardenRequest('/update', 'POST', { image: info.previousImage }).catch(err => {
    console.error('[update] rollback warden error (expected if container is restarting):', err.message);
  });
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
    wardenAvailable: await isWardenAvailable(),
  });
});

// GET /api/update/compose — download a starter docker-compose.yml
router.get('/compose', async (_req: Request, res: Response) => {
  const ver = await getVersion();
  const compose = `# trapperkeeper — docker-compose.yml
# generated by trapperkeeper ${ver.version}
# docs: https://github.com/torresmva/trapperkeeper

services:
  trapperkeeper:
    image: ghcr.io/torresmva/trapperkeeper:latest
    container_name: trapperkeeper
    ports:
      - "3001:3001"
      - "3443:3443"
    volumes:
      - trapperkeeper-data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - SSL_PORT=3443
      - TK_PASSWORD=rocco
      - TK_UPDATE_PROVIDER=github
      - TK_UPDATE_REPO=torresmva/trapperkeeper
      - TK_UPDATE_API_URL=https://api.github.com
      - TK_UPDATE_IMAGE=ghcr.io/torresmva/trapperkeeper
      - TK_WARDEN_URL=http://tk-warden:3002

  warden:
    image: ghcr.io/torresmva/trapperkeeper-warden:latest
    container_name: tk-warden
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    environment:
      - TK_CONTAINER=trapperkeeper
      - TK_HEALTH_URL=http://trapperkeeper:3001/api/update/health

volumes:
  trapperkeeper-data:
    driver: local
`;
  res.setHeader('Content-Type', 'text/yaml');
  res.setHeader('Content-Disposition', 'attachment; filename="docker-compose.yml"');
  res.send(compose);
});

export default router;
