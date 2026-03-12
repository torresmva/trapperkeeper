import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api/client';

export function ParkingLot() {
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.getParkingLot().then(res => {
      setContent(res.content);
      setLoaded(true);
    });
  }, []);

  const save = useCallback((text: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.saveParkingLot(text);
    }, 600);
  }, []);

  const handleChange = (text: string) => {
    setContent(text);
    save(text);
  };

  const lineCount = content.split('\n').filter(l => l.trim()).length;

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '8px 16px',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: '10px',
          color: lineCount > 0 ? 'var(--accent-tertiary)' : 'var(--text-muted)',
          letterSpacing: '0.06em',
        }}>
          {expanded ? '▾' : '▸'}
        </span>
        <span style={{
          fontSize: '10px',
          color: lineCount > 0 ? 'var(--accent-tertiary)' : 'var(--text-muted)',
          flex: 1,
          letterSpacing: '0.04em',
        }}>
          parking lot
        </span>
        {lineCount > 0 && !expanded && (
          <span style={{
            fontSize: '9px',
            color: 'var(--accent-tertiary)',
            opacity: 0.7,
          }}>
            {lineCount}
          </span>
        )}
      </div>

      {expanded && loaded && (
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder="dump it here..."
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 80,
            maxHeight: 200,
            marginTop: 6,
            padding: '6px 0',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}
