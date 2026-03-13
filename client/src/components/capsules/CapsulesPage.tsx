import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Capsule } from '../../types';
import { PixelLock, PixelKey } from '../shared/PixelArt';

export function CapsulesPage() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadCapsules = async () => {
    try {
      const data = await api.listCapsules();
      setCapsules(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  const handleSeal = async () => {
    if (!title.trim() || !content.trim() || !unlockDate) return;
    try {
      await api.createCapsule({ title: title.trim(), content: content.trim(), unlockDate });
      setTitle('');
      setContent('');
      setUnlockDate('');
      await loadCapsules();
    } catch {}
  };

  const handleOpen = async (id: string) => {
    setOpeningId(id);
    try {
      const opened = await api.openCapsule(id);
      // Brief animation delay then update
      setTimeout(() => {
        setCapsules(prev => prev.map(c => c.id === id ? opened : c));
        setOpeningId(null);
      }, 800);
    } catch {
      setOpeningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCapsule(id);
      setCapsules(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const today = new Date().toISOString().split('T')[0];

  const getCapsuleState = (capsule: Capsule): 'locked' | 'unlockable' | 'opened' => {
    if (!capsule.sealed) return 'opened';
    if (capsule.unlockDate <= today) return 'unlockable';
    return 'locked';
  };

  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

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
          time capsules
        </h1>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          seal now, open later
        </span>
      </div>

      {/* Create form */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          new capsule
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="capsule title"
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
            marginBottom: 8,
          }}
        />

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="your message to the future..."
          style={{
            width: '100%',
            minHeight: 100,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            lineHeight: 1.7,
            padding: 12,
            outline: 'none',
            resize: 'vertical',
            marginBottom: 8,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
              unlock date
            </div>
            <input
              type="date"
              value={unlockDate}
              onChange={e => setUnlockDate(e.target.value)}
              min={today}
              style={{
                background: 'var(--bg-primary)',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                padding: '4px 0',
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={handleSeal}
            disabled={!title.trim() || !content.trim() || !unlockDate}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
              fontSize: '11px',
              padding: '6px 14px',
              cursor: !title.trim() || !content.trim() || !unlockDate ? 'not-allowed' : 'pointer',
              opacity: !title.trim() || !content.trim() || !unlockDate ? 0.3 : 1,
              marginTop: 12,
            }}
          >
            seal capsule
          </button>
        </div>
      </div>

      {/* Capsule list */}
      {loading ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>loading...</div>
      ) : capsules.length === 0 ? (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          opacity: 0.5,
        }}>
          no capsules yet — seal your first message
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {capsules.map(capsule => {
            const state = getCapsuleState(capsule);
            const isOpening = openingId === capsule.id;

            return (
              <div
                key={capsule.id}
                style={{
                  border: '1px solid var(--border)',
                  padding: '12px 16px',
                  animation: isOpening ? 'capsuleOpen 0.8s ease forwards' : 'fadeIn 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Flash overlay for opening */}
                {isOpening && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--accent-primary)',
                    animation: 'capsuleFlash 0.8s ease forwards',
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: state === 'opened' ? 8 : 0 }}>
                  <div style={{ flexShrink: 0 }}>
                    {state === 'locked' && <PixelLock size={16} color="var(--text-muted)" />}
                    {state === 'unlockable' && (
                      <span style={{ animation: 'pulse 1.5s infinite' }}>
                        <PixelKey size={16} color="var(--accent-green)" />
                      </span>
                    )}
                    {state === 'opened' && <PixelKey size={16} color="var(--accent-primary)" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      color: state === 'locked' ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontWeight: 600,
                    }}>
                      {capsule.title}
                    </div>
                    <div style={{ fontSize: '9px', marginTop: 2 }}>
                      {state === 'locked' && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          unlocks in {daysUntil(capsule.unlockDate)}d
                        </span>
                      )}
                      {state === 'unlockable' && (
                        <span style={{ color: 'var(--accent-green)' }}>
                          ready to open!
                        </span>
                      )}
                      {state === 'opened' && capsule.openedAt && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          opened {new Date(capsule.openedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {state === 'unlockable' && (
                      <button
                        onClick={() => handleOpen(capsule.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--accent-green)',
                          color: 'var(--accent-green)',
                          fontSize: '10px',
                          padding: '3px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        open
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(capsule.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      delete
                    </button>
                  </div>
                </div>

                {/* Content revealed when opened */}
                {state === 'opened' && (
                  <div style={{
                    padding: '8px 0 0 26px',
                    borderTop: '1px solid var(--border)',
                    marginTop: 8,
                  }}>
                    <pre style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      fontFamily: "'JetBrains Mono', monospace",
                      margin: 0,
                    }}>
                      {capsule.content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes capsuleOpen {
          0% { transform: scale(1); }
          30% { transform: scale(1.02); }
          60% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes capsuleFlash {
          0% { opacity: 0; }
          30% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
