import { useEffect, useState } from 'react';

const SHORTCUTS = [
  { keys: 'Ctrl + K', action: 'Quick capture' },
  { keys: 'Ctrl + P', action: 'Full preview (in editor)' },
  { keys: '?', action: 'Show keyboard shortcuts' },
  { keys: 'Esc', action: 'Close modal / dialog' },
  { keys: '0-7', action: 'Navigate sidebar items' },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).closest('.cm-editor')) return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 2500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: '24px 32px',
          minWidth: 320,
          maxWidth: 420,
        }}
      >
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 20px 0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          keyboard shortcuts
        </h2>
        {SHORTCUTS.map(s => (
          <div key={s.keys} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--accent-primary)',
              background: 'var(--bg-surface)',
              padding: '2px 8px',
              border: '1px solid var(--border)',
            }}>
              {s.keys}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}>
              {s.action}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 16, fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          press ? or esc to close
        </div>
      </div>
    </div>
  );
}
