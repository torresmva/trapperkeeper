import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useCollections(space?: string) {
  return useQuery({
    queryKey: ['collections', space],
    queryFn: () => api.listCollections(space),
  });
}

export function useCollection(name: string | undefined, space?: string) {
  return useQuery({
    queryKey: ['collections', name, space],
    queryFn: () => api.getCollection(name!, space),
    enabled: !!name,
  });
}
