import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Link } from '../../types';
import { PixelKey, PixelBorder, PixelGhost, PixelSkull } from '../shared/PixelArt';
import { TagBadge } from '../shared/TagBadge';
import { useRandomQuote } from '../../hooks/useQuotes';

type StatusFilter = 'all' | 'unread' | 'read' | 'archived';

const STATUS_COLORS: Record<string, string> = {
  unread: 'var(--accent-primary)',
  read: 'var(--accent-green)',
  archived: 'var(--text-muted)',
};

export function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');

  const flavor = useRandomQuote('links', 'a graveyard for your browser tabs');

  const loadLinks = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      const data = await api.listLinks(params);
      setLinks(data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    await api.createLink({
      url: newUrl.trim(),
      title: newTitle.trim() || newUrl.trim(),
      note: newNote.trim() || undefined,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setNewUrl(''); setNewTitle(''); setNewNote(''); setNewTags('');
    setShowAdd(false);
    loadLinks();
  };

  const handleMarkRead = async (id: string) => {
    await api.markLinkRead(id);
    loadLinks();
  };

  const handleArchive = async (id: string) => {
    await api.archiveLink(id);
    loadLinks();
  };

  const handleDelete = async (id: string) => {
    await api.deleteLink(id);
    loadLinks();
  };

  const allLinks = links;
  const counts = {
    all: allLinks.length,
    unread: allLinks.filter(l => l.status === 'unread').length,
    read: allLinks.filter(l => l.status === 'read').length,
    archived: allLinks.filter(l => l.status === 'archived').length,
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelKey size={20} color="var(--accent-primary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            links
          </h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
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
          paddingLeft: 32,
        }}>
          {flavor}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{
          marginBottom: 24,
          padding: '16px',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              autoFocus
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="title (optional — defaults to url)"
              style={inputStyle}
            />
            <input
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="note / why you saved this (optional)"
              style={inputStyle}
            />
            <input
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              placeholder="tags (comma-separated)"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={cancelBtn}>cancel</button>
              <button onClick={handleAdd} disabled={!newUrl.trim()} style={submitBtn}>
                save link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        {(['all', 'unread', 'read', 'archived'] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              background: 'transparent',
              color: filter === s ? (s === 'all' ? 'var(--accent-primary)' : STATUS_COLORS[s]) : 'var(--text-muted)',
              border: 'none',
              borderBottom: filter === s ? `2px solid ${s === 'all' ? 'var(--accent-primary)' : STATUS_COLORS[s]}` : '2px solid transparent',
              fontSize: 11,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: -1,
            }}
          >
            {s} {counts[s] > 0 ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
            digging through bookmarks...
          </p>
        </div>
      ) : links.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
          <PixelSkull size={24} color="var(--text-muted)" />
          <p style={{ fontSize: '13px', marginTop: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            the bookmark graveyard is empty
          </p>
          <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic' }}>
            close a tab. save a link. free yourself.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {links.map(link => (
            <div
              key={link.id}
              style={{
                padding: '12px 0 12px 16px',
                borderLeft: `2px solid ${STATUS_COLORS[link.status]}`,
                borderBottom: '1px solid var(--border)',
                animation: 'fadeIn 0.2s ease',
                opacity: link.status === 'archived' ? 0.5 : 1,
              }}
            >
              {/* Title + URL */}
              <div style={{ marginBottom: 4 }}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    letterSpacing: '-0.02em',
                    textDecoration: link.status === 'read' ? 'none' : 'underline',
                    textDecorationColor: 'var(--border)',
                    textUnderlineOffset: 3,
                  }}
                >
                  {link.title}
                </a>
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: link.note ? 4 : 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {link.url}
              </div>

              {/* Note */}
              {link.note && (
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  fontStyle: 'italic',
                }}>
                  {link.note}
                </p>
              )}

              {/* Tags + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {link.tags.map(tag => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {link.created.split('T')[0]}
                </span>
                <div style={{ flex: 1 }} />
                {link.status === 'unread' && (
                  <button onClick={() => handleMarkRead(link.id)} style={actionBtn}>read</button>
                )}
                {link.status !== 'archived' && (
                  <button onClick={() => handleArchive(link.id)} style={actionBtn}>archive</button>
                )}
                <button onClick={() => handleDelete(link.id)} style={{ ...actionBtn, opacity: 0.4 }}>del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <PixelBorder />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: 12,
  padding: '8px 0',
  outline: 'none',
  fontFamily: "'JetBrains Mono', monospace",
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 11,
  cursor: 'pointer',
  padding: '6px 12px',
};

const submitBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--accent-primary)',
  color: 'var(--accent-primary)',
  fontSize: 11,
  cursor: 'pointer',
  padding: '6px 14px',
};

const actionBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 10,
  cursor: 'pointer',
  padding: '2px 4px',
  fontFamily: "'JetBrains Mono', monospace",
};
