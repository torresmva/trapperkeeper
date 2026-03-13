import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Stats } from '../../types';
import { ActivityBoard } from './ActivityBoard';
import {
  PixelTrophy, PixelFire, PixelBorder, PixelSword, PixelCoffee, PixelGhost,
  PixelHeart, PixelKey, PixelLightning, PixelScroll,
} from '../shared/PixelArt';
import { useRandomQuote } from '../../hooks/useQuotes';

interface KeeperCounts {
  openPromises: number;
  unreadLinks: number;
  pendingReceipts: number;
  activeTasks: number;
}

interface OnThisDayEntry {
  label: string;
  date: string;
  entries: { id: string; title: string; type: string; category: string }[];
}

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [keeperCounts, setKeeperCounts] = useState<KeeperCounts | null>(null);
  const [onThisDay, setOnThisDay] = useState<OnThisDayEntry[]>([]);
  const [standup, setStandup] = useState<string | null>(null);
  const [standupCopied, setStandupCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load keeper counts in parallel
    Promise.all([
      api.listPromises({ status: 'open' }),
      api.listLinks({ status: 'unread' }),
      api.listReceipts({ status: 'pending' }),
      api.listTasks('active'),
    ]).then(([promises, links, receipts, tasks]) => {
      setKeeperCounts({
        openPromises: promises.length,
        unreadLinks: links.length,
        pendingReceipts: receipts.length,
        activeTasks: tasks.length,
      });
    }).catch(() => {});

    // Load on this day
    api.getOnThisDay().then(setOnThisDay).catch(() => {});
  }, []);

  const greeting = useRandomQuote('dashboard', 'press start to continue.');

  const handleStandup = async () => {
    const res = await api.getStandup();
    setStandup(res.standup);
  };

  const copyStandup = () => {
    if (!standup) return;
    navigator.clipboard.writeText(standup);
    setStandupCopied(true);
    setTimeout(() => setStandupCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
        <PixelGhost size={20} color="var(--text-muted)" />
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>summoning your stats...</p>
      </div>
    );
  }

  if (!stats) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>failed to load stats</p>;
  }

  return (
    <div style={{ maxWidth: 740 }}>
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
          dashboard
        </h1>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          letterSpacing: '0.01em',
        }}>
          {greeting}
        </span>
      </div>

      {/* Stat cards row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        marginBottom: 32,
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}>
        <StatCell label="entries" value={stats.totalEntries} />
        <StatCell label="this week" value={stats.thisWeek} accent="var(--accent-primary)" icon={<PixelCoffee size={16} color="var(--accent-primary)" />} />
        <StatCell label="streak" value={stats.currentStreak} suffix="d" icon={<PixelSword size={16} color="var(--accent-tertiary)" />} />
        <StatCell label="best streak" value={stats.longestStreak} suffix="d" icon={<PixelTrophy size={16} color="var(--accent-tertiary)" />} />
      </div>

      {/* Keeper status + standup row */}
      {keeperCounts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          marginBottom: 32,
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          <KeeperCell
            label="tasks"
            value={keeperCounts.activeTasks}
            icon={<PixelSword size={12} color="var(--accent-primary)" />}
            accent="var(--accent-primary)"
            onClick={() => navigate('/keeper')}
          />
          <KeeperCell
            label="promises"
            value={keeperCounts.openPromises}
            icon={<PixelHeart size={12} color="var(--accent-secondary)" />}
            accent="var(--accent-secondary)"
            onClick={() => navigate('/keeper?tab=promises')}
          />
          <KeeperCell
            label="unread"
            value={keeperCounts.unreadLinks}
            icon={<PixelKey size={12} color="var(--accent-primary)" />}
            accent="var(--accent-primary)"
            onClick={() => navigate('/keeper?tab=links')}
          />
          <KeeperCell
            label="pending"
            value={keeperCounts.pendingReceipts}
            icon={<PixelTrophy size={12} color="var(--accent-tertiary)" />}
            accent="var(--accent-tertiary)"
            onClick={() => navigate('/keeper?tab=receipts')}
          />
        </div>
      )}

      {/* Standup generator */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            flex: 1,
          }}>
            standup
          </div>
          {!standup ? (
            <button
              onClick={handleStandup}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontSize: '10px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              generate
            </button>
          ) : (
            <button
              onClick={copyStandup}
              style={{
                background: 'transparent',
                border: `1px solid ${standupCopied ? 'var(--accent-green)' : 'var(--border)'}`,
                color: standupCopied ? 'var(--accent-green)' : 'var(--text-muted)',
                fontSize: '10px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              {standupCopied ? 'copied!' : 'copy'}
            </button>
          )}
        </div>
        {standup && (
          <pre style={{
            background: 'var(--code-bg)',
            borderLeft: '2px solid var(--accent-primary)',
            padding: '12px 16px',
            fontSize: '11px',
            lineHeight: 1.7,
            maxHeight: 250,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            color: 'var(--text-secondary)',
            animation: 'fadeIn 0.2s ease',
          }}>
            {standup}
          </pre>
        )}
        {!standup && (
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            opacity: 0.5,
          }}>
            auto-assembles from yesterday's entries + today's open tasks
          </div>
        )}
      </div>

      {/* Activity board */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          activity — last 365 days
        </div>
        <div style={{
          border: '1px solid var(--border)',
          padding: '16px',
          background: 'var(--bg-surface)',
        }}>
          <ActivityBoard activity={stats.activity} />
        </div>
        <PixelBorder />
      </div>

      {/* On This Day */}
      {onThisDay.length > 0 && (
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
            <PixelScroll size={12} color="var(--accent-secondary)" />
            on this day
          </div>
          {onThisDay.map(period => (
            <div key={period.label} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--accent-secondary)',
                marginBottom: 6,
                fontWeight: 600,
              }}>
                {period.label} — {period.date}
              </div>
              {period.entries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/${entry.category}/${entry.id}`)}
                  style={{
                    padding: '6px 0 6px 12px',
                    borderLeft: '2px solid var(--border)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderLeftColor = 'var(--accent-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'var(--border)'; }}
                >
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginRight: 8, textTransform: 'uppercase' }}>
                    {entry.type}
                  </span>
                  {entry.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Two columns: tags + collections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Tags */}
        <div>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            top tags
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats.topTags.map((tag, i) => (
              <div key={tag.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
              }}>
                <span style={{ color: 'var(--text-muted)', width: 16, textAlign: 'right', fontSize: '10px' }}>{i + 1}</span>
                <span style={{ color: 'var(--accent-primary)', flex: 1 }}>
                  <span style={{ opacity: 0.5 }}>#</span>{tag.name}
                </span>
                <BarInline value={tag.count} max={stats.topTags[0]?.count || 1} />
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', width: 24, textAlign: 'right' }}>{tag.count}</span>
              </div>
            ))}
            {stats.topTags.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                <PixelGhost size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>no tags yet — ghosts in the machine</span>
              </div>
            )}
          </div>
        </div>

        {/* Collections */}
        <div>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            collections
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats.topCollections.map((coll, i) => (
              <div key={coll.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
              }}>
                <span style={{ color: 'var(--text-muted)', width: 16, textAlign: 'right', fontSize: '10px' }}>{i + 1}</span>
                <span style={{ color: 'var(--accent-secondary)', flex: 1 }}>{coll.name}</span>
                <BarInline value={coll.count} max={stats.topCollections[0]?.count || 1} color="var(--accent-secondary)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', width: 24, textAlign: 'right' }}>{coll.count}</span>
              </div>
            ))}
            {stats.topCollections.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                <PixelGhost size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>no collections yet — nothing to see here</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div style={{
        display: 'flex',
        gap: 24,
        padding: '12px 0',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        <span><span style={{ color: 'var(--accent-primary)' }}>{stats.totalJournal}</span> journal</span>
        <span><span style={{ color: 'var(--accent-secondary)' }}>{stats.totalNotes}</span> notes</span>
        <span><span style={{ color: 'var(--accent-tertiary)' }}>{stats.thisMonth}</span> this month</span>
      </div>
    </div>
  );
}

function StatCell({ label, value, suffix, accent, icon }: {
  label: string;
  value: number;
  suffix?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--bg-surface)',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
        {icon}
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '24px',
          fontWeight: 700,
          color: accent || 'var(--text-primary)',
          letterSpacing: '-0.03em',
        }}>
          {value}{suffix}
        </span>
      </div>
      <div style={{
        fontSize: '9px',
        color: 'var(--text-muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

function KeeperCell({ label, value, icon, accent, onClick }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        background: 'var(--bg-surface)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
    >
      {icon}
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '16px',
        fontWeight: 700,
        color: value > 0 ? accent : 'var(--text-muted)',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '9px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

function BarInline({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{
      width: 60,
      height: 4,
      background: 'var(--border)',
      position: 'relative',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: color || 'var(--accent-primary)',
        imageRendering: 'pixelated',
      }} />
    </div>
  );
}
