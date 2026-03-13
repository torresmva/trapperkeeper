import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { PixelSkull, PixelGhost } from '../shared/PixelArt';

interface OublietteItem {
  id: string;
  title: string;
  originalType: string;
  deletedAt: string;
  daysRemaining: number;
}

const TYPE_COLORS: Record<string, string> = {
  entry: 'var(--accent-primary)',
  wiki: 'var(--accent-tertiary)',
  note: 'var(--accent-secondary)',
};

export function OubliettePage() {
  const [items, setItems] = useState<OublietteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.listOubliette();
      setItems(data);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  };

  const restore = async (id: string) => {
    setRestoring(id);
    try {
      await api.restoreFromOubliette(id);
      flash('restored');
      load();
    } catch {
      flash('restore failed');
    } finally {
      setRestoring(null);
    }
  };

  const destroy = async (id: string) => {
    try {
      await api.deleteFromOubliette(id);
      flash('permanently deleted');
      load();
    } catch {
      flash('delete failed');
    }
  };

  const purge = async () => {
    try {
      const result = await api.purgeOubliette();
      flash(`purged ${result.purged} expired items`);
      load();
    } catch {
      flash('purge failed');
    }
  };

  const expiredCount = items.filter(i => i.daysRemaining === 0).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <PixelSkull size={24} />
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          letterSpacing: '-0.03em',
        }}>
          the oubliette
        </h1>
      </div>
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginLeft: 36,
        marginBottom: 24,
        letterSpacing: '0.02em',
      }}>
        where deleted things linger for 30 days before vanishing forever
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {items.length} item{items.length !== 1 ? 's' : ''} in the depths
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {feedback && (
            <span style={{
              fontSize: '10px',
              color: 'var(--accent-green)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {feedback}
            </span>
          )}
          {expiredCount > 0 && (
            <button
              onClick={purge}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              purge expired ({expiredCount})
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          padding: '40px 0',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          descending into the depths...
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div style={{
          padding: '60px 0',
          textAlign: 'center',
        }}>
          <PixelGhost size={32} />
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 16,
          }}>
            the oubliette is empty
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: 4,
            opacity: 0.6,
          }}>
            nothing has been forgotten... yet
          </div>
        </div>
      )}

      {/* Items list */}
      {items.map(item => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            gap: 12,
          }}
        >
          {/* Type indicator */}
          <div style={{
            width: 3,
            height: 28,
            background: TYPE_COLORS[item.originalType] || 'var(--text-muted)',
            flexShrink: 0,
          }} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.title}
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 3,
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted)',
            }}>
              <span style={{ color: TYPE_COLORS[item.originalType] }}>
                {item.originalType}
              </span>
              <span>
                deleted {new Date(item.deletedAt).toLocaleDateString()}
              </span>
              <span style={{
                color: item.daysRemaining <= 5 ? 'var(--danger)' : 'var(--text-muted)',
              }}>
                {item.daysRemaining === 0
                  ? 'expired'
                  : `${item.daysRemaining}d remaining`
                }
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => restore(item.id)}
              disabled={restoring === item.id}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                opacity: restoring === item.id ? 0.4 : 1,
              }}
            >
              {restoring === item.id ? 'restoring...' : 'restore'}
            </button>
            <button
              onClick={() => destroy(item.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
              }}
            >
              destroy
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
