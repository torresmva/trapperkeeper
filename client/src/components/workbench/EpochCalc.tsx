import { useState, useEffect, useCallback } from 'react';

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '14px',
  padding: '6px 0',
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
  fontWeight: 600,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 12px',
  borderBottom: '1px solid var(--border)',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', monospace",
};

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

function formatDate(d: Date): { rows: [string, string][] } {
  const rows: [string, string][] = [
    ['unix seconds', String(Math.floor(d.getTime() / 1000))],
    ['unix milliseconds', String(d.getTime())],
    ['ISO 8601', d.toISOString()],
    ['UTC', d.toUTCString()],
    ['local', d.toLocaleString()],
    ['date', `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`],
    ['time (local)', `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`],
    ['time (UTC)', `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`],
    ['day of week', d.toLocaleDateString(undefined, { weekday: 'long' })],
    ['day of year', String(Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000))],
    ['week number', String(getWeekNumber(d))],
    ['timezone', Intl.DateTimeFormat().resolvedOptions().timeZone],
    ['tz offset', `UTC${d.getTimezoneOffset() <= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(d.getTimezoneOffset()) / 60))}:${pad(Math.abs(d.getTimezoneOffset()) % 60)}`],
  ];
  return { rows };
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const jan4 = new Date(target.getFullYear(), 0, 4);
  return 1 + Math.round(((target.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

function parseInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pure number — epoch
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed);
    // Seconds (10 digits) vs milliseconds (13 digits)
    if (trimmed.length <= 10) {
      return new Date(n * 1000);
    }
    return new Date(n);
  }

  // Negative number — epoch before 1970
  if (/^-\d+$/.test(trimmed)) {
    const n = parseInt(trimmed);
    if (trimmed.length <= 11) return new Date(n * 1000);
    return new Date(n);
  }

  // Try ISO / date string
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  return null;
}

export function EpochCalc() {
  const [input, setInput] = useState('');
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed = input ? parseInput(input) : null;
  const display = parsed || new Date(now);
  const isLive = !input || !parsed;
  const { rows } = formatDate(display);

  const copyValue = useCallback((label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  // Relative time from now
  const relativeTime = parsed ? (() => {
    const diff = parsed.getTime() - Date.now();
    const abs = Math.abs(diff);
    const suffix = diff < 0 ? 'ago' : 'from now';
    if (abs < 60000) return `${Math.floor(abs / 1000)}s ${suffix}`;
    if (abs < 3600000) return `${Math.floor(abs / 60000)}m ${suffix}`;
    if (abs < 86400000) return `${Math.floor(abs / 3600000)}h ${Math.floor((abs % 3600000) / 60000)}m ${suffix}`;
    if (abs < 2592000000) return `${Math.floor(abs / 86400000)}d ${suffix}`;
    if (abs < 31536000000) return `${Math.floor(abs / 2592000000)}mo ${suffix}`;
    return `${(abs / 31536000000).toFixed(1)}y ${suffix}`;
  })() : null;

  return (
    <div style={{ maxWidth: 520 }}>
      {/* Live clock display */}
      <div style={{
        borderLeft: '2px solid var(--accent-primary)',
        padding: '8px 16px',
        marginBottom: 20,
      }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}>
          {isLive ? 'now' : 'parsed'}
        </div>
        <div style={{
          fontSize: '20px',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          color: 'var(--accent-primary)',
          letterSpacing: '-0.02em',
        }}>
          {isLive ? Math.floor(now / 1000) : Math.floor(display.getTime() / 1000)}
        </div>
        {relativeTime && (
          <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', marginTop: 4 }}>
            {relativeTime}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ marginBottom: 24 }}>
        <div style={labelStyle}>convert timestamp or date string</div>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          style={inputStyle}
          placeholder="1710288000, 1710288000000, 2024-03-13T00:00:00Z ..."
          spellCheck={false}
        />
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4 }}>
          {!input && 'showing live clock — type a value to convert'}
          {input && !parsed && 'unrecognized format'}
          {input && parsed && `detected: ${/^\d+$/.test(input.trim()) ? (input.trim().length <= 10 ? 'unix seconds' : 'unix milliseconds') : 'date string'}`}
        </div>
      </div>

      {/* Results */}
      <div>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{ ...rowStyle, cursor: 'pointer' }}
            onClick={() => copyValue(label, value)}
            title="click to copy"
          >
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{label}</span>
            <span style={{
              color: copied === label ? 'var(--accent-green)' : 'var(--text-primary)',
              fontWeight: 500,
              transition: 'color 0.15s',
            }}>
              {copied === label ? 'copied' : value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
