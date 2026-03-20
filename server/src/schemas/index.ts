import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// === Validate helper ===

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new Error('Validation failed') as any;
    err.status = 400;
    err.details = result.error.flatten().fieldErrors;
    throw err;
  }
  return result.data;
}

// Express middleware version
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

// === Shared primitives ===

const tags = z.array(z.string()).optional().default([]);
const collections = z.array(z.string()).optional().default([]);
const optionalString = z.string().optional();

// === Entry schemas ===

const entryMeta = z.object({
  title: z.string().min(1),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
  type: z.enum(['daily', 'weekly', 'monthly', 'note', 'meeting', 'incident', 'decision', '1on1', 'project-update']).default('note'),
  category: z.enum(['journal', 'notes']).default('journal'),
  tags,
  collections,
  pinned: z.boolean().optional(),
  pinnedInCollections: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  space: optionalString,
  created: z.string().default(() => new Date().toISOString()),
  modified: z.string().default(() => new Date().toISOString()),
  archived: z.boolean().optional(),
});

export const createEntrySchema = z.object({
  meta: entryMeta,
  body: z.string().optional().default(''),
  category: z.enum(['journal', 'notes']).optional().default('journal'),
  filename: z.string().optional(),
});

export const updateEntrySchema = z.object({
  meta: entryMeta,
  body: z.string().optional().default(''),
});

// === Quick note ===

export const quickNoteSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  tags,
  collections,
  space: optionalString,
});

// === Task schemas ===

export const createTaskSchema = z.object({
  title: z.string().min(1),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
}).passthrough();

// === Receipt schemas ===

export const createReceiptSchema = z.object({
  what: z.string().min(1),
  who: z.string().optional().default(''),
  date: z.string().optional(),
  outcome: optionalString,
  tags,
  entryId: optionalString,
  status: z.enum(['delivered', 'pending', 'acknowledged']).optional().default('delivered'),
});

export const updateReceiptSchema = z.object({
  what: z.string().optional(),
  who: z.string().optional(),
  date: z.string().optional(),
  outcome: optionalString,
  tags: z.array(z.string()).optional(),
  entryId: optionalString,
  status: z.enum(['delivered', 'pending', 'acknowledged']).optional(),
}).passthrough();

// === Link schemas ===

export const createLinkSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  note: optionalString,
  tags,
  status: z.enum(['unread', 'read', 'archived']).optional().default('unread'),
});

export const updateLinkSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  note: optionalString,
  tags: z.array(z.string()).optional(),
  status: z.enum(['unread', 'read', 'archived']).optional(),
}).passthrough();

// === Promise schemas ===

export const createPromiseSchema = z.object({
  description: z.string().min(1),
  who: z.string().optional().default(''),
  direction: z.enum(['i-owe', 'they-owe']).optional().default('i-owe'),
  due: optionalString,
  context: optionalString,
});

export const updatePromiseSchema = z.object({
  description: z.string().optional(),
  who: z.string().optional(),
  direction: z.enum(['i-owe', 'they-owe']).optional(),
  due: optionalString,
  context: optionalString,
  status: z.enum(['open', 'kept', 'broken']).optional(),
}).passthrough();

// === Snippet schemas ===

export const createSnippetSchema = z.object({
  code: z.string().min(1),
  language: z.string().optional().default('text'),
  title: z.string().optional().default(''),
  tags,
});

export const updateSnippetSchema = z.object({
  code: z.string().optional(),
  language: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).passthrough();

// === Runbook schemas ===

const runbookStepInput = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  notes: z.string().optional().default(''),
});

export const createRunbookSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  steps: z.array(z.union([runbookStepInput, z.string()])).optional().default([]),
  tags,
});

export const updateRunbookSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(z.union([runbookStepInput, z.string()])).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateExecutionSchema = z.object({
  stepId: z.string().min(1),
  completed: z.boolean(),
  notes: z.string().optional(),
});

// === Wall schemas ===

export const createWallItemSchema = z.object({
  content: z.string().optional().default(''),
  type: z.enum(['note', 'image', 'link']).optional().default('note'),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  color: z.string().optional(),
});

export const updateWallItemSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['note', 'image', 'link']).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  color: z.string().optional(),
  zIndex: z.number().optional(),
});

export const bulkWallUpdateSchema = z.array(z.object({
  id: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
}));

// === Wiki schemas ===

export const createWikiPageSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional().default(''),
  parent: optionalString,
  tags,
  order: z.number().optional(),
  space: optionalString,
});

export const updateWikiPageSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  parent: z.string().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export const bulkWikiActionSchema = z.object({
  action: z.enum(['reparent', 'delete', 'tag']),
  ids: z.array(z.string()).min(1),
  parent: z.string().optional(),
  tag: z.string().optional(),
});

// === Export schema ===

export const exportSchema = z.object({
  format: z.enum(['resume-bullets', 'blog-draft', 'brag-doc', 'markdown-bundle']),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// === Git sync schema (sanitize commit message) ===

export const gitSyncSchema = z.object({
  message: z.string()
    .max(500)
    .optional()
    .transform(val => val ? val.replace(/[`$"\\]/g, '') : val),
});

// === Sprint schema ===

export const sprintSchema = z.object({
  name: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  major: z.string().optional().default(''),
  minor: z.string().optional().default(''),
});

// === Briefing schemas ===

export const createServiceSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().optional(),
  type: z.enum(['http', 'https', 'tcp']).optional().default('http'),
  path: z.string().optional(),
});

export const calendarConfigSchema = z.object({
  url: z.string().optional().default(''),
  user: z.string().optional().default(''),
  pass: z.string().optional().default(''),
});

// === Template schema ===

export const updateTemplateSchema = z.object({
  content: z.string(),
});

// === Base64 asset upload ===

export const base64UploadSchema = z.object({
  data: z.string().min(1),
  filename: z.string().optional(),
});
