import { useEffect, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

export function FullPreviewModal({ open, onClose, content, title }: Props) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-primary)',
      }}
      tabIndex={-1}
    >
      {/* Top bar */}
      <div style={{
        height: 40,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        gap: 12,
      }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
        <button
          onClick={handleCopy}
          style={{
            fontSize: '10px',
            color: copyFeedback ? 'var(--success)' : 'var(--text-muted)',
            background: 'transparent',
            border: '1px solid var(--border)',
            padding: '3px 10px',
            textTransform: 'none',
            transition: 'color 0.15s',
          }}
        >
          {copyFeedback ? 'copied!' : 'copy md'}
        </button>
        <button
          onClick={onClose}
          style={{
            fontSize: '10px',
            color: 'var(--accent-primary)',
            background: 'transparent',
            border: '1px solid var(--border)',
            padding: '3px 10px',
            textTransform: 'none',
          }}
        >
          esc to close
        </button>
      </div>

      {/* Content */}
      <div
        className="markdown-preview"
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px 48px 48px',
          maxWidth: 800,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
