import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onQuickCapture: () => void;
}

export function MainLayout({ theme, onToggleTheme, onQuickCapture }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header theme={theme} onToggleTheme={onToggleTheme} onQuickCapture={onQuickCapture} />
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '28px 32px',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
