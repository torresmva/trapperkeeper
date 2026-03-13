import { useState, useEffect, useCallback, useRef, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { WikiTreeNode } from '../../types';
import { PixelScroll } from '../shared/PixelArt';
import { useSpace } from '../../contexts/SpaceContext';

/* ─── Helpers ─── */

function findPathToNode(nodes: WikiTreeNode[], targetId: string, path: WikiTreeNode[] = []): WikiTreeNode[] | null {
  for (const node of nodes) {
    const cur = [...path, node];
    if (node.id === targetId) return cur;
    if (node.children.length > 0) {
      const found = findPathToNode(node.children, targetId, cur);
      if (found) return found;
    }
  }
  return null;
}

function isDescendant(nodes: WikiTreeNode[], ancestorId: string, nodeId: string): boolean {
  function find(items: WikiTreeNode[]): WikiTreeNode | null {
    for (const n of items) {
      if (n.id === ancestorId) return n;
      const found = find(n.children);
      if (found) return found;
    }
    return null;
  }
  const ancestor = find(nodes);
  if (!ancestor) return false;
  return !!findPathToNode(ancestor.children, nodeId);
}

function getAllIds(nodes: WikiTreeNode[]): string[] {
  const ids: string[] = [];
  for (const n of nodes) { ids.push(n.id); ids.push(...getAllIds(n.children)); }
  return ids;
}

function countAllNodes(nodes: WikiTreeNode[]): number {
  let count = 0;
  for (const n of nodes) { count += 1 + countAllNodes(n.children); }
  return count;
}

function filterTree(nodes: WikiTreeNode[], query: string): WikiTreeNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  const result: WikiTreeNode[] = [];
  for (const node of nodes) {
    const filteredChildren = filterTree(node.children, query);
    const titleMatch = node.title.toLowerCase().includes(q);
    if (titleMatch || filteredChildren.length > 0) {
      result.push({ ...node, children: titleMatch ? node.children : filteredChildren });
    }
  }
  return result;
}

function getNodeParent(tree: WikiTreeNode[], nodeId: string): string | undefined {
  for (const n of tree) {
    for (const c of n.children) {
      if (c.id === nodeId) return n.id;
    }
    const found = getNodeParent(n.children, nodeId);
    if (found) return found;
  }
  return undefined;
}

/* ─── Drag context passed to tree nodes ─── */
interface DragCtx {
  draggedId: string | null;
  dropTargetId: string | null;
  onDragStart: (id: string, e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (id: string, e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (id: string) => void;
}

/* ─── Bulk context ─── */
interface BulkCtx {
  active: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

/* ─── Node styles ─── */
function getDropStyle(nodeId: string, drag: DragCtx): React.CSSProperties {
  if (drag.dropTargetId === nodeId && drag.draggedId !== nodeId) {
    return {
      borderLeft: '2px solid var(--accent-primary)',
      background: 'rgba(34,211,238,0.08)',
    };
  }
  return {};
}

/* ─── Parent node ─── */
function ParentNode({
  node, activeSlug, onSelect, onNewChild, expandedSet, onToggleExpand, depth, drag, bulk,
}: {
  node: WikiTreeNode; activeSlug: string | null; onSelect: (id: string) => void;
  onNewChild: (parentId: string) => void; expandedSet: Set<string>;
  onToggleExpand: (id: string) => void; depth: number; drag: DragCtx; bulk: BulkCtx;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = activeSlug === node.id;
  const isExpanded = expandedSet.has(node.id);
  const isDragged = drag.draggedId === node.id;
  const dropStyles = getDropStyle(node.id, drag);

  return (
    <div style={{ marginTop: depth === 0 ? 12 : 6, opacity: isDragged ? 0.35 : 1, transition: 'opacity 0.15s' }}>
      <div
        draggable={!bulk.active}
        onDragStart={e => drag.onDragStart(node.id, e)}
        onDragEnd={drag.onDragEnd}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); drag.onDragOver(node.id, e); }}
        onDragLeave={drag.onDragLeave}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); drag.onDrop(node.id); }}
        onClick={() => bulk.active ? bulk.onToggle(node.id) : onSelect(node.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '6px 12px',
          paddingLeft: depth * 20 + 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: bulk.active ? 'pointer' : 'grab',
          borderLeft: isActive && !dropStyles.borderLeft ? '2px solid var(--accent-primary)' : (dropStyles.borderLeft || '2px solid transparent'),
          background: dropStyles.background || (isActive ? 'rgba(34,211,238,0.06)' : hovered ? 'rgba(255,255,255,0.02)' : 'transparent'),
          transition: 'background 0.12s',
        }}
      >
        {/* Bulk checkbox */}
        {bulk.active && (
          <span style={{
            width: 12, height: 12,
            border: '1px solid var(--border)',
            background: bulk.selectedIds.has(node.id) ? 'var(--accent-primary)' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', color: 'var(--bg-primary)', flexShrink: 0,
          }}>
            {bulk.selectedIds.has(node.id) ? '■' : ''}
          </span>
        )}

        {/* Expand arrow */}
        {!bulk.active && (
          <span
            onClick={e => { e.stopPropagation(); onToggleExpand(node.id); }}
            style={{
              fontSize: '9px',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              width: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'transform 0.15s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0,
            }}
          >
            ▸
          </span>
        )}

        {/* Title */}
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 600,
          color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
          letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', flex: 1, minWidth: 0,
        }}>
          {node.title}
        </span>

        {/* Child count */}
        <span style={{
          fontSize: '9px', color: 'var(--text-muted)', opacity: 0.4, flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {node.children.length}
        </span>

        {/* Hover add */}
        {hovered && !bulk.active && !drag.draggedId && (
          <span
            onClick={e => { e.stopPropagation(); onNewChild(node.id); }}
            title="add sub-page"
            style={{ fontSize: '13px', color: 'var(--accent-primary)', opacity: 0.5, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}
          >
            +
          </span>
        )}
      </div>

      {isExpanded && (
        <div>
          {node.children.map(child =>
            child.children.length > 0 ? (
              <ParentNode key={child.id} node={child} activeSlug={activeSlug} onSelect={onSelect}
                onNewChild={onNewChild} expandedSet={expandedSet} onToggleExpand={onToggleExpand}
                depth={depth + 1} drag={drag} bulk={bulk} />
            ) : (
              <LeafNode key={child.id} node={child} activeSlug={activeSlug} onSelect={onSelect}
                onNewChild={onNewChild} depth={depth + 1} drag={drag} bulk={bulk} />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Leaf node ─── */
function LeafNode({
  node, activeSlug, onSelect, onNewChild, depth, drag, bulk,
}: {
  node: WikiTreeNode; activeSlug: string | null; onSelect: (id: string) => void;
  onNewChild: (parentId: string) => void; depth: number; drag: DragCtx; bulk: BulkCtx;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = activeSlug === node.id;
  const isDragged = drag.draggedId === node.id;
  const dropStyles = getDropStyle(node.id, drag);

  return (
    <div
      draggable={!bulk.active}
      onDragStart={e => drag.onDragStart(node.id, e)}
      onDragEnd={drag.onDragEnd}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); drag.onDragOver(node.id, e); }}
      onDragLeave={drag.onDragLeave}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); drag.onDrop(node.id); }}
      onClick={() => bulk.active ? bulk.onToggle(node.id) : onSelect(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 12px', paddingLeft: depth * 20 + 30,
        fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: bulk.active ? 'pointer' : 'grab',
        display: 'flex', alignItems: 'center', gap: 4,
        borderLeft: isActive && !dropStyles.borderLeft ? '2px solid var(--accent-primary)' : (dropStyles.borderLeft || '2px solid transparent'),
        background: dropStyles.background || (isActive ? 'rgba(34,211,238,0.06)' : hovered ? 'rgba(255,255,255,0.02)' : 'transparent'),
        transition: 'background 0.12s, color 0.12s, opacity 0.15s',
        minHeight: 26,
        opacity: isDragged ? 0.35 : 1,
      }}
    >
      {bulk.active && (
        <span style={{
          width: 12, height: 12, border: '1px solid var(--border)',
          background: bulk.selectedIds.has(node.id) ? 'var(--accent-primary)' : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', color: 'var(--bg-primary)', flexShrink: 0,
        }}>
          {bulk.selectedIds.has(node.id) ? '■' : ''}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
        {node.title}
      </span>
      {hovered && !bulk.active && !drag.draggedId && (
        <span
          onClick={e => { e.stopPropagation(); onNewChild(node.id); }}
          title="add sub-page"
          style={{ fontSize: '11px', color: 'var(--accent-primary)', opacity: 0.4, cursor: 'pointer', flexShrink: 0 }}
        >
          +
        </span>
      )}
    </div>
  );
}

/* ─── Root-level leaf ─── */
function RootLeafNode({
  node, activeSlug, onSelect, onNewChild, drag, bulk,
}: {
  node: WikiTreeNode; activeSlug: string | null; onSelect: (id: string) => void;
  onNewChild: (parentId: string) => void; drag: DragCtx; bulk: BulkCtx;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = activeSlug === node.id;
  const isDragged = drag.draggedId === node.id;
  const dropStyles = getDropStyle(node.id, drag);

  return (
    <div
      draggable={!bulk.active}
      onDragStart={e => drag.onDragStart(node.id, e)}
      onDragEnd={drag.onDragEnd}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); drag.onDragOver(node.id, e); }}
      onDragLeave={drag.onDragLeave}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); drag.onDrop(node.id); }}
      onClick={() => bulk.active ? bulk.onToggle(node.id) : onSelect(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 12px', paddingLeft: 12,
        fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: bulk.active ? 'pointer' : 'grab',
        display: 'flex', alignItems: 'center', gap: 6,
        borderLeft: isActive && !dropStyles.borderLeft ? '2px solid var(--accent-primary)' : (dropStyles.borderLeft || '2px solid transparent'),
        background: dropStyles.background || (isActive ? 'rgba(34,211,238,0.06)' : hovered ? 'rgba(255,255,255,0.02)' : 'transparent'),
        transition: 'background 0.12s, color 0.12s, opacity 0.15s',
        minHeight: 28,
        opacity: isDragged ? 0.35 : 1,
      }}
    >
      {bulk.active && (
        <span style={{
          width: 12, height: 12, border: '1px solid var(--border)',
          background: bulk.selectedIds.has(node.id) ? 'var(--accent-primary)' : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', color: 'var(--bg-primary)', flexShrink: 0,
        }}>
          {bulk.selectedIds.has(node.id) ? '■' : ''}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
        {node.title}
      </span>
      {hovered && !bulk.active && !drag.draggedId && (
        <span
          onClick={e => { e.stopPropagation(); onNewChild(node.id); }}
          title="add sub-page"
          style={{ fontSize: '11px', color: 'var(--accent-primary)', opacity: 0.4, cursor: 'pointer', flexShrink: 0 }}
        >
          +
        </span>
      )}
    </div>
  );
}

/* ─── Search bar ─── */
function TreeSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
      <input
        ref={inputRef} value={value} onChange={e => onChange(e.target.value)}
        placeholder="filter pages..."
        style={{
          width: '100%', background: 'transparent', border: 'none',
          borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
          fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
          padding: '4px 0', outline: 'none',
        }}
      />
    </div>
  );
}

/* ─── Bulk Action Bar ─── */
function BulkActionBar({
  selectedIds, tree, onAction, onClear,
}: {
  selectedIds: Set<string>; tree: WikiTreeNode[];
  onAction: (action: string, payload?: any) => void; onClear: () => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const [parentTarget, setParentTarget] = useState('');

  const allPages = getAllIds(tree);
  const nonSelected = allPages.filter(id => !selectedIds.has(id));

  // Build flat list for parent picker
  const parentOptions: { id: string; title: string; depth: number }[] = [];
  function flatten(nodes: WikiTreeNode[], d: number) {
    for (const n of nodes) {
      if (!selectedIds.has(n.id)) {
        parentOptions.push({ id: n.id, title: n.title, depth: d });
      }
      flatten(n.children, d + 1);
    }
  }
  flatten(tree, 0);

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '8px 10px',
      fontSize: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          {selectedIds.size} selected
        </span>
        <button
          onClick={onClear}
          style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)',
            fontSize: '10px', cursor: 'pointer', padding: '2px 4px',
          }}
        >
          clear
        </button>
      </div>

      {/* Reparent */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <select
          value={parentTarget}
          onChange={e => setParentTarget(e.target.value)}
          style={{
            flex: 1, background: 'var(--bg-primary)', border: 'none',
            borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)',
            fontSize: '10px', padding: '2px 0', outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <option value="">move to root</option>
          {parentOptions.map(o => (
            <option key={o.id} value={o.id}>
              {'  '.repeat(o.depth)}{o.depth > 0 ? '└ ' : ''}{o.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => onAction('reparent', parentTarget || undefined)}
          style={{
            background: 'transparent', border: '1px solid var(--accent-primary)',
            color: 'var(--accent-primary)', fontSize: '10px', padding: '2px 6px',
            cursor: 'pointer', textTransform: 'none', whiteSpace: 'nowrap',
          }}
        >
          move
        </button>
      </div>

      {/* Tag */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { onAction('tag', tagInput.trim()); setTagInput(''); } }}
          placeholder="add tag..."
          style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
            fontSize: '10px', padding: '2px 0', outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
        <button
          onClick={() => { if (tagInput.trim()) { onAction('tag', tagInput.trim()); setTagInput(''); } }}
          style={{
            background: 'transparent', border: '1px solid var(--accent-secondary)',
            color: 'var(--accent-secondary)', fontSize: '10px', padding: '2px 6px',
            cursor: 'pointer', textTransform: 'none',
          }}
        >
          tag
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => onAction('delete')}
        style={{
          background: 'transparent', border: '1px solid var(--danger)',
          color: 'var(--danger)', fontSize: '10px', padding: '3px 6px',
          cursor: 'pointer', textTransform: 'none', width: '100%',
        }}
      >
        delete {selectedIds.size} page{selectedIds.size > 1 ? 's' : ''}
      </button>
    </div>
  );
}

/* ─── Main Panel ─── */
export function WikiTreePanel({
  activeSlug,
  onNavigate,
}: {
  activeSlug: string | null;
  onNavigate: (slug: string) => void;
}) {
  const [tree, setTree] = useState<WikiTreeNode[]>([]);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Bulk state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { activeSpace } = useSpace();

  const loadTree = useCallback(async () => {
    try {
      const treeData = await api.getWikiTree(activeSpace || undefined);
      setTree(treeData);
      if (!initialized) {
        const folders = new Set<string>();
        function collect(nodes: WikiTreeNode[]) {
          for (const n of nodes) {
            if (n.children.length > 0) { folders.add(n.id); collect(n.children); }
          }
        }
        collect(treeData);
        setExpandedSet(folders);
        setInitialized(true);
      }
    } catch {}
  }, [initialized, activeSpace]);

  useEffect(() => { loadTree(); }, [loadTree]);

  useEffect(() => {
    const handler = () => loadTree();
    window.addEventListener('tk-wiki-tree-changed', handler);
    return () => window.removeEventListener('tk-wiki-tree-changed', handler);
  }, [loadTree]);

  useEffect(() => {
    if (activeSlug && tree.length > 0) {
      const path = findPathToNode(tree, activeSlug);
      if (path) {
        setExpandedSet(prev => {
          const next = new Set(prev);
          for (const n of path) { if (n.children.length > 0) next.add(n.id); }
          return next;
        });
      }
    }
  }, [activeSlug, tree]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedSet(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  const handleSelect = (id: string) => onNavigate(id);

  const handleNewChild = useCallback(async (parentId: string) => {
    try {
      const raw: any = await api.createWikiPage({ title: 'untitled', parent: parentId, space: activeSpace || undefined });
      setExpandedSet(prev => { const next = new Set(prev); next.add(parentId); return next; });
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
      onNavigate(raw.id);
    } catch {}
  }, [loadTree, onNavigate]);

  const handleNewPage = async () => {
    try {
      const raw: any = await api.createWikiPage({ title: 'untitled', space: activeSpace || undefined });
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
      onNavigate(raw.id);
    } catch {}
  };

  // ── Drag handlers ──
  const handleDragStart = useCallback((id: string, e: DragEvent) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback((id: string, _e: DragEvent) => {
    if (!draggedId || draggedId === id) return;
    // Don't allow dropping onto a descendant
    if (isDescendant(tree, draggedId, id)) return;
    setDropTargetId(id);
  }, [draggedId, tree]);

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(async (targetId: string) => {
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }
    if (isDescendant(tree, draggedId, targetId)) { handleDragEnd(); return; }

    try {
      await api.updateWikiPage(draggedId, { parent: targetId });
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
    } catch {}
    handleDragEnd();
  }, [draggedId, tree, loadTree, handleDragEnd]);

  const handleRootDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;
    try {
      // Set parent to empty string to move to root
      await api.updateWikiPage(draggedId, { parent: '' });
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
    } catch {}
    handleDragEnd();
  }, [draggedId, loadTree, handleDragEnd]);

  const dragCtx: DragCtx = {
    draggedId, dropTargetId,
    onDragStart: handleDragStart, onDragEnd: handleDragEnd,
    onDragOver: handleDragOver, onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  // ── Bulk handlers ──
  const toggleBulkSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkAction = useCallback(async (action: string, payload?: any) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === 'delete') {
      if (!confirm(`delete ${ids.length} page${ids.length > 1 ? 's' : ''}? children will be reparented.`)) return;
    }

    try {
      await api.bulkWikiAction({
        action,
        ids,
        parent: action === 'reparent' ? (payload || '') : undefined,
        tag: action === 'tag' ? payload : undefined,
      });
      await loadTree();
      window.dispatchEvent(new Event('tk-wiki-tree-changed'));
      setSelectedIds(new Set());
      if (action === 'delete' && activeSlug && ids.includes(activeSlug)) {
        navigate('/wiki');
      }
    } catch {}
  }, [selectedIds, loadTree, navigate, activeSlug]);

  const bulkCtx: BulkCtx = {
    active: bulkMode,
    selectedIds,
    onToggle: toggleBulkSelect,
  };

  const displayTree = search ? filterTree(tree, search) : tree;
  const displayExpanded = search ? new Set(getAllIds(displayTree)) : expandedSet;
  const pageCount = countAllNodes(tree);

  return (
    <div style={{
      width: 240, minWidth: 240, height: '100%',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-rail, var(--bg-primary))',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 12px 10px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <PixelScroll size={13} color="var(--accent-primary)" />
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 700,
          color: 'var(--text-primary)', letterSpacing: '-0.02em', flex: 1,
        }}>
          wiki
        </span>
        <button
          onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: bulkMode ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontSize: '9px', padding: '2px 4px',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.06em',
          }}
        >
          {bulkMode ? 'done' : 'select'}
        </button>
        <span style={{
          fontSize: '9px', color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace", opacity: 0.5,
        }}>
          {pageCount}
        </span>
      </div>

      {/* Search */}
      {!bulkMode && <TreeSearch value={search} onChange={setSearch} />}

      {/* Tree */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
        {displayTree.map(node =>
          node.children.length > 0 ? (
            <ParentNode key={node.id} node={node} activeSlug={activeSlug} onSelect={handleSelect}
              onNewChild={handleNewChild} expandedSet={displayExpanded} onToggleExpand={toggleExpand}
              depth={0} drag={dragCtx} bulk={bulkCtx} />
          ) : (
            <RootLeafNode key={node.id} node={node} activeSlug={activeSlug} onSelect={handleSelect}
              onNewChild={handleNewChild} drag={dragCtx} bulk={bulkCtx} />
          )
        )}

        {displayTree.length === 0 && !search && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <PixelScroll size={24} color="var(--text-muted)" />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>no pages yet</p>
          </div>
        )}

        {displayTree.length === 0 && search && (
          <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            no matches
          </div>
        )}

        {/* Root drop zone — visible when dragging */}
        {draggedId && (
          <div
            onDragOver={e => { e.preventDefault(); setDropTargetId('__root__'); }}
            onDragLeave={() => setDropTargetId(null)}
            onDrop={handleRootDrop}
            style={{
              margin: '8px 10px',
              padding: '10px 0',
              border: dropTargetId === '__root__' ? '1px solid var(--accent-primary)' : '1px dashed var(--border)',
              background: dropTargetId === '__root__' ? 'rgba(34,211,238,0.06)' : 'transparent',
              textAlign: 'center',
              fontSize: '10px',
              color: dropTargetId === '__root__' ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'all 0.12s',
            }}
          >
            drop here → move to root
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          tree={tree}
          onAction={handleBulkAction}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* New page */}
      {!bulkMode && (
        <button
          onClick={handleNewPage}
          style={{
            background: 'transparent', border: 'none', borderTop: '1px solid var(--border)',
            color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer',
            padding: '10px 12px', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span> new page
        </button>
      )}
    </div>
  );
}
