import { useState, useEffect, useCallback } from 'react';
import { useUpdate } from '../../hooks/useUpdate';
import { api } from '../../api/client';

// ═══════════════════════════════════════════════════════════════════
// Sidebar badge — opens the sys modal
// ═══════════════════════════════════════════════════════════════════

export function UpdateBadge() {
  const { version, status, checkForUpdate } = useUpdate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (version?.updateConfigured) checkForUpdate();
  }, [version?.updateConfigured]);

  const dotColor = STATUS_COLORS[status];

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 16px',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid var(--border)',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6,
            background: dotColor,
            display: 'inline-block',
            animation: PULSING_STATES.includes(status) ? 'tk-pulse 1s infinite' : 'none',
          }} />
          <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>sys</span>
        </span>
        <span style={{ color: dotColor, fontSize: '9px' }}>
          {version?.version || '...'}
        </span>
      </button>

      {modalOpen && <SysModal onClose={() => setModalOpen(false)} />}

      <style>{`
        @keyframes tk-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sys modal — tabbed: about | updates | data backup
// ═══════════════════════════════════════════════════════════════════

type Tab = 'about' | 'updates' | 'backup';

const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'about' },
  { key: 'updates', label: 'updates' },
  { key: 'backup', label: 'data backup' },
];

function SysModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('about');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          width: 460,
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              letterSpacing: '-0.04em',
            }}>
              trapperkeeper
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: 4,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              personal knowledge system
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          padding: '16px 24px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
                padding: '8px 14px',
                cursor: 'pointer',
                textTransform: 'lowercase',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {tab === 'about' && <AboutTab />}
          {tab === 'updates' && <UpdatesTab />}
          {tab === 'backup' && <BackupTab />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab: About
// ═══════════════════════════════════════════════════════════════════

function AboutTab() {
  const { version, config, fetchConfig } = useUpdate();

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      {/* Build info */}
      <SectionLabel>build</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <Row label="version" value={version?.version || '—'} mono />
        <Row label="commit" value={version?.commit?.slice(0, 8) || '—'} mono />
        <Row label="branch" value={version?.branch || '—'} mono />
        {version?.buildDate && <Row label="built" value={formatDate(version.buildDate)} />}
        <Row label="provider" value={version?.provider || '—'} />
      </div>

      {/* System */}
      <div style={{ marginTop: 20 }}>
        <SectionLabel>system</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <Row
            label="docker socket"
            value={config?.dockerSocket ? 'connected' : 'not mounted'}
            valueColor={config?.dockerSocket ? 'var(--accent-green)' : 'var(--text-muted)'}
          />
          <Row
            label="docker cli"
            value={config?.dockerCLI ? 'available' : 'not found'}
            valueColor={config?.dockerCLI ? 'var(--accent-green)' : 'var(--text-muted)'}
          />
          {config?.repo && <Row label="repo" value={config.repo} mono />}
          {config?.image && <Row label="image" value={config.image} mono />}
          <Row label="compose" value={config?.composePath || '—'} mono />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab: Updates
// ═══════════════════════════════════════════════════════════════════

function UpdatesTab() {
  const {
    version, check, status, error, pullMessage,
    checkForUpdate, applyUpdate,
  } = useUpdate();

  useEffect(() => {
    if (version?.updateConfigured && !check) checkForUpdate();
  }, [version?.updateConfigured]);

  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      {/* Status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <SectionLabel>status</SectionLabel>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '9px', color: statusColor }}>
          <span style={{
            width: 6, height: 6,
            background: statusColor,
            display: 'inline-block',
            animation: PULSING_STATES.includes(status) ? 'tk-pulse 1s infinite' : 'none',
          }} />
          {statusLabel}
        </span>
      </div>

      {/* Current version */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        <Row label="current" value={version?.version || '—'} mono />
        {check && <Row label="latest" value={check.latest} mono valueColor={check.updateAvailable ? 'var(--accent-orange)' : 'var(--accent-green)'} />}
      </div>

      {/* Update available details */}
      {check?.updateAvailable && (
        <div style={{
          marginTop: 14,
          borderLeft: '2px solid var(--accent-orange)',
          paddingLeft: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {check.releaseDate && <Row label="released" value={formatDate(check.releaseDate)} />}
          {check.changelog && (
            <div style={{
              color: 'var(--text-muted)',
              fontSize: '10px',
              lineHeight: '1.5',
              maxHeight: 100,
              overflow: 'auto',
              marginTop: 4,
              whiteSpace: 'pre-wrap',
            }}>
              {check.changelog.slice(0, 500)}
              {check.changelog.length > 500 && '...'}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 12,
          color: 'var(--accent-pink)',
          fontSize: '10px',
          borderLeft: '2px solid var(--accent-pink)',
          paddingLeft: 12,
          lineHeight: '1.4',
        }}>
          {error}
        </div>
      )}

      {/* Manual command */}
      {pullMessage && (
        <div
          style={{
            marginTop: 12,
            background: 'rgba(255,255,255,0.03)',
            padding: '8px 12px',
            fontSize: '10px',
            color: 'var(--text-muted)',
            borderLeft: '2px solid var(--border)',
            cursor: 'pointer',
          }}
          onClick={() => navigator.clipboard.writeText(pullMessage)}
          title="click to copy"
        >
          <span style={{ opacity: 0.5 }}>$ </span>{pullMessage}
        </div>
      )}

      {/* Unconfigured hint */}
      {status === 'unconfigured' && (
        <div style={{
          marginTop: 12,
          color: 'var(--text-muted)',
          fontSize: '10px',
          lineHeight: '1.6',
          borderLeft: '2px solid var(--border)',
          paddingLeft: 12,
        }}>
          set environment variables to enable auto-updates:<br />
          <span style={{ color: 'var(--text-secondary)' }}>TK_UPDATE_REPO</span> — gitlab/github repo path<br />
          <span style={{ color: 'var(--text-secondary)' }}>TK_UPDATE_IMAGE</span> — docker registry image
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <ActionButton
          onClick={checkForUpdate}
          disabled={status === 'checking' || status === 'pulling' || status === 'restarting'}
          label={status === 'checking' ? 'checking...' : 'check for updates'}
        />
        {check?.updateAvailable && (
          <ActionButton
            onClick={() => applyUpdate(check.latestTag)}
            disabled={status === 'pulling' || status === 'restarting'}
            label={status === 'pulling' ? 'pulling...' : status === 'restarting' ? 'restarting...' : 'apply update'}
            accent
          />
        )}
      </div>

      {/* Restarting overlay */}
      {status === 'restarting' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5,5,5,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <div style={{
            color: 'var(--accent-primary)',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            animation: 'tk-pulse 1s infinite',
          }}>
            restarting...
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            page will reload when ready
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab: Data Backup (git sync)
// ═══════════════════════════════════════════════════════════════════

interface GitStatus {
  initialized: boolean;
  branch: string | null;
  changes: number;
  hasRemote: boolean;
  ahead: number;
  lastCommit: { hash: string; date: string; message: string } | null;
  dirty: boolean;
}

function BackupTab() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    api.gitStatus()
      .then(s => { setStatus(s); setLoading(false); })
      .catch(() => { setStatus(null); setLoading(false); });
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await api.gitSync();
      setResult(res.message);
      refresh();
    } catch {
      setResult('sync failed — check server logs');
    } finally {
      setSyncing(false);
      setTimeout(() => setResult(null), 8000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px 24px 20px', color: 'var(--text-muted)', fontSize: '10px' }}>
        checking git status...
      </div>
    );
  }

  const hasPending = status?.dirty || (status?.ahead ?? 0) > 0;
  const statusColor = !status?.initialized
    ? 'var(--text-muted)'
    : hasPending
      ? 'var(--accent-orange)'
      : 'var(--accent-green)';
  const statusLabel = !status?.initialized
    ? 'not initialized'
    : status.dirty
      ? `${status.changes} uncommitted change${status.changes !== 1 ? 's' : ''}`
      : status.ahead > 0
        ? `${status.ahead} unpushed commit${status.ahead !== 1 ? 's' : ''}`
        : 'synced';

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <SectionLabel>data repository</SectionLabel>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '9px', color: statusColor }}>
          <span style={{
            width: 6, height: 6,
            background: statusColor,
            display: 'inline-block',
          }} />
          {statusLabel}
        </span>
      </div>

      {/* Not initialized */}
      {!status?.initialized && (
        <div style={{
          marginTop: 12,
          color: 'var(--text-muted)',
          fontSize: '10px',
          lineHeight: '1.6',
          borderLeft: '2px solid var(--border)',
          paddingLeft: 12,
        }}>
          the data directory is not a git repository.<br /><br />
          to enable backups, initialize git in your data volume:<br />
          <Code>cd /opt/trapperkeeper-data</Code>
          <Code>git init</Code>
          <Code>git remote add origin {'<your-repo-url>'}</Code>
        </div>
      )}

      {/* Initialized — show details */}
      {status?.initialized && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            <Row label="branch" value={status.branch || '—'} mono />
            <Row
              label="remote"
              value={status.hasRemote ? 'configured' : 'none'}
              valueColor={status.hasRemote ? 'var(--accent-green)' : 'var(--accent-orange)'}
            />
            <Row label="uncommitted" value={String(status.changes)} mono />
            <Row label="unpushed" value={String(status.ahead)} mono />
          </div>

          {/* Last commit */}
          {status.lastCommit && (
            <div style={{ marginTop: 14 }}>
              <SectionLabel>last commit</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                <Row label="hash" value={status.lastCommit.hash.slice(0, 8)} mono />
                <Row label="date" value={formatDate(status.lastCommit.date)} />
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  marginTop: 2,
                  lineHeight: '1.4',
                }}>
                  {status.lastCommit.message}
                </div>
              </div>
            </div>
          )}

          {/* No remote warning */}
          {!status.hasRemote && (
            <div style={{
              marginTop: 14,
              color: 'var(--accent-orange)',
              fontSize: '10px',
              lineHeight: '1.6',
              borderLeft: '2px solid var(--accent-orange)',
              paddingLeft: 12,
            }}>
              no remote configured — commits stay local only.<br />
              <Code>git remote add origin {'<your-repo-url>'}</Code>
            </div>
          )}

          {/* Sync button */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleSync}
              disabled={syncing || !hasPending}
              style={{
                background: 'transparent',
                border: `1px solid ${hasPending ? 'var(--accent-green)' : 'var(--border)'}`,
                color: hasPending ? 'var(--accent-green)' : 'var(--text-muted)',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
                padding: '6px 16px',
                cursor: syncing || !hasPending ? 'default' : 'pointer',
                opacity: syncing || !hasPending ? 0.5 : 1,
                textTransform: 'lowercase',
              }}
            >
              {syncing ? 'syncing...' : 'sync now'}
            </button>
            <ActionButton onClick={refresh} label="refresh" />
          </div>

          {/* Result */}
          {result && (
            <div style={{
              marginTop: 10,
              fontSize: '10px',
              color: result.includes('fail') ? 'var(--accent-pink)' : 'var(--accent-green)',
              borderLeft: `2px solid ${result.includes('fail') ? 'var(--accent-pink)' : 'var(--accent-green)'}`,
              paddingLeft: 12,
            }}>
              {result}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Shared bits
// ═══════════════════════════════════════════════════════════════════

const PULSING_STATES = ['checking', 'pulling', 'restarting'];

const STATUS_COLORS: Record<string, string> = {
  idle: 'var(--text-muted)',
  checking: 'var(--accent-primary)',
  available: 'var(--accent-orange)',
  pulling: 'var(--accent-primary)',
  restarting: 'var(--accent-primary)',
  'up-to-date': 'var(--accent-green)',
  error: 'var(--accent-pink)',
  unconfigured: 'var(--text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'idle',
  checking: 'checking...',
  available: 'update available',
  pulling: 'pulling image...',
  restarting: 'restarting...',
  'up-to-date': 'up to date',
  error: 'error',
  unconfigured: 'not configured',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '9px',
      color: 'var(--text-muted)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}

function Row({ label, value, valueColor, mono }: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</span>
      <span style={{
        color: valueColor || 'var(--text-secondary)',
        fontSize: '10px',
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
        maxWidth: 240,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        direction: 'rtl',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

function ActionButton({ onClick, disabled, label, accent }: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: `1px solid ${accent ? 'var(--accent-orange)' : 'var(--text-muted)'}`,
        color: accent ? 'var(--accent-orange)' : 'var(--text-secondary)',
        fontSize: '10px',
        cursor: disabled ? 'default' : 'pointer',
        padding: '2px 0',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        padding: '4px 8px',
        marginTop: 4,
        fontSize: '10px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        borderLeft: '2px solid var(--border)',
      }}
      onClick={() => {
        const text = typeof children === 'string' ? children : '';
        if (text) navigator.clipboard.writeText(text);
      }}
      title="click to copy"
    >
      <span style={{ opacity: 0.4 }}>$ </span>{children}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
