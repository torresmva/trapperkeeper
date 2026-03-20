import { describe, it, expect } from 'vitest';
import { paginate, parsePagination } from '../services/pagination';

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('returns first page', () => {
    const result = paginate(items, 1, 10);
    expect(result.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.total).toBe(25);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(3);
  });

  it('returns last page with partial items', () => {
    const result = paginate(items, 3, 10);
    expect(result.items).toEqual([20, 21, 22, 23, 24]);
    expect(result.page).toBe(3);
  });

  it('clamps page to valid range', () => {
    const result = paginate(items, 99, 10);
    expect(result.page).toBe(3);
    expect(result.items).toEqual([20, 21, 22, 23, 24]);
  });

  it('handles empty array', () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });
});

describe('parsePagination', () => {
  it('parses valid params', () => {
    const { page, pageSize } = parsePagination({ page: '2', pageSize: '25' });
    expect(page).toBe(2);
    expect(pageSize).toBe(25);
  });

  it('uses defaults for missing params', () => {
    const { page, pageSize } = parsePagination({}, 30);
    expect(page).toBe(1);
    expect(pageSize).toBe(30);
  });

  it('clamps pageSize to max 200', () => {
    const { pageSize } = parsePagination({ pageSize: '999' });
    expect(pageSize).toBe(200);
  });

  it('clamps page to min 1', () => {
    const { page } = parsePagination({ page: '-5' });
    expect(page).toBe(1);
  });
});
