interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderTop: '1px solid var(--border)',
      marginTop: 12,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      color: 'var(--text-muted)',
    }}>
      <span>{total} total</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: page <= 1 ? 'var(--text-muted)' : 'var(--accent-primary)',
            padding: '4px 8px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: page <= 1 ? 'default' : 'pointer',
            opacity: page <= 1 ? 0.4 : 1,
          }}
        >
          prev
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: page >= totalPages ? 'var(--text-muted)' : 'var(--accent-primary)',
            padding: '4px 8px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: page >= totalPages ? 'default' : 'pointer',
            opacity: page >= totalPages ? 0.4 : 1,
          }}
        >
          next
        </button>
      </div>
    </div>
  );
}
