import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { EntryMeta } from '../../types';
import { useSpace } from '../../contexts/SpaceContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string, category: string) => void;
}

const allTypes = [
  { value: 'daily', label: 'daily', accent: 'var(--accent-primary)', category: 'journal' as const },
  { value: 'weekly', label: 'weekly', accent: 'var(--accent-secondary)', category: 'journal' as const },
  { value: 'monthly', label: 'monthly', accent: 'var(--accent-tertiary)', category: 'journal' as const },
  { value: 'meeting', label: 'meeting', accent: 'var(--accent-green)', category: 'notes' as const },
  { value: 'incident', label: 'incident', accent: 'var(--danger)', category: 'journal' as const },
  { value: 'decision', label: 'decision', accent: 'var(--accent-tertiary)', category: 'journal' as const },
  { value: '1on1', label: '1:1', accent: 'var(--accent-secondary)', category: 'notes' as const },
  { value: 'project-update', label: 'project', accent: 'var(--accent-primary)', category: 'journal' as const },
];

export function NewEntryDialog({ open, onClose, onCreated }: Props) {
  const { activeSpace } = useSpace();
  const [selectedType, setSelectedType] = useState('daily');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [collections, setCollections] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateBody, setTemplateBody] = useState('');
  const [templateLoaded, setTemplateLoaded] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setTags('');
      setCollections('');
      setSelectedType('daily');
      setTemplateBody('');
      setTemplateLoaded(false);
    }
  }, [open]);

  // Fetch template when type changes
  useEffect(() => {
    if (!open) return;
    setTemplateLoaded(false);
    setTemplateBody('');
    api.getTemplate(selectedType)
      .then(tmpl => {
        const body = tmpl.expanded.replace(/^---[\s\S]*?---\n*/m, '').trim();
        setTemplateBody(body);
        setTemplateLoaded(true);
      })
      .catch(() => {
        setTemplateBody('');
        setTemplateLoaded(false);
      });
  }, [selectedType, open]);

  if (!open) return null;

  const typeInfo = allTypes.find(t => t.value === selectedType) || allTypes[0];

  const handleCreate = async () => {
    setLoading(true);
    try {
      const body = templateBody;

      const now = new Date();
      const meta: EntryMeta = {
        title: title || `${selectedType} - ${now.toLocaleDateString()}`,
        date: now.toISOString().split('T')[0],
        type: selectedType as EntryMeta['type'],
        category: typeInfo.category,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        collections: collections ? collections.split(',').map(c => c.trim()).filter(Boolean) : [],
        pinned: false,
        archived: false,
        pinnedInCollections: [],
        links: [],
        space: activeSpace || undefined,
        created: now.toISOString(),
        modified: now.toISOString(),
      };

      const entry = await api.createEntry({ meta, body, category: typeInfo.category });
      onCreated(entry.id, typeInfo.category);
      onClose();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '24px 28px',
          width: 440,
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '16px', fontWeight: 600, marginBottom: 20,
          color: 'var(--text-primary)', letterSpacing: '-0.02em',
        }}>
          new entry
        </h2>

        {/* Type grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          marginBottom: 20,
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          {allTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              style={{
                padding: '8px 4px',
                background: selectedType === type.value ? 'var(--bg-primary)' : 'var(--bg-surface)',
                color: selectedType === type.value ? type.accent : 'var(--text-muted)',
                fontSize: '10px',
                textTransform: 'lowercase',
                borderBottom: selectedType === type.value ? `2px solid ${type.accent}` : '2px solid transparent',
                letterSpacing: '0.02em',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>title</label>
          <input placeholder="auto-generated if empty" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>tags</label>
          <input placeholder="comma-separated" value={tags} onChange={e => setTags(e.target.value)} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>collections</label>
          <input placeholder="e.g. impact, meetings" value={collections} onChange={e => setCollections(e.target.value)} />
        </div>

        {activeSpace && (
          <div style={{
            fontSize: '10px',
            color: 'var(--accent-primary)',
            marginBottom: 12,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>space</span>
            <span>{activeSpace}</span>
          </div>
        )}

        {templateLoaded && (
          <div style={{
            fontSize: '10px',
            color: 'var(--accent-primary)',
            marginBottom: 12,
            letterSpacing: '0.04em',
            opacity: 0.8,
          }}>
            template loaded
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '11px', background: 'transparent', padding: '6px 12px' }}>
            cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              color: typeInfo.accent, fontSize: '11px', padding: '6px 14px',
              border: `1px solid ${typeInfo.accent}`, background: 'transparent',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'creating...' : 'create'}
          </button>
        </div>
      </div>
    </div>
  );
}
