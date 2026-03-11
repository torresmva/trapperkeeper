import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry } from '../../types';
import { EntryCard } from './EntryCard';
import { NewEntryDialog } from './NewEntryDialog';
import { PixelSword, PixelGhost } from '../shared/PixelArt';

type FilterType = 'all' | 'daily' | 'weekly' | 'monthly' | 'meeting' | '1on1' | 'incident' | 'decision' | 'project-update';

const allFilters: FilterType[] = ['all', 'daily', 'weekly', 'monthly', 'meeting', '1on1', 'incident', 'decision', 'project-update'];

export function EntryList() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    const journalParams: Record<string, string> = {};
    const notesParams: Record<string, string> = {};
    if (filter !== 'all') {
      journalParams.type = filter;
      notesParams.type = filter;
    }
    if (showArchived) {
      journalParams.archived = 'true';
      notesParams.archived = 'true';
    }
    Promise.all([
      api.listEntries('journal', journalParams),
      api.listEntries('notes', notesParams),
    ]).then(([journal, notes]) => {
      const all = [...journal, ...notes];
      all.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
      setEntries(all);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, showArchived]);

  const navigateToEntry = (entry: Entry) => {
    const base = entry.meta.category === 'notes' ? '/notes' : '/journal';
    navigate(`${base}/${entry.id}`);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        marginBottom: 32,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
        flexWrap: 'wrap',
      }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
        }}>
          entries
        </h1>

        <div style={{ flex: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {allFilters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                color: filter === f ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: filter === f ? '1px solid var(--accent-primary)' : '1px solid transparent',
                textTransform: 'lowercase',
                background: 'transparent',
                letterSpacing: '0.02em',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowArchived(!showArchived)}
          style={{
            fontSize: '10px',
            padding: '3px 8px',
            color: showArchived ? 'var(--accent-tertiary)' : 'var(--text-muted)',
            borderBottom: showArchived ? '1px solid var(--accent-tertiary)' : '1px solid transparent',
            background: 'transparent',
            textTransform: 'lowercase',
            letterSpacing: '0.02em',
          }}
        >
          {showArchived ? 'hide archived' : 'show archived'}
        </button>

        <button
          onClick={() => setShowNew(true)}
          style={{
            color: 'var(--accent-primary)',
            fontSize: '11px',
            padding: '4px 10px',
            border: '1px solid var(--accent-primary)',
            background: 'transparent',
          }}
        >
          + new
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
            animation: 'pulse 1.5s infinite',
          }}>
            rolling for initiative...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <PixelSword size={20} color="var(--accent-primary)" />
            <p style={{ fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>your quest log is empty</p>
          </div>
          <p style={{ fontSize: '11px', paddingLeft: 30 }}>
            the adventure begins with a single entry. press <span style={{ color: 'var(--accent-primary)' }}>+ new</span> to start.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {entries.map(entry => (
            <div
              key={entry.id}
              style={{
                opacity: (entry.meta as any).archived ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <EntryCard
                entry={entry}
                isActive={false}
                onClick={() => navigateToEntry(entry)}
              />
            </div>
          ))}
        </div>
      )}

      <NewEntryDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(id, category) => {
          const base = category === 'notes' ? '/notes' : '/journal';
          navigate(`${base}/${id}`);
        }}
      />
    </div>
  );
}
