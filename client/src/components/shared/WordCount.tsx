interface Props {
  content: string;
}

export function WordCount({ content }: Props) {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div style={{
      display: 'flex',
      gap: 16,
      fontSize: '10px',
      fontFamily: "'JetBrains Mono', monospace",
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      <span>{words} words</span>
      <span>{chars} chars</span>
      <span>{readingTime} min read</span>
    </div>
  );
}
