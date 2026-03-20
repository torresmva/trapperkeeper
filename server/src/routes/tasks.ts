import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { Task } from '../types';
import { validate, createTaskSchema, updateTaskSchema } from '../schemas';
import { paginate, parsePagination } from '../services/pagination';

const router = Router();

async function readTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(config.tasksFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeTasks(tasks: Task[]): Promise<void> {
  await fs.writeFile(config.tasksFile, JSON.stringify(tasks, null, 2));
}

async function appendCompletedToNote(task: Task): Promise<void> {
  const year = new Date().getFullYear();
  const filename = `completed-tasks-${year}.md`;
  const filepath = path.join(config.notesDir, filename);

  const dateAdded = task.created.split('T')[0];
  const dateCompleted = task.completed?.split('T')[0] || new Date().toISOString().split('T')[0];
  const deadline = task.deadline || '—';
  const line = `| ${task.title} | ${dateAdded} | ${deadline} | ${dateCompleted} |\n`;

  try {
    await fs.access(filepath);
    await fs.appendFile(filepath, line);
  } catch {
    const header = `---
title: completed tasks ${year}
date: ${year}-01-01
type: note
category: notes
tags: [tasks, completed]
collections: [tasks]
created: ${new Date().toISOString()}
modified: ${new Date().toISOString()}
---

# completed tasks — ${year}

| task | added | deadline | completed |
|------|-------|----------|-----------|
`;
    await fs.writeFile(filepath, header + line);
  }
}

// List tasks (optionally filter by status)
router.get('/', async (req: Request, res: Response) => {
  const tasks = await readTasks();
  const status = req.query.status as string | undefined;
  let filtered = status ? tasks.filter(t => t.status === status) : tasks;
  if (req.query.page) {
    const { page, pageSize } = parsePagination(req.query as any, 100);
    return res.json(paginate(filtered, page, pageSize));
  }
  res.json(filtered);
});

// Create task
router.post('/', async (req: Request, res: Response) => {
  const { title, deadline, priority } = validate(createTaskSchema, req.body);
  const tasks = await readTasks();
  const task: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    deadline: deadline || undefined,
    priority: priority || 'normal',
    status: 'active',
    created: new Date().toISOString(),
  };
  tasks.push(task);
  await writeTasks(tasks);
  res.status(201).json(task);
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const updates = validate(updateTaskSchema, req.body);
  tasks[idx] = { ...tasks[idx], ...updates, id: tasks[idx].id };
  await writeTasks(tasks);
  res.json(tasks[idx]);
});

// Complete task — moves to completed, appends to markdown note
router.patch('/:id/complete', async (req: Request, res: Response) => {
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  tasks[idx].status = 'completed';
  tasks[idx].completed = new Date().toISOString();
  await writeTasks(tasks);
  await appendCompletedToNote(tasks[idx]);
  res.json(tasks[idx]);
});

// Archive task
router.patch('/:id/archive', async (req: Request, res: Response) => {
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  tasks[idx].status = 'archived';
  await writeTasks(tasks);
  res.json(tasks[idx]);
});

// Reopen task
router.patch('/:id/reopen', async (req: Request, res: Response) => {
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  tasks[idx].status = 'active';
  tasks[idx].completed = undefined;
  await writeTasks(tasks);
  res.json(tasks[idx]);
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  let tasks = await readTasks();
  tasks = tasks.filter(t => t.id !== req.params.id);
  await writeTasks(tasks);
  res.json({ success: true });
});

export default router;
