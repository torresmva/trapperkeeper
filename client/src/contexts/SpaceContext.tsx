import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api/client';

interface SpaceContextValue {
  activeSpace: string | null; // null = "all"
  setActiveSpace: (s: string | null) => void;
  spaces: string[];
  addSpace: (name: string) => void;
  refreshSpaces: () => void;
}

const SpaceContext = createContext<SpaceContextValue>({
  activeSpace: null,
  setActiveSpace: () => {},
  spaces: [],
  addSpace: () => {},
  refreshSpaces: () => {},
});

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [activeSpace, setActiveSpaceRaw] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tk-active-space') || null;
    } catch {
      return null;
    }
  });
  const [apiSpaces, setApiSpaces] = useState<string[]>([]);
  const [userSpaces, setUserSpaces] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tk-user-spaces');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Merge API-discovered spaces with user-created spaces (deduplicated, sorted)
  const spaces = Array.from(new Set([...apiSpaces, ...userSpaces])).sort();

  const setActiveSpace = useCallback((s: string | null) => {
    setActiveSpaceRaw(s);
    if (s) {
      localStorage.setItem('tk-active-space', s);
    } else {
      localStorage.removeItem('tk-active-space');
    }
    // Notify other components
    window.dispatchEvent(new Event('tk-space-change'));
  }, []);

  const addSpace = useCallback((name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return;
    setUserSpaces(prev => {
      if (prev.includes(normalized)) {
        setActiveSpace(normalized);
        return prev;
      }
      const next = [...prev, normalized];
      localStorage.setItem('tk-user-spaces', JSON.stringify(next));
      setActiveSpace(normalized);
      return next;
    });
  }, [setActiveSpace]);

  const refreshSpaces = useCallback(() => {
    api.getSpaces().then(data => {
      setApiSpaces(data.spaces);
    }).catch(() => {});
  }, []);

  // Load spaces on mount
  useEffect(() => {
    refreshSpaces();
  }, [refreshSpaces]);

  // Refresh spaces when entries change
  useEffect(() => {
    const handler = () => {
      // Debounce refresh
      setTimeout(refreshSpaces, 500);
    };
    window.addEventListener('tk-file-change', handler);
    return () => window.removeEventListener('tk-file-change', handler);
  }, [refreshSpaces]);

  return (
    <SpaceContext.Provider value={{ activeSpace, setActiveSpace, spaces, addSpace, refreshSpaces }}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  return useContext(SpaceContext);
}
