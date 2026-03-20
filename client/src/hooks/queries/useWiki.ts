import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useWikiPages(space?: string) {
  return useQuery({
    queryKey: ['wiki', 'list', space],
    queryFn: () => api.listWikiPages(space),
  });
}

export function useWikiTree(space?: string) {
  return useQuery({
    queryKey: ['wiki', 'tree', space],
    queryFn: () => api.getWikiTree(space),
  });
}

export function useWikiPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['wiki', 'page', slug],
    queryFn: () => api.getWikiPage(slug!),
    enabled: !!slug,
  });
}

export function useCreateWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body?: string; parent?: string; tags?: string[]; space?: string }) =>
      api.createWikiPage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wiki'] });
    },
  });
}

export function useUpdateWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { title?: string; body?: string; parent?: string; tags?: string[]; order?: number } }) =>
      api.updateWikiPage(slug, data),
    onSuccess: (_data, { slug }) => {
      qc.invalidateQueries({ queryKey: ['wiki'] });
    },
  });
}

export function useDeleteWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.deleteWikiPage(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wiki'] });
    },
  });
}
