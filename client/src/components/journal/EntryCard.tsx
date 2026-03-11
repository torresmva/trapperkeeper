import { Entry } from '../../types';
import { TagBadge } from '../shared/TagBadge';
import { format, parseISO } from 'date-fns';

interface Props {
  entry: Entry;
  isActive: boolean;
  onClick: () => void;
}

const typeAccents: Record<string, string> = {
  daily: 'var(--accent-primary)',
  weekly: 'var(--accent-secondary)',
  monthly: 'var(--accent-tertiary)',
};

export function EntryCard({ entry, isActive, onClick }: Props) {
  const preview = entry.body
    .replace(/^#+\s.*/gm, '')
    .replace(/[-*]\s/g, '')
    .trim()
    .slice(0, 140);

  const accentColor = typeAccents[entry.meta.type] || 'var(--text-muted)';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 0 14px 16px',
        borderLeft: `2px solid ${isActive ? accentColor : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        background: isActive ? 'var(--accent-primary-dim)' : 'transparent',
        animation: 'fadeIn 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.borderLeftColor = accentColor;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.borderLeftColor = 'var(--border)';
      }}
    >
      {/* Top line: date + type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          minWidth: 56,
        }}>
          {format(parseISO(entry.meta.date), 'MMM dd')}
        </span>
        <span style={{
          fontSize: '9px',
          color: accentColor,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {entry.meta.type}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        marginBottom: preview ? 6 : 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {entry.meta.title}
      </div>

      {/* Preview */}
      {preview && (
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: entry.meta.tags.length > 0 ? 8 : 0,
        }}>
          {preview}
        </p>
      )}

      {/* Tags */}
      {entry.meta.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {entry.meta.tags.slice(0, 4).map(tag => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
