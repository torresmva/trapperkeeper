import { useState, useRef, useEffect } from 'react';

interface Props {
  language: string;
  children: React.ReactNode;
  rawCode: string;
}

const LANG_LABELS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  bash: 'bash',
  zsh: 'zsh',
  yml: 'yaml',
  yaml: 'yaml',
  json: 'json',
  md: 'markdown',
  css: 'css',
  html: 'html',
  sql: 'sql',
  go: 'go',
  rs: 'rust',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  toml: 'toml',
  xml: 'xml',
  graphql: 'graphql',
  tf: 'terraform',
  hcl: 'hcl',
};

export function CodeBlock({ language, children, rawCode }: Props) {
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const codeRef = useRef<HTMLPreElement>(null);

  const displayLang = LANG_LABELS[language] || language;

  useEffect(() => {
    const lines = rawCode.split('\n').length;
    setLineCount(lines);
  }, [rawCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ margin: '16px 0', position: 'relative' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        borderLeft: '2px solid var(--accent-primary)',
        borderBottom: '1px solid var(--border)',
        padding: '4px 12px 4px 14px',
        minHeight: 28,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: displayLang ? 'var(--accent-primary)' : 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {displayLang || 'code'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <button
            onClick={handleCopy}
            style={{
              fontSize: '9px',
              color: copied ? 'var(--success)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              padding: '2px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {copied ? 'copied!' : 'copy'}
          </button>
        </div>
      </div>

      {/* Code area with line numbers */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Line numbers gutter */}
        <div
          aria-hidden
          style={{
            background: 'var(--code-bg)',
            borderLeft: '2px solid var(--accent-primary)',
            padding: '14px 0',
            userSelect: 'none',
            textAlign: 'right',
            minWidth: lineCount > 99 ? 44 : 34,
            flexShrink: 0,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                lineHeight: '1.7',
                color: 'var(--text-muted)',
                paddingRight: 10,
                opacity: 0.6,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code content */}
        <pre
          ref={codeRef}
          style={{
            flex: 1,
            background: 'var(--code-bg)',
            borderLeft: 'none',
            margin: 0,
            padding: '14px 16px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {children}
        </pre>
      </div>
    </div>
  );
}
