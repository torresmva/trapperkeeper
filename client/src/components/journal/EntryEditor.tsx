import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry } from '../../types';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { LivePreview } from '../editor/LivePreview';
import { TagBadge } from '../shared/TagBadge';
import { FullPreviewModal } from '../shared/FullPreviewModal';
import { PixelStar, PixelGhost } from '../shared/PixelArt';
import { AudioRecorder } from '../shared/AudioRecorder';
import { WordCount } from '../shared/WordCount';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useSpace } from '../../contexts/SpaceContext';

function buildFullMarkdown(meta: Record<string, any>, tags: string[], collections: string[], pinnedIn: string[], body: string): string {
  const fm = ['---'];
  fm.push(`title: "${meta.title || ''}"`);
  fm.push(`date: ${meta.date || ''}`);
  fm.push(`type: ${meta.type || ''}`);
  fm.push(`category: ${meta.category || ''}`);
  if (tags.length > 0) fm.push(`tags: [${tags.join(', ')}]`);
  if (collections.length > 0) fm.push(`collections: [${collections.join(', ')}]`);
  if (pinnedIn.length > 0) fm.push(`pinnedInCollections: [${pinnedIn.join(', ')}]`);
  if (meta.space) fm.push(`space: ${meta.space}`);
  if (meta.archived) fm.push(`archived: true`);
  fm.push(`created: ${meta.created || ''}`);
  fm.push(`modified: ${meta.modified || ''}`);
  fm.push('---', '', body);
  return fm.join('\n');
}

export function EntryEditor() {
  const { '*': id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [pinnedIn, setPinnedIn] = useState<string[]>([]);
  const [entrySpace, setEntrySpace] = useState<string | undefined>(undefined);
  const [newTag, setNewTag] = useState('');
  const [newCollection, setNewCollection] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() =>
    window.innerWidth <= 768 ? 'editor' : 'split'
  );
  const [fullPreview, setFullPreview] = useState(false);
  const [backlinks, setBacklinks] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [archived, setArchived] = useState(false);
  const [archiveFeedback, setArchiveFeedback] = useState(false);
  const [dupeFeedback, setDupeFeedback] = useState(false);
  const { spaces, addSpace } = useSpace();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getEntry(id),
      api.getBacklinks(id).catch(() => []),
    ]).then(([e, bl]) => {
      if (e) {
        setEntry(e);
        setBody(e.body);
        setTags(e.meta.tags);
        setCollections(e.meta.collections || []);
        setPinnedIn(e.meta.pinnedInCollections || []);
        setArchived(!!(e.meta as any).archived);
        setEntrySpace(e.meta.space || undefined);
      }
      setBacklinks(bl);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(async () => {
    if (!entry || !id) return;
    setSaveStatus('saving');
    try {
      await api.updateEntry(id, {
        ...entry.meta,
        tags,
        collections,
        pinnedInCollections: pinnedIn,
        space: entrySpace,
        modified: new Date().toISOString(),
      }, body);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
    }
  }, [entry, id, body, tags, collections, pinnedIn, entrySpace]);

  useAutoSave(save, [body, tags, collections, pinnedIn, entrySpace]);

  const markUnsaved = () => setSaveStatus('unsaved');

  const handleBodyChange = (val: string) => {
    setBody(val);
    markUnsaved();
  };

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags([...tags, t]); markUnsaved(); }
    setNewTag('');
  };

  const addCollection = () => {
    const c = newCollection.trim().toLowerCase();
    if (c && !collections.includes(c)) { setCollections([...collections, c]); markUnsaved(); }
    setNewCollection('');
  };

  const togglePin = (coll: string) => {
    if (pinnedIn.includes(coll)) {
      setPinnedIn(pinnedIn.filter(c => c !== coll));
    } else {
      setPinnedIn([...pinnedIn, coll]);
    }
    markUnsaved();
  };

  const fullMarkdown = useMemo(() => {
    if (!entry) return body;
    return buildFullMarkdown(entry.meta, tags, collections, pinnedIn, body);
  }, [entry, body, tags, collections, pinnedIn]);

  const handleCopyMd = async () => {
    try {
      await navigator.clipboard.writeText(fullMarkdown);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullMarkdown;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const handleArchive = async () => {
    if (!id) return;
    if (!archived && !confirm(`Archive this entry? It will be hidden from lists.`)) return;
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(id)}/archive`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        const isNowArchived = !!(data?.meta?.archived);
        setArchived(isNowArchived);
        setArchiveFeedback(true);
        setTimeout(() => setArchiveFeedback(false), 1500);
      }
    } catch (err) {
      console.error('Failed to archive entry:', err);
    }
  };

  const handleDuplicate = async () => {
    if (!entry) return;
    try {
      const now = new Date().toISOString();
      const newEntry = await api.createEntry({
        meta: {
          ...entry.meta,
          title: `${entry.meta.title} (copy)`,
          space: entrySpace,
          created: now,
          modified: now,
        },
        body,
        category: entry.meta.category,
      });
      setDupeFeedback(true);
      setTimeout(() => setDupeFeedback(false), 1500);
      const base = newEntry.meta.category === 'notes' ? '/notes' : '/journal';
      navigate(`${base}/${newEntry.id}`);
    } catch (err) {
      console.error('Failed to duplicate entry:', err);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this entry?')) return;
    await api.deleteEntry(id);
    navigate('/entries');
  };

  // Keyboard shortcut for full preview
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setFullPreview(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40 }}>
        <PixelGhost size={18} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>loading entry...</span>
      </div>
    );
  }

  if (!entry) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: 40 }}>entry not found</div>;
  }

  const statusColor = saveStatus === 'saved' ? 'var(--accent-green)' : saveStatus === 'saving' ? 'var(--accent-tertiary)' : 'var(--text-muted)';
  const btnColor = 'var(--text-primary)';

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;
      for (const file of Array.from(input.files)) {
        try {
          const result = await api.uploadImage(file);
          const isImage = file.type.startsWith('image/');
          const link = isImage
            ? `\n![${file.name}](/api/assets/files/${result.filename})\n`
            : `\n[${file.name}](/api/assets/files/${result.filename})\n`;
          handleBodyChange(body + link);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }
    };
    input.click();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
        marginBottom: 10,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => navigate('/entries')}
          style={{ color: btnColor, fontSize: '11px', padding: '2px 0', background: 'transparent', textTransform: 'none' }}
        >
          {'<-'} back
        </button>

        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {entry.meta.title}
        </h2>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: statusColor,
            animation: saveStatus === 'saving' ? 'pulse 1s infinite' : 'none',
          }} />
          <span style={{ fontSize: '10px', color: statusColor, letterSpacing: '0.04em' }}>{saveStatus}</span>
        </div>

        {/* View mode toggles */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)' }}>
          {(['editor', 'split', 'preview'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              color: viewMode === m ? 'var(--accent-primary)' : btnColor,
              fontSize: '10px', padding: '3px 8px', background: 'transparent',
              borderRight: m !== 'preview' ? '1px solid var(--border)' : 'none',
              textTransform: 'none',
            }}>
              {m}
            </button>
          ))}
        </div>

        <button onClick={() => setFullPreview(true)} style={{
          color: btnColor, fontSize: '10px', padding: '3px 8px',
          border: '1px solid var(--border)', background: 'transparent', textTransform: 'none',
        }}>
          full <kbd style={{ fontSize: '8px', opacity: 0.6, marginLeft: 2 }}>^P</kbd>
        </button>

        <button onClick={handleCopyMd} style={{
          color: copyFeedback ? 'var(--accent-green)' : btnColor,
          fontSize: '10px', padding: '3px 8px', border: '1px solid var(--border)',
          background: 'transparent', textTransform: 'none',
          transition: 'color 0.15s',
        }}>
          {copyFeedback ? 'copied!' : 'copy md'}
        </button>

        <button onClick={handleDuplicate} style={{
          color: dupeFeedback ? 'var(--accent-green)' : btnColor,
          fontSize: '10px', padding: '3px 8px', border: '1px solid var(--border)',
          background: 'transparent', textTransform: 'none',
          transition: 'color 0.15s',
        }}>
          {dupeFeedback ? 'duped!' : 'dupe'}
        </button>

        <button onClick={handleArchive} style={{
          color: archiveFeedback ? 'var(--accent-green)' : archived ? 'var(--accent-tertiary)' : btnColor,
          fontSize: '10px', padding: '3px 8px',
          border: '1px solid var(--border)', background: 'transparent', textTransform: 'none',
        }}>
          {archiveFeedback ? (archived ? 'archived!' : 'restored!') : archived ? 'unarchive' : 'archive'}
        </button>

        <button onClick={handleDelete} style={{
          color: 'var(--danger)', fontSize: '10px', padding: '3px 8px',
          border: '1px solid var(--border)', background: 'transparent', textTransform: 'none',
        }}>
          del
        </button>

        <AudioRecorder onRecordingComplete={(url) => {
          const audioTag = `\n\n<audio controls src="${url}"></audio>\n`;
          handleBodyChange(body + audioTag);
        }} />

        <button onClick={handleUpload} style={{
          color: btnColor, fontSize: '10px', padding: '3px 8px',
          border: '1px solid var(--border)', background: 'transparent', textTransform: 'none',
        }}>
          upload
        </button>
      </div>

      {archived && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-tertiary)',
          borderLeft: '3px solid var(--accent-tertiary)',
          padding: '8px 14px',
          marginBottom: 10,
          fontSize: '11px',
          color: 'var(--accent-tertiary)',
          letterSpacing: '0.02em',
        }}>
          this entry is archived
        </div>
      )}

      {/* Metadata row: type, date, space */}
      <div style={{
        display: 'flex',
        gap: 16,
        paddingBottom: 8,
        marginBottom: 8,
        borderBottom: '1px solid var(--border)',
        fontSize: '10px',
        color: 'var(--text-secondary)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span>
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>type</span>
          <span style={{ color: 'var(--accent-primary)' }}>{entry.meta.type}</span>
        </span>
        <span>
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>date</span>
          {entry.meta.date}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>space</span>
          <select
            value={entrySpace || ''}
            onChange={e => {
              const val = e.target.value || undefined;
              setEntrySpace(val);
              markUnsaved();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: entrySpace ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '0 2px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="" style={{ background: 'var(--bg-primary)' }}>none</option>
            {spaces.map(s => (
              <option key={s} value={s} style={{ background: 'var(--bg-primary)' }}>{s}</option>
            ))}
          </select>
          <input
            placeholder="+ new"
            style={{
              width: 44,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '0 2px',
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
                if (val) {
                  addSpace(val);
                  setEntrySpace(val);
                  markUnsaved();
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
        </span>
        <span>
          <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>created</span>
          {new Date(entry.meta.created).toLocaleString()}
        </span>
      </div>

      {/* Tags + Collections row */}
      <div style={{
        display: 'flex',
        gap: 16,
        paddingBottom: 8,
        marginBottom: 8,
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        alignItems: 'center',
        fontSize: '11px',
      }}>
        {/* Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>tags</span>
          {tags.map(tag => (
            <TagBadge key={tag} tag={tag} removable onRemove={() => { setTags(tags.filter(t => t !== tag)); markUnsaved(); }} />
          ))}
          <input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
            placeholder="+"
            style={{ width: 50, padding: '1px 0', fontSize: '11px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent' }}
          />
        </div>

        <span style={{ color: 'var(--border)' }}>|</span>

        {/* Collections */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>in</span>
          {collections.map(coll => (
            <span key={coll} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span
                onClick={() => togglePin(coll)}
                style={{ cursor: 'pointer', display: 'inline-flex' }}
                title={pinnedIn.includes(coll) ? 'Unpin from collection' : 'Pin in collection'}
              >
                <PixelStar size={10} color={pinnedIn.includes(coll) ? 'var(--accent-tertiary)' : 'var(--text-muted)'} />
              </span>
              <span style={{ color: 'var(--accent-secondary)', fontSize: '11px' }}>{coll}</span>
              <span
                onClick={() => { setCollections(collections.filter(c => c !== coll)); setPinnedIn(pinnedIn.filter(c => c !== coll)); markUnsaved(); }}
                style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '9px', opacity: 0.5 }}
              >x</span>
            </span>
          ))}
          <input
            value={newCollection}
            onChange={e => setNewCollection(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCollection(); }}
            placeholder="+"
            style={{ width: 50, padding: '1px 0', fontSize: '11px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{ flex: 1, display: 'flex', gap: 1, minHeight: 0 }}>
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div style={{
            flex: 1, minWidth: 0,
            borderRight: viewMode === 'split' ? '1px solid var(--border)' : 'none',
          }}>
            <MarkdownEditor value={body} onChange={handleBodyChange} />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <LivePreview content={body} />
          </div>
        )}
      </div>

      {/* Word count */}
      <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 10 }}>
        <WordCount content={body} />
      </div>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          marginTop: 10,
        }}>
          <span style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            backlinks ({backlinks.length})
          </span>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            {backlinks.map(bl => (
              <span
                key={bl.id}
                onClick={() => {
                  const base = bl.meta.category === 'notes' ? '/notes' : '/journal';
                  navigate(`${base}/${bl.id}`);
                }}
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  borderBottom: '1px solid transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = 'var(--accent-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
              >
                {bl.meta.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full preview modal */}
      <FullPreviewModal
        open={fullPreview}
        onClose={() => setFullPreview(false)}
        content={body}
        title={entry.meta.title}
      />
    </div>
  );
}
