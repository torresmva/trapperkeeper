import { describe, it, expect } from 'vitest';
import {
  validate,
  createTaskSchema,
  createLinkSchema,
  createPromiseSchema,
  gitSyncSchema,
  bulkWikiActionSchema,
  exportSchema,
} from '../schemas';

describe('validate', () => {
  it('returns parsed data on valid input', () => {
    const result = validate(createTaskSchema, { title: 'Test task' });
    expect(result.title).toBe('Test task');
    expect(result.priority).toBe('normal');
  });

  it('throws on invalid input', () => {
    expect(() => validate(createTaskSchema, { title: '' })).toThrow();
  });

  it('throws with 400 status', () => {
    try {
      validate(createTaskSchema, {});
      expect.fail('should have thrown');
    } catch (err: any) {
      expect(err.status).toBe(400);
      expect(err.details).toBeDefined();
    }
  });
});

describe('createLinkSchema', () => {
  it('requires url', () => {
    expect(() => validate(createLinkSchema, {})).toThrow();
  });

  it('defaults status to unread', () => {
    const result = validate(createLinkSchema, { url: 'https://example.com' });
    expect(result.status).toBe('unread');
  });
});

describe('createPromiseSchema', () => {
  it('requires description', () => {
    expect(() => validate(createPromiseSchema, {})).toThrow();
  });

  it('defaults direction to i-owe', () => {
    const result = validate(createPromiseSchema, { description: 'Do the thing' });
    expect(result.direction).toBe('i-owe');
  });
});

describe('gitSyncSchema', () => {
  it('strips dangerous characters from commit message', () => {
    const result = validate(gitSyncSchema, { message: 'test `$(whoami)` "injection"' });
    expect(result.message).not.toContain('`');
    expect(result.message).not.toContain('$');
    expect(result.message).not.toContain('"');
  });

  it('allows empty body (message optional)', () => {
    const result = validate(gitSyncSchema, {});
    expect(result.message).toBeUndefined();
  });
});

describe('bulkWikiActionSchema', () => {
  it('requires valid action', () => {
    expect(() => validate(bulkWikiActionSchema, { action: 'invalid', ids: ['a'] })).toThrow();
  });

  it('requires non-empty ids', () => {
    expect(() => validate(bulkWikiActionSchema, { action: 'reparent', ids: [] })).toThrow();
  });

  it('accepts valid bulk action', () => {
    const result = validate(bulkWikiActionSchema, { action: 'tag', ids: ['page-1'], tag: 'test' });
    expect(result.action).toBe('tag');
    expect(result.ids).toEqual(['page-1']);
  });
});

describe('exportSchema', () => {
  it('validates format enum', () => {
    expect(() => validate(exportSchema, { format: 'invalid' })).toThrow();
  });

  it('accepts valid export', () => {
    const result = validate(exportSchema, { format: 'brag-doc' });
    expect(result.format).toBe('brag-doc');
  });
});
