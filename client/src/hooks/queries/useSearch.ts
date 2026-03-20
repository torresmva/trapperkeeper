import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useSearch(q: string, tag?: string, space?: string) {
  return useQuery({
    queryKey: ['search', q, tag, space],
    queryFn: () => api.search(q, tag, space),
    enabled: !!(q || tag),
    staleTime: 10 * 1000,
  });
}

export function useTags(space?: string) {
  return useQuery({
    queryKey: ['tags', space],
    queryFn: () => api.getTags(space),
  });
}
