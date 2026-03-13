import { useState, useMemo } from 'react';

const UNITS = [
  { label: 'Bits', short: 'b', factor: 1 },
  { label: 'Bytes', short: 'B', factor: 8 },
  { label: 'Kilobytes', short: 'KB', factor: 8e3 },
  { label: 'Kibibytes', short: 'KiB', factor: 8 * 1024 },
  { label: 'Megabytes', short: 'MB', factor: 8e6 },
  { label: 'Mebibytes', short: 'MiB', factor: 8 * Math.pow(1024, 2) },
  { label: 'Gigabytes', short: 'GB', factor: 8e9 },
  { label: 'Gibibytes', short: 'GiB', factor: 8 * Math.pow(1024, 3) },
  { label: 'Terabytes', short: 'TB', factor: 8e12 },
  { label: 'Tebibytes', short: 'TiB', factor: 8 * Math.pow(1024, 4) },
  { label: 'Petabytes', short: 'PB', factor: 8e15 },
  { label: 'Pebibytes', short: 'PiB', factor: 8 * Math.pow(1024, 5) },
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

export function SizeCalc() {
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState(6); // GB

  const results = useMemo(() => {
    const val = parseFloat(value);
    if (isNaN(val) || val < 0) return [];
    const bits = val * UNITS[unit].factor;
    return UNITS.map((u, i) => ({
      label: u.label,
      short: u.short,
      value: formatValue(bits / u.factor),
      isCurrent: i === unit,
    }));
  }, [value, unit]);

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>value</div>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            style={inputStyle}
            min="0"
            step="any"
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>unit</div>
          <select
            value={unit}
            onChange={e => setUnit(Number(e.target.value))}
            style={selectStyle}
          >
            {UNITS.map((u, i) => (
              <option key={i} value={i}>{u.label} ({u.short})</option>
            ))}
          </select>
        </div>
      </div>

      {results.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {results.map(r => (
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
  );
}
