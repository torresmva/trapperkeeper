interface Props {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        color: theme === 'dark' ? 'var(--accent-tertiary)' : 'var(--accent-primary)',
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        padding: 0,
        textTransform: 'none',
      }}
    >
      {theme === 'dark' ? 'lt' : 'dk'}
    </button>
  );
}
