import { useState, useEffect } from 'react';

const ACCENT_PRESETS = [
  { name: 'cyan', color: '#22d3ee' },
  { name: 'pink', color: '#f472b6' },
  { name: 'orange', color: '#fb923c' },
  { name: 'green', color: '#4ade80' },
  { name: 'purple', color: '#a78bfa' },
  { name: 'red', color: '#f87171' },
  { name: 'yellow', color: '#facc15' },
];

export function AccentPicker() {
  const [current, setCurrent] = useState(() => localStorage.getItem('tk-accent') || '#22d3ee');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', current);
    document.documentElement.style.setProperty('--glow', `${current}15`);
  }, [current]);

  const handleSelect = (color: string) => {
    setCurrent(color);
    localStorage.setItem('tk-accent', color);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 14,
          height: 14,
          background: current,
          border: '1px solid var(--border)',
          cursor: 'pointer',
          padding: 0,
        }}
        title="Accent color"
      />
      {open && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: 6,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: 8,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 20px)',
          gap: 6,
          zIndex: 2000,
        }}>
          {ACCENT_PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => handleSelect(p.color)}
              style={{
                width: 20,
                height: 20,
                background: p.color,
                border: current === p.color ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                cursor: 'pointer',
                padding: 0,
              }}
              title={p.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
