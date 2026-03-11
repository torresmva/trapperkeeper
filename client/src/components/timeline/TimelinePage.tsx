import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry, CollectionInfo } from '../../types';
import { TagBadge } from '../shared/TagBadge';
import { PixelSword, PixelGhost } from '../shared/PixelArt';
import { format, parseISO } from 'date-fns';

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

export function TimelinePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.listEntries('journal'),
      api.listEntries('notes'),
      api.listCollections(),
    ]).then(([journal, notes, cols]) => {
      const all = [...journal, ...notes];
      all.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
      setEntries(all);
      setCollections(cols);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredEntries = selectedCollection === 'all'
    ? entries
    : entries.filter(e => e.meta.collections?.includes(selectedCollection));

  // Group by month
  const months: Record<string, Entry[]> = {};
  for (const entry of filteredEntries) {
    const key = entry.meta.date.slice(0, 7); // YYYY-MM
    if (!months[key]) months[key] = [];
    months[key].push(entry);
  }

  return (
    <div style={{ maxWidth: 640 }}>
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
          timeline
        </h1>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {filteredEntries.length} entries
        </span>

        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCollection('all')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              color: selectedCollection === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: selectedCollection === 'all' ? '1px solid var(--accent-primary)' : '1px solid transparent',
              textTransform: 'lowercase',
              background: 'transparent',
              letterSpacing: '0.02em',
            }}
          >
            all
          </button>
          {collections.map(col => (
            <button
              key={col.name}
              onClick={() => setSelectedCollection(col.name)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                color: selectedCollection === col.name ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: selectedCollection === col.name ? '1px solid var(--accent-primary)' : '1px solid transparent',
                textTransform: 'lowercase',
                background: 'transparent',
                letterSpacing: '0.02em',
              }}
            >
              {col.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>unraveling the timeline...</p>
        </div>
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
              {/* Month label */}
              <div style={{
                position: 'relative',
                marginBottom: 16,
                marginLeft: -24,
              }}>
                {/* Dot on timeline */}
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

              {/* Entries */}
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
                    onClick={() => {
                      const base = entry.meta.category === 'notes' ? '/notes' : '/journal';
                      navigate(`${base}/${entry.id}`);
                    }}
                    style={{
                      position: 'relative',
                      marginBottom: 2,
                      padding: '10px 0 10px 0',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      marginLeft: -24,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary-dim)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Small dot */}
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
                      {/* Date + type */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: 40 }}>
                          {format(parseISO(entry.meta.date), 'dd')}
                        </span>
                        <span style={{ fontSize: '9px', color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {entry.meta.type}
                        </span>
                      </div>

                      {/* Title */}
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

                      {/* Preview */}
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

                      {/* Tags */}
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

          {filteredEntries.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-muted)' }}>
              <PixelSword size={28} color="var(--accent-primary)" />
              <p style={{ fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif" }}>the timeline is unwritten</p>
              <p style={{ fontSize: '11px' }}>start logging to forge your history.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
