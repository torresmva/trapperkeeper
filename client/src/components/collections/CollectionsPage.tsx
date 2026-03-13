import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry, CollectionInfo } from '../../types';
import { EntryCard } from '../journal/EntryCard';
import { PixelFolder, PixelStar, PixelBorder, PixelGhost } from '../shared/PixelArt';
import { useSpace } from '../../contexts/SpaceContext';

export function CollectionsPage() {
  const { name } = useParams<{ name?: string }>();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { activeSpace } = useSpace();

  useEffect(() => {
    api.listCollections(activeSpace || undefined).then(setCollections).catch(console.error);
  }, [activeSpace]);

  useEffect(() => {
    if (name) {
      setLoading(true);
      api.getCollection(name, activeSpace || undefined)
        .then(setEntries)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [name, activeSpace]);

  // Collection list view
  if (!name) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          marginBottom: 32,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 16,
        }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
          }}>
            collections
          </h1>
        </div>

        {collections.length === 0 ? (
          <div style={{ padding: '48px 0', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <PixelFolder size={20} color="var(--accent-secondary)" />
              <p style={{ fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>no collections yet</p>
            </div>
            <p style={{ fontSize: '11px', paddingLeft: 30 }}>
              add <code style={{ color: 'var(--accent-primary)' }}>collections: [name]</code> to any entry's frontmatter to start organizing your loot.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {collections.map(coll => (
              <div
                key={coll.name}
                onClick={() => navigate(`/collections/${encodeURIComponent(coll.name)}`)}
                style={{
                  padding: '14px 0 14px 16px',
                  borderLeft: '2px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = 'var(--accent-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = 'var(--border)'; }}
              >
                <PixelFolder size={14} color="var(--accent-secondary)" />
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  flex: 1,
                }}>
                  {coll.name}
                </span>
                {coll.pinnedCount > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <PixelStar size={10} color="var(--accent-tertiary)" />
                    <span style={{ fontSize: '10px', color: 'var(--accent-tertiary)' }}>{coll.pinnedCount}</span>
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {coll.count} {coll.count === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            ))}
          </div>
        )}
        <PixelBorder />
      </div>
    );
  }

  // Single collection view
  const pinnedEntries = entries.filter(e => e.meta.pinnedInCollections?.includes(name));
  const otherEntries = entries.filter(e => !e.meta.pinnedInCollections?.includes(name));

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        marginBottom: 32,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <button
          onClick={() => navigate('/collections')}
          style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            background: 'transparent',
            padding: '2px 0',
            textTransform: 'none',
          }}
        >
          collections /
        </button>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--accent-secondary)',
        }}>
          {name}
        </h1>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {entries.length} entries
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>opening the vault...</p>
        </div>
      ) : (
        <>
          {/* Pinned section */}
          {pinnedEntries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '10px',
                color: 'var(--accent-tertiary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                <PixelStar size={10} color="var(--accent-tertiary)" />
                pinned
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {pinnedEntries.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isActive={false}
                    onClick={() => {
                      const base = entry.meta.category === 'notes' ? '/notes' : '/journal';
                      navigate(`${base}/${entry.id}`);
                    }}
                  />
                ))}
              </div>
              <PixelBorder color="var(--accent-tertiary)" />
            </div>
          )}

          {/* Rest */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {otherEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isActive={false}
                onClick={() => {
                  const base = entry.meta.category === 'notes' ? '/notes' : '/journal';
                  navigate(`${base}/${entry.id}`);
                }}
              />
            ))}
          </div>

          {entries.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0', color: 'var(--text-muted)' }}>
              <PixelGhost size={18} />
              <p style={{ fontSize: '12px' }}>this collection is empty. a blank slate awaits.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
