import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry, TagCount } from '../../types';
import { EntryCard } from '../journal/EntryCard';
import { TagBadge } from '../shared/TagBadge';
import { PixelKey, PixelSkull } from '../shared/PixelArt';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getTags().then(setTags).catch(console.error);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query || selectedTag) {
        api.search(query, selectedTag || undefined)
          .then(setResults)
          .catch(console.error)
          .finally(() => setSearched(true));
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, selectedTag]);

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{
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
          marginBottom: 20,
        }}>
          search
        </h1>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="type to search..."
          autoFocus
          style={{
            width: '100%',
            fontSize: '14px',
            padding: '8px 0',
            borderBottom: '2px solid var(--accent-primary)',
          }}
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 28,
          paddingBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'transparent',
                padding: '0',
                textTransform: 'none',
                textDecoration: 'underline',
              }}
            >
              clear
            </button>
          )}
          {tags.map(t => (
            <span
              key={t.name}
              onClick={() => setSelectedTag(selectedTag === t.name ? null : t.name)}
              style={{
                cursor: 'pointer',
                fontSize: '11px',
                color: selectedTag === t.name ? 'var(--accent-primary)' : 'var(--text-muted)',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ opacity: 0.5 }}>#</span>{t.name}
              <span style={{ fontSize: '9px', opacity: 0.4, marginLeft: 2 }}>{t.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {!searched && !query && !selectedTag ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-muted)' }}>
          <PixelKey size={28} color="var(--accent-primary)" />
          <p style={{ fontSize: '12px', fontStyle: 'italic' }}>seek and you shall find</p>
        </div>
      ) : searched && results.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-muted)' }}>
          <PixelSkull size={24} color="var(--text-muted)" />
          <p style={{ fontSize: '12px' }}>nothing here. the void stares back.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {results.map(entry => (
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
      )}
    </div>
  );
}
