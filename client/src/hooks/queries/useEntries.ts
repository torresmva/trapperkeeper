import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Entry, EntryMeta, PaginatedResult } from '../../types';

export function useEntries(category: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['entries', category, params],
    queryFn: () => api.listEntries(category, params),
  });
}

export function useEntriesPaged(category: string, page: number, pageSize: number, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['entries', 'paged', category, page, pageSize, params],
    queryFn: () => api.listEntriesPaged(category, page, pageSize, params),
  });
}

export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['entry', id],
    queryFn: () => api.getEntry(id!),
    enabled: !!id,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { meta: EntryMeta; body: string; category: string; filename?: string }) =>
      api.createEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, meta, body }: { id: string; meta: EntryMeta; body: string }) =>
      api.updateEntry(id, meta, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['entry', id] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
