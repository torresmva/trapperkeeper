import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/client';
import { Stats } from '../../types';
import { ActivityBoard } from './ActivityBoard';
import { PixelTrophy, PixelFire, PixelBorder, PixelSword, PixelCoffee, PixelGhost } from '../shared/PixelArt';

const GREETINGS = [
  'it\'s dangerous to go alone. take this.',
  'the cake is a lie, but your impact is real.',
  'all your base are belong to you.',
  'wake up, neo. you have entries to write.',
  'do a barrel roll through your backlog.',
  'the princess is in another sprint.',
  'you have died of meeting overload.',
  'a winner is you.',
  'war. war never changes. but your code does.',
  'press start to continue.',
  'player one ready.',
  'loading personality module...',
  'sudo make me productive',
  'rm -rf /procrastination',
  'git commit -m "shipped it"',
  '// TODO: conquer the world',
  'another day, another deploy.',
  'segfault in meeting.exe \u2014 core dumped.',
  'your quest log has been updated.',
  'level up! +1 to documentation.',
];

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);

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
