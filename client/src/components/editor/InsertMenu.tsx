import { useState, useEffect, useRef } from 'react';

export interface InsertItem {
  label: string;
  shortcut: string;
  snippet: string;
  category: string;
}

export const INSERT_ITEMS: InsertItem[] = [
  // Headings
  { label: 'Heading 1', shortcut: 'h1', snippet: '# ', category: 'headings' },
  { label: 'Heading 2', shortcut: 'h2', snippet: '## ', category: 'headings' },
  { label: 'Heading 3', shortcut: 'h3', snippet: '### ', category: 'headings' },
  { label: 'Heading 4', shortcut: 'h4', snippet: '#### ', category: 'headings' },

  // Text formatting
  { label: 'Bold', shortcut: 'bold', snippet: '**text**', category: 'formatting' },
  { label: 'Italic', shortcut: 'italic', snippet: '*text*', category: 'formatting' },
  { label: 'Strikethrough', shortcut: 'strike', snippet: '~~text~~', category: 'formatting' },
  { label: 'Highlight', shortcut: 'highlight', snippet: '==text==', category: 'formatting' },

  // Blocks
  { label: 'Code Block', shortcut: 'code', snippet: '```\n\n```', category: 'blocks' },
  { label: 'Code (JavaScript)', shortcut: 'js', snippet: '```javascript\n\n```', category: 'blocks' },
  { label: 'Code (TypeScript)', shortcut: 'ts', snippet: '```typescript\n\n```', category: 'blocks' },
  { label: 'Code (Python)', shortcut: 'py', snippet: '```python\n\n```', category: 'blocks' },
  { label: 'Code (Bash)', shortcut: 'bash', snippet: '```bash\n\n```', category: 'blocks' },
  { label: 'Code (SQL)', shortcut: 'sql', snippet: '```sql\n\n```', category: 'blocks' },
  { label: 'Code (YAML)', shortcut: 'yaml', snippet: '```yaml\n\n```', category: 'blocks' },
  { label: 'Code (JSON)', shortcut: 'json', snippet: '```json\n\n```', category: 'blocks' },
  { label: 'Blockquote', shortcut: 'quote', snippet: '> ', category: 'blocks' },
  { label: 'Callout / Note', shortcut: 'note', snippet: '> **Note:** ', category: 'blocks' },
  { label: 'Warning', shortcut: 'warn', snippet: '> **Warning:** ', category: 'blocks' },

  // Lists
  { label: 'Bullet List', shortcut: 'ul', snippet: '- ', category: 'lists' },
  { label: 'Numbered List', shortcut: 'ol', snippet: '1. ', category: 'lists' },
  { label: 'Task List', shortcut: 'task', snippet: '- [ ] ', category: 'lists' },
  { label: 'Checklist', shortcut: 'check', snippet: '- [ ] Item 1\n- [ ] Item 2\n- [ ] Item 3', category: 'lists' },

  // Media & Links
  { label: 'Link', shortcut: 'link', snippet: '[text](url)', category: 'media' },
  { label: 'Image', shortcut: 'img', snippet: '![alt](url)', category: 'media' },
  { label: 'Wiki Link', shortcut: 'wiki', snippet: '[[', category: 'media' },
  { label: 'Audio Player', shortcut: 'audio', snippet: '<audio controls src="url"></audio>', category: 'media' },
  { label: 'PDF Embed', shortcut: 'pdf', snippet: '[document.pdf](/api/assets/files/filename.pdf)', category: 'media' },

  // Tables
  { label: 'Table (2 col)', shortcut: 'table2', snippet: '| Column 1 | Column 2 |\n|----------|----------|\n| | |\n| | |', category: 'tables' },
  { label: 'Table (3 col)', shortcut: 'table3', snippet: '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| | | |\n| | | |', category: 'tables' },

  // Diagrams & Math
  { label: 'Mermaid Diagram', shortcut: 'mermaid', snippet: '```mermaid\ngraph TD\n    A[Start] --> B[End]\n```', category: 'diagrams' },
  { label: 'Mermaid Flowchart', shortcut: 'flow', snippet: '```mermaid\nflowchart LR\n    A --> B --> C\n```', category: 'diagrams' },
  { label: 'Mermaid Sequence', shortcut: 'seq', snippet: '```mermaid\nsequenceDiagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi\n```', category: 'diagrams' },
  { label: 'Mermaid Gantt', shortcut: 'gantt', snippet: '```mermaid\ngantt\n    title Timeline\n    section Phase 1\n    Task 1: 2024-01-01, 30d\n```', category: 'diagrams' },
  { label: 'Math (inline)', shortcut: 'math', snippet: '$expression$', category: 'diagrams' },
  { label: 'Math (block)', shortcut: 'mathblock', snippet: '$$\nexpression\n$$', category: 'diagrams' },

  // Dividers & Special
  { label: 'Horizontal Rule', shortcut: 'hr', snippet: '\n---\n', category: 'special' },
  { label: 'Collapsible Section', shortcut: 'details', snippet: '<details>\n<summary>Click to expand</summary>\n\nContent here\n\n</details>', category: 'special' },
  { label: 'Footnote', shortcut: 'footnote', snippet: 'text[^1]\n\n[^1]: Footnote content', category: 'special' },
];

const CATEGORY_LABELS: Record<string, string> = {
  headings: 'HEADINGS',
  formatting: 'FORMATTING',
  blocks: 'BLOCKS',
  lists: 'LISTS',
  media: 'MEDIA & LINKS',
  tables: 'TABLES',
  diagrams: 'DIAGRAMS & MATH',
  special: 'SPECIAL',
};

interface Props {
  filter: string;
  position: { x: number; y: number };
  onSelect: (item: InsertItem) => void;
  onClose: () => void;
}

export function InsertMenu({ filter, position, onSelect, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const query = filter.toLowerCase();
  const filtered = INSERT_ITEMS.filter(
    item => item.label.toLowerCase().includes(query) || item.shortcut.toLowerCase().includes(query)
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  // Group by category
  const grouped: { category: string; items: (InsertItem & { globalIndex: number })[] }[] = [];
  let globalIdx = 0;
  const categoryOrder = ['headings', 'formatting', 'blocks', 'lists', 'media', 'tables', 'diagrams', 'special'];

  for (const cat of categoryOrder) {
    const items = filtered
      .filter(item => item.category === cat)
      .map(item => ({ ...item, globalIndex: globalIdx++ }));
    if (items.length > 0) {
      grouped.push({ category: cat, items });
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 3000,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderLeft: '2px solid var(--accent-primary)',
        maxHeight: 320,
        width: 280,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {grouped.map(group => (
        <div key={group.category}>
          <div style={{
            fontSize: '8px',
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            padding: '8px 12px 3px',
          }}>
            {CATEGORY_LABELS[group.category]}
          </div>
          {group.items.map(item => (
            <div
              key={item.shortcut}
              data-index={item.globalIndex}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(item.globalIndex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 12px',
                cursor: 'pointer',
                background: item.globalIndex === selectedIndex ? 'var(--bg-surface)' : 'transparent',
                borderLeft: item.globalIndex === selectedIndex ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'background 0.08s',
              }}
            >
              <span style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: item.globalIndex === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '9px',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-muted)',
              }}>
                /{item.shortcut}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
