import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api/client';
import { Receipt } from '../../types';
import { PixelTrophy, PixelBorder, PixelGhost, PixelStar } from '../shared/PixelArt';
import { TagBadge } from '../shared/TagBadge';

type StatusFilter = 'all' | 'delivered' | 'pending' | 'acknowledged';

const STATUS_COLORS: Record<string, string> = {
  delivered: 'var(--accent-green)',
  pending: 'var(--accent-tertiary)',
  acknowledged: 'var(--accent-primary)',
};

const FLAVOR = [
  "keeping score since day one",
  "the receipts don't lie",
  "i brought the receipts — and they're itemized",
  "proof of work, not proof of stake",
  "a lannister always keeps their receipts",
  "you did that. we wrote it down.",
  "in god we trust. everyone else, show receipts.",
];

export function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWhat, setNewWhat] = useState('');
  const [newWho, setNewWho] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newStatus, setNewStatus] = useState<Receipt['status']>('delivered');

  const flavor = useMemo(() => FLAVOR[Math.floor(Math.random() * FLAVOR.length)], []);

  const loadReceipts = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      const data = await api.listReceipts(params);
      setReceipts(data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadReceipts(); }, [loadReceipts]);

  const handleAdd = async () => {
    if (!newWhat.trim()) return;
    await api.createReceipt({
      what: newWhat.trim(),
      who: newWho.trim(),
      outcome: newOutcome.trim() || undefined,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      status: newStatus,
    });
    setNewWhat(''); setNewWho(''); setNewOutcome(''); setNewTags('');
    setShowAdd(false);
    loadReceipts();
  };

  const handleDelete = async (id: string) => {
    await api.deleteReceipt(id);
    loadReceipts();
  };

  const handleStatusChange = async (id: string, status: Receipt['status']) => {
    await api.updateReceipt(id, { status });
    loadReceipts();
  };

  const counts = {
    all: receipts.length,
    delivered: receipts.filter(r => r.status === 'delivered').length,
    pending: receipts.filter(r => r.status === 'pending').length,
    acknowledged: receipts.filter(r => r.status === 'acknowledged').length,
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
          <PixelTrophy size={20} color="var(--accent-tertiary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            receipts
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
              value={newWhat}
              onChange={e => setNewWhat(e.target.value)}
              placeholder="what did you deliver?"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                value={newWho}
                onChange={e => setNewWho(e.target.value)}
                placeholder="for whom?"
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as Receipt['status'])}
                style={{
                  ...inputStyle,
                  width: 120,
                  color: STATUS_COLORS[newStatus],
                  cursor: 'pointer',
                }}
              >
                <option value="delivered">delivered</option>
                <option value="pending">pending</option>
                <option value="acknowledged">acknowledged</option>
              </select>
            </div>
            <input
              value={newOutcome}
              onChange={e => setNewOutcome(e.target.value)}
              placeholder="outcome / impact (optional)"
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
              <button onClick={handleAdd} disabled={!newWhat.trim()} style={submitBtn}>
                save receipt
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
        {(['all', 'delivered', 'pending', 'acknowledged'] as StatusFilter[]).map(s => (
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
            checking the vault...
          </p>
        </div>
      ) : receipts.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
          <PixelStar size={24} color="var(--accent-primary)" />
          <p style={{ fontSize: '13px', marginTop: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            no receipts yet
          </p>
          <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic' }}>
            you've done things. you should write them down.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {receipts.map(receipt => (
            <div
              key={receipt.id}
              style={{
                padding: '14px 0 14px 16px',
                borderLeft: `2px solid ${STATUS_COLORS[receipt.status]}`,
                borderBottom: '1px solid var(--border)',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {receipt.date}
                </span>
                <span style={{
                  fontSize: '9px',
                  color: STATUS_COLORS[receipt.status],
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  {receipt.status}
                </span>
                {receipt.who && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    → {receipt.who}
                  </span>
                )}
              </div>

              {/* What */}
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: receipt.outcome ? 4 : 0,
              }}>
                {receipt.what}
              </div>

              {/* Outcome */}
              {receipt.outcome && (
                <p style={{
                  fontSize: '12px',
                  color: 'var(--accent-green)',
                  marginBottom: 6,
                }}>
                  ↳ {receipt.outcome}
                </p>
              )}

              {/* Tags + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {receipt.tags.map(tag => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                <div style={{ flex: 1 }} />
                <select
                  value={receipt.status}
                  onChange={e => handleStatusChange(receipt.id, e.target.value as Receipt['status'])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <option value="pending">pending</option>
                  <option value="delivered">delivered</option>
                  <option value="acknowledged">acknowledged</option>
                </select>
                <button
                  onClick={() => handleDelete(receipt.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    opacity: 0.5,
                  }}
                >
                  del
                </button>
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
