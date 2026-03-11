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

async function ensureDataDirs() {
  const dirs = [config.journalDir, config.notesDir, config.templatesDir, config.assetsDir];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function main() {
  await ensureDataDirs();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

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
  const httpServer = app.listen(config.port, '0.0.0.0', () => {
    console.log(`TrapperKeeper running on http://localhost:${config.port}`);
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
