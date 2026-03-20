import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { parseFrontmatter, serializeFrontmatter } from '../services/frontmatter';
import { moveToOubliette } from './oubliette';
import { validate, createWikiPageSchema, updateWikiPageSchema, bulkWikiActionSchema } from '../schemas';
import { paginate, parsePagination } from '../services/pagination';

const router = Router();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface WikiPageMeta {
  title: string;
  parent?: string;
  tags: string[];
  created: string;
  modified: string;
  order?: number;
  space?: string;
}

async function readAllPages(): Promise<{ id: string; meta: WikiPageMeta; body: string }[]> {
  const pages: { id: string; meta: WikiPageMeta; body: string }[] = [];
  try {
    const files = await fs.readdir(config.wikiDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const id = file.replace(/\.md$/, '');
      const content = await fs.readFile(path.join(config.wikiDir, file), 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      pages.push({
        id,
        meta: {
          title: meta.title,
          parent: (meta as any).parent || undefined,
          tags: meta.tags,
          created: meta.created,
          modified: meta.modified,
          order: (meta as any).order,
          space: (meta as any).space || undefined,
        },
        body,
      });
    }
  } catch {
    // wiki dir doesn't exist yet
  }
  return pages;
}

// GET /api/wiki — flat list (no body)
router.get('/', async (req: Request, res: Response) => {
  const space = req.query.space as string | undefined;
  let pages = await readAllPages();
  if (space) pages = pages.filter(p => p.meta.space === space);
  const list = pages.map(({ id, meta }) => ({ id, ...meta }));
  list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
  if (req.query.page) {
    const { page, pageSize } = parsePagination(req.query as any, 50);
    return res.json(paginate(list, page, pageSize));
  }
  res.json(list);
});

// GET /api/wiki/tree — hierarchical tree
router.get('/tree', async (req: Request, res: Response) => {
  const space = req.query.space as string | undefined;
  let pages = await readAllPages();
  if (space) pages = pages.filter(p => p.meta.space === space);

  interface TreeNode {
    id: string;
    title: string;
    order?: number;
    children: TreeNode[];
  }

  const nodeMap: Record<string, TreeNode> = {};
  for (const p of pages) {
    nodeMap[p.id] = { id: p.id, title: p.meta.title, order: p.meta.order, children: [] };
  }

  const roots: TreeNode[] = [];
  for (const p of pages) {
    if (p.meta.parent && nodeMap[p.meta.parent]) {
      nodeMap[p.meta.parent].children.push(nodeMap[p.id]);
    } else {
      roots.push(nodeMap[p.id]);
    }
  }

  // Sort children recursively
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
    for (const n of nodes) sortChildren(n.children);
  }
  sortChildren(roots);

  res.json(roots);
});

// POST /api/wiki/bulk — batch operations (reparent, delete, tag)
router.post('/bulk', async (req: Request, res: Response) => {
  const { action, ids, parent, tag } = validate(bulkWikiActionSchema, req.body);

  let updated = 0;

  if (action === 'reparent') {
    for (const id of ids) {
      const filePath = path.join(config.wikiDir, `${id}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);
        const updatedMeta: any = { ...meta };
        if (parent) {
          updatedMeta.parent = parent;
        } else {
          delete updatedMeta.parent;
        }
        await fs.writeFile(filePath, serializeFrontmatter(updatedMeta, body));
        updated++;
      } catch {}
    }
  } else if (action === 'delete') {
    // Delete in reverse order so children get reparented before parents are removed
    const allPages = await readAllPages();
    for (const id of ids) {
      const filePath = path.join(config.wikiDir, `${id}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { meta } = parseFrontmatter(content);
        const deletedParent = (meta as any).parent || undefined;

        // Reparent children of this page
        for (const child of allPages) {
          if (child.meta.parent === id && !ids.includes(child.id)) {
            const childPath = path.join(config.wikiDir, `${child.id}.md`);
            try {
              const childContent = await fs.readFile(childPath, 'utf-8');
              const { meta: childMeta, body: childBody } = parseFrontmatter(childContent);
              const cm: any = { ...childMeta };
              if (deletedParent) { cm.parent = deletedParent; } else { delete cm.parent; }
              await fs.writeFile(childPath, serializeFrontmatter(cm, childBody));
            } catch {}
          }
        }

        await moveToOubliette(filePath, 'wiki', meta as any);
        updated++;
      } catch {}
    }
  } else if (action === 'tag') {
    if (!tag || typeof tag !== 'string') {
      return res.status(400).json({ error: 'tag string required' });
    }
    const normalizedTag = tag.trim().toLowerCase();
    for (const id of ids) {
      const filePath = path.join(config.wikiDir, `${id}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);
        const tags = Array.isArray(meta.tags) ? meta.tags : [];
        if (!tags.includes(normalizedTag)) {
          tags.push(normalizedTag);
        }
        const updatedMeta: any = { ...meta, tags };
        await fs.writeFile(filePath, serializeFrontmatter(updatedMeta, body));
        updated++;
      } catch {}
    }
  } else {
    return res.status(400).json({ error: 'unknown action' });
  }

  res.json({ success: true, updated });
});

// GET /api/wiki/:slug — full page with body
router.get('/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const filePath = path.join(config.wikiDir, `${slug}.md`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    res.json({
      id: slug,
      title: meta.title,
      parent: (meta as any).parent || null,
      tags: meta.tags,
      created: meta.created,
      modified: meta.modified,
      order: (meta as any).order,
      space: (meta as any).space || undefined,
      body,
    });
  } catch {
    res.status(404).json({ error: 'page not found' });
  }
});

// POST /api/wiki — create page
router.post('/', async (req: Request, res: Response) => {
  const { title, body, parent, tags, order, space } = validate(createWikiPageSchema, req.body);

  await fs.mkdir(config.wikiDir, { recursive: true });

  let slug = slugify(title);
  // Uniqueness check
  let candidate = path.join(config.wikiDir, `${slug}.md`);
  let suffix = 1;
  while (true) {
    try {
      await fs.access(candidate);
      slug = `${slugify(title)}-${suffix}`;
      candidate = path.join(config.wikiDir, `${slug}.md`);
      suffix++;
    } catch {
      break;
    }
  }

  const now = new Date().toISOString();
  const meta: any = {
    title,
    tags: tags || [],
    created: now,
    modified: now,
    date: now.split('T')[0],
    type: 'note' as const,
    category: 'notes' as const,
  };
  if (parent) meta.parent = parent;
  if (order !== undefined) meta.order = order;
  if (space) meta.space = space;

  const content = serializeFrontmatter(meta, body || '');
  await fs.writeFile(candidate, content);

  res.status(201).json({
    id: slug,
    title,
    parent: parent || null,
    tags: tags || [],
    created: now,
    modified: now,
    order: order ?? null,
    body: body || '',
  });
});

// PUT /api/wiki/:slug — update page
router.put('/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const filePath = path.join(config.wikiDir, `${slug}.md`);

  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    const { meta: oldMeta } = parseFrontmatter(existing);

    const { title, body, parent, tags, order } = validate(updateWikiPageSchema, req.body);
    const now = new Date().toISOString();

    const meta: any = {
      ...oldMeta,
      title: title ?? oldMeta.title,
      tags: tags ?? oldMeta.tags,
      modified: now,
    };
    if (parent !== undefined) meta.parent = parent || undefined;
    if (order !== undefined) meta.order = order;

    const content = serializeFrontmatter(meta, body ?? '');
    await fs.writeFile(filePath, content);

    res.json({
      id: slug,
      title: meta.title,
      parent: meta.parent || null,
      tags: meta.tags,
      created: meta.created,
      modified: now,
      order: meta.order ?? null,
      body: body ?? '',
    });
  } catch {
    res.status(404).json({ error: 'page not found' });
  }
});

// DELETE /api/wiki/:slug — reparent children to deleted page's parent
router.delete('/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const filePath = path.join(config.wikiDir, `${slug}.md`);
  try {
    // Read the page to find its parent (so children inherit it)
    const content = await fs.readFile(filePath, 'utf-8');
    const { meta } = parseFrontmatter(content);
    const deletedParent = (meta as any).parent || undefined;

    // Reparent any children of this page
    const allPages = await readAllPages();
    for (const child of allPages) {
      if (child.meta.parent === slug) {
        const childPath = path.join(config.wikiDir, `${child.id}.md`);
        const childContent = await fs.readFile(childPath, 'utf-8');
        const { meta: childMeta, body: childBody } = parseFrontmatter(childContent);
        const updatedMeta: any = { ...childMeta };
        if (deletedParent) {
          updatedMeta.parent = deletedParent;
        } else {
          delete updatedMeta.parent;
        }
        await fs.writeFile(childPath, serializeFrontmatter(updatedMeta, childBody));
      }
    }

    await moveToOubliette(filePath, 'wiki', meta as any);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'page not found' });
  }
});

export default router;
