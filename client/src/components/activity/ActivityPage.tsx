import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PixelCoffee, PixelScroll, PixelCrown, PixelGhost, PixelSword,
  PixelSkull, PixelShield, PixelLightning, PixelStar, PixelTrophy,
  PixelRocket, PixelBorder, PixelHeart, PixelWrench,
  PixelFolder, PixelFire,
} from '../shared/PixelArt';

interface ActivityEvent {
  type: string;
  action: string;
  timestamp: string;
  title: string;
  detail?: string;
}

type TimeWindow = 7 | 14 | 30 | 90;

const EVENT_CONFIG: Record<string, {
  icon: (s: number) => React.ReactNode;
  accent: string;
  verb: string;
}> = {
  'entry-created': {
    icon: (s) => <PixelCoffee size={s} color="var(--accent-primary)" />,
    accent: 'var(--accent-primary)',
    verb: 'wrote',
  },
  'task-completed': {
    icon: (s) => <PixelStar size={s} color="var(--accent-green)" />,
    accent: 'var(--accent-green)',
    verb: 'completed',
  },
  'task-created': {
    icon: (s) => <PixelWrench size={s} color="var(--text-muted)" />,
    accent: 'var(--text-muted)',
    verb: 'created task',
  },
  'receipt-created': {
    icon: (s) => <PixelScroll size={s} color="var(--accent-secondary)" />,
    accent: 'var(--accent-secondary)',
    verb: 'logged receipt',
  },
  'link-saved': {
    icon: (s) => <PixelRocket size={s} color="var(--accent-primary)" />,
    accent: 'var(--accent-primary)',
    verb: 'saved',
  },
  'promise-created': {
    icon: (s) => <PixelHeart size={s} color="var(--accent-secondary)" />,
    accent: 'var(--accent-secondary)',
    verb: 'made promise',
  },
  'promise-resolved': {
    icon: (s) => <PixelShield size={s} color="var(--accent-green)" />,
    accent: 'var(--accent-green)',
    verb: 'resolved',
  },
  'snippet-created': {
    icon: (s) => <PixelLightning size={s} color="var(--accent-tertiary)" />,
    accent: 'var(--accent-tertiary)',
    verb: 'saved snippet',
  },
  'wiki-created': {
    icon: (s) => <PixelFolder size={s} color="var(--accent-primary)" />,
    accent: 'var(--accent-primary)',
    verb: 'created page',
  },
  'wiki-updated': {
    icon: (s) => <PixelFolder size={s} color="var(--text-secondary)" />,
    accent: 'var(--text-secondary)',
    verb: 'updated page',
  },
  'trophy-unlocked': {
    icon: (s) => <PixelTrophy size={s} color="var(--accent-tertiary)" />,
    accent: 'var(--accent-tertiary)',
    verb: 'unlocked',
  },
};

const DEFAULT_CONFIG = {
  icon: (s: number) => <PixelGhost size={s} color="var(--text-muted)" />,
  accent: 'var(--text-muted)',
  verb: '',
};

export function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState<TimeWindow>(30);
  const [filterType, setFilterType] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/activity?days=${window}&limit=200`)
      .then(r => r.json())
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [window]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  // Group by date
  const groups = useMemo(() => {
    const map: Record<string, ActivityEvent[]> = {};
    for (const ev of filtered) {
      const day = ev.timestamp.slice(0, 10);
      if (!map[day]) map[day] = [];
      map[day].push(ev);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Unique event types for filter
  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type));
    return Array.from(types).sort();
  }, [events]);

  // Stats summary
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.type] = (counts[ev.type] || 0) + 1;
    }
    return counts;
  }, [events]);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return ''; }
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return 'today';
    if (dateStr === yesterday) return 'yesterday';
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      }).toLowerCase();
    } catch { return dateStr; }
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
          <PixelFire size={20} color="var(--accent-tertiary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            activity
          </h1>
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
          paddingLeft: 32,
        }}>
          everything you've been up to. the full picture.
        </div>
      </div>

      {/* Time window selector */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        {([7, 14, 30, 90] as TimeWindow[]).map(w => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            style={{
              background: 'transparent',
              color: window === w ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: window === w ? '2px solid var(--accent-primary)' : '2px solid transparent',
              fontSize: 11,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: -1,
              letterSpacing: '0.04em',
            }}
          >
            {w}d
          </button>
        ))}
        <span style={{
          marginLeft: 'auto',
          alignSelf: 'center',
          fontSize: '9px',
          color: 'var(--text-muted)',
          opacity: 0.5,
          paddingRight: 4,
        }}>
          {events.length} events
        </span>
      </div>

      {/* Stats ribbon */}
      {!loading && events.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          padding: '10px 0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([type, count]) => {
              const cfg = EVENT_CONFIG[type] || DEFAULT_CONFIG;
              const isActive = filterType === type;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(isActive ? 'all' : type)}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    background: 'transparent',
                    border: isActive ? `1px solid ${cfg.accent}` : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {cfg.icon(10)}
                  <span style={{
                    fontSize: '10px',
                    color: isActive ? cfg.accent : 'var(--text-secondary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      <PixelBorder />

      {/* Feed */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
            gathering your trail...
          </p>
        </div>
      ) : events.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <PixelGhost size={28} color="var(--accent-secondary)" />
          <p style={{ fontSize: '13px', marginTop: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
            no activity yet
          </p>
          <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic', opacity: 0.6 }}>
            start writing, and your story will appear here.
          </p>
        </div>
      ) : (
        <div style={{ paddingTop: 8 }}>
          {groups.map(([date, dayEvents], gi) => (
            <div key={date} style={{ marginBottom: 4 }}>
              {/* Date header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 0 6px',
                marginTop: gi > 0 ? 4 : 0,
              }}>
                <div style={{
                  width: 32,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    background: date === new Date().toISOString().slice(0, 10)
                      ? 'var(--accent-primary)' : 'var(--text-muted)',
                    opacity: date === new Date().toISOString().slice(0, 10) ? 1 : 0.4,
                  }} />
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: date === new Date().toISOString().slice(0, 10)
                    ? 'var(--accent-primary)' : 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {formatDate(date)}
                </span>
                <div style={{ flex: 1, height: 0, borderTop: '1px dashed var(--border)', opacity: 0.3 }} />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.4 }}>
                  {dayEvents.length}
                </span>
              </div>

              {/* Events for this day */}
              {dayEvents.map((ev, ei) => {
                const cfg = EVENT_CONFIG[ev.type] || DEFAULT_CONFIG;
                return (
                  <div
                    key={`${ev.timestamp}-${ei}`}
                    style={{
                      display: 'flex',
                      gap: 0,
                      animation: `entrySlideIn 0.25s ease both`,
                      animationDelay: `${Math.min((gi * 10 + ei) * 20, 400)}ms`,
                    }}
                  >
                    {/* Icon gutter */}
                    <div style={{
                      width: 32,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      paddingTop: 10,
                      position: 'relative',
                    }}>
                      {cfg.icon(14)}
                      {ei < dayEvents.length - 1 && (
                        <div style={{
                          flex: 1,
                          width: 1,
                          background: 'var(--border)',
                          marginTop: 4,
                          opacity: 0.3,
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '6px 0 8px',
                      borderBottom: ei < dayEvents.length - 1 ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 2,
                      }}>
                        <span style={{
                          fontSize: '9px',
                          color: cfg.accent,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                        }}>
                          {cfg.verb}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.4 }}>
                          {formatTime(ev.timestamp)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {ev.title}
                      </div>
                      {ev.detail && (
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          marginTop: 1,
                          opacity: 0.6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {ev.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <PixelBorder />
      </div>
    </div>
  );
}
