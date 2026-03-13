import { ThemeToggle } from '../shared/ThemeToggle';
import { useLocation } from 'react-router-dom';
import { useSpace } from '../../contexts/SpaceContext';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onQuickCapture: () => void;
  onLock?: () => void;
}

function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith('/journal/')) return 'entries / editing';
  if (pathname.startsWith('/notes/')) return 'entries / editing';
  if (pathname.startsWith('/collections/')) return 'collections / viewing';
  if (pathname === '/entries') return 'entries';
  if (pathname === '/collections') return 'collections';
  if (pathname === '/timeline') return 'timeline';
  if (pathname === '/search') return 'search';
  if (pathname === '/stats') return 'dashboard';
  if (pathname === '/exports') return 'export';
  return '';
}

export function Header({ theme, onToggleTheme, onQuickCapture, onLock }: Props) {
  const location = useLocation();
  const breadcrumb = getBreadcrumb(location.pathname);
  const { activeSpace } = useSpace();

  return (
    <header
      style={{
        height: 44,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        gap: 16,
      }}
    >
      <span style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        letterSpacing: '0.04em',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {breadcrumb}
        {activeSpace && (
          <span style={{
            fontSize: '9px',
            letterSpacing: '0.06em',
            color: 'var(--accent-primary)',
            borderLeft: '1px solid var(--border)',
            paddingLeft: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ width: 5, height: 5, background: 'var(--accent-primary)', display: 'inline-block' }} />
            {activeSpace}
          </span>
        )}
      </span>

      <button
        onClick={onQuickCapture}
        style={{
          color: 'var(--accent-primary)',
          fontSize: '11px',
          padding: '4px 10px',
          border: '1px solid var(--border)',
          background: 'transparent',
          textTransform: 'none',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: 'var(--accent-secondary)' }}>+</span>
        capture
        <kbd style={{
          fontSize: '9px',
          color: 'var(--text-muted)',
          padding: '1px 4px',
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
        }}>^K</kbd>
      </button>

      <ThemeToggle theme={theme} onToggle={onToggleTheme} />

      {onLock && (
        <button
          onClick={onLock}
          title="lock trapperkeeper"
          style={{
            padding: '4px 6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.5,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
        >
          <svg width="14" height="16" viewBox="0 0 7 8" style={{ imageRendering: 'pixelated' }}>
            <rect x="2" y="0" width="3" height="1" fill="#ef4444" />
            <rect x="1" y="1" width="1" height="1" fill="#ef4444" />
            <rect x="5" y="1" width="1" height="1" fill="#ef4444" />
            <rect x="1" y="2" width="1" height="1" fill="#ef4444" />
            <rect x="5" y="2" width="1" height="1" fill="#ef4444" />
            <rect x="0" y="3" width="7" height="5" fill="#ef4444" />
            <rect x="3" y="5" width="1" height="2" fill="#050505" />
            <rect x="2" y="4" width="3" height="1" fill="#050505" />
          </svg>
        </button>
      )}
    </header>
  );
}
