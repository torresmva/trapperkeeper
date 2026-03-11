import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language';
import { api } from '../../api/client';
import { InsertMenu, InsertItem } from './InsertMenu';
import '../../styles/editor.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPasteImage?: (path: string) => void;
}

export function MarkdownEditor({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [dragOver, setDragOver] = useState(false);
  const [insertMenu, setInsertMenu] = useState<{ open: boolean; filter: string; pos: { x: number; y: number }; from: number } | null>(null);
  const insertMenuRef = useRef(insertMenu);
  insertMenuRef.current = insertMenu;

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const result = await api.uploadImage(file);
        const imageMarkdown = `\n![${file.name}](/api/assets/files/${result.filename})\n`;
        if (viewRef.current) {
          const pos = viewRef.current.state.selection.main.head;
          viewRef.current.dispatch({
            changes: { from: pos, insert: imageMarkdown },
          });
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInsertSelect = useCallback((item: InsertItem) => {
    const menu = insertMenuRef.current;
    if (!menu || !viewRef.current) return;
    const view = viewRef.current;
    const pos = view.state.selection.main.head;

    view.dispatch({
      changes: { from: menu.from, to: pos, insert: item.snippet },
      selection: { anchor: menu.from + item.snippet.length },
    });

    setInsertMenu(null);
    view.focus();
  }, []);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        try {
          const result = await api.uploadImage(file);
          const mdLink = `![image](/api/assets/files/${result.filename})`;
          const view = viewRef.current;
          if (view) {
            const pos = view.state.selection.main.head;
            view.dispatch({
              changes: { from: pos, insert: mdLink },
            });
          }
        } catch (err) {
          console.error('Image upload failed:', err);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const insertMenuListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged && !update.selectionSet) return;

      const state = update.state;
      const pos = state.selection.main.head;
      const line = state.doc.lineAt(pos);
      const lineText = line.text;
      const colPos = pos - line.from;

      const beforeCursor = lineText.slice(0, colPos);
      const slashMatch = beforeCursor.match(/(?:^|\s)\/(\w*)$/);

      if (slashMatch) {
        const coords = update.view.coordsAtPos(pos);
        if (coords) {
          const slashPos = line.from + beforeCursor.lastIndexOf('/');
          setInsertMenu({
            open: true,
            filter: slashMatch[1],
            pos: { x: coords.left, y: coords.bottom + 4 },
            from: slashPos,
          });
        }
      } else {
        if (insertMenuRef.current?.open) {
          setInsertMenu(null);
        }
      }
    });

    const theme = EditorView.theme({
      '&': {
        height: '100%',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        bracketMatching(),
        search(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
        updateListener,
        insertMenuListener,
        theme,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    containerRef.current.addEventListener('paste', handlePaste);

    return () => {
      containerRef.current?.removeEventListener('paste', handlePaste);
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        outline: dragOver ? '2px solid var(--accent-primary)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      {dragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--accent-primary-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          fontSize: '12px',
          color: 'var(--accent-primary)',
          letterSpacing: '0.04em',
        }}>
          drop image
        </div>
      )}
      {insertMenu?.open && (
        <InsertMenu
          filter={insertMenu.filter}
          position={insertMenu.pos}
          onSelect={handleInsertSelect}
          onClose={() => { setInsertMenu(null); viewRef.current?.focus(); }}
        />
      )}
    </div>
  );
}
