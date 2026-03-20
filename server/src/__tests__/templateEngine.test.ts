import { describe, it, expect } from 'vitest';
import { expandTemplate } from '../services/templateEngine';

describe('expandTemplate', () => {
  const fixedDate = new Date('2025-06-15T14:30:00Z');

  it('expands DATE_LONG', () => {
    const result = expandTemplate('Today: {{DATE_LONG}}', fixedDate);
    expect(result).toContain('June');
    expect(result).toContain('2025');
  });

  it('expands DATE_ISO', () => {
    const result = expandTemplate('{{DATE_ISO}}', fixedDate);
    expect(result).toBe('2025-06-15');
  });

  it('expands YEAR', () => {
    const result = expandTemplate('{{YEAR}}', fixedDate);
    expect(result).toBe('2025');
  });

  it('expands NOW_ISO', () => {
    const result = expandTemplate('{{NOW_ISO}}', fixedDate);
    expect(result).toBe(fixedDate.toISOString());
  });

  it('leaves unknown placeholders as-is', () => {
    const result = expandTemplate('{{UNKNOWN}}', fixedDate);
    expect(result).toBe('{{UNKNOWN}}');
  });

  it('expands multiple placeholders in one string', () => {
    const result = expandTemplate('{{DATE_ISO}} — {{YEAR}}', fixedDate);
    expect(result).toBe('2025-06-15 — 2025');
  });
});
