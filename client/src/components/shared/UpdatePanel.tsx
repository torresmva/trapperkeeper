import { useState, useEffect, useCallback } from 'react';
import { useUpdate, UpdateStatus } from '../../hooks/useUpdate';
import { api } from '../../api/client';

// ═══════════════════════════════════════════════════════════════════
// Sidebar badge — opens the sys modal
// ═══════════════════════════════════════════════════════════════════

// 8-bit character that pops out to nudge you to update
function PixelNudge({ onClick }: { onClick: () => void }) {
  // Little 8-bit adventurer (Link-style)
  const grid = [
    '..##..',
    '.#..#.',
    '.####.',
    '..##..',
    '.####.',
    '#.##.#',
    '..##..',
    '.#..#.',
  ];
  const px = 2;
  const size = grid[0].length * px;
  const height = grid.length * px;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 16,
        marginBottom: 4,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        cursor: 'pointer',
        animation: 'tk-nudge-enter 0.4s ease forwards',
      }}
    >
      <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`} style={{ imageRendering: 'pixelated' }}>
        {grid.map((row, y) =>
          row.split('').map((cell, x) =>
            cell === '#' ? (
              <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px}
                fill={y < 3 ? '#4ade80' : y < 5 ? '#22d3ee' : '#fb923c'} />
            ) : null
          )
        )}
      </svg>
      <span style={{
        fontSize: '8px',
        color: 'var(--accent-tertiary)',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        padding: '2px 6px',
        marginBottom: 2,
      }}>
        update available!
      </span>
    </div>
  );
}

export function UpdateBadge() {
  const { version, status, checkForUpdate } = useUpdate();
  const [modalOpen, setModalOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    if (version?.updateConfigured) checkForUpdate();
  }, [version?.updateConfigured]);

  // Show the nudge character periodically when update is available
  useEffect(() => {
    if (status !== 'available' || nudgeDismissed) {
      setShowNudge(false);
      return;
    }
    // Show after 5s, then every 2 minutes
    const initial = setTimeout(() => setShowNudge(true), 5000);
    const interval = setInterval(() => {
      setShowNudge(true);
      // Auto-hide after 8s
      setTimeout(() => setShowNudge(false), 8000);
    }, 120000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [status, nudgeDismissed]);

  const dotColor = STATUS_COLORS[status] || 'var(--text-muted)';
  const isUpdateAvailable = status === 'available';
  const isError = status === 'error' || status === 'restart-failed' || status === 'restart-timeout';

  return (
    <>
      <div style={{ position: 'relative' }}>
        {showNudge && !modalOpen && (
          <PixelNudge onClick={() => {
            setShowNudge(false);
            setNudgeDismissed(true);
            setModalOpen(true);
          }} />
        )}
        <button
          onClick={() => {
            setModalOpen(true);
            setShowNudge(false);
          }}
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
            color: isUpdateAvailable ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6,
              background: dotColor,
              display: 'inline-block',
              animation: PULSING_STATES.includes(status) ? 'tk-pulse 1s infinite'
                : isUpdateAvailable ? 'tk-pulse-slow 2s infinite' : 'none',
            }} />
            <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isUpdateAvailable ? 'update' : 'sys'}
            </span>
          </span>
          <span style={{ color: dotColor, fontSize: '9px' }}>
            {version?.version || '...'}
          </span>
        </button>
      </div>

      {modalOpen && <SysModal onClose={() => setModalOpen(false)} />}

      <style>{`
        @keyframes tk-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes tk-pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes tk-nudge-enter {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sys modal — tabbed: about | updates | data backup
// ═══════════════════════════════════════════════════════════════════

type Tab = 'about' | 'updates' | 'shortcuts' | 'slogans' | 'backup';

const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'about' },
  { key: 'updates', label: 'updates' },
  { key: 'shortcuts', label: 'keys' },
  { key: 'slogans', label: 'slogans' },
  { key: 'backup', label: 'backup' },
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
          {tab === 'shortcuts' && <ShortcutsTab />}
          {tab === 'slogans' && <SlogansTab />}
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
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
    api.getStats().then(setStats).catch(() => {});
  }, [fetchConfig]);

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      <SectionLabel>build</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <Row label="version" value={version?.version || '—'} mono />
        <Row label="commit" value={version?.commit?.slice(0, 8) || '—'} mono />
        <Row label="branch" value={version?.branch || '—'} mono />
        {version?.buildDate && <Row label="built" value={formatDate(version.buildDate)} />}
        <Row label="provider" value={version?.provider || '—'} />
      </div>

      {stats && (
        <div style={{ marginTop: 20 }}>
          <SectionLabel>storage</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <Row label="total entries" value={String(stats.totalEntries || 0)} />
            <Row label="journal" value={String(stats.totalJournal || 0)} />
            <Row label="notes" value={String(stats.totalNotes || 0)} />
            <Row label="streak" value={`${stats.currentStreak || 0}d current / ${stats.longestStreak || 0}d best`} />
            <Row label="this week" value={String(stats.thisWeek || 0)} />
            <Row label="this month" value={String(stats.thisMonth || 0)} />
          </div>
          {stats.topTags?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Row label="top tags" value={stats.topTags.slice(0, 5).map((t: any) => `#${t.name}`).join('  ')} mono />
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <SectionLabel>system</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <Row
            label="warden"
            value={config?.wardenAvailable ? 'connected' : 'not found'}
            valueColor={config?.wardenAvailable ? 'var(--accent-green)' : 'var(--accent-orange)'}
          />
          {config?.repo && <Row label="repo" value={config.repo} mono />}
          {config?.image && <Row label="image" value={config.image} mono />}
        </div>
        {config && !config.wardenAvailable && (
          <div style={{
            marginTop: 10,
            color: 'var(--accent-orange)',
            fontSize: '9px',
            lineHeight: '1.6',
            borderLeft: '2px solid var(--accent-orange)',
            paddingLeft: 12,
          }}>
            warden not found — auto-update requires the warden container.<br />
            add the warden service to your docker-compose.yml.
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab: Keyboard Shortcuts
// ═══════════════════════════════════════════════════════════════════

const SHORTCUTS: { key: string; action: string; section: string }[] = [
  { section: 'global', key: 'ctrl+k', action: 'quick capture' },
  { section: 'global', key: 'ctrl+shift+p', action: 'command palette' },
  { section: 'global', key: 'esc', action: 'close modal / dialog' },
  { section: 'editor', key: 'ctrl+p', action: 'full preview' },
  { section: 'editor', key: '/', action: 'insert menu (in editor)' },
  { section: 'editor', key: 'ctrl+s', action: 'force save' },
  { section: 'navigation', key: 'ctrl+shift+p', action: 'command palette (fuzzy search)' },
  { section: 'entries', key: '≡ / ☰', action: 'toggle compact / full view' },
  { section: 'entries', key: 'filter...', action: 'inline search in entry list' },
];

function ShortcutsTab() {
  const sections = ['global', 'editor', 'navigation', 'entries'];

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      {sections.map(section => {
        const items = SHORTCUTS.filter(s => s.section === section);
        if (items.length === 0) return null;
        return (
          <div key={section} style={{ marginBottom: 16 }}>
            <SectionLabel>{section}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              {items.map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {s.action}
                  </span>
                  <kbd style={{
                    fontSize: '9px',
                    color: 'var(--accent-primary)',
                    padding: '2px 6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab: Updates
// ═══════════════════════════════════════════════════════════════════

const ERROR_HELP: Record<string, string> = {
  CONFIG_MISSING: 'set TK_UPDATE_REPO, TK_UPDATE_IMAGE, and TK_UPDATE_API_URL in docker-compose.yml',
  DOCKER_CLI_MISSING: 'warden service not available — add the warden container to your docker-compose.yml',
  REGISTRY_AUTH_FAILED: 'run docker login on the host, or set TK_UPDATE_TOKEN',
  IMAGE_NOT_FOUND: 'the image tag was not found in the registry — was it pushed?',
  COMPOSE_RESTART_FAILED: 'warden failed to restart the container — check warden logs',
  API_UNREACHABLE: 'could not reach the update API — check TK_UPDATE_API_URL and network',
  PULL_FAILED: 'image pull failed — check registry access and network',
};

function UpdatesTab() {
  const {
    version, check, rollback, status, error, errorCode, pullMessage, restartElapsed,
    checkForUpdate, applyUpdate, fetchRollback, applyRollback,
  } = useUpdate();

  useEffect(() => {
    if (version?.updateConfigured && !check) checkForUpdate();
  }, [version?.updateConfigured]);

  useEffect(() => {
    fetchRollback();
  }, [fetchRollback]);

  const statusColor = STATUS_COLORS[status] || 'var(--text-muted)';
  const statusLabel = STATUS_LABELS[status] || status;

  const isRestarting = status === 'restarting' || status === 'verifying';

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      {/* Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel>status</SectionLabel>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '9px', color: statusColor }}>
          <span style={{
            width: 6, height: 6,
            background: statusColor,
            display: 'inline-block',
            animation: PULSING_STATES.includes(status) ? 'tk-pulse 1s infinite' : 'none',
          }} />
          {statusLabel}
          {isRestarting && restartElapsed > 0 && (
            <span style={{ color: 'var(--text-muted)' }}>({restartElapsed}s)</span>
          )}
        </span>
      </div>

      {/* Current/Latest */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        <Row label="current" value={version?.version || '—'} mono />
        {check && (
          <Row
            label="latest"
            value={check.latest}
            mono
            valueColor={check.updateAvailable ? 'var(--accent-orange)' : 'var(--accent-green)'}
          />
        )}
      </div>

      {/* Update available */}
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
          borderLeft: '2px solid var(--accent-pink)',
          paddingLeft: 12,
        }}>
          <div style={{ color: 'var(--accent-pink)', fontSize: '10px', lineHeight: '1.4' }}>
            {error}
          </div>
          {errorCode && ERROR_HELP[errorCode] && (
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginTop: 4, lineHeight: '1.4' }}>
              {ERROR_HELP[errorCode]}
            </div>
          )}
        </div>
      )}

      {/* Manual command */}
      {pullMessage && (
        <Code>{pullMessage}</Code>
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
          <span style={{ color: 'var(--text-secondary)' }}>TK_UPDATE_REPO</span> — github repo (user/repo)<br />
          <span style={{ color: 'var(--text-secondary)' }}>TK_UPDATE_IMAGE</span> — ghcr.io/user/repo
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <ActionButton
          onClick={checkForUpdate}
          disabled={status === 'checking' || status === 'pulling' || isRestarting}
          label={status === 'checking' ? 'checking...' : 'check for updates'}
        />
        {check?.updateAvailable && !isRestarting && status !== 'restart-timeout' && (
          <ActionButton
            onClick={() => applyUpdate(check.latestTag)}
            disabled={status === 'pulling'}
            label={status === 'pulling' ? 'pulling...' : 'apply update'}
            accent
          />
        )}
        {(status === 'restart-failed' || status === 'restart-timeout') && rollback?.available && (
          <ActionButton
            onClick={applyRollback}
            label="rollback"
            accent
          />
        )}
        {status === 'restart-timeout' && (
          <ActionButton
            onClick={() => checkForUpdate()}
            label="retry"
          />
        )}
      </div>

      {/* Restarting overlay */}
      {isRestarting && (
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
            {status === 'verifying' ? 'verifying...' : 'restarting...'}
          </div>
          {restartElapsed > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              {restartElapsed}s — page will reload when ready
            </div>
          )}
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

// ═══════════════════════════════════════════════════════════════════
// Tab: Slogans
// ═══════════════════════════════════════════════════════════════════

function SlogansTab() {
  const [slogans, setSlogans] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSlogans()
      .then(res => {
        setSlogans(res.slogans);
        setText(res.slogans.join('\n'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await api.saveSlogans(lines);
      setSlogans(res.slogans);
      setText(res.slogans.join('\n'));
      // Invalidate the cache so the sidebar picks up changes
      const { invalidateSlogansCache } = await import('../../hooks/useQuotes');
      invalidateSlogansCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ padding: '16px 24px 20px' }}>
      <SectionLabel>sidebar slogans</SectionLabel>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>
        one per line. these rotate in the sidebar under the logo.
        {slogans.length > 0 && ` (${slogans.length} active)`}
        {slogans.length === 0 && !loading && ' using built-in defaults.'}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={'trapping knowledge\nwrite it down\nship the log\nbrain on disk'}
        rows={12}
        style={{
          width: '100%',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          padding: '10px 12px',
          lineHeight: '1.8',
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary)',
            background: 'transparent',
            padding: '5px 14px',
            fontSize: '10px',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'saving...' : 'save'}
        </button>
        {saved && (
          <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>saved</span>
        )}
        <span style={{ fontSize: '9px', color: 'var(--text-muted)', flex: 1, textAlign: 'right' }}>
          {text.split('\n').filter(s => s.trim()).length} slogans
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tab: Data Backup
// ═══════════════════════════════════════════════════════════════════

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel>data repository</SectionLabel>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '9px', color: statusColor }}>
          <span style={{ width: 6, height: 6, background: statusColor, display: 'inline-block' }} />
          {statusLabel}
        </span>
      </div>

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

          {status.lastCommit && (
            <div style={{ marginTop: 14 }}>
              <SectionLabel>last commit</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                <Row label="hash" value={status.lastCommit.hash.slice(0, 8)} mono />
                <Row label="date" value={formatDate(status.lastCommit.date)} />
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: 2, lineHeight: '1.4' }}>
                  {status.lastCommit.message}
                </div>
              </div>
            </div>
          )}

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

          <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
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

      {/* Danger zone */}
      <DangerZone />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Danger Zone
// ═══════════════════════════════════════════════════════════════════

function DangerZone() {
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  const handlePurge = async () => {
    setPurging(true);
    try {
      const res = await api.purgeOubliette();
      setPurgeResult(`purged ${res.purged} items`);
      setTimeout(() => setPurgeResult(''), 3000);
    } catch {
      setPurgeResult('purge failed');
    }
    setPurging(false);
    setConfirm(null);
  };

  const handleResetSlogans = async () => {
    try {
      await api.saveSlogans([]);
      const { invalidateSlogansCache } = await import('../../hooks/useQuotes');
      invalidateSlogansCache();
      setPurgeResult('slogans reset to defaults');
      setTimeout(() => setPurgeResult(''), 3000);
    } catch {}
    setConfirm(null);
  };

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <SectionLabel>danger zone</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {confirm === 'purge' ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--danger)' }}>purge all trash?</span>
            <ActionButton onClick={handlePurge} label={purging ? 'purging...' : 'confirm'} accent />
            <ActionButton onClick={() => setConfirm(null)} label="cancel" />
          </div>
        ) : (
          <ActionButton onClick={() => setConfirm('purge')} label="purge oubliette" />
        )}

        {confirm === 'slogans' ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--danger)' }}>reset slogans?</span>
            <ActionButton onClick={handleResetSlogans} label="confirm" accent />
            <ActionButton onClick={() => setConfirm(null)} label="cancel" />
          </div>
        ) : (
          <ActionButton onClick={() => setConfirm('slogans')} label="reset slogans" />
        )}
      </div>
      {purgeResult && (
        <div style={{ marginTop: 8, fontSize: '9px', color: 'var(--accent-green)' }}>{purgeResult}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Shared
// ═══════════════════════════════════════════════════════════════════

const PULSING_STATES: UpdateStatus[] = ['checking', 'pulling', 'restarting', 'verifying'];

const STATUS_COLORS: Record<UpdateStatus, string> = {
  idle: 'var(--text-muted)',
  checking: 'var(--accent-primary)',
  available: 'var(--accent-tertiary)',
  pulling: 'var(--accent-primary)',
  restarting: 'var(--accent-primary)',
  verifying: 'var(--accent-primary)',
  'restart-timeout': 'var(--danger)',
  'restart-failed': 'var(--danger)',
  'up-to-date': 'var(--accent-green)',
  error: 'var(--danger)',
  unconfigured: 'var(--text-muted)',
};

const STATUS_LABELS: Record<UpdateStatus, string> = {
  idle: 'idle',
  checking: 'checking...',
  available: 'update available',
  pulling: 'pulling image...',
  restarting: 'restarting...',
  verifying: 'verifying...',
  'restart-timeout': 'timeout',
  'restart-failed': 'restart failed',
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
