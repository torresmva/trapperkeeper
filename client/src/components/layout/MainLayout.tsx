import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface Props {
  onQuickCapture: () => void;
  onLock?: () => void;
}

// Routes that manage their own padding (e.g. wiki with its tree panel)
const ZERO_PADDING_ROUTES = ['/wiki'];

export function MainLayout({ onQuickCapture, onLock }: Props) {
  const location = useLocation();
  const [pageVisible, setPageVisible] = useState(true);
  const [crt, setCrt] = useState(() => localStorage.getItem('tk-crt') === 'true');

  const useZeroPadding = ZERO_PADDING_ROUTES.some(r => location.pathname.startsWith(r));

  // Page transition on route change
  useEffect(() => {
    setPageVisible(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPageVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  // Listen for CRT toggle events
  useEffect(() => {
    const handler = () => setCrt(localStorage.getItem('tk-crt') === 'true');
    window.addEventListener('tk-crt-change', handler);
    return () => window.removeEventListener('tk-crt-change', handler);
  }, []);

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header onQuickCapture={onQuickCapture} onLock={onLock} />
          <main className="main-content" style={{
            flex: 1,
            overflow: 'auto',
            padding: useZeroPadding ? 0 : '28px 32px',
            opacity: pageVisible ? 1 : 0,
            transform: pageVisible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* CRT scanline overlay — outside flex layout for correct fixed positioning */}
      {crt && (
        <div
          className="crt-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
            backgroundSize: '100% 3px',
          }}
        >
          {/* Corner vignette */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }} />
          {/* Subtle flicker */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.01)',
            animation: 'crtFlicker 0.08s infinite alternate',
          }} />
        </div>
      )}
    </>
  );
}
