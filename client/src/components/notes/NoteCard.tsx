import { Entry } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  entry: Entry;
  onClick: () => void;
}

export function NoteCard({ entry, onClick }: Props) {
  const preview = entry.body.trim().slice(0, 120);

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 0 12px 16px',
        borderLeft: '2px solid var(--border)',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        animation: 'fadeIn 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = 'var(--accent-secondary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = 'var(--border)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entry.meta.title}
        </span>
        <span style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {format(parseISO(entry.meta.created), 'MMM dd HH:mm')}
        </span>
      </div>
      {preview && (
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {preview}
        </p>
      )}
    </div>
  );
}
