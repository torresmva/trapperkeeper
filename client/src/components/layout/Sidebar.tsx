import { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AccentPicker } from '../shared/AccentPicker';

const TAGLINES = [
  'work log // v1.0',
  'trapping knowledge',
  'your quest log',
  '[ save game ]',
  'captain\'s log',
];

const navItems = [
  { to: '/stats', label: 'dashboard', shortcut: '0' },
  { to: '/digest', label: 'digest', shortcut: '1' },
  { to: '/entries', label: 'entries', shortcut: '2' },
  { to: '/collections', label: 'collections', shortcut: '3' },
  { to: '/timeline', label: 'timeline', shortcut: '4' },
  { to: '/tasks', label: 'tasks', shortcut: '5' },
  { to: '/search', label: 'search', shortcut: '6' },
  { to: '/exports', label: 'export', shortcut: '7' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const tagline = useMemo(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)], []);

  return (
    <aside
      style={{
        width: collapsed ? 48 : 200,
        minWidth: collapsed ? 48 : 200,
        height: '100%',
        background: 'var(--bg-rail)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Brand — click navigates to dashboard */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: collapsed ? 'center' : 'flex-start',
          flexDirection: collapsed ? 'column' : 'row',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 4,
        }}
      >
        <div
          onClick={() => navigate('/stats')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: collapsed ? '14px' : '15px',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            letterSpacing: '-0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            {collapsed ? 'tk' : 'trapperkeeper'}
          </div>
          {!collapsed && (
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: 2,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {tagline}
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '10px',
              padding: '2px 4px',
              textTransform: 'none',
              opacity: 0.6,
              marginTop: 2,
            }}
            title="Collapse sidebar"
          >
            {'<<'}
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '10px',
              padding: '2px 0',
              textTransform: 'none',
              opacity: 0.6,
              marginTop: 6,
            }}
            title="Expand sidebar"
          >
            {'>>'}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map(item => {
          const isActive = item.to === '/stats'
            ? location.pathname === '/stats' || location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                padding: collapsed ? '8px 0' : '8px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 400,
                transition: 'color 0.15s',
                position: 'relative',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {!collapsed && (
                <>
                  <span style={{ color: 'var(--text-muted)', marginRight: 8, fontSize: '10px' }}>{item.shortcut}</span>
                  {item.label}
                </>
              )}
              {collapsed && (
                <span style={{ fontSize: '10px' }}>{item.label.charAt(0)}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}>
          <span style={{ color: 'var(--accent-primary)' }}>^K</span> capture<br/>
          <span style={{ color: 'var(--accent-primary)' }}>^P</span> full preview<br/>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>accent</span>
            <AccentPicker />
          </div>
        </div>
      )}
    </aside>
  );
}
