import { Entry } from '../../types';
import { TagBadge } from '../shared/TagBadge';
import { format, parseISO } from 'date-fns';
import {
  PixelCoffee, PixelScroll, PixelCrown, PixelGhost, PixelSword,
  PixelSkull, PixelShield, PixelLightning, PixelStar,
} from '../shared/PixelArt';

interface Props {
  entry: Entry;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
  index?: number;
}

const TYPE_CONFIG: Record<string, {
  accent: string;
  icon: (size: number) => React.ReactNode;
  glyph: string;
  pattern: string; // ASCII pattern for the left strip
}> = {
  daily: {
    accent: 'var(--accent-primary)',
    icon: (s) => <PixelCoffee size={s} color="var(--accent-primary)" />,
    glyph: '>>',
    pattern: '▎',
  },
  weekly: {
    accent: 'var(--accent-secondary)',
    icon: (s) => <PixelScroll size={s} color="var(--accent-secondary)" />,
    glyph: '::',
    pattern: '▍',
  },
  monthly: {
    accent: 'var(--accent-tertiary)',
    icon: (s) => <PixelCrown size={s} color="var(--accent-tertiary)" />,
    glyph: '##',
    pattern: '▌',
  },
  meeting: {
    accent: 'var(--accent-green)',
    icon: (s) => <PixelGhost size={s} color="var(--accent-green)" />,
    glyph: '<>',
    pattern: '▎',
  },
  incident: {
    accent: 'var(--danger)',
    icon: (s) => <PixelSkull size={s} color="var(--danger)" />,
    glyph: '!!',
    pattern: '▋',
  },
  decision: {
    accent: 'var(--accent-tertiary)',
    icon: (s) => <PixelShield size={s} color="var(--accent-tertiary)" />,
    glyph: '??',
    pattern: '▎',
  },
  '1on1': {
    accent: 'var(--accent-secondary)',
    icon: (s) => <PixelSword size={s} color="var(--accent-secondary)" />,
    glyph: '^^',
    pattern: '▎',
  },
  'project-update': {
    accent: 'var(--accent-primary)',
    icon: (s) => <PixelLightning size={s} color="var(--accent-primary)" />,
    glyph: '~>',
    pattern: '▎',
  },
  note: {
    accent: 'var(--text-muted)',
    icon: (s) => <PixelStar size={s} color="var(--text-muted)" />,
    glyph: '..',
    pattern: '▏',
  },
};

export { TYPE_CONFIG };

// Width of the accent strip varies by entry importance
const STRIP_WIDTH: Record<string, number> = {
  daily: 3,
  weekly: 4,
  monthly: 5,
  meeting: 3,
  incident: 5,
  decision: 3,
  '1on1': 3,
  'project-update': 3,
  note: 2,
};

export function EntryCard({ entry, isActive, onClick, compact, index = 0 }: Props) {
  const preview = entry.body
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^#+\s.*/gm, '')
    .replace(/[-*>]\s/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 120);

  const config = TYPE_CONFIG[entry.meta.type] || TYPE_CONFIG.note;
  const isArchived = !!(entry.meta as any).archived;
  const stripWidth = STRIP_WIDTH[entry.meta.type] || 2;

  return (
    <div
      onClick={onClick}
      className="entry-card"
      style={{
        display: 'flex',
        cursor: 'pointer',
        opacity: isArchived ? 0.3 : 1,
        position: 'relative',
        animation: `entrySlideIn 0.2s ease both`,
        animationDelay: `${Math.min(index * 25, 250)}ms`,
      }}
    >
      {/* Accent strip — width varies by type */}
      <div style={{
        width: stripWidth,
        flexShrink: 0,
        background: config.accent,
        opacity: isActive ? 1 : 0.7,
        transition: 'opacity 0.15s, width 0.15s',
      }} />

      {/* Icon column */}
      <div style={{
        width: 36,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: compact ? 8 : 12,
        position: 'relative',
      }}>
        <div style={{
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {config.icon(14)}
        </div>
        {/* Vertical connector */}
        <div style={{
          flex: 1,
          width: 1,
          background: 'var(--border)',
          marginTop: 4,
          opacity: 0.25,
        }} />
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: compact ? '6px 12px 6px 4px' : '8px 12px 10px 4px',
          borderBottom: '1px solid var(--border)',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.015)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Top row: type + date + collections */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: compact ? 1 : 3,
        }}>
          {/* Type glyph + badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: config.accent,
          }}>
            <span style={{ opacity: 0.4, fontSize: '8px' }}>{config.glyph}</span>
            {entry.meta.type === 'project-update' ? 'project' : entry.meta.type}
          </span>

          <span style={{
            margin: '0 6px',
            fontSize: '6px',
            color: 'var(--border)',
          }}>
            ·
          </span>

          {/* Date */}
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {format(parseISO(entry.meta.date), 'MMM dd')}
          </span>

          {/* Time if not midnight */}
          {entry.meta.created && format(parseISO(entry.meta.created), 'HH:mm') !== '00:00' && (
            <span style={{
              fontSize: '9px',
              color: 'var(--text-muted)',
              opacity: 0.4,
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: 4,
            }}>
              {format(parseISO(entry.meta.created), 'HH:mm')}
            </span>
          )}

          {/* Collections — right aligned */}
          {entry.meta.collections && entry.meta.collections.length > 0 && !compact && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted)',
              opacity: 0.35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}>
              {entry.meta.collections.slice(0, 2).join(' / ')}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: isActive ? config.accent : 'var(--text-primary)',
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {entry.meta.title}
        </div>

        {/* Preview */}
        {preview && !compact && (
          <p style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.45,
            marginTop: 2,
          }}>
            {preview}
          </p>
        )}

        {/* Tags row */}
        {entry.meta.tags.length > 0 && !compact && (
          <div style={{
            display: 'flex',
            gap: 10,
            marginTop: 5,
            flexWrap: 'wrap',
          }}>
            {entry.meta.tags.slice(0, 4).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {entry.meta.tags.length > 4 && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.4 }}>
                +{entry.meta.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
