import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  name: string;
}

export function WikiLink({ name }: Props) {
  const [preview, setPreview] = useState<{ title: string; snippet: string } | null>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<number>();
  const navigate = useNavigate();

  const handleMouseEnter = async (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPos({ x: rect.left, y: rect.bottom + 4 });
    timeoutRef.current = window.setTimeout(async () => {
      try {
        // Search for the linked entry
        const res = await fetch(`/api/search?q=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (data.length > 0) {
          setPreview({ title: data[0].title, snippet: data[0].body?.slice(0, 150) || '' });
          setShow(true);
        }
      } catch {
        // silently ignore fetch errors
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const handleClick = () => {
    // Navigate to search for this term
    navigate(`/search?q=${encodeURIComponent(name)}`);
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          color: 'var(--accent-primary)',
          cursor: 'pointer',
          borderBottom: '1px dashed var(--accent-primary)',
          transition: 'opacity 0.15s',
        }}
      >
        {name}
      </span>
      {show && preview && (
        <div style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 3000,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: '10px 14px',
          maxWidth: 300,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
            {preview.title}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>
            {preview.snippet}...
          </div>
        </div>
      )}
    </>
  );
}
