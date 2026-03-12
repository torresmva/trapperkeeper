import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api/client';
import { TKPromise } from '../../types';
import { PixelHeart, PixelBorder, PixelGhost, PixelShield, PixelSkull } from '../shared/PixelArt';

type DirectionFilter = 'all' | 'i-owe' | 'they-owe';
type StatusFilter = 'open' | 'kept' | 'broken';

const DIRECTION_COLORS: Record<string, string> = {
  'i-owe': 'var(--accent-secondary)',
  'they-owe': 'var(--accent-primary)',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <PixelHeart size={12} color="var(--accent-secondary)" />,
  kept: <PixelShield size={12} color="var(--accent-green)" />,
  broken: <PixelSkull size={12} color="var(--accent-tertiary)" />,
};

const FLAVOR = [
  "a lannister always pays their debts",
  "pinky swear protocol v2.0",
  "we will keep these promises — what else can we do?",
  "you are the smell before rain. don't let them down.",
  "trust, but verify. then write it down.",
  "i will follow you into the dark (of accountability)",
  "the quiet things that someone definitely needs to know",
  "not all promises are created equal",
];

function isOverdue(due?: string): boolean {
  if (!due) return false;
  return new Date(due) < new Date(new Date().toISOString().split('T')[0]);
}

function daysUntil(due: string): number {
  const now = new Date(new Date().toISOString().split('T')[0]);
  const d = new Date(due);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function PromisesPage() {
  const [promises, setPromises] = useState<TKPromise[]>([]);
  const [dirFilter, setDirFilter] = useState<DirectionFilter>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newWho, setNewWho] = useState('');
  const [newDirection, setNewDirection] = useState<'i-owe' | 'they-owe'>('i-owe');
  const [newDue, setNewDue] = useState('');
  const [newContext, setNewContext] = useState('');

  const flavor = useMemo(() => FLAVOR[Math.floor(Math.random() * FLAVOR.length)], []);

  const loadPromises = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (dirFilter !== 'all') params.direction = dirFilter;
      const data = await api.listPromises(params);
      setPromises(data);
    } finally {
      setLoading(false);
    }
  }, [dirFilter]);

  useEffect(() => { loadPromises(); }, [loadPromises]);

  const handleAdd = async () => {
    if (!newDesc.trim()) return;
    await api.createPromise({
      description: newDesc.trim(),
      who: newWho.trim(),
      direction: newDirection,
      due: newDue || undefined,
      context: newContext.trim() || undefined,
    });
    setNewDesc(''); setNewWho(''); setNewDue(''); setNewContext('');
    setShowAdd(false);
    loadPromises();
  };

  const handleKeep = async (id: string) => {
    await api.keepPromise(id);
    loadPromises();
  };

  const handleBreak = async (id: string) => {
    await api.breakPromise(id);
    loadPromises();
  };

  const handleReopen = async (id: string) => {
    await api.reopenPromise(id);
    loadPromises();
  };

  const handleDelete = async (id: string) => {
    await api.deletePromise(id);
    loadPromises();
  };

  const open = promises.filter(p => p.status === 'open');
  const resolved = promises.filter(p => p.status !== 'open');
  const displayed = showResolved ? promises : open;

  const iOweOpen = open.filter(p => p.direction === 'i-owe').length;
  const theyOweOpen = open.filter(p => p.direction === 'they-owe').length;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelHeart size={20} color="var(--accent-secondary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            promises
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

      {/* Score summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        marginBottom: 24,
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          padding: '14px 16px',
          background: 'var(--bg-surface)',
          borderLeft: '2px solid var(--accent-secondary)',
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--accent-secondary)',
          }}>
            {iOweOpen}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            i owe
          </div>
        </div>
        <div style={{
          padding: '14px 16px',
          background: 'var(--bg-surface)',
          borderLeft: '2px solid var(--accent-primary)',
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--accent-primary)',
          }}>
            {theyOweOpen}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            they owe
          </div>
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
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="what was promised?"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                value={newWho}
                onChange={e => setNewWho(e.target.value)}
                placeholder="who?"
                style={{ ...inputStyle, flex: 1 }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setNewDirection('i-owe')}
                  style={{
                    background: 'transparent',
                    border: newDirection === 'i-owe' ? '1px solid var(--accent-secondary)' : '1px solid var(--border)',
                    color: newDirection === 'i-owe' ? 'var(--accent-secondary)' : 'var(--text-muted)',
                    fontSize: 10,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  i owe
                </button>
                <button
                  onClick={() => setNewDirection('they-owe')}
                  style={{
                    background: 'transparent',
                    border: newDirection === 'they-owe' ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                    color: newDirection === 'they-owe' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontSize: 10,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  they owe
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="date"
                value={newDue}
                onChange={e => setNewDue(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="due date (optional)"
              />
              <input
                value={newContext}
                onChange={e => setNewContext(e.target.value)}
                placeholder="context (e.g., from 1:1 on march 10)"
                style={{ ...inputStyle, flex: 2 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={cancelBtn}>cancel</button>
              <button onClick={handleAdd} disabled={!newDesc.trim()} style={submitBtn}>
                save promise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direction filter + resolved toggle */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 20,
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
      }}>
        {(['all', 'i-owe', 'they-owe'] as DirectionFilter[]).map(d => (
          <button
            key={d}
            onClick={() => setDirFilter(d)}
            style={{
              background: 'transparent',
              color: dirFilter === d
                ? (d === 'all' ? 'var(--accent-primary)' : DIRECTION_COLORS[d])
                : 'var(--text-muted)',
              border: 'none',
              borderBottom: dirFilter === d
                ? `2px solid ${d === 'all' ? 'var(--accent-primary)' : DIRECTION_COLORS[d]}`
                : '2px solid transparent',
              fontSize: 11,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: -1,
            }}
          >
            {d === 'all' ? 'all' : d.replace('-', ' ')}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowResolved(!showResolved)}
          style={{
            background: 'transparent',
            border: 'none',
            color: showResolved ? 'var(--accent-tertiary)' : 'var(--text-muted)',
            fontSize: 10,
            cursor: 'pointer',
            padding: '8px 10px',
            marginBottom: -1,
            borderBottom: showResolved ? '2px solid var(--accent-tertiary)' : '2px solid transparent',
          }}
        >
          {showResolved ? 'hide resolved' : `show resolved (${resolved.length})`}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
            checking the ledger...
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
          <PixelShield size={24} color="var(--accent-green)" />
          <p style={{ fontSize: '13px', marginTop: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            all clear — no open promises
          </p>
          <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic' }}>
            a clean ledger is a peaceful mind.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {displayed.map(promise => {
            const overdue = promise.status === 'open' && isOverdue(promise.due);
            const days = promise.due ? daysUntil(promise.due) : null;
            const isResolved = promise.status !== 'open';

            return (
              <div
                key={promise.id}
                style={{
                  padding: '12px 0 12px 16px',
                  borderLeft: `2px solid ${
                    isResolved
                      ? (promise.status === 'kept' ? 'var(--accent-green)' : 'var(--accent-tertiary)')
                      : DIRECTION_COLORS[promise.direction]
                  }`,
                  borderBottom: '1px solid var(--border)',
                  animation: 'fadeIn 0.2s ease',
                  opacity: isResolved ? 0.6 : 1,
                }}
              >
                {/* Direction + who */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {STATUS_ICONS[promise.status]}
                  <span style={{
                    fontSize: '9px',
                    color: DIRECTION_COLORS[promise.direction],
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}>
                    {promise.direction.replace('-', ' ')}
                  </span>
                  {promise.who && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {promise.direction === 'i-owe' ? `→ ${promise.who}` : `← ${promise.who}`}
                    </span>
                  )}
                  {promise.due && (
                    <span style={{
                      fontSize: '10px',
                      color: overdue ? 'var(--accent-tertiary)' : days !== null && days <= 2 ? 'var(--accent-tertiary)' : 'var(--text-muted)',
                      marginLeft: 'auto',
                    }}>
                      {overdue ? `overdue ${promise.due}` :
                       days === 0 ? 'due today' :
                       days === 1 ? 'due tomorrow' :
                       `due ${promise.due}`}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isResolved ? 'var(--text-muted)' : 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  textDecoration: promise.status === 'broken' ? 'line-through' : 'none',
                }}>
                  {promise.description}
                </div>

                {/* Context */}
                {promise.context && (
                  <p style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: 4,
                    fontStyle: 'italic',
                  }}>
                    {promise.context}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {promise.status === 'open' && (
                    <>
                      <button onClick={() => handleKeep(promise.id)} style={{ ...actionBtn, color: 'var(--accent-green)' }}>
                        kept
                      </button>
                      <button onClick={() => handleBreak(promise.id)} style={{ ...actionBtn, color: 'var(--accent-tertiary)' }}>
                        broken
                      </button>
                    </>
                  )}
                  {isResolved && (
                    <button onClick={() => handleReopen(promise.id)} style={actionBtn}>
                      reopen
                    </button>
                  )}
                  <button onClick={() => handleDelete(promise.id)} style={{ ...actionBtn, opacity: 0.4 }}>
                    del
                  </button>
                </div>
              </div>
            );
          })}
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
