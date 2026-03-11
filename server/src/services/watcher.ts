import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config';
import { parseFrontmatter } from './frontmatter';
import { addToIndex, removeFromIndex } from './searchIndex';

const pendingWrites = new Set<string>();
let wss: WebSocketServer;

export function markPendingWrite(filePath: string) {
  pendingWrites.add(filePath);
  setTimeout(() => pendingWrites.delete(filePath), 2000);
}

function broadcast(data: object) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

async function handleFileChange(filePath: string) {
  if (pendingWrites.has(filePath)) return;
  if (!filePath.endsWith('.md')) return;

  const id = path.relative(config.dataDir, filePath);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    addToIndex({ id, meta, body, filePath });
    broadcast({ type: 'file-changed', id });
  } catch {
    // File might have been deleted between event and read
  }
}

function handleFileRemove(filePath: string) {
  if (!filePath.endsWith('.md')) return;
  const id = path.relative(config.dataDir, filePath);
  removeFromIndex(id);
  broadcast({ type: 'file-removed', id });
}

export function startWatcher(server: any): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', () => {
    console.log('WebSocket client connected');
  });

  const watcher = chokidar.watch(config.dataDir, {
    ignored: /(^|[\/\\])\.|node_modules/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', handleFileChange)
    .on('change', handleFileChange)
    .on('unlink', handleFileRemove);

  console.log(`Watching ${config.dataDir} for changes`);
  return wss;
}
