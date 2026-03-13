import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry, WikiPage as WikiPageType } from '../../types';
import { useSpace } from '../../contexts/SpaceContext';

interface CommandItem {
  id: string;
  label: string;
  category: 'navigate' | 'wiki' | 'entries' | 'actions';
  shortcut?: string;
  action: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  // sequential char match score
  let qi = 0;
  let score = 0;
  let lastIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += (lastIdx === ti - 1) ? 10 : 5;
      lastIdx = ti;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wikiPages, setWikiPages] = useState<WikiPageType[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { activeSpace, setActiveSpace, spaces } = useSpace();

  // Listen for Ctrl+Shift+P
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  // Fetch data when opened
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    const spaceParam = activeSpace || undefined;
    const entryParams = spaceParam ? { space: spaceParam } : undefined;
    api.listWikiPages(spaceParam).then(setWikiPages).catch(() => {});
    api.listEntries('journal', entryParams).then(j => {
      api.listEntries('notes', entryParams).then(n => {
        setEntries([...j, ...n]);
      }).catch(() => setEntries(j));
    }).catch(() => {});
    // Focus input after render
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, activeSpace]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const exec = useCallback((item: CommandItem) => {
    close();
    item.action();
  }, [close]);

  // Build all items
  const allItems = useMemo((): CommandItem[] => {
    const nav: CommandItem[] = [
      { id: 'nav-entries', label: 'entries', category: 'navigate', action: () => navigate('/entries') },
      { id: 'nav-wiki', label: 'wiki', category: 'navigate', action: () => navigate('/wiki') },
      { id: 'nav-collections', label: 'collections', category: 'navigate', action: () => navigate('/collections') },
      { id: 'nav-keeper', label: 'keeper', category: 'navigate', action: () => navigate('/keeper') },
      { id: 'nav-dashboard', label: 'dashboard', category: 'navigate', action: () => navigate('/stats') },
      { id: 'nav-search', label: 'search', category: 'navigate', action: () => navigate('/search') },
      { id: 'nav-wall', label: 'wall', category: 'navigate', action: () => navigate('/wall') },
      { id: 'nav-confessional', label: 'confessional', category: 'navigate', action: () => navigate('/confessional') },
      { id: 'nav-capsules', label: 'capsules', category: 'navigate', action: () => navigate('/capsules') },
      { id: 'nav-workbench', label: 'workbench', category: 'navigate', action: () => navigate('/workbench') },
      { id: 'nav-oubliette', label: 'oubliette', category: 'navigate', action: () => navigate('/oubliette') },
      { id: 'nav-templates', label: 'templates', category: 'navigate', action: () => navigate('/templates') },
      { id: 'nav-activity', label: 'activity', category: 'navigate', action: () => navigate('/activity') },
      { id: 'nav-exports', label: 'exports', category: 'navigate', action: () => navigate('/exports') },
    ];

    const actions: CommandItem[] = [
      { id: 'act-new-entry', label: 'new entry', category: 'actions', action: () => navigate('/journal/new') },
      { id: 'act-new-wiki', label: 'new wiki page', category: 'actions', action: () => navigate('/wiki?new=1') },
      { id: 'act-capture', label: 'quick capture', category: 'actions', shortcut: 'ctrl+k', action: () => {
        window.dispatchEvent(new Event('tk-open-capture'));
      }},
      { id: 'act-crt', label: 'toggle crt', category: 'actions', action: () => {
        const current = localStorage.getItem('tk-crt') === 'true';
        localStorage.setItem('tk-crt', String(!current));
        window.dispatchEvent(new Event('tk-crt-change'));
      }},
      { id: 'act-export', label: 'export', category: 'actions', action: () => navigate('/exports') },
      { id: 'act-search', label: 'search', category: 'actions', shortcut: 'ctrl+/', action: () => navigate('/search') },
      // Space switching
      { id: 'act-space-all', label: 'space: all', category: 'actions', action: () => setActiveSpace(null) },
      ...spaces.map(s => ({
        id: `act-space-${s}`,
        label: `space: ${s}`,
        category: 'actions' as const,
        action: () => setActiveSpace(s),
      })),
    ];

    const wiki: CommandItem[] = wikiPages.map(p => ({
      id: `wiki-${p.id}`,
      label: (p as any).title || p.meta?.title || p.id,
      category: 'wiki' as const,
      action: () => navigate(`/wiki/${p.id}`),
    }));

    const entryItems: CommandItem[] = entries.map(e => ({
      id: `entry-${e.id}`,
      label: e.meta.title || e.id,
      category: 'entries' as const,
      action: () => {
        const prefix = e.meta.category === 'notes' ? '/notes' : '/journal';
        navigate(`${prefix}/${encodeURIComponent(e.id)}`);
      },
    }));

    return [...nav, ...actions, ...wiki, ...entryItems];
  }, [navigate, wikiPages, entries, spaces, setActiveSpace]);

  // Filter and sort
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show nav + actions when empty
      return allItems.filter(i => i.category === 'navigate' || i.category === 'actions').slice(0, 10);
    }
    return allItems
      .filter(i => fuzzyMatch(query, i.label))
      .sort((a, b) => fuzzyScore(query, b.label) - fuzzyScore(query, a.label))
      .slice(0, 10);
  }, [query, allItems]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        exec(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }, [filtered, selectedIndex, exec, close]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  // Group results by category
  const categoryOrder: CommandItem['category'][] = ['navigate', 'wiki', 'entries', 'actions'];
  const grouped: { category: string; items: { item: CommandItem; globalIndex: number }[] }[] = [];
  let globalIdx = 0;
  for (const cat of categoryOrder) {
    const items: { item: CommandItem; globalIndex: number }[] = [];
    for (const item of filtered) {
      if (item.category === cat) {
        items.push({ item, globalIndex: filtered.indexOf(item) });
      }
    }
    if (items.length > 0) {
      grouped.push({ category: cat, items });
    }
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
        }}
      />
      {/* modal */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* search input */}
        <div style={{ padding: '12px 16px 0' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="> type a command..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              padding: '8px 0',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* results */}
        <div
          ref={listRef}
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {grouped.length === 0 && (
            <div style={{
              padding: '16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              no results
            </div>
          )}
          {grouped.map(group => (
            <div key={group.category}>
              <div style={{
                padding: '8px 16px 4px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}>
                {group.category}
              </div>
              {group.items.map(({ item, globalIndex }) => {
                const isSelected = globalIndex === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => exec(item)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    style={{
                      padding: '6px 16px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      paddingLeft: '14px',
                    }}
                  >
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        marginLeft: '12px',
                        flexShrink: 0,
                      }}>
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
