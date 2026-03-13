import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry, CollectionInfo } from '../../types';
import { EntryCard } from './EntryCard';
import { NewEntryDialog } from './NewEntryDialog';
import { TagBadge } from '../shared/TagBadge';
import { format, parseISO } from 'date-fns';
import {
  PixelSword, PixelGhost, PixelCoffee, PixelStar,
  PixelLightning, PixelSkull, PixelShield, PixelCrown, PixelScroll,
  PixelBorder, PixelMusicNote,
} from '../shared/PixelArt';
import { useRandomQuote, useEmptyQuotes } from '../../hooks/useQuotes';

type ViewMode = 'list' | 'timeline' | 'digest';
type FilterType = 'all' | 'daily' | 'weekly' | 'monthly' | 'meeting' | '1on1' | 'incident' | 'decision' | 'project-update';

const FILTER_CONFIG: { type: FilterType; icon: React.ReactNode; accent: string; label: string }[] = [
  { type: 'all',              icon: <PixelStar size={12} color="var(--accent-primary)" />,       accent: 'var(--accent-primary)',   label: 'all' },
  { type: 'daily',            icon: <PixelCoffee size={12} color="var(--accent-primary)" />,     accent: 'var(--accent-primary)',   label: 'daily' },
  { type: 'weekly',           icon: <PixelScroll size={12} color="var(--accent-secondary)" />,   accent: 'var(--accent-secondary)', label: 'weekly' },
  { type: 'monthly',          icon: <PixelCrown size={12} color="var(--accent-tertiary)" />,     accent: 'var(--accent-tertiary)',  label: 'monthly' },
  { type: 'meeting',          icon: <PixelGhost size={12} color="var(--text-muted)" />,          accent: 'var(--text-secondary)',   label: 'meeting' },
  { type: '1on1',             icon: <PixelSword size={12} color="var(--accent-primary)" />,      accent: 'var(--accent-primary)',   label: '1:1' },
  { type: 'incident',         icon: <PixelSkull size={12} color="var(--accent-tertiary)" />,     accent: 'var(--accent-tertiary)',  label: 'incident' },
  { type: 'decision',         icon: <PixelShield size={12} color="var(--accent-green)" />,       accent: 'var(--accent-green)',     label: 'decision' },
  { type: 'project-update',   icon: <PixelLightning size={12} color="var(--accent-secondary)" />,accent: 'var(--accent-secondary)', label: 'project' },
];

const typeAccents: Record<string, string> = {
  daily: 'var(--accent-primary)',
  weekly: 'var(--accent-secondary)',
  monthly: 'var(--accent-tertiary)',
  meeting: 'var(--accent-green)',
  incident: 'var(--danger)',
  decision: 'var(--accent-tertiary)',
  '1on1': 'var(--accent-secondary)',
  'project-update': 'var(--accent-primary)',
  note: 'var(--text-muted)',
};

const TYPE_COLORS: Record<string, string> = {
  daily: 'var(--accent-primary)',
  weekly: 'var(--accent-secondary)',
  monthly: 'var(--accent-tertiary)',
  note: 'var(--text-secondary)',
  meeting: 'var(--accent-green)',
  incident: 'var(--danger)',
  decision: 'var(--accent-primary)',
  '1on1': 'var(--accent-secondary)',
  'project-update': 'var(--accent-tertiary)',
};

const EMPTY_QUOTES_FALLBACK = [
  { text: 'your quest log is empty', sub: 'the adventure begins with a single entry.' },
];

interface DigestDay {
  date: string;
  entries: { title: string; type: string; id: string; category: string }[];
}
interface Digest {
  period: { start: string; end: string };
  totalEntries: number;
  days: DigestDay[];
}

export function EntryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewMode) || 'list';

  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [showArchived, setShowArchived] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // Timeline state
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('all');

  // Digest state
  const [digest, setDigest] = useState<Digest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  const navigate = useNavigate();
  const subheading = useRandomQuote('entries', 'this is your story. keep writing.');
  const emptyQuotes = useEmptyQuotes('entries-empty', EMPTY_QUOTES_FALLBACK);
  const emptyQuote = useMemo(() => emptyQuotes[Math.floor(Math.random() * emptyQuotes.length)], [emptyQuotes]);

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchParams(mode === 'list' ? {} : { view: mode });
  };

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
    const countPromise = filter === 'all' && !showArchived
      ? null
      : Promise.all([
          api.listEntries('journal', {}),
          api.listEntries('notes', {}),
        ]);

    Promise.all([
      api.listEntries('journal', journalParams),
      api.listEntries('notes', notesParams),
      api.listCollections(),
      ...(countPromise ? [countPromise] : []),
    ]).then(([journal, notes, cols, ...rest]) => {
      const all = [...(journal as Entry[]), ...(notes as Entry[])];
      all.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
      setEntries(all);
      setCollections(cols as CollectionInfo[]);

      if (rest.length && rest[0]) {
        const [aj, an] = rest[0] as [Entry[], Entry[]];
        setAllEntries([...aj, ...an]);
      } else {
        setAllEntries(all);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, showArchived]);

  // Load digest when switching to digest view
  useEffect(() => {
    if (viewMode === 'digest' && !digest) {
      setDigestLoading(true);
      fetch('/api/digest/weekly').then(r => r.json()).then(setDigest).finally(() => setDigestLoading(false));
    }
  }, [viewMode]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEntries.length };
    for (const e of allEntries) {
      counts[e.meta.type] = (counts[e.meta.type] || 0) + 1;
    }
    return counts;
  }, [allEntries]);

  // Timeline grouping
  const timelineEntries = selectedCollection === 'all'
    ? entries
    : entries.filter(e => e.meta.collections?.includes(selectedCollection));

  const months: Record<string, Entry[]> = {};
  for (const entry of timelineEntries) {
    const key = entry.meta.date.slice(0, 7);
    if (!months[key]) months[key] = [];
    months[key].push(entry);
  }

  const navigateToEntry = (entry: Entry | { id: string; category: string }) => {
    const cat = 'meta' in entry ? entry.meta.category : (entry as any).category;
    const base = cat === 'notes' ? '/notes' : '/journal';
    navigate(`${base}/${entry.id}`);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
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
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
        }}>
          {subheading}
        </div>
      </div>

      {/* View mode tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        {([
          { mode: 'list' as ViewMode, label: 'list' },
          { mode: 'timeline' as ViewMode, label: 'timeline' },
          { mode: 'digest' as ViewMode, label: 'weekly' },
        ]).map(v => (
          <button
            key={v.mode}
            onClick={() => switchView(v.mode)}
            style={{
              background: 'transparent',
              color: viewMode === v.mode ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: viewMode === v.mode ? '2px solid var(--accent-primary)' : '2px solid transparent',
              fontSize: 11,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: -1,
              letterSpacing: '0.04em',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ====== LIST VIEW ====== */}
      {viewMode === 'list' && (
        <>
          {/* Category filter grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            marginBottom: 24,
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}>
            {FILTER_CONFIG.map(f => {
              const isActive = filter === f.type;
              const count = typeCounts[f.type] || 0;
              return (
                <button
                  key={f.type}
                  onClick={() => setFilter(f.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    background: isActive ? 'var(--bg-surface)' : 'var(--bg-primary)',
                    border: 'none',
                    borderLeft: isActive ? `2px solid ${f.accent}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderLeftColor = f.accent;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                >
                  {f.icon}
                  <span style={{
                    fontSize: '11px',
                    color: isActive ? f.accent : 'var(--text-secondary)',
                    flex: 1,
                    letterSpacing: '0.02em',
                  }}>
                    {f.label}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    color: isActive ? f.accent : 'var(--text-muted)',
                    opacity: isActive ? 1 : 0.5,
                    minWidth: 16,
                    textAlign: 'right',
                  }}>
                    {count || '—'}
                  </span>
                </button>
              );
            })}
          </div>
          <PixelBorder />

          {/* Archive toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              {loading ? '' : `${entries.length} ${filter === 'all' ? 'entries' : filter}`}
            </span>
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
          </div>

          {/* Entry list */}
          {loading ? (
            <LoadingState />
          ) : entries.length === 0 ? (
            <EmptyState quote={emptyQuote} onNew={() => setShowNew(true)} />
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
        </>
      )}

      {/* ====== TIMELINE VIEW ====== */}
      {viewMode === 'timeline' && (
        <>
          {/* Collection filter */}
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 20 }}>
            <button
              onClick={() => setSelectedCollection('all')}
              style={collBtnStyle(selectedCollection === 'all')}
            >
              all
            </button>
            {collections.map(col => (
              <button
                key={col.name}
                onClick={() => setSelectedCollection(col.name)}
                style={collBtnStyle(selectedCollection === col.name)}
              >
                {col.name}
              </button>
            ))}
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 8, alignSelf: 'center' }}>
              {timelineEntries.length} entries
            </span>
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: 4,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'var(--border)',
              }} />

              {Object.entries(months).map(([monthKey, monthEntries]) => (
                <div key={monthKey} style={{ marginBottom: 32 }}>
                  <div style={{ position: 'relative', marginBottom: 16, marginLeft: -24 }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 6,
                      width: 9,
                      height: 9,
                      background: 'var(--accent-primary)',
                      imageRendering: 'pixelated',
                    }} />
                    <span style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      letterSpacing: '-0.02em',
                      marginLeft: 24,
                    }}>
                      {format(parseISO(monthKey + '-01'), 'MMMM yyyy')}
                    </span>
                  </div>

                  {monthEntries.map(entry => {
                    const accent = typeAccents[entry.meta.type] || 'var(--text-muted)';
                    const preview = entry.body
                      .replace(/^#+\s.*/gm, '')
                      .replace(/[-*]\s/g, '')
                      .trim()
                      .slice(0, 100);

                    return (
                      <div
                        key={entry.id}
                        onClick={() => navigateToEntry(entry)}
                        style={{
                          position: 'relative',
                          marginBottom: 2,
                          padding: '10px 0',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                          marginLeft: -24,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary-dim)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          position: 'absolute',
                          left: 2,
                          top: 16,
                          width: 5,
                          height: 5,
                          background: accent,
                          imageRendering: 'pixelated',
                        }} />

                        <div style={{ marginLeft: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: 40 }}>
                              {format(parseISO(entry.meta.date), 'dd')}
                            </span>
                            <span style={{ fontSize: '9px', color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {entry.meta.type}
                            </span>
                          </div>
                          <div style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            marginBottom: preview ? 4 : 0,
                          }}>
                            {entry.meta.title}
                          </div>
                          {preview && (
                            <p style={{
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: entry.meta.tags.length > 0 ? 6 : 0,
                            }}>
                              {preview}
                            </p>
                          )}
                          {entry.meta.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              {entry.meta.tags.slice(0, 3).map(tag => (
                                <TagBadge key={tag} tag={tag} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {timelineEntries.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-muted)' }}>
                  <PixelSword size={28} color="var(--accent-primary)" />
                  <p style={{ fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>the timeline is unwritten</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ====== DIGEST VIEW ====== */}
      {viewMode === 'digest' && (
        <>
          {digestLoading || !digest ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
              <PixelGhost size={18} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
                brewing your weekly digest...
              </span>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: 20,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {digest.period.start} → {digest.period.end} · {digest.totalEntries} entries
              </div>

              {digest.days.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  quiet week — no entries recorded
                </div>
              ) : (
                digest.days.map(day => (
                  <div key={day.date} style={{ marginBottom: 28 }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: 10,
                      paddingBottom: 6,
                      borderBottom: '1px solid var(--border)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    {day.entries.map((entry, i) => (
                      <div
                        key={i}
                        onClick={() => navigateToEntry(entry)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '8px 12px',
                          marginBottom: 2,
                          cursor: 'pointer',
                          borderLeft: `2px solid ${TYPE_COLORS[entry.type] || 'var(--border)'}`,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          color: TYPE_COLORS[entry.type] || 'var(--text-muted)',
                          fontFamily: "'JetBrains Mono', monospace",
                          minWidth: 80,
                          letterSpacing: '0.5px',
                        }}>
                          {entry.type}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {entry.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </>
          )}
        </>
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

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
      <PixelGhost size={18} color="var(--text-muted)" />
      <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
        rolling for initiative...
      </p>
    </div>
  );
}

function EmptyState({ quote, onNew }: { quote: { text: string; sub: string }; onNew: () => void }) {
  return (
    <div style={{ padding: '48px 0', color: 'var(--text-muted)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <PixelMusicNote size={20} color="var(--accent-secondary)" />
        <p style={{ fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
          {quote.text}
        </p>
      </div>
      <p style={{ fontSize: '11px', paddingLeft: 30, fontStyle: 'italic' }}>
        {quote.sub}{' '}
        <span onClick={onNew} style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>+ new</span>
      </p>
    </div>
  );
}

function collBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 8px',
    fontSize: '11px',
    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
    borderBottom: active ? '1px solid var(--accent-primary)' : '1px solid transparent',
    textTransform: 'lowercase',
    background: 'transparent',
    letterSpacing: '0.02em',
    border: 'none',
    cursor: 'pointer',
  };
}
