import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { GhostEntry } from '../../types';
import { PixelGhost } from '../shared/PixelArt';

export function GhostPanel() {
  const [ghosts, setGhosts] = useState<GhostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getGhosts()
      .then(setGhosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleArchive = async (id: string) => {
    try {
      await api.archiveEntry(id);
      setGhosts(prev => prev.filter(g => g.id !== id));
    } catch {}
  };

  const handleFinish = (ghost: GhostEntry) => {
    navigate(`/${ghost.category}/${ghost.id}`);
  };

  if (loading) return null;

  const visible = ghosts.slice(0, 5);
  const overflow = ghosts.length - 5;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <PixelGhost size={12} color="var(--text-muted)" />
        ghosts
      </div>

      {ghosts.length === 0 ? (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          opacity: 0.5,
          padding: '8px 0',
        }}>
          no ghosts — all caught up
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visible.map(ghost => (
            <div
              key={ghost.id}
              style={{
                padding: '8px 0 8px 12px',
                borderLeft: '2px solid var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {ghost.title}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {ghost.age}d ago
                  </span>
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--accent-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {ghost.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleFinish(ghost)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                finish
              </button>
              <button
                onClick={() => handleArchive(ghost.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                archive
              </button>
            </div>
          ))}
          {overflow > 0 && (
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              padding: '6px 0 0 12px',
              fontStyle: 'italic',
            }}>
              and {overflow} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
