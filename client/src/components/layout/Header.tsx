import { ThemeToggle } from '../shared/ThemeToggle';
import { useLocation } from 'react-router-dom';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onQuickCapture: () => void;
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

export function Header({ theme, onToggleTheme, onQuickCapture }: Props) {
  const location = useLocation();
  const breadcrumb = getBreadcrumb(location.pathname);

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
      }}>
        {breadcrumb}
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
    </header>
  );
}
