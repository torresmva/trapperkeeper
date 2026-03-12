import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useWebSocket } from './hooks/useWebSocket';
import { MainLayout } from './components/layout/MainLayout';
import { MobileNav } from './components/layout/MobileNav';
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
import { KeyboardShortcuts } from './components/shared/KeyboardShortcuts';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

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

  // Restore saved accent color on mount
  useEffect(() => {
    const saved = localStorage.getItem('tk-accent');
    if (saved) {
      document.documentElement.style.setProperty('--accent-primary', saved);
      document.documentElement.style.setProperty('--glow', `${saved}15`);
    }
  }, []);

  // WebSocket for live file updates
  useWebSocket(useCallback((msg) => {
    if (msg.type === 'file-changed' || msg.type === 'file-removed') {
      window.dispatchEvent(new CustomEvent('tk-file-change', { detail: msg }));
    }
  }, []));

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <MainLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onQuickCapture={() => setQuickCaptureOpen(true)}
            />
          }
        >
          <Route path="/" element={<Navigate to="/stats" replace />} />
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
          <Route path="/exports" element={<ExportPage />} />

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
      <KeyboardShortcuts />
      <MobileNav onCapture={() => setQuickCaptureOpen(true)} />
    </BrowserRouter>
  );
}
