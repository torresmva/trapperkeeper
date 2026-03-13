import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useSpace } from '../../contexts/SpaceContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuickCapture({ open, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { activeSpace } = useSpace();

  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setTags('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const entry = await api.quickNote({
        title: title || undefined,
        body,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        space: activeSpace || undefined,
      });
      onClose();
      navigate(`/notes/${entry.id}`);
    } catch (err) {
      console.error('Quick capture failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '18vh',
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-primary)',
          padding: 0,
          width: 500,
          animation: 'fadeIn 0.12s ease',
          boxShadow: 'var(--glow-primary)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}>
          <span style={{ color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em' }}>
            capture
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            ctrl+enter to save / esc to close
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '16px' }}>
          <input
            placeholder="title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              marginBottom: 12,
              fontSize: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              letterSpacing: '-0.02em',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              padding: '4px 0',
            }}
          />

          <textarea
            ref={textareaRef}
            placeholder="start typing..."
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{
              width: '100%',
              minHeight: 140,
              resize: 'vertical',
              fontSize: '13px',
              lineHeight: 1.7,
              border: '1px solid var(--border)',
              padding: '12px',
              background: 'var(--bg-primary)',
            }}
          />

          <input
            placeholder="tags (comma-separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
            style={{ width: '100%', marginTop: 12, fontSize: '12px' }}
          />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              fontSize: '11px',
              background: 'transparent',
              padding: '4px 10px',
            }}
          >
            cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !body.trim()}
            style={{
              color: 'var(--accent-primary)',
              fontSize: '11px',
              padding: '4px 12px',
              border: '1px solid var(--accent-primary)',
              background: 'transparent',
              opacity: loading || !body.trim() ? 0.3 : 1,
            }}
          >
            {loading ? 'saving...' : 'save'}
          </button>
        </div>
      </div>
    </div>
  );
}
