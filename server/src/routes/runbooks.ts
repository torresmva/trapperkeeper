import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { validate, createRunbookSchema, updateRunbookSchema, updateExecutionSchema } from '../schemas';
import { paginate, parsePagination } from '../services/pagination';

const router = Router();
const runbooksFile = path.join(config.dataDir, 'runbooks.json');
const runbookLogsFile = path.join(config.dataDir, 'runbook-logs.json');

export interface RunbookStep {
  id: string;
  label: string;
  notes?: string;
}

export interface Runbook {
  id: string;
  title: string;
  description?: string;
  steps: RunbookStep[];
  tags: string[];
  created: string;
  modified: string;
  lastRun?: string;
  runCount: number;
}

export interface RunbookExecution {
  id: string;
  runbookId: string;
  startedAt: string;
  completedAt?: string;
  steps: { stepId: string; completed: boolean; completedAt?: string; notes?: string }[];
}

async function readRunbooks(): Promise<Runbook[]> {
  try {
    const data = await fs.readFile(runbooksFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRunbooks(runbooks: Runbook[]): Promise<void> {
  await fs.writeFile(runbooksFile, JSON.stringify(runbooks, null, 2));
}

async function readLogs(): Promise<RunbookExecution[]> {
  try {
    const data = await fs.readFile(runbookLogsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLogs(logs: RunbookExecution[]): Promise<void> {
  await fs.writeFile(runbookLogsFile, JSON.stringify(logs, null, 2));
}

// List runbooks
router.get('/', async (_req: Request, res: Response) => {
  const runbooks = await readRunbooks();
  runbooks.sort((a, b) => b.modified.localeCompare(a.modified));
  if (_req.query.page) {
    const { page, pageSize } = parsePagination(_req.query as any, 50);
    return res.json(paginate(runbooks, page, pageSize));
  }
  res.json(runbooks);
});

// Get single runbook
router.get('/:id', async (req: Request, res: Response) => {
  const runbooks = await readRunbooks();
  const rb = runbooks.find(r => r.id === req.params.id);
  if (!rb) return res.status(404).json({ error: 'not found' });
  res.json(rb);
});

// Create runbook
router.post('/', async (req: Request, res: Response) => {
  const { title, description, steps, tags } = validate(createRunbookSchema, req.body);
  const runbooks = await readRunbooks();
  const now = new Date().toISOString();
  const runbook: Runbook = {
    id: `rb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    description: description || '',
    steps: (steps || []).map((s: any, i: number) => ({
      id: `step-${i}-${Math.random().toString(36).slice(2, 7)}`,
      label: s.label || s,
      notes: s.notes || '',
    })),
    tags: tags || [],
    created: now,
    modified: now,
    runCount: 0,
  };
  runbooks.push(runbook);
  await writeRunbooks(runbooks);
  res.status(201).json(runbook);
});

// Update runbook
router.put('/:id', async (req: Request, res: Response) => {
  const runbooks = await readRunbooks();
  const idx = runbooks.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const { title, description, steps, tags } = validate(updateRunbookSchema, req.body);
  if (title !== undefined) runbooks[idx].title = title;
  if (description !== undefined) runbooks[idx].description = description;
  if (tags !== undefined) runbooks[idx].tags = tags;
  if (steps !== undefined) {
    runbooks[idx].steps = steps.map((s: any, i: number) => ({
      id: s.id || `step-${i}-${Math.random().toString(36).slice(2, 7)}`,
      label: s.label || s,
      notes: s.notes || '',
    }));
  }
  runbooks[idx].modified = new Date().toISOString();
  await writeRunbooks(runbooks);
  res.json(runbooks[idx]);
});

// Delete runbook
router.delete('/:id', async (req: Request, res: Response) => {
  let runbooks = await readRunbooks();
  runbooks = runbooks.filter(r => r.id !== req.params.id);
  await writeRunbooks(runbooks);
  // Also clean up logs
  let logs = await readLogs();
  logs = logs.filter(l => l.runbookId !== req.params.id);
  await writeLogs(logs);
  res.json({ success: true });
});

// Start a new execution
router.post('/:id/run', async (req: Request, res: Response) => {
  const runbooks = await readRunbooks();
  const idx = runbooks.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const logs = await readLogs();
  const now = new Date().toISOString();
  const execution: RunbookExecution = {
    id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    runbookId: req.params.id,
    startedAt: now,
    steps: runbooks[idx].steps.map(s => ({ stepId: s.id, completed: false })),
  };
  logs.push(execution);
  await writeLogs(logs);

  // Update runbook stats
  runbooks[idx].lastRun = now;
  runbooks[idx].runCount++;
  await writeRunbooks(runbooks);

  res.status(201).json(execution);
});

// Get executions for a runbook
router.get('/:id/logs', async (req: Request, res: Response) => {
  const logs = await readLogs();
  const rbLogs = logs
    .filter(l => l.runbookId === req.params.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  res.json(rbLogs);
});

// Update execution (check/uncheck steps)
router.put('/exec/:execId', async (req: Request, res: Response) => {
  const logs = await readLogs();
  const idx = logs.findIndex(l => l.id === req.params.execId);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const { stepId, completed, notes } = validate(updateExecutionSchema, req.body);
  const stepIdx = logs[idx].steps.findIndex(s => s.stepId === stepId);
  if (stepIdx === -1) return res.status(404).json({ error: 'step not found' });

  logs[idx].steps[stepIdx].completed = completed;
  logs[idx].steps[stepIdx].completedAt = completed ? new Date().toISOString() : undefined;
  if (notes !== undefined) logs[idx].steps[stepIdx].notes = notes;

  // Auto-complete execution if all steps done
  const allDone = logs[idx].steps.every(s => s.completed);
  if (allDone && !logs[idx].completedAt) {
    logs[idx].completedAt = new Date().toISOString();
  } else if (!allDone) {
    logs[idx].completedAt = undefined;
  }

  await writeLogs(logs);
  res.json(logs[idx]);
});

export default router;
