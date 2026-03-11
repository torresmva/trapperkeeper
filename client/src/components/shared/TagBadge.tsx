interface Props {
  tag: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

const accentCycle = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  'var(--accent-tertiary)',
  'var(--accent-green)',
];

function getAccent(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return accentCycle[Math.abs(hash) % accentCycle.length];
}

export function TagBadge({ tag, onClick, removable, onRemove }: Props) {
  const accent = getAccent(tag);
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        color: accent,
        fontSize: '11px',
        fontWeight: 400,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span style={{ opacity: 0.5 }}>#</span>{tag}
      {removable && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          style={{ cursor: 'pointer', marginLeft: 2, opacity: 0.4, fontSize: '10px' }}
        >
          x
        </span>
      )}
    </span>
  );
}
