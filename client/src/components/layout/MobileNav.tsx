import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', path: '/stats', icon: '◆' },
  { label: 'Entries', path: '/entries', icon: '▤' },
  { label: '+', path: '__capture__', icon: '+' },
  { label: 'Search', path: '/search', icon: '⌕' },
];

interface Props {
  onCapture: () => void;
}

export function MobileNav({ onCapture }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      display: 'none',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      zIndex: 2000,
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px',
    }} className="mobile-nav">
      {NAV_ITEMS.map(item => {
        const isActive = item.path !== '__capture__' && location.pathname.startsWith(item.path);
        const isCapture = item.path === '__capture__';
        return (
          <button
            key={item.label}
            onClick={() => isCapture ? onCapture() : navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: isCapture ? 'var(--accent-primary)' : 'transparent',
              border: 'none',
              color: isCapture ? 'var(--bg-primary)' : isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: isCapture ? '20px' : '16px',
              padding: isCapture ? '8px 16px' : '8px 12px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'color 0.15s',
              ...(isCapture ? { fontWeight: 700 } : {}),
            }}
          >
            <span>{item.icon}</span>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
