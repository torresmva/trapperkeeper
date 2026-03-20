import { useState, useEffect } from 'react';
import { useUpdate } from '../../hooks/useUpdate';

/** Compact sidebar badge — opens the About modal */
export function UpdateBadge() {
  const { version, status, checkForUpdate } = useUpdate();
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-check on mount if configured
  useEffect(() => {
    if (version?.updateConfigured) {
      checkForUpdate();
    }
  }, [version?.updateConfigured]);

  const dotColor = {
    idle: 'var(--text-muted)',
    checking: 'var(--accent-primary)',
    available: 'var(--accent-orange)',
    pulling: 'var(--accent-primary)',
    restarting: 'var(--accent-primary)',
    'up-to-date': 'var(--accent-green)',
    error: 'var(--accent-pink)',
    unconfigured: 'var(--text-muted)',
  }[status];

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
            width: 6,
            height: 6,
            background: dotColor,
            display: 'inline-block',
            animation: status === 'checking' || status === 'pulling' || status === 'restarting'
              ? 'tk-pulse 1s infinite' : 'none',
          }} />
          <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            sys
          </span>
        </span>
        <span style={{ color: dotColor, fontSize: '9px' }}>
          {version?.version || '...'}
        </span>
      </button>

      {modalOpen && <AboutModal onClose={() => setModalOpen(false)} />}

      <style>{`
        @keyframes tk-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}

/** Full about / system / update modal */
function AboutModal({ onClose }: { onClose: () => void }) {
  const {
    version,
    check,
    config,
    status,
    error,
    pullMessage,
    checkForUpdate,
    applyUpdate,
    fetchConfig,
  } = useUpdate();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (version?.updateConfigured && !check) {
      checkForUpdate();
    }
  }, [version?.updateConfigured]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const statusColor = {
    idle: 'var(--text-muted)',
    checking: 'var(--accent-primary)',
    available: 'var(--accent-orange)',
    pulling: 'var(--accent-primary)',
    restarting: 'var(--accent-primary)',
    'up-to-date': 'var(--accent-green)',
    error: 'var(--accent-pink)',
    unconfigured: 'var(--text-muted)',
  }[status];

  const statusLabel = {
    idle: 'idle',
    checking: 'checking...',
    available: 'update available',
    pulling: 'pulling image...',
    restarting: 'restarting...',
    'up-to-date': 'up to date',
    error: 'error',
    unconfigured: 'not configured',
  }[status];

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
          width: 420,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
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

        {/* Version section */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <SectionLabel>build</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <Row label="version" value={version?.version || '—'} mono />
            <Row label="commit" value={version?.commit?.slice(0, 8) || '—'} mono />
            <Row label="branch" value={version?.branch || '—'} mono />
            {version?.buildDate && (
              <Row label="built" value={formatDate(version.buildDate)} />
            )}
            <Row label="provider" value={version?.provider || '—'} />
          </div>
        </div>

        {/* Update section */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <SectionLabel>updates</SectionLabel>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '9px',
              color: statusColor,
            }}>
              <span style={{
                width: 6,
                height: 6,
                background: statusColor,
                display: 'inline-block',
                animation: status === 'checking' || status === 'pulling' || status === 'restarting'
                  ? 'tk-pulse 1s infinite' : 'none',
              }} />
              {statusLabel}
            </span>
          </div>

          {/* Update available */}
          {check?.updateAvailable && (
            <div style={{
              marginTop: 12,
              borderLeft: '2px solid var(--accent-orange)',
              paddingLeft: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <Row label="latest" value={check.latest} valueColor="var(--accent-orange)" mono />
              {check.releaseDate && (
                <Row label="released" value={formatDate(check.releaseDate)} />
              )}
              {check.changelog && (
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                  lineHeight: '1.5',
                  maxHeight: 80,
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
              marginTop: 10,
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
                marginTop: 10,
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
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>$ </span>
              {pullMessage}
            </div>
          )}

          {/* Unconfigured hint */}
          {status === 'unconfigured' && (
            <div style={{
              marginTop: 10,
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
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
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
        </div>

        {/* System section */}
        <div style={{ padding: '16px 24px' }}>
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
    </div>
  );
}

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
        maxWidth: 220,
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
