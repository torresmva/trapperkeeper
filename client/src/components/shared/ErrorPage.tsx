import { useState, useEffect } from 'react';

// ── 8-bit pixel art scene pieces ──

function PixelSun({ x, y }: { x: number; y: number }) {
  const grid = [
    '....#....',
    '..#.#.#..',
    '.#..#..#.',
    '...###...',
    '#.#####.#',
    '...###...',
    '.#..#..#.',
    '..#.#.#..',
    '....#....',
  ];
  const px = 4;
  return (
    <g transform={`translate(${x},${y})`}>
      {grid.map((row, gy) =>
        row.split('').map((cell, gx) =>
          cell === '#' ? <rect key={`${gx}-${gy}`} x={gx * px} y={gy * px} width={px} height={px} fill="#fb923c" /> : null
        )
      )}
    </g>
  );
}

function PixelPalm({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const grid = [
    '...##....',
    '..####...',
    '.######..',
    '####.###.',
    '##.###.##',
    '#..##..#.',
    '...##....',
    '...##....',
    '...##....',
    '...##....',
    '...##....',
    '..####...',
  ];
  const px = 3;
  return (
    <g transform={`translate(${x},${y})${flip ? ` scale(-1,1) translate(-${grid[0].length * px},0)` : ''}`}>
      {grid.map((row, gy) =>
        row.split('').map((cell, gx) =>
          cell === '#' ? (
            <rect key={`${gx}-${gy}`} x={gx * px} y={gy * px} width={px} height={px}
              fill={gy < 6 ? '#4ade80' : '#a0522d'} />
          ) : null
        )
      )}
    </g>
  );
}

function PixelDino({ x, y }: { x: number; y: number }) {
  const grid = [
    '...####.',
    '...#####',
    '...####.',
    '..####..',
    '#.#####.',
    '########',
    '.#####..',
    '..##.#..',
    '..#..#..',
  ];
  const px = 4;
  return (
    <g transform={`translate(${x},${y})`}>
      {grid.map((row, gy) =>
        row.split('').map((cell, gx) =>
          cell === '#' ? <rect key={`${gx}-${gy}`} x={gx * px} y={gy * px} width={px} height={px} fill="#22d3ee" /> : null
        )
      )}
    </g>
  );
}

function PixelCactus({ x, y }: { x: number; y: number }) {
  const grid = [
    '..##..',
    '..##..',
    '#.##.#',
    '####.#',
    '.####.',
    '..##..',
    '..##..',
    '.####.',
  ];
  const px = 3;
  return (
    <g transform={`translate(${x},${y})`}>
      {grid.map((row, gy) =>
        row.split('').map((cell, gx) =>
          cell === '#' ? <rect key={`${gx}-${gy}`} x={gx * px} y={gy * px} width={px} height={px} fill="#4ade80" /> : null
        )
      )}
    </g>
  );
}

function PixelCloud({ x, y }: { x: number; y: number }) {
  const grid = [
    '..###..',
    '.#####.',
    '#######',
    '#######',
  ];
  const px = 3;
  return (
    <g transform={`translate(${x},${y})`}>
      {grid.map((row, gy) =>
        row.split('').map((cell, gx) =>
          cell === '#' ? <rect key={`${gx}-${gy}`} x={gx * px} y={gy * px} width={px} height={px} fill="rgba(255,255,255,0.08)" /> : null
        )
      )}
    </g>
  );
}

function PixelBird({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={0} y={4} width={3} height={3} fill="var(--text-muted)" />
      <rect x={3} y={0} width={3} height={3} fill="var(--text-muted)" />
      <rect x={9} y={0} width={3} height={3} fill="var(--text-muted)" />
      <rect x={12} y={4} width={3} height={3} fill="var(--text-muted)" />
    </g>
  );
}

// ── Ground line ──
function Ground({ width }: { width: number }) {
  return (
    <>
      <rect x={0} y={196} width={width} height={4} fill="var(--border)" />
      {/* Pixel grass tufts */}
      {Array.from({ length: Math.floor(width / 12) }, (_, i) => (
        <rect key={i} x={i * 12 + 2} y={193} width={3} height={3}
          fill={i % 3 === 0 ? '#4ade80' : 'transparent'} opacity={0.3} />
      ))}
    </>
  );
}

// ── Main scene ──
function PixelScene() {
  return (
    <svg width="480" height="200" viewBox="0 0 480 200" style={{ imageRendering: 'pixelated', maxWidth: '100%' }}>
      <PixelSun x={380} y={20} />
      <PixelCloud x={60} y={30} />
      <PixelCloud x={240} y={15} />
      <PixelBird x={140} y={50} />
      <PixelBird x={310} y={40} />
      <PixelPalm x={30} y={126} />
      <PixelPalm x={400} y={130} flip />
      <PixelCactus x={180} y={172} />
      <PixelDino x={250} y={160} />
      <PixelCactus x={340} y={175} />
      <Ground width={480} />
    </svg>
  );
}

// ── Error messages ──
const ERROR_LINES = [
  'something broke. probably not your fault.',
  'the bits got scrambled.',
  'a wild error appeared.',
  'oops. that wasn\'t supposed to happen.',
  'the server gremlins are at it again.',
  'a rift in the data continuum.',
  'this page wandered off.',
  'error: brain not found.',
];

interface Props {
  error?: Error | string | null;
  is404?: boolean;
  onReset?: () => void;
}

export function ErrorPage({ error, is404, onReset }: Props) {
  const [line] = useState(() => ERROR_LINES[Math.floor(Math.random() * ERROR_LINES.length)]);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const title = is404 ? '404' : 'error';
  const subtitle = is404 ? 'this page doesn\'t exist.' : line;
  const errorMsg = typeof error === 'string' ? error : error?.message;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
      gap: 0,
      padding: 24,
    }}>
      <PixelScene />

      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '48px',
        fontWeight: 700,
        color: 'var(--accent-primary)',
        letterSpacing: '-0.04em',
        marginTop: 24,
        lineHeight: 1,
      }}>
        {title}
      </div>

      <div style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginTop: 8,
        textAlign: 'center',
      }}>
        {subtitle}
      </div>

      {errorMsg && !is404 && (
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 12,
          padding: '8px 12px',
          borderLeft: '2px solid var(--danger)',
          maxWidth: 400,
          wordBreak: 'break-word',
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 24,
      }}>
        <a
          href="/"
          style={{
            color: 'var(--accent-primary)',
            fontSize: '12px',
            padding: '6px 16px',
            border: '1px solid var(--accent-primary)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
        >
          home
        </a>
        <button
          onClick={() => {
            if (onReset) onReset();
            else window.location.reload();
          }}
          style={{
            color: 'var(--text-secondary)',
            fontSize: '12px',
            padding: '6px 16px',
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          reload{dots}
        </button>
      </div>

      <div style={{
        fontSize: '9px',
        color: 'var(--text-muted)',
        marginTop: 32,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        trapperkeeper
      </div>
    </div>
  );
}
