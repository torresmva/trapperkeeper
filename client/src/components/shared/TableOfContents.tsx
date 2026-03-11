import { useState, useMemo } from 'react';

interface Props {
  content: string;
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

export function TableOfContents({ content }: Props) {
  const [expanded, setExpanded] = useState(true);

  const headings = useMemo(() => {
    const result: Heading[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{1,4})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*_`\[\]]/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        result.push({ level, text, id });
      }
    }
    return result;
  }, [content]);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map(h => h.level));

  return (
    <div style={{
      borderLeft: '2px solid var(--accent-primary)',
      padding: '8px 0 8px 14px',
      marginBottom: 20,
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          fontSize: '9px',
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--accent-primary)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          marginBottom: expanded ? 8 : 0,
        }}
      >
        {expanded ? '\u25BE' : '\u25B8'} contents
      </button>
      {expanded && (
        <div>
          {headings.map((h, i) => (
            <div
              key={i}
              style={{
                paddingLeft: (h.level - minLevel) * 14,
                marginBottom: 3,
              }}
            >
              <a
                href={`#${h.id}`}
                style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: h.level <= 2 ? 'var(--text-secondary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  borderBottom: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = h.level <= 2 ? 'var(--text-secondary)' : 'var(--text-muted)'}
              >
                {h.text}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
