import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../api/client';
import { WallItem } from '../../types';
import { PixelBrick } from '../shared/PixelArt';

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  'var(--accent-tertiary)',
  'var(--accent-green)',
  'var(--text-muted)',
];

const FLAVOR = [
  'pin it, move it, forget about it — wait no, that\'s the point',
  'the quiet things that no one ever knows',
  'beautiful things in ugly spaces',
  'a space for the things that don\'t fit anywhere else',
];

export function WallPage() {
  const [items, setItems] = useState<WallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [flavor] = useState(() => FLAVOR[Math.floor(Math.random() * FLAVOR.length)]);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getWallItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const item = await api.createWallItem({ x, y, color, content: '', type: 'note' });
    setItems(prev => [...prev, item]);
    setEditingId(item.id);
  };

  const handleMouseDown = (e: React.MouseEvent, item: WallItem) => {
    if (editingId === item.id) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragItem(item.id);
    api.bringToFront(item.id);
    setItems(prev => {
      const maxZ = prev.reduce((m, i) => Math.max(m, i.zIndex), 0);
      return prev.map(i => i.id === item.id ? { ...i, zIndex: maxZ + 1 } : i);
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragItem || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    setItems(prev => prev.map(i => i.id === dragItem ? { ...i, x, y } : i));
  }, [dragItem, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (!dragItem) return;
    const item = items.find(i => i.id === dragItem);
    if (item) {
      api.updateWallItem(item.id, { x: item.x, y: item.y });
    }
    setDragItem(null);
  }, [dragItem, items]);

  useEffect(() => {
    if (dragItem) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragItem, handleMouseMove, handleMouseUp]);

  const handleContentChange = async (id: string, content: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, content } : i));
  };

  const handleContentBlur = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      await api.updateWallItem(id, { content: item.content });
    }
    setEditingId(null);
  };

  const handleColorChange = async (id: string, color: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, color } : i));
    await api.updateWallItem(id, { color });
  };

  const handleDelete = async (id: string) => {
    await api.deleteWallItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '0 0 16px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelBrick size={20} color="var(--accent-tertiary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            the wall
          </h1>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.5 }}>
            {items.length} items
          </span>
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
          paddingLeft: 32,
        }}>
          {flavor}
        </div>
      </div>

      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        marginBottom: 8,
        opacity: 0.5,
      }}>
        double-click empty space to add a note — drag to move
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onDoubleClick={handleAdd}
        style={{
          flex: 1,
          position: 'relative',
          minHeight: 500,
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          overflow: 'auto',
          cursor: dragItem ? 'grabbing' : 'crosshair',
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '-1px -1px',
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>
            loading...
          </div>
        )}

        {items.map(item => (
          <div
            key={item.id}
            onMouseDown={(e) => handleMouseDown(e, item)}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              width: item.width,
              minHeight: item.height,
              zIndex: item.zIndex,
              borderLeft: `3px solid ${item.color}`,
              borderTop: `1px solid ${item.color}20`,
              borderRight: `1px solid var(--border)`,
              borderBottom: `1px solid var(--border)`,
              background: 'var(--bg-surface)',
              cursor: editingId === item.id ? 'text' : 'grab',
              transition: dragItem === item.id ? 'none' : 'box-shadow 0.15s',
              boxShadow: dragItem === item.id
                ? `0 4px 20px ${item.color}20`
                : 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              gap: 4,
              borderBottom: '1px solid var(--border)',
            }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={(e) => { e.stopPropagation(); handleColorChange(item.id, c); }}
                  style={{
                    width: 8,
                    height: 8,
                    background: c,
                    border: item.color === c ? '1px solid var(--text-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
              <div style={{ flex: 1 }} />
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '9px',
                  cursor: 'pointer',
                  padding: '0 2px',
                  opacity: 0.4,
                }}
              >
                x
              </button>
            </div>

            {/* Content */}
            {editingId === item.id ? (
              <textarea
                autoFocus
                value={item.content}
                onChange={e => handleContentChange(item.id, e.target.value)}
                onBlur={() => handleContentBlur(item.id)}
                onKeyDown={e => {
                  if (e.key === 'Escape') handleContentBlur(item.id);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.6,
                  padding: '8px',
                  resize: 'none',
                  outline: 'none',
                  minHeight: 60,
                }}
              />
            ) : (
              <div
                onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: item.content ? 'var(--text-primary)' : 'var(--text-muted)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: 60,
                  cursor: 'text',
                }}
              >
                {item.content || 'click to type...'}
              </div>
            )}

            {/* Timestamp */}
            <div style={{
              padding: '2px 8px 4px',
              fontSize: '8px',
              color: 'var(--text-muted)',
              opacity: 0.4,
              textAlign: 'right',
            }}>
              {new Date(item.created).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
