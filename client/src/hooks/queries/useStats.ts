import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useStats(space?: string) {
  return useQuery({
    queryKey: ['stats', space],
    queryFn: () => api.getStats(space),
    staleTime: 60 * 1000,
  });
}

export function useRadar(window?: number, by?: string, space?: string) {
  return useQuery({
    queryKey: ['stats', 'radar', window, by, space],
    queryFn: () => api.getRadar(window, by, space),
    staleTime: 60 * 1000,
  });
}

export function useTrophies() {
  return useQuery({
    queryKey: ['trophies'],
    queryFn: () => api.getTrophies(),
    staleTime: 5 * 60 * 1000,
  });
}
