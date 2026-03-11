import { useState } from 'react';
import { api } from '../../api/client';

const formats = [
  { value: 'resume-bullets', label: 'resume' },
  { value: 'blog-draft', label: 'blog' },
  { value: 'markdown-bundle', label: 'full' },
];

export function ExportPage() {
  const [format, setFormat] = useState('resume-bullets');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

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
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{
        marginBottom: 32,
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
      </div>

      {/* Format selector */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
      }}>
        {formats.map(f => (
          <button
            key={f.value}
            onClick={() => setFormat(f.value)}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              background: 'transparent',
              color: format === f.value ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: format === f.value ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: -1,
              textTransform: 'lowercase',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'flex-end' }}>
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
                color: 'var(--text-muted)',
                fontSize: '10px',
                padding: '2px 8px',
                background: 'transparent',
                border: '1px solid var(--border)',
                textTransform: 'none',
              }}
            >
              copy
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
