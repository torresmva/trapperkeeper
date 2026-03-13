import { useState, useMemo } from 'react';

const RATE_UNITS = [
  { label: 'bits/s', short: 'bps', factor: 1 },
  { label: 'Kilobits/s', short: 'Kbps', factor: 1e3 },
  { label: 'Megabits/s', short: 'Mbps', factor: 1e6 },
  { label: 'Gigabits/s', short: 'Gbps', factor: 1e9 },
  { label: 'Terabits/s', short: 'Tbps', factor: 1e12 },
  { label: 'Bytes/s', short: 'B/s', factor: 8 },
  { label: 'Kilobytes/s', short: 'KB/s', factor: 8e3 },
  { label: 'Megabytes/s', short: 'MB/s', factor: 8e6 },
  { label: 'Gigabytes/s', short: 'GB/s', factor: 8e9 },
];

const SIZE_UNITS = [
  { label: 'Megabytes', short: 'MB', factor: 8e6 },
  { label: 'Gigabytes', short: 'GB', factor: 8e9 },
  { label: 'Terabytes', short: 'TB', factor: 8e12 },
  { label: 'Petabytes', short: 'PB', factor: 8e15 },
];

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

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '12px',
  padding: '6px 8px',
  outline: 'none',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
  fontWeight: 600,
};

const cellStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', monospace",
  borderBottom: '1px solid var(--border)',
};

function formatValue(n: number): string {
  if (n === 0) return '0';
  if (n >= 1e15) return n.toExponential(4);
  if (n < 0.001) return n.toExponential(4);
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toPrecision(4);
}

function formatDuration(seconds: number): string {
  if (seconds < 0.001) return '< 1ms';
  if (seconds < 1) return `${(seconds * 1000).toFixed(1)}ms`;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toFixed(0)}s`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

export function RateCalc() {
  const [mode, setMode] = useState<'convert' | 'transfer'>('convert');

  // Rate converter
  const [rateValue, setRateValue] = useState('1');
  const [rateUnit, setRateUnit] = useState(2); // Mbps

  // Transfer time
  const [transferSize, setTransferSize] = useState('1');
  const [transferSizeUnit, setTransferSizeUnit] = useState(1); // GB
  const [transferRate, setTransferRate] = useState('100');
  const [transferRateUnit, setTransferRateUnit] = useState(2); // Mbps

  const rateResults = useMemo(() => {
    const val = parseFloat(rateValue);
    if (isNaN(val) || val < 0) return [];
    const bps = val * RATE_UNITS[rateUnit].factor;
    return RATE_UNITS.map((u, i) => ({
      label: u.label,
      short: u.short,
      value: formatValue(bps / u.factor),
      isCurrent: i === rateUnit,
    }));
  }, [rateValue, rateUnit]);

  const transferResult = useMemo(() => {
    const size = parseFloat(transferSize);
    const rate = parseFloat(transferRate);
    if (isNaN(size) || isNaN(rate) || rate <= 0 || size < 0) return null;
    const bits = size * SIZE_UNITS[transferSizeUnit].factor;
    const bps = rate * RATE_UNITS[transferRateUnit].factor;
    const seconds = bits / bps;
    return {
      formatted: formatDuration(seconds),
      breakdown: [
        { label: 'seconds', value: formatValue(seconds) },
        { label: 'minutes', value: formatValue(seconds / 60) },
        { label: 'hours', value: formatValue(seconds / 3600) },
        { label: 'days', value: formatValue(seconds / 86400) },
      ],
    };
  }, [transferSize, transferSizeUnit, transferRate, transferRateUnit]);

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {([
          { id: 'convert' as const, label: 'convert rates' },
          { id: 'transfer' as const, label: 'transfer time' },
        ]).map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              background: mode === m.id ? 'var(--accent-primary)' : 'transparent',
              color: mode === m.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${mode === m.id ? 'var(--accent-primary)' : 'var(--border)'}`,
              padding: '6px 16px',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              fontWeight: mode === m.id ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'convert' ? (
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>value</div>
              <input
                type="number"
                value={rateValue}
                onChange={e => setRateValue(e.target.value)}
                style={inputStyle}
                min="0"
                step="any"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>unit</div>
              <select
                value={rateUnit}
                onChange={e => setRateUnit(Number(e.target.value))}
                style={selectStyle}
              >
                {RATE_UNITS.map((u, i) => (
                  <option key={i} value={i}>{u.label} ({u.short})</option>
                ))}
              </select>
            </div>
          </div>

          {rateResults.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {rateResults.map(r => (
                  <tr key={r.label} style={{
                    background: r.isCurrent ? 'var(--bg-surface-hover)' : 'transparent',
                  }}>
                    <td style={{
                      ...cellStyle,
                      color: r.isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      width: '35%',
                    }}>
                      {r.label}
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({r.short})</span>
                    </td>
                    <td style={{
                      ...cellStyle,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                      fontWeight: r.isCurrent ? 600 : 400,
                    }}>
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>data size</div>
              <input
                type="number"
                value={transferSize}
                onChange={e => setTransferSize(e.target.value)}
                style={inputStyle}
                min="0"
                step="any"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>unit</div>
              <select
                value={transferSizeUnit}
                onChange={e => setTransferSizeUnit(Number(e.target.value))}
                style={selectStyle}
              >
                {SIZE_UNITS.map((u, i) => (
                  <option key={i} value={i}>{u.label} ({u.short})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>link speed</div>
              <input
                type="number"
                value={transferRate}
                onChange={e => setTransferRate(e.target.value)}
                style={inputStyle}
                min="0"
                step="any"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>unit</div>
              <select
                value={transferRateUnit}
                onChange={e => setTransferRateUnit(Number(e.target.value))}
                style={selectStyle}
              >
                {RATE_UNITS.map((u, i) => (
                  <option key={i} value={i}>{u.label} ({u.short})</option>
                ))}
              </select>
            </div>
          </div>

          {transferResult && (
            <div>
              <div style={{
                borderLeft: '2px solid var(--accent-primary)',
                padding: '12px 16px',
                marginBottom: 20,
              }}>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}>
                  estimated transfer time
                </div>
                <div style={{
                  fontSize: '24px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  letterSpacing: '-0.03em',
                }}>
                  {transferResult.formatted}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {transferResult.breakdown.map(b => (
                    <tr key={b.label}>
                      <td style={{ ...cellStyle, color: 'var(--text-secondary)', fontSize: '12px', width: '35%' }}>
                        {b.label}
                      </td>
                      <td style={{ ...cellStyle, color: 'var(--text-primary)', textAlign: 'right' }}>
                        {b.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
