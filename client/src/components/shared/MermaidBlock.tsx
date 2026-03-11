import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

function initMermaid() {
  if (initialized) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
    themeVariables: theme === 'dark' ? {
      primaryColor: '#22d3ee',
      primaryTextColor: '#d4d4d4',
      primaryBorderColor: '#222222',
      lineColor: '#525252',
      secondaryColor: '#111111',
      tertiaryColor: '#0a0a0a',
      background: '#050505',
      mainBkg: '#111111',
      nodeBorder: '#22d3ee',
      clusterBkg: '#0c0c0c',
      titleColor: '#d4d4d4',
      edgeLabelBackground: '#111111',
    } : {},
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
  });
  initialized = true;
}

interface Props {
  chart: string;
}

export function MermaidBlock({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    initMermaid();
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    mermaid.render(id, chart)
      .then(({ svg }) => {
        setSvg(svg);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Failed to render diagram');
      });
  }, [chart]);

  if (error) {
    return (
      <pre style={{
        borderLeft: '2px solid var(--danger)',
        padding: '12px 16px',
        fontSize: '11px',
        color: 'var(--danger)',
        background: 'var(--bg-surface)',
        margin: '12px 0',
      }}>
        mermaid error: {error}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{
        margin: '16px 0',
        padding: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        textAlign: 'center',
        overflow: 'auto',
      }}
    />
  );
}
