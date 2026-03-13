import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { WikiTreeNode } from '../../types';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { LivePreview } from '../editor/LivePreview';
import { FullPreviewModal } from '../shared/FullPreviewModal';
import { WordCount } from '../shared/WordCount';
import { TagBadge } from '../shared/TagBadge';
import { PixelScroll, PixelGhost, PixelFolder } from '../shared/PixelArt';
import { WikiTreePanel } from './WikiTreeNav';
import { useSpace } from '../../contexts/SpaceContext';

interface WikiPageData {
  id: string;
  title: string;
  parent?: string | null;
  tags: string[];
  created: string;
  modified: string;
  order?: number | null;
  body?: string;
}

type PageMode = 'read' | 'edit';

/** Find the path from root to a target node in the tree */
function findPathToNode(nodes: WikiTreeNode[], targetId: string, path: WikiTreeNode[] = []): WikiTreeNode[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.id === targetId) return currentPath;
    if (node.children.length > 0) {
      const found = findPathToNode(node.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
}

export function WikiPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { activeSpace } = useSpace();
  const [tree, setTree] = useState<WikiTreeNode[]>([]);
  const [currentPage, setCurrentPage] = useState<WikiPageData | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [parent, setParent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [mode, setMode] = useState<PageMode>('read');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() =>
    window.innerWidth <= 768 ? 'editor' : 'split'
  );
  const [fullPreview, setFullPreview] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const skipAutoSave = useRef(false);

  // Load tree (for breadcrumbs and child listings)
  const loadTree = useCallback(async () => {
    try {
      setTree(await api.getWikiTree(activeSpace || undefined));
    } catch {}
  }, [activeSpace]);

  useEffect(() => { loadTree().finally(() => setLoading(false)); }, [loadTree]);

  // Reload tree on wiki changes
  useEffect(() => {
    const handler = () => loadTree();
    window.addEventListener('tk-wiki-tree-changed', handler);
    return () => window.removeEventListener('tk-wiki-tree-changed', handler);
  }, [loadTree]);

  // Load page when slug changes — start in read mode
  useEffect(() => {
    if (slug) {
      api.getWikiPage(slug).then((raw: any) => {
        const page: WikiPageData = {
          id: raw.id,
          title: raw.title || raw.meta?.title || 'untitled',
          parent: raw.parent ?? raw.meta?.parent ?? null,
          tags: raw.tags || raw.meta?.tags || [],
          created: raw.created || raw.meta?.created || '',
          modified: raw.modified || raw.meta?.modified || '',
          order: raw.order ?? raw.meta?.order ?? null,
          body: raw.body ?? '',
        };
        skipAutoSave.current = true;
        setCurrentPage(page);
        setTitle(page.title);
        setBody(page.body || '');
        setTags(page.tags);
        setParent(page.parent || '');
        setSaveStatus('saved');
        setMode('read');
      }).catch(() => setCurrentPage(null));
    } else {
      setCurrentPage(null);
      setTitle(''); setBody(''); setTags([]); setParent('');
      setMode('read');
    }
  }, [slug]);

  // Auto-save (only in edit mode)
  useEffect(() => {
    if (!currentPage || mode !== 'edit') return;
    if (skipAutoSave.current) { skipAutoSave.current = false; return; }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('unsaved');
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      api.updateWikiPage(currentPage.id, { title, body, parent: parent || undefined, tags })
        .then(() => {
          setSaveStatus('saved');
          loadTree();
          window.dispatchEvent(new Event('tk-wiki-tree-changed'));
        })
        .catch(() => setSaveStatus('unsaved'));
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, body, tags, parent]);

  const handleNavigate = useCallback((id: string) => {
    navigate(`/wiki/${id}`);
  }, [navigate]);

  const handleNewPage = async (parentSlug?: string) => {
    try {
      const raw: any = await api.createWikiPage({ title: 'untitled', parent: parentSlug || undefined, space: activeSpace || undefined });
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
      navigate(`/wiki/${raw.id}`);
      setTimeout(() => setMode('edit'), 100);
    } catch {}
  };

  const handleDelete = async () => {
    if (!currentPage || !confirm(`delete "${currentPage.title}"? children will be reparented.`)) return;
    try {
      await api.deleteWikiPage(currentPage.id);
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
      navigate('/wiki');
    } catch {}
  };

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag('');
  };

  const buildFullMarkdown = useCallback(() => {
    if (!currentPage) return body;
    const fm = ['---', `title: "${title}"`, `created: ${currentPage.created}`, `modified: ${currentPage.modified}`];
    if (tags.length > 0) fm.push(`tags: [${tags.join(', ')}]`);
    if (parent) fm.push(`parent: ${parent}`);
    fm.push('---', '', body);
    return fm.join('\n');
  }, [currentPage, title, body, tags, parent]);

  const handleCopyMd = async () => {
    try { await navigator.clipboard.writeText(buildFullMarkdown()); } catch {}
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  // Keyboard: Ctrl+P full preview, Ctrl+E toggle edit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setFullPreview(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (currentPage) setMode(prev => prev === 'read' ? 'edit' : 'read');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage]);

  // Breadcrumb path
  const breadcrumb = useMemo(() => slug ? findPathToNode(tree, slug) : null, [tree, slug]);

  // Child pages of current page
  const childPages = useMemo(() => {
    if (!slug) return [];
    function findNode(nodes: WikiTreeNode[]): WikiTreeNode | null {
      for (const n of nodes) {
        if (n.id === slug) return n;
        const found = findNode(n.children);
        if (found) return found;
      }
      return null;
    }
    return findNode(tree)?.children || [];
  }, [tree, slug]);

  const statusColor = saveStatus === 'saved' ? 'var(--accent-green)' : saveStatus === 'saving' ? 'var(--accent-tertiary)' : 'var(--text-muted)';

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* ─── Tree Panel (own pane) ─── */}
      <WikiTreePanel activeSlug={slug || null} onNavigate={handleNavigate} />

      {/* ─── Content ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 32 }}>
            <PixelGhost size={18} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>loading...</span>
          </div>
        ) : !currentPage ? (
          /* ─── No page selected ─── */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            padding: 32,
          }}>
            <PixelScroll size={32} color="var(--text-muted)" />
            <p style={{
              fontSize: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              select a page
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', maxWidth: 300 }}>
              choose from the tree or create a new page
            </p>
          </div>
        ) : mode === 'read' ? (
          /* ─── READ MODE ─── */
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
            {/* Breadcrumb */}
            {breadcrumb && breadcrumb.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                marginBottom: 16,
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {breadcrumb.map((node, i) => (
                  <span key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && <span style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 6px' }}>/</span>}
                    <span
                      onClick={() => navigate(`/wiki/${node.id}`)}
                      style={{
                        color: i === breadcrumb.length - 1 ? 'var(--accent-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: i === breadcrumb.length - 1 ? 600 : 400,
                      }}
                      onMouseEnter={e => { if (i < breadcrumb.length - 1) e.currentTarget.style.color = 'var(--accent-primary)'; }}
                      onMouseLeave={e => { if (i < breadcrumb.length - 1) e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      {node.title}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                flex: 1,
                lineHeight: 1.3,
                margin: 0,
              }}>
                {title}
              </h1>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingTop: 4 }}>
                <button
                  onClick={() => setMode('edit')}
                  style={{
                    color: 'var(--accent-primary)',
                    fontSize: '10px',
                    padding: '3px 10px',
                    border: '1px solid var(--accent-primary)',
                    background: 'transparent',
                    textTransform: 'none',
                    cursor: 'pointer',
                  }}
                >
                  edit <kbd style={{ fontSize: '8px', opacity: 0.5, marginLeft: 2 }}>^E</kbd>
                </button>
                <button
                  onClick={handleCopyMd}
                  style={{
                    color: copyFeedback ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontSize: '10px',
                    padding: '3px 8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    textTransform: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {copyFeedback ? 'copied!' : 'copy md'}
                </button>
              </div>
            </div>

            {/* Meta */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <span>{new Date(currentPage.modified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {tags.length > 0 && (
                <>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                  </div>
                </>
              )}
            </div>

            {/* Body */}
            <div style={{ marginTop: 20 }}>
              <LivePreview content={body} />
            </div>

            {/* Child pages */}
            {childPages.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 24 }}>
                <div style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <PixelFolder size={10} color="var(--text-muted)" />
                  sub-pages ({childPages.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {childPages.map(child => (
                    <button
                      key={child.id}
                      onClick={() => navigate(`/wiki/${child.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: 'transparent',
                        border: 'none',
                        borderLeft: '2px solid var(--border)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 0.15s, background 0.1s',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderLeftColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                        e.currentTarget.style.background = 'rgba(34,211,238,0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderLeftColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {child.children.length > 0
                        ? <PixelFolder size={11} color="var(--text-muted)" />
                        : <PixelScroll size={10} color="var(--text-muted)" />
                      }
                      <span style={{ flex: 1 }}>{child.title}</span>
                      {child.children.length > 0 && (
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.5 }}>
                          {child.children.length} sub
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleNewPage(slug)}
                  style={{
                    marginTop: 8,
                    color: 'var(--accent-primary)',
                    fontSize: '10px',
                    padding: '4px 10px',
                    background: 'transparent',
                    border: '1px solid var(--accent-primary)',
                    cursor: 'pointer',
                    textTransform: 'none',
                  }}
                >
                  + new sub-page
                </button>
              </div>
            )}

            {/* Add sub-page prompt */}
            {childPages.length === 0 && body.trim() && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 24 }}>
                <button
                  onClick={() => handleNewPage(slug)}
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    padding: '4px 10px',
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    cursor: 'pointer',
                    textTransform: 'none',
                    opacity: 0.6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  + add sub-page
                </button>
              </div>
            )}

            {/* Word count */}
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 16 }}>
              <WordCount content={body} />
            </div>
          </div>
        ) : (
          /* ─── EDIT MODE (split pane) ─── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => setMode('read')}
                style={{
                  color: 'var(--text-muted)', fontSize: '11px', padding: '2px 0',
                  background: 'transparent', textTransform: 'none', cursor: 'pointer', border: 'none',
                }}
              >
                {'<-'} read
              </button>

              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  flex: 1, minWidth: 120, background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', fontWeight: 600,
                  letterSpacing: '-0.02em', padding: '2px 0', outline: 'none',
                }}
                placeholder="page title"
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 5, height: 5, background: statusColor,
                  animation: saveStatus === 'saving' ? 'pulse 1s infinite' : 'none',
                }} />
                <span style={{ fontSize: '10px', color: statusColor, letterSpacing: '0.04em' }}>{saveStatus}</span>
              </div>

              {/* View mode toggle */}
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)' }}>
                {(['editor', 'split', 'preview'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)} style={{
                    color: viewMode === m ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontSize: '10px', padding: '3px 8px', background: 'transparent',
                    borderRight: m !== 'preview' ? '1px solid var(--border)' : 'none',
                    textTransform: 'none', cursor: 'pointer', border: m !== 'preview' ? undefined : 'none',
                  }}>
                    {m}
                  </button>
                ))}
              </div>

              <button onClick={() => setFullPreview(true)} style={{
                color: 'var(--text-muted)', fontSize: '10px', padding: '3px 8px',
                border: '1px solid var(--border)', background: 'transparent', textTransform: 'none', cursor: 'pointer',
              }}>
                full <kbd style={{ fontSize: '8px', opacity: 0.5, marginLeft: 2 }}>^P</kbd>
              </button>

              <button onClick={handleCopyMd} style={{
                color: copyFeedback ? 'var(--accent-green)' : 'var(--text-muted)',
                fontSize: '10px', padding: '3px 8px', border: '1px solid var(--border)',
                background: 'transparent', textTransform: 'none', cursor: 'pointer', transition: 'color 0.15s',
              }}>
                {copyFeedback ? 'copied!' : 'copy md'}
              </button>

              <button onClick={() => handleNewPage(currentPage.id)} style={{
                color: 'var(--accent-secondary)', fontSize: '10px', padding: '3px 8px',
                border: '1px solid var(--accent-secondary)', background: 'transparent',
                textTransform: 'none', cursor: 'pointer',
              }}>
                + sub
              </button>

              <button onClick={handleDelete} style={{
                color: 'var(--danger)', fontSize: '10px', padding: '3px 8px',
                background: 'transparent', textTransform: 'none', opacity: 0.5, border: 'none', cursor: 'pointer',
              }}>
                del
              </button>
            </div>

            {/* Tags + Parent */}
            <div style={{
              display: 'flex', gap: 16, padding: '6px 16px',
              borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
              alignItems: 'center', fontSize: '11px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>tags</span>
                {tags.map(tag => (
                  <TagBadge key={tag} tag={tag} removable onRemove={() => setTags(tags.filter(t => t !== tag))} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>parent</span>
                <select
                  value={parent}
                  onChange={e => setParent(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)', border: 'none',
                    borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)',
                    fontSize: '11px', padding: '2px 0', outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <option value="">none (root)</option>
                  {(() => {
                    const pageId = currentPage!.id;
                    const opts: { id: string; title: string; depth: number }[] = [];
                    function flatten(nodes: WikiTreeNode[], d: number) {
                      for (const n of nodes) {
                        if (n.id !== pageId) {
                          opts.push({ id: n.id, title: n.title, depth: d });
                          flatten(n.children, d + 1);
                        }
                      }
                    }
                    flatten(tree, 0);
                    return opts.map(o => (
                      <option key={o.id} value={o.id}>
                        {'  '.repeat(o.depth)}{o.depth > 0 ? '└ ' : ''}{o.title}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* Split pane editor */}
            <div style={{ flex: 1, display: 'flex', gap: 0, minHeight: 0 }}>
              {(viewMode === 'editor' || viewMode === 'split') && (
                <div style={{
                  flex: 1, minWidth: 0,
                  borderRight: viewMode === 'split' ? '1px solid var(--border)' : 'none',
                }}>
                  <MarkdownEditor value={body} onChange={setBody} />
                </div>
              )}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '16px 20px' }}>
                  <LivePreview content={body} />
                </div>
              )}
            </div>

            {/* Word count */}
            <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border)' }}>
              <WordCount content={body} />
            </div>

            <FullPreviewModal
              open={fullPreview}
              onClose={() => setFullPreview(false)}
              content={body}
              title={title}
            />
          </div>
        )}
      </div>
    </div>
  );
}
