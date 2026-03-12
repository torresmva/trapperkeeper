import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TaskBoard } from '../tasks/TaskBoard';
import { ReceiptsPage } from '../receipts/ReceiptsPage';
import { LinksPage } from '../links/LinksPage';
import { PromisesPage } from '../promises/PromisesPage';
import { SnippetsPage } from '../snippets/SnippetsPage';
import { RunbooksPage } from '../runbooks/RunbooksPage';
import {
  PixelSword, PixelTrophy, PixelKey, PixelHeart, PixelLightning, PixelWrench, PixelBorder,
} from '../shared/PixelArt';

type KeeperTab = 'tasks' | 'receipts' | 'links' | 'promises' | 'snippets' | 'runbooks';

const TABS: { id: KeeperTab; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'tasks',    label: 'tasks',    icon: <PixelSword size={12} color="var(--accent-primary)" />,      accent: 'var(--accent-primary)' },
  { id: 'receipts', label: 'receipts', icon: <PixelTrophy size={12} color="var(--accent-tertiary)" />,    accent: 'var(--accent-tertiary)' },
  { id: 'links',    label: 'links',    icon: <PixelKey size={12} color="var(--accent-primary)" />,        accent: 'var(--accent-primary)' },
  { id: 'promises', label: 'promises', icon: <PixelHeart size={12} color="var(--accent-secondary)" />,    accent: 'var(--accent-secondary)' },
  { id: 'snippets', label: 'snippets', icon: <PixelLightning size={12} color="var(--accent-tertiary)" />, accent: 'var(--accent-tertiary)' },
  { id: 'runbooks', label: 'runbooks', icon: <PixelWrench size={12} color="var(--accent-primary)" />, accent: 'var(--accent-primary)' },
];

const FLAVOR = [
  'trapping tasks, receipts, links, promises, and snippets since day one',
  "keeping it all together — that's the whole point",
  "you won't remember this tomorrow. we will.",
  'the boy who blocked his own context-switching',
  "i will keep you in a jar beside my bed",
];

export function KeeperPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as KeeperTab) || 'tasks';
  const [tab, setTab] = useState<KeeperTab>(initialTab);
  const flavor = useMemo(() => FLAVOR[Math.floor(Math.random() * FLAVOR.length)], []);

  const switchTab = (t: KeeperTab) => {
    setTab(t);
    setSearchParams(t === 'tasks' ? {} : { tab: t });
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
        }}>
          keeper
        </h1>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
        }}>
          {flavor}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 1,
        marginBottom: 24,
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}>
        {TABS.map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '12px 6px',
                background: isActive ? 'var(--bg-surface)' : 'var(--bg-primary)',
                border: 'none',
                borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderBottomColor = t.accent;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderBottomColor = 'transparent';
              }}
            >
              {t.icon}
              <span style={{
                fontSize: '10px',
                color: isActive ? t.accent : 'var(--text-muted)',
                letterSpacing: '0.02em',
                fontWeight: isActive ? 600 : 400,
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <PixelBorder />

      {/* Content */}
      <div style={{ marginTop: 24 }}>
        {tab === 'tasks' && <TaskBoardInline />}
        {tab === 'receipts' && <ReceiptsPage />}
        {tab === 'links' && <LinksPage />}
        {tab === 'promises' && <PromisesPage />}
        {tab === 'snippets' && <SnippetsPage />}
        {tab === 'runbooks' && <RunbooksPage />}
      </div>
    </div>
  );
}

function TaskBoardInline() {
  return (
    <div style={{ margin: '-24px -32px 0 -32px' }}>
      <TaskBoard />
    </div>
  );
}
