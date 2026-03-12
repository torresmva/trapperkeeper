import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { PixelUpload } from './PixelArt';

const SYNC_QUOTES = [
  'i am not your friend, i am just a messenger',
  'we are not your friends, we are just your backup',
  'the repo remembers what you forget',
  'git push origin main — the sequel is never quite as good',
  'saving your progress...',
  'another day, another commit',
  'your changes are safe with us',
];

interface GitStatus {
  initialized: boolean;
  branch: string | null;
  changes: number;
  hasRemote: boolean;
  ahead: number;
  lastCommit: { hash: string; date: string; message: string } | null;
  dirty: boolean;
}

export function GitSync() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(() => {
    api.gitStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await api.gitSync();
      setResult(res.message);
      refresh();
    } catch (err: any) {
      setResult('sync failed — check console');
    } finally {
      setSyncing(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  if (!status?.initialized) return null;

  const quote = SYNC_QUOTES[Math.floor(Math.random() * SYNC_QUOTES.length)];
  const hasPendingWork = status.dirty || status.ahead > 0;

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '10px 16px',
    }}>
      {/* Sync button row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <PixelUpload
          size={14}
          color={hasPendingWork ? 'var(--accent-green)' : 'var(--text-muted)'}
        />
        <span style={{
          fontSize: '11px',
          color: hasPendingWork ? 'var(--accent-green)' : 'var(--text-muted)',
          flex: 1,
        }}>
          {status.dirty
            ? `${status.changes} unsaved`
            : status.ahead > 0
              ? `${status.ahead} unpushed`
              : 'synced'}
        </span>
        {status.branch && (
          <span style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            opacity: 0.6,
          }}>
            {status.branch}
          </span>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px dashed var(--border)',
          animation: 'fadeIn 0.15s ease',
        }}>
          {/* Status details */}
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginBottom: 8,
            lineHeight: 1.6,
          }}>
            {status.lastCommit && (
              <div>
                <span style={{ opacity: 0.5 }}>last:</span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {status.lastCommit.message}
                </span>
              </div>
            )}
            {!status.hasRemote && (
              <div style={{ color: 'var(--accent-tertiary)', marginTop: 4 }}>
                no remote configured — commits stay local
              </div>
            )}
          </div>

          {/* Sync button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleSync(); }}
            disabled={syncing || (!status.dirty && status.ahead === 0)}
            style={{
              width: '100%',
              padding: '6px 0',
              fontSize: '10px',
              letterSpacing: '0.06em',
              color: syncing
                ? 'var(--text-muted)'
                : hasPendingWork
                  ? 'var(--accent-green)'
                  : 'var(--text-muted)',
              border: `1px solid ${hasPendingWork ? 'var(--accent-green)' : 'var(--border)'}`,
              background: 'transparent',
              cursor: syncing || !hasPendingWork ? 'default' : 'pointer',
              opacity: syncing || !hasPendingWork ? 0.5 : 1,
              textTransform: 'lowercase',
            }}
          >
            {syncing ? 'syncing...' : 'git sync'}
          </button>

          {/* Result message */}
          {result && (
            <div style={{
              fontSize: '10px',
              color: result.includes('fail') ? 'var(--accent-tertiary)' : 'var(--accent-green)',
              marginTop: 6,
              animation: 'fadeIn 0.2s ease',
            }}>
              {result}
            </div>
          )}

          {/* Flavor quote */}
          <div style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            opacity: 0.4,
            marginTop: 8,
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}>
            {quote}
          </div>
        </div>
      )}
    </div>
  );
}
