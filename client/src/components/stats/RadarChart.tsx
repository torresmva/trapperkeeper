import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RadarData } from '../../types';

const WINDOWS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '365d', value: 365 },
];

const BY_OPTIONS = [
  { label: 'collections', value: 'collections' },
  { label: 'tags', value: 'tags' },
];

export function RadarChart() {
  const [data, setData] = useState<RadarData | null>(null);
  const [window, setWindow] = useState(30);
  const [by, setBy] = useState('collections');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getRadar(window, by)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [window, by]);

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;

  const renderChart = () => {
    if (!data || data.axes.length < 3) {
      return (
        <div style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          not enough data
        </div>
      );
    }

    const n = data.axes.length;
    const angleStep = (2 * Math.PI) / n;
    const maxValue = Math.max(...data.axes.map(a => a.value), 1);

    const getPoint = (i: number, r: number) => {
      const angle = -Math.PI / 2 + i * angleStep;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    };

    const polygonPoints = (r: number) =>
      Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, r);
        return `${p.x},${p.y}`;
      }).join(' ');

    const dataPoints = data.axes.map((axis, i) => {
      const r = (axis.value / maxValue) * radius;
      return getPoint(i, r);
    });

    const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%' }}>
        {/* Concentric polygons */}
        {[0.33, 0.66, 1].map(scale => (
          <polygon
            key={scale}
            points={polygonPoints(radius * scale)}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const p = getPoint(i, radius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="var(--accent-primary)"
          fillOpacity="0.15"
          stroke="var(--accent-primary)"
          strokeWidth="1.5"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--accent-primary)"
          />
        ))}

        {/* Labels */}
        {data.axes.map((axis, i) => {
          const p = getPoint(i, radius + 18);
          const angle = -Math.PI / 2 + i * angleStep;
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (Math.cos(angle) > 0.3) textAnchor = 'start';
          else if (Math.cos(angle) < -0.3) textAnchor = 'end';

          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fill="var(--text-muted)"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
            >
              {axis.name.length > 10 ? axis.name.slice(0, 10) + '..' : axis.name}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        radar
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {WINDOWS.map(w => (
            <button
              key={w.value}
              onClick={() => setWindow(w.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: window === w.value ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '10px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderBottom: window === w.value ? '1px solid var(--accent-primary)' : '1px solid transparent',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {BY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setBy(opt.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: by === opt.value ? 'var(--accent-secondary)' : 'var(--text-muted)',
                fontSize: '10px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderBottom: by === opt.value ? '1px solid var(--accent-secondary)' : '1px solid transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        border: '1px solid var(--border)',
        padding: 16,
        display: 'flex',
        justifyContent: 'center',
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}>
        {renderChart()}
      </div>
    </div>
  );
}
