import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import https from 'https';
import { execSync } from 'child_process';
import { config } from './config';
import { buildIndex } from './services/searchIndex';
import { startWatcher } from './services/watcher';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import authRouter from './routes/auth';
import entriesRouter from './routes/entries';
import notesRouter from './routes/notes';
import searchRouter from './routes/search';
import assetsRouter from './routes/assets';
import templatesRouter from './routes/templates';
import exportsRouter from './routes/exports';
import statsRouter from './routes/stats';
import collectionsRouter from './routes/collections';
import digestRouter from './routes/digest';
import historyRouter from './routes/history';
import importRouter from './routes/import';
import tasksRouter from './routes/tasks';
import gitRouter from './routes/git';
import receiptsRouter from './routes/receipts';
import linksRouter from './routes/links';
import promisesRouter from './routes/promises';
import scratchRouter from './routes/scratch';
import snippetsRouter from './routes/snippets';
import standupRouter from './routes/standup';
import runbooksRouter from './routes/runbooks';
import wallRouter from './routes/wall';

import ghostsRouter from './routes/ghosts';
import trophiesRouter from './routes/trophies';
import wikiRouter from './routes/wiki';

import activityRouter from './routes/activity';
import oublietteRouter from './routes/oubliette';
import spacesRouter from './routes/spaces';
import briefingRouter from './routes/briefing';
import updateRouter from './routes/update';

async function ensureDataDirs() {
  const dirs = [config.journalDir, config.notesDir, config.templatesDir, config.assetsDir, config.wikiDir, config.oublietteDir];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  // Seed default templates if templates dir is empty
  const defaultTemplatesDir = path.join(__dirname, '..', '..', 'default-templates');
  try {
    const existing = await fs.readdir(config.templatesDir);
    if (existing.filter(f => f.endsWith('.md')).length === 0) {
      const defaults = await fs.readdir(defaultTemplatesDir);
      for (const file of defaults) {
        if (!file.endsWith('.md')) continue;
        await fs.copyFile(
          path.join(defaultTemplatesDir, file),
          path.join(config.templatesDir, file)
        );
      }
      console.log(`Seeded ${defaults.filter(f => f.endsWith('.md')).length} default templates`);
    }
  } catch {
    // default-templates dir may not exist in dev mode
  }

  // Seed default reference notes (RFC list, routing protocol cheat sheets)
  const referencesDir = path.join(config.notesDir, 'references');
  const defaultRefsDir = path.join(__dirname, '..', '..', 'default-references');
  try {
    await fs.mkdir(referencesDir, { recursive: true });
    const defaults = await fs.readdir(defaultRefsDir);
    for (const file of defaults) {
      if (!file.endsWith('.md')) continue;
      const target = path.join(referencesDir, file);
      try {
        await fs.access(target);
        // File already exists, skip
      } catch {
        await fs.copyFile(path.join(defaultRefsDir, file), target);
      }
    }
    console.log(`Seeded reference notes to ${referencesDir}`);
  } catch {
    // default-references dir may not exist
  }
}

async function main() {
  await ensureDataDirs();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Health check — unauthenticated (used by update polling + monitoring)
  app.get('/api/update/health', async (_req, res) => {
    const { getVersion } = await import('./routes/update');
    const version = await getVersion();
    res.json({ ok: true, version: version.version, uptime: Math.floor(process.uptime()) });
  });

  // Auth
  app.use('/api/auth', authRouter);
  app.use(authMiddleware);

  // Serve assets statically
  app.use('/api/assets/files', express.static(config.assetsDir));

  // API routes
  app.use('/api/entries', entriesRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/templates', templatesRouter);
  app.use('/api/exports', exportsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/collections', collectionsRouter);
  app.use('/api/digest', digestRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/import', importRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/git', gitRouter);
  app.use('/api/receipts', receiptsRouter);
  app.use('/api/links', linksRouter);
  app.use('/api/promises', promisesRouter);
  app.use('/api/scratch', scratchRouter);
  app.use('/api/snippets', snippetsRouter);
  app.use('/api/standup', standupRouter);
  app.use('/api/runbooks', runbooksRouter);
  app.use('/api/wall', wallRouter);

  app.use('/api/ghosts', ghostsRouter);
  app.use('/api/trophies', trophiesRouter);
  app.use('/api/wiki', wikiRouter);

  app.use('/api/activity', activityRouter);
  app.use('/api/oubliette', oublietteRouter);
  app.use('/api/spaces', spacesRouter);
  app.use('/api/briefing', briefingRouter);
  app.use('/api/update', updateRouter);

  // Serve client in production
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  try {
    await fs.access(clientDist);
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } catch {
    // Client not built yet, dev mode with Vite proxy
  }

  app.use(errorHandler);

  // Build search index
  await buildIndex();

  // Start HTTP server
  const tkPassword = process.env.TK_PASSWORD ?? 'rocco';
  const httpServer = app.listen(config.port, '0.0.0.0', () => {
    console.log('');
    console.log('  ┌──────────────────────────────────────┐');
    console.log(`  │  trapperkeeper                        │`);
    console.log(`  │  http://localhost:${config.port}                │`);
    if (tkPassword === '') {
      console.log('  │  auth: disabled                       │');
    } else {
      console.log(`  │  password: ${tkPassword.padEnd(26)}│`);
    }
    console.log('  │                                      │');
    console.log('  │  set TK_PASSWORD env to change       │');
    console.log('  └──────────────────────────────────────┘');
    console.log('');
  });

  // Start HTTPS server if enabled
  const sslPort = process.env.SSL_PORT ? parseInt(process.env.SSL_PORT) : 3443;
  const certDir = path.join(config.dataDir, '.certs');

  if (process.env.ENABLE_HTTPS !== 'false') {
    try {
      await fs.mkdir(certDir, { recursive: true });
      const keyPath = path.join(certDir, 'key.pem');
      const certPath = path.join(certDir, 'cert.pem');

      // Generate self-signed cert if it doesn't exist
      try {
        await fs.access(keyPath);
      } catch {
        console.log('Generating self-signed SSL certificate...');
        execSync(
          `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" ` +
          `-days 365 -nodes -subj "/CN=trapperkeeper"`,
          { stdio: 'pipe' }
        );
      }

      const key = await fs.readFile(keyPath, 'utf-8');
      const cert = await fs.readFile(certPath, 'utf-8');
      const httpsServer = https.createServer({ key, cert }, app);

      httpsServer.listen(sslPort, '0.0.0.0', () => {
        console.log(`TrapperKeeper HTTPS on https://localhost:${sslPort}`);
      });

      // WebSocket on HTTPS server (preferred for audio/media)
      startWatcher(httpsServer);
    } catch (err) {
      console.log('HTTPS setup skipped (openssl not available)');
      startWatcher(httpServer);
    }
  } else {
    startWatcher(httpServer);
  }
}

main().catch(console.error);
