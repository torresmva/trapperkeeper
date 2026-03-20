import { useState, useEffect, useRef, useCallback } from 'react';
import { themes, themeVariants } from '../../styles/theme';

const ACCENT_PRESETS = [
  { name: 'cyan', color: '#22d3ee' },
  { name: 'pink', color: '#f472b6' },
  { name: 'orange', color: '#fb923c' },
  { name: 'green', color: '#4ade80' },
  { name: 'purple', color: '#a78bfa' },
  { name: 'red', color: '#f87171' },
  { name: 'yellow', color: '#facc15' },
];

/** Reset all dark theme CSS variables to their defaults */
function resetDarkThemeVars() {
  const el = document.documentElement;
  for (const [key, value] of Object.entries(themes.dark)) {
    el.style.setProperty(key, value);
  }
}

/** Apply a theme variant by name. Call on app mount to restore saved variant. */
export function applyThemeVariant(variantName: string) {
  const variant = themeVariants.find(v => v.name === variantName);
  if (!variant) return;

  // Always start from the base dark theme
  resetDarkThemeVars();

  // Apply variant overrides on top
  const el = document.documentElement;
  for (const [key, value] of Object.entries(variant.overrides)) {
    if (value !== undefined) {
      el.style.setProperty(key, value);
    }
  }

  // Set data-theme for CSS selectors
  el.setAttribute('data-theme', variantName === 'light' ? 'light' : 'dark');

  // If default variant, also restore saved accent color
  if (variantName === 'default') {
    const savedAccent = localStorage.getItem('tk-accent');
    if (savedAccent) {
      el.style.setProperty('--accent-primary', savedAccent);
    }
  }
}

const sectionLabel: React.CSSProperties = {
  fontSize: 8,
  fontFamily: 'JetBrains Mono, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  marginBottom: 6,
};

export function AccentPicker() {
  const [currentAccent, setCurrentAccent] = useState(
    () => localStorage.getItem('tk-accent') || '#22d3ee'
  );
  const [currentVariant, setCurrentVariant] = useState(
    () => localStorage.getItem('tk-theme-variant') || 'default'
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Restore variant + accent on mount
  useEffect(() => {
    applyThemeVariant(currentVariant);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVariantSelect = useCallback((variantName: string) => {
    setCurrentVariant(variantName);
    localStorage.setItem('tk-theme-variant', variantName);
    applyThemeVariant(variantName);
  }, []);

  const handleAccentSelect = useCallback((color: string) => {
    if (currentVariant !== 'default') return;
    setCurrentAccent(color);
    localStorage.setItem('tk-accent', color);
    document.documentElement.style.setProperty('--accent-primary', color);
    setOpen(false);
  }, [currentVariant]);

  const isNonDefault = currentVariant !== 'default';

  // Determine the button color: variant's primary accent, or saved accent
  const activeVariant = themeVariants.find(v => v.name === currentVariant);
  const buttonColor = isNonDefault
    ? (activeVariant?.overrides['--accent-primary'] || currentAccent)
    : currentAccent;

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 14,
          height: 14,
          background: buttonColor,
          border: '1px solid var(--border)',
          borderRadius: 0,
          cursor: 'pointer',
          padding: 0,
        }}
        title="theme & accent"
      />
      {open && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: 6,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: 10,
          width: 180,
          zIndex: 2000,
        }}>
          {/* theme variants section */}
          <div style={sectionLabel}>themes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
            {themeVariants.map(v => {
              const isActive = currentVariant === v.name;
              const variantAccent = v.overrides['--accent-primary'] || '#22d3ee';
              return (
                <button
                  key={v.name}
                  onClick={() => handleVariantSelect(v.name)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRadius: 0,
                    padding: '3px 4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: isActive ? variantAccent : 'var(--text-secondary)',
                    borderLeft: isActive ? `2px solid ${variantAccent}` : '2px solid transparent',
                  }}
                  title={v.description}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* accent colors section */}
          <div style={{
            ...sectionLabel,
            opacity: isNonDefault ? 0.35 : 1,
          }}>accent</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 20px)',
            gap: 6,
            opacity: isNonDefault ? 0.25 : 1,
            pointerEvents: isNonDefault ? 'none' : 'auto',
          }}>
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => handleAccentSelect(p.color)}
                style={{
                  width: 20,
                  height: 20,
                  background: p.color,
                  border: currentAccent === p.color && !isNonDefault
                    ? '2px solid var(--text-primary)'
                    : '1px solid var(--border)',
                  borderRadius: 0,
                  cursor: isNonDefault ? 'default' : 'pointer',
                  padding: 0,
                }}
                title={p.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
