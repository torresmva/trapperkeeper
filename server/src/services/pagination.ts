export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function parsePagination(query: { page?: string; pageSize?: string }, defaultPageSize = 50) {
  const page = Math.max(1, parseInt(query.page as string || '1', 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(query.pageSize as string || String(defaultPageSize), 10) || defaultPageSize));
  return { page, pageSize };
}
