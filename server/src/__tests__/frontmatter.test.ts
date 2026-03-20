import { describe, it, expect } from 'vitest';
import { parseFrontmatter, serializeFrontmatter } from '../services/frontmatter';

describe('parseFrontmatter', () => {
  it('parses valid frontmatter with all fields', () => {
    const content = `---
title: Test Entry
date: 2025-03-11
type: daily
category: journal
tags: [work, important]
collections: [impact]
created: 2025-03-11T10:00:00Z
modified: 2025-03-11T10:00:00Z
---

Hello world`;

    const { meta, body } = parseFrontmatter(content);
    expect(meta.title).toBe('Test Entry');
    // gray-matter parses YAML dates as Date objects; check it's there
    expect(meta.date).toBeTruthy();
    expect(meta.type).toBe('daily');
    expect(meta.category).toBe('journal');
    expect(meta.tags).toEqual(['work', 'important']);
    expect(meta.collections).toEqual(['impact']);
    expect(body).toBe('Hello world');
  });

  it('fills defaults for missing optional fields', () => {
    const content = `---
title: Minimal
---

Body text`;

    const { meta } = parseFrontmatter(content);
    expect(meta.title).toBe('Minimal');
    expect(meta.type).toBe('note');
    expect(meta.category).toBe('notes');
    expect(meta.tags).toEqual([]);
    expect(meta.collections).toEqual([]);
  });

  it('extracts [[wiki-links]] from body', () => {
    const content = `---
title: Links Test
---

See [[some-page]] and also [[another-page]].`;

    const { meta } = parseFrontmatter(content);
    expect(meta.links).toContain('some-page');
    expect(meta.links).toContain('another-page');
  });

  it('handles empty body', () => {
    const content = `---
title: Empty
---
`;

    const { meta, body } = parseFrontmatter(content);
    expect(meta.title).toBe('Empty');
    expect(body).toBe('');
  });

  it('handles content with no frontmatter', () => {
    const content = 'Just plain text';
    const { meta, body } = parseFrontmatter(content);
    expect(meta.title).toBe('Untitled');
    expect(body).toBe('Just plain text');
  });
});

describe('serializeFrontmatter', () => {
  it('serializes and omits empty collections', () => {
    const content = `---
title: Test
date: 2025-01-01
type: note
category: notes
tags: [test]
created: 2025-01-01T00:00:00Z
modified: 2025-01-01T00:00:00Z
---

Body`;

    const { meta, body } = parseFrontmatter(content);
    const output = serializeFrontmatter(meta, body);
    expect(output).toContain('title: Test');
    expect(output).not.toContain('collections:');
    expect(output).not.toContain('pinnedInCollections:');
  });

  it('roundtrips parse -> serialize -> parse', () => {
    const content = `---
title: Roundtrip
date: 2025-06-15
type: meeting
category: notes
tags: [meeting, standup]
collections: [team]
created: 2025-06-15T09:00:00.000Z
modified: 2025-06-15T09:30:00.000Z
---

# Standup Notes

- Did things`;

    const { meta, body } = parseFrontmatter(content);
    const serialized = serializeFrontmatter(meta, body);
    const { meta: meta2, body: body2 } = parseFrontmatter(serialized);

    expect(meta2.title).toBe(meta.title);
    expect(meta2.type).toBe(meta.type);
    expect(meta2.tags).toEqual(meta.tags);
    expect(meta2.collections).toEqual(meta.collections);
    expect(body2).toBe(body);
  });
});
