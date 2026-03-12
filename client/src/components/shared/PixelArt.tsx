// 8-bit pixel art decorations

export function PixelTrophy({ size = 24, color = 'var(--accent-tertiary)' }: { size?: number; color?: string }) {
  // 8x8 pixel trophy
  const grid = [
    '..####..',
    '.######.',
    '#.####.#',
    '#.####.#',
    '.######.',
    '..####..',
    '...##...',
    '..####..',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelFire({ size = 24, color = 'var(--accent-tertiary)' }: { size?: number; color?: string }) {
  const grid = [
    '...##...',
    '..####..',
    '.##..##.',
    '.######.',
    '########',
    '.######.',
    '..####..',
    '...##...',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelStar({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '...#....',
    '...#....',
    '.#####..',
    '..###...',
    '.#.#.#..',
    '#..#..#.',
    '........',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelFolder({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '.###....',
    '########',
    '########',
    '########',
    '########',
    '########',
    '........',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelSword({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '......#.',
    '.....##.',
    '....##..',
    '...##...',
    '#.##....',
    '.###....',
    '.##.....',
    '#.......',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelHeart({ size = 16, color = 'var(--accent-secondary)' }: { size?: number; color?: string }) {
  const grid = [
    '.##..##.',
    '########',
    '########',
    '########',
    '.######.',
    '..####..',
    '...##...',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelSkull({ size = 16, color = 'var(--text-muted)' }: { size?: number; color?: string }) {
  const grid = [
    '..####..',
    '.######.',
    '#.##.##.',
    '########',
    '.######.',
    '..####..',
    '..#..#..',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelCoffee({ size = 16, color = 'var(--accent-tertiary)' }: { size?: number; color?: string }) {
  const grid = [
    '..#.#...',
    '.#.#.#..',
    '........',
    '.######.',
    '.######.',
    '.####.#.',
    '.####.#.',
    '..####..',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelLightning({ size = 16, color = 'var(--accent-tertiary)' }: { size?: number; color?: string }) {
  const grid = [
    '...####.',
    '..####..',
    '.####...',
    '######..',
    '..####..',
    '.####...',
    '####....',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelGhost({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '..####..',
    '.######.',
    '#.##.##.',
    '########',
    '########',
    '########',
    '#.##.##.',
    '#.##.##.',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelKey({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '..###...',
    '.#...#..',
    '.#...#..',
    '..###...',
    '...#....',
    '...##...',
    '...#....',
    '...##...',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelRocket({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '...##...',
    '..####..',
    '..####..',
    '.######.',
    '.######.',
    '..#..#..',
    '.#....#.',
    '#......#',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelShield({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '.######.',
    '########',
    '########',
    '########',
    '.######.',
    '..####..',
    '...##...',
    '....#...',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelCrown({ size = 16, color = 'var(--accent-tertiary)' }: { size?: number; color?: string }) {
  const grid = [
    '#..##..#',
    '##.##.##',
    '########',
    '########',
    '.######.',
    '.######.',
    '........',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelMusicNote({ size = 16, color = 'var(--accent-secondary)' }: { size?: number; color?: string }) {
  const grid = [
    '..#####.',
    '..#...#.',
    '..#...#.',
    '..#..##.',
    '..#.###.',
    '.##..##.',
    '###.....',
    '.##.....',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelScroll({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '.#####..',
    '#.....#.',
    '#.###..#',
    '#.###..#',
    '#.###..#',
    '#.....#.',
    '.#####..',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelPotion({ size = 16, color = 'var(--accent-green)' }: { size?: number; color?: string }) {
  const grid = [
    '..####..',
    '...##...',
    '..####..',
    '.######.',
    '.######.',
    '.######.',
    '..####..',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelUpload({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '...##...',
    '..####..',
    '.######.',
    '...##...',
    '...##...',
    '...##...',
    '.######.',
    '.######.',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelWrench({ size = 16, color = 'var(--accent-primary)' }: { size?: number; color?: string }) {
  const grid = [
    '#....#..',
    '##..##..',
    '.####...',
    '..##....',
    '..##....',
    '.####...',
    '.#..#...',
    '#....#..',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelBrick({ size = 16, color = 'var(--accent-tertiary)' }: { size?: number; color?: string }) {
  const grid = [
    '########',
    '###..###',
    '........',
    '########',
    '.###.###',
    '........',
    '########',
    '###..###',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelLock({ size = 16, color = 'var(--accent-secondary)' }: { size?: number; color?: string }) {
  const grid = [
    '..####..',
    '.#....#.',
    '.#....#.',
    '########',
    '###..###',
    '###..###',
    '########',
    '........',
  ];
  const px = size / 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '#' ? (
            <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}

export function PixelBorder({ width = '100%', color = 'var(--border)' }: { width?: string; color?: string }) {
  return (
    <div style={{
      width,
      height: 4,
      background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)`,
      imageRendering: 'pixelated',
    }} />
  );
}
