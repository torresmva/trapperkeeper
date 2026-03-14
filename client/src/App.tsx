import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useWebSocket } from './hooks/useWebSocket';
import { MainLayout } from './components/layout/MainLayout';
import { MobileNav } from './components/layout/MobileNav';
import { LoginPage } from './components/auth/LoginPage';
import { EntryList } from './components/journal/EntryList';
import { EntryEditor } from './components/journal/EntryEditor';
import { QuickCapture } from './components/notes/QuickCapture';
import { SearchPage } from './components/search/SearchPage';
import { ExportPage } from './components/exports/ExportPage';
import { StatsPage } from './components/stats/StatsPage';
import { CollectionsPage } from './components/collections/CollectionsPage';
import { KeeperPage } from './components/keeper/KeeperPage';
import { WallPage } from './components/wall/WallPage';
import { ConfessionalPage } from './components/confessional/ConfessionalPage';
import { WorkbenchPage } from './components/workbench/WorkbenchPage';
import { WikiPage } from './components/wiki/WikiPage';
import { CapsulesPage } from './components/capsules/CapsulesPage';
import { ActivityPage } from './components/activity/ActivityPage';
import { TemplatesPage } from './components/templates/TemplatesPage';
import { KeyboardShortcuts } from './components/shared/KeyboardShortcuts';
import { CommandPalette } from './components/shared/CommandPalette';
import { OubliettePage } from './components/oubliette/OubliettePage';
import { BriefingPage } from './components/briefing/BriefingPage';
import { SpaceProvider } from './contexts/SpaceContext';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setQuickCaptureOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Listen for command palette quick capture action
  useEffect(() => {
    const handler = () => setQuickCaptureOpen(true);
    window.addEventListener('tk-open-capture', handler);
    return () => window.removeEventListener('tk-open-capture', handler);
  }, []);

  // Restore saved accent color and theme variant on mount
  useEffect(() => {
    // Theme variant takes priority over plain accent
    const variant = localStorage.getItem('tk-theme-variant');
    if (variant && variant !== 'default') {
      // Will be applied by AccentPicker's applyThemeVariant
      import('./styles/theme').then(({ themeVariants }) => {
        const v = themeVariants?.find((t: any) => t.name === variant);
        if (v) {
          for (const [key, value] of Object.entries(v.overrides)) {
            document.documentElement.style.setProperty(key, value as string);
          }
        }
      });
    } else {
      const saved = localStorage.getItem('tk-accent');
      if (saved) {
        document.documentElement.style.setProperty('--accent-primary', saved);
        document.documentElement.style.setProperty('--glow', `${saved}15`);
      }
    }
  }, []);

  // WebSocket for live file updates
  useWebSocket(useCallback((msg) => {
    if (msg.type === 'file-changed' || msg.type === 'file-removed') {
      window.dispatchEvent(new CustomEvent('tk-file-change', { detail: msg }));
    }
  }, []));

  // Auth loading state
  if (authenticated === null) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
      }}>
        booting...
      </div>
    );
  }

  const handleLock = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
    <SpaceProvider>
      <Routes>
        <Route
          element={
            <MainLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onQuickCapture={() => setQuickCaptureOpen(true)}
              onLock={handleLock}
            />
          }
        >
          <Route path="/" element={<Navigate to="/briefing" replace />} />
          <Route path="/briefing" element={<BriefingPage />} />
          <Route path="/entries" element={<EntryList />} />
          <Route path="/journal" element={<Navigate to="/entries" replace />} />
          <Route path="/journal/*" element={<EntryEditor />} />
          <Route path="/notes" element={<Navigate to="/entries" replace />} />
          <Route path="/notes/*" element={<EntryEditor />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:name" element={<CollectionsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/keeper" element={<KeeperPage />} />
          <Route path="/wall" element={<WallPage />} />
          <Route path="/confessional" element={<ConfessionalPage />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/wiki/:slug" element={<WikiPage />} />
          <Route path="/capsules" element={<CapsulesPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/exports" element={<ExportPage />} />
          <Route path="/oubliette" element={<OubliettePage />} />

          {/* Redirects from old routes */}
          <Route path="/timeline" element={<Navigate to="/entries?view=timeline" replace />} />
          <Route path="/digest" element={<Navigate to="/entries?view=digest" replace />} />
          <Route path="/tasks" element={<Navigate to="/keeper" replace />} />
          <Route path="/receipts" element={<Navigate to="/keeper?tab=receipts" replace />} />
          <Route path="/links" element={<Navigate to="/keeper?tab=links" replace />} />
          <Route path="/promises" element={<Navigate to="/keeper?tab=promises" replace />} />
          <Route path="/snippets" element={<Navigate to="/keeper?tab=snippets" replace />} />
          <Route path="/runbooks" element={<Navigate to="/keeper?tab=runbooks" replace />} />
        </Route>
      </Routes>
      <QuickCapture open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
      <CommandPalette />
      <KeyboardShortcuts />
      <MobileNav onCapture={() => setQuickCaptureOpen(true)} />
    </SpaceProvider>
    </BrowserRouter>
  );
}
