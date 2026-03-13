import { useState } from 'react';
import { api } from '../../api/client';
import { PixelTrophy, PixelCrown, PixelScroll, PixelRocket, PixelBorder } from '../shared/PixelArt';
import { useRandomQuote } from '../../hooks/useQuotes';

const formats = [
  { value: 'brag-doc', label: 'brag doc', icon: <PixelTrophy size={14} color="var(--accent-tertiary)" />, desc: 'self-review / impact summary grouped by collection' },
  { value: 'resume-bullets', label: 'resume', icon: <PixelCrown size={14} color="var(--accent-tertiary)" />, desc: 'bullet points extracted from journal entries' },
  { value: 'blog-draft', label: 'blog', icon: <PixelScroll size={14} color="var(--accent-primary)" />, desc: 'full entries formatted as blog sections' },
  { value: 'markdown-bundle', label: 'full', icon: <PixelRocket size={14} color="var(--accent-secondary)" />, desc: 'complete markdown export with metadata' },
];


export function ExportPage() {
  const [format, setFormat] = useState('brag-doc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const flavor = useRandomQuote('exports', 'show your work. you earned it.');
  const activeFormat = formats.find(f => f.value === format)!;

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await api.exportEntries({
        format,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : undefined,
      });
      setPreview(result);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trapperkeeper-${format}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
        }}>
          export
        </h1>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
        }}>
          {flavor}
        </div>
      </div>

      {/* Format selector — vertical cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        marginBottom: 24,
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}>
        {formats.map(f => {
          const isActive = format === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '12px',
                background: isActive ? 'var(--bg-surface)' : 'var(--bg-primary)',
                border: 'none',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              {f.icon}
              <div>
                <div style={{
                  fontSize: '12px',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                  marginBottom: 2,
                }}>
                  {f.label}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}>
                  {f.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <PixelBorder />

      {/* Date range */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, marginTop: 24, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 4,
          }}>from</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 4,
          }}>to</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            color: 'var(--accent-primary)',
            fontSize: '11px',
            padding: '6px 14px',
            border: '1px solid var(--accent-primary)',
            background: 'transparent',
            opacity: loading ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'generating...' : 'generate'}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>output</span>
            <button
              onClick={handleCopy}
              style={{
                color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
                fontSize: '10px',
                padding: '2px 8px',
                background: 'transparent',
                border: `1px solid ${copied ? 'var(--accent-green)' : 'var(--border)'}`,
                textTransform: 'none',
                transition: 'all 0.15s',
              }}
            >
              {copied ? 'copied!' : 'copy'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                color: 'var(--text-muted)',
                fontSize: '10px',
                padding: '2px 8px',
                background: 'transparent',
                border: '1px solid var(--border)',
                textTransform: 'none',
              }}
            >
              download
            </button>
          </div>
          <pre style={{
            background: 'var(--code-bg)',
            borderLeft: '2px solid var(--accent-primary)',
            padding: '16px 20px',
            fontSize: '12px',
            lineHeight: 1.7,
            maxHeight: 500,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            color: 'var(--text-secondary)',
          }}>
            {preview}
          </pre>
        </div>
      )}
    </div>
  );
}
