import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSpace } from '../../contexts/SpaceContext';

const PRIMARY_NAV = [
  { label: 'wire', path: '/briefing', icon: '◆' },
  { label: 'entries', path: '/entries', icon: '▤' },
  { label: 'new', path: '__capture__', icon: '+' },
  { label: 'keeper', path: '/keeper', icon: '▦' },
  { label: 'more', path: '__more__', icon: '···' },
];

const MORE_NAV = [
  { label: 'dashboard', path: '/stats', icon: '◇' },
  { label: 'collections', path: '/collections', icon: '▧' },
  { label: 'wiki', path: '/wiki', icon: '▤' },
  { label: 'wall', path: '/wall', icon: '▨' },
  { label: 'confessional', path: '/confessional', icon: '▩' },
  { label: 'capsules', path: '/capsules', icon: '◉' },
  { label: 'oubliette', path: '/oubliette', icon: '☠' },
  { label: 'workbench', path: '/workbench', icon: '⚙' },
  { label: 'search', path: '/search', icon: '⌕' },
  { label: 'activity', path: '/activity', icon: '◈' },
  { label: 'templates', path: '/templates', icon: '▤' },
  { label: 'export', path: '/exports', icon: '↗' },
];

interface Props {
  onCapture: () => void;
}

export function MobileNav({ onCapture }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeSpace, setActiveSpace, spaces } = useSpace();

  // Check if current route is in the "more" menu
  const isMoreActive = MORE_NAV.some(item => location.pathname.startsWith(item.path));

  const handleTap = (path: string) => {
    if (path === '__capture__') {
      onCapture();
      setMoreOpen(false);
    } else if (path === '__more__') {
      setMoreOpen(prev => !prev);
    } else {
      navigate(path);
      setMoreOpen(false);
    }
  };

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1999,
          }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu panel */}
      {moreOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          zIndex: 2001,
          padding: '0',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}>
          {/* Space switcher */}
          {spaces.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 0,
              borderBottom: '1px solid var(--border)',
              padding: '0',
            }}>
              <button
                onClick={() => { setActiveSpace(null); }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: !activeSpace ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: !activeSpace ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  textTransform: 'lowercase',
                }}
              >
                all
              </button>
              {spaces.map(s => (
                <button
                  key={s}
                  onClick={() => { setActiveSpace(s); }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeSpace === s ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeSpace === s ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    textTransform: 'lowercase',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Nav items */}
          <div style={{ padding: '8px 0' }}>
            {MORE_NAV.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => handleTap(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    padding: '12px 20px',
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '14px', width: 20, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(52px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        zIndex: 2000,
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: 4,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }} className="mobile-nav">
        {PRIMARY_NAV.map(item => {
          const isCapture = item.path === '__capture__';
          const isMore = item.path === '__more__';
          const isActive = !isCapture && !isMore && (
            item.path === '/briefing'
              ? (location.pathname === '/briefing' || location.pathname === '/')
              : location.pathname.startsWith(item.path)
          );
          const isMoreHighlight = isMore && (moreOpen || isMoreActive);

          return (
            <button
              key={item.label}
              onClick={() => handleTap(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                background: isCapture ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                color: isCapture
                  ? 'var(--bg-primary)'
                  : (isActive || isMoreHighlight) ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: isCapture ? '18px' : '15px',
                padding: isCapture ? '6px 14px' : '6px 10px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                WebkitTapHighlightColor: 'transparent',
                minWidth: 44,
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: '9px', letterSpacing: '0.3px' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
