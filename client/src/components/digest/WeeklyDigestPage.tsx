import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DigestDay {
  date: string;
  entries: { title: string; type: string; id: string; category: string }[];
}

interface Digest {
  period: { start: string; end: string };
  totalEntries: number;
  days: DigestDay[];
}

const TYPE_COLORS: Record<string, string> = {
  daily: 'var(--accent-primary)',
  weekly: 'var(--accent-secondary)',
  monthly: 'var(--accent-tertiary)',
  note: 'var(--text-secondary)',
  meeting: 'var(--accent-green)',
  incident: 'var(--danger)',
  decision: 'var(--accent-primary)',
  '1on1': 'var(--accent-secondary)',
  'project-update': 'var(--accent-tertiary)',
};

export function WeeklyDigestPage() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/digest/weekly').then(r => r.json()).then(setDigest);
  }, []);

  if (!digest) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40 }}>
      <span style={{ fontSize: '16px', imageRendering: 'pixelated' as any }}>&#9632;</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>brewing your weekly digest...</span>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          weekly digest
        </h1>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {digest.period.start} → {digest.period.end} · {digest.totalEntries} entries
        </div>
      </div>

      {digest.days.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          quiet week — no entries recorded
        </div>
      ) : (
        digest.days.map(day => (
          <div key={day.date} style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            {day.entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => navigate(`/${entry.category}/${entry.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  marginBottom: 2,
                  cursor: 'pointer',
                  borderLeft: `2px solid ${TYPE_COLORS[entry.type] || 'var(--border)'}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: TYPE_COLORS[entry.type] || 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  minWidth: 80,
                  letterSpacing: '0.5px',
                }}>
                  {entry.type}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {entry.title}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
