import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

function initMermaid() {
  if (initialized) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    logLevel: 5,
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

function cleanError(msg: string): string {
  const lines = msg.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('parse error') || lower.includes('syntax error') || lower.includes('expecting')) {
      return line.trim().slice(0, 150);
    }
    if (lower.includes('error') && !lower.includes('stack') && !lower.includes('at ')) {
      return line.trim().slice(0, 150);
    }
  }
  return (lines[0] || 'diagram syntax error').slice(0, 150);
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
        setError(cleanError(err.message || 'diagram syntax error'));
        // Clean up orphaned elements
        const el = document.getElementById(id);
        if (el) el.remove();
      });
  }, [chart]);

  if (error) {
    return (
      <div style={{
        borderLeft: '2px solid var(--danger)',
        padding: '8px 12px',
        fontSize: '10px',
        color: 'var(--danger)',
        background: 'var(--bg-surface)',
        margin: '12px 0',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.5,
      }}>
        diagram error: {error}
      </div>
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
