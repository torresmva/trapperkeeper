import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AccentPicker } from '../shared/AccentPicker';
import { SprintCard } from '../shared/SprintCard';

import { useRotatingQuote } from '../../hooks/useQuotes';
import { useSpace } from '../../contexts/SpaceContext';
import { UpdateBadge } from '../shared/UpdatePanel';

interface NavItem {
  to: string;
  label: string;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { to: '/stats', label: 'dashboard' },
  { to: '/briefing', label: 'the wire' },
];

const navGroups: NavGroup[] = [
  {
    key: 'write',
    label: 'write',
    items: [
      { to: '/entries', label: 'entries' },
      { to: '/collections', label: 'collections' },
      { to: '/wiki', label: 'wiki' },
      { to: '/templates', label: 'templates' },
    ],
  },
  {
    key: 'track',
    label: 'track',
    items: [
      { to: '/keeper', label: 'keeper' },
      { to: '/activity', label: 'activity' },
    ],
  },
  {
    key: 'tools',
    label: 'tools',
    items: [
      { to: '/search', label: 'search' },
      { to: '/workbench', label: 'workbench' },
      { to: '/exports', label: 'export' },
    ],
  },
  {
    key: 'vault',
    label: 'vault',
    items: [
      { to: '/wall', label: 'the wall' },

      { to: '/oubliette', label: 'oubliette' },
    ],
  },
];

function getStoredState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('tk-nav-groups');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: Record<string, boolean>) {
  localStorage.setItem('tk-nav-groups', JSON.stringify(state));
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [groupState, setGroupState] = useState<Record<string, boolean>>(getStoredState);
  const [crt, setCrt] = useState(() => localStorage.getItem('tk-crt') === 'true');
  const location = useLocation();
  const navigate = useNavigate();
  const tagline = useRotatingQuote('sidebar', 'trapping knowledge');
  const { activeSpace, setActiveSpace, spaces, addSpace } = useSpace();

  const toggleCrt = useCallback(() => {
    const next = !crt;
    setCrt(next);
    localStorage.setItem('tk-crt', String(next));
    window.dispatchEvent(new Event('tk-crt-change'));
  }, [crt]);

  // Auto-expand group containing active route
  useEffect(() => {
    for (const group of navGroups) {
      const hasActive = group.items.some(item => location.pathname.startsWith(item.to));
      if (hasActive && !groupState[group.key]) {
        setGroupState(prev => {
          const next = { ...prev, [group.key]: true };
          saveState(next);
          return next;
        });
      }
    }
  }, [location.pathname]);

  const toggleGroup = (key: string) => {
    setGroupState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveState(next);
      return next;
    });
  };

  const isActive = (to: string) => {
    if (to === '/briefing') return location.pathname === '/briefing' || location.pathname === '/';
    if (to === '/stats') return location.pathname === '/stats';
    return location.pathname.startsWith(to);
  };

  const linkStyle = (to: string, indent: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    padding: collapsed ? '7px 0' : `7px 16px 7px ${indent ? '28px' : '16px'}`,
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: isActive(to) ? 'var(--accent-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 400,
    transition: 'color 0.15s',
    position: 'relative',
    borderLeft: isActive(to) ? '2px solid var(--accent-primary)' : '2px solid transparent',
    whiteSpace: 'nowrap',
  });

  return (
    <aside
      className="sidebar-rail"
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
      {/* Brand */}
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
          onClick={() => navigate('/briefing')}
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

      {/* Space switcher — always visible */}
      {!collapsed && (
        <div style={{
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            gap: 0,
          }}>
            <button
              onClick={() => setActiveSpace(null)}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: !activeSpace ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: !activeSpace ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '9px',
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
                onClick={() => setActiveSpace(s)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeSpace === s ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeSpace === s ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  textTransform: 'lowercase',
                }}
              >
                {s}
              </button>
            ))}
            <span style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
            }}>
              <input
                placeholder="+ space"
                style={{
                  width: 52,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '2px 0',
                  outline: 'none',
                  textTransform: 'lowercase',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
                    if (val) {
                      addSpace(val);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </span>
          </div>
        </div>
      )}
      {collapsed && (
        <button
          onClick={() => {
            if (spaces.length === 0) return;
            if (!activeSpace) {
              setActiveSpace(spaces[0]);
            } else {
              const idx = spaces.indexOf(activeSpace);
              setActiveSpace(idx < spaces.length - 1 ? spaces[idx + 1] : null);
            }
          }}
          style={{
            width: '100%',
            padding: '6px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: activeSpace ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontSize: '9px',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
          }}
          title={activeSpace ? `space: ${activeSpace}` : 'all spaces'}
        >
          {activeSpace ? activeSpace.charAt(0) : '●'}
        </button>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {/* Top-level nav */}
        {topItems.map(item => (
          <NavLink key={item.to} to={item.to} style={linkStyle(item.to, false)}>
            {!collapsed && item.label}
            {collapsed && <span style={{ fontSize: '10px' }}>{item.label.charAt(0)}</span>}
          </NavLink>
        ))}

        {/* Grouped items */}
        {navGroups.map(group => {
          const open = groupState[group.key] ?? true;
          const groupHasActive = group.items.some(item => isActive(item.to));

          return (
            <div key={group.key}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderLeft: '2px solid transparent',
                  padding: collapsed ? '10px 0' : '10px 16px 4px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  cursor: 'pointer',
                  color: groupHasActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {!collapsed && (
                  <>
                    <span style={{
                      fontSize: '8px',
                      transition: 'transform 0.15s',
                      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}>
                      ▸
                    </span>
                    {group.label}
                  </>
                )}
                {collapsed && (
                  <span style={{ fontSize: '8px', opacity: 0.4 }}>—</span>
                )}
              </button>

              {/* Group items */}
              {(open || collapsed) && group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={linkStyle(item.to, !collapsed)}
                >
                  {!collapsed && item.label}
                  {collapsed && (
                    <span style={{ fontSize: '10px' }}>{item.label.charAt(0)}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Sprint */}
      {!collapsed && <SprintCard />}


      {/* System / Update / Backup */}
      {!collapsed && <UpdateBadge />}

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>accent</span>
            <AccentPicker />
          </div>
          <button
            onClick={toggleCrt}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              color: crt ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="Toggle CRT scanline effect"
          >
            crt
            <span style={{
              width: 12,
              height: 12,
              background: crt ? 'var(--accent-primary)' : 'transparent',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '7px',
              color: crt ? 'var(--bg-primary)' : 'var(--text-muted)',
            }}>
              {crt ? '■' : ''}
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
