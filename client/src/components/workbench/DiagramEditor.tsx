import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#22d3ee',
    primaryTextColor: '#e5e5e5',
    primaryBorderColor: '#333',
    lineColor: '#666',
    secondaryColor: '#1a1a1a',
    tertiaryColor: '#111',
  },
});

interface SavedDiagram {
  name: string;
  code: string;
  savedAt: number;
}

const STORAGE_KEY = 'tk-diagrams';

const TEMPLATES: { label: string; code: string }[] = [
  {
    label: 'flowchart',
    code: 'graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Do Thing]\n    B -->|No| D[Other Thing]\n    C --> E[End]\n    D --> E',
  },
  {
    label: 'sequence',
    code: 'sequenceDiagram\n    participant A as Client\n    participant B as Server\n    A->>B: Request\n    B-->>A: Response',
  },
  {
    label: 'class',
    code: 'classDiagram\n    class Animal {\n        +String name\n        +int age\n        +makeSound()\n    }\n    class Dog\n    Dog --|> Animal',
  },
  {
    label: 'state',
    code: 'stateDiagram-v2\n    [*] --> Idle\n    Idle --> Processing : start\n    Processing --> Done : complete\n    Done --> [*]',
  },
  {
    label: 'er',
    code: 'erDiagram\n    USER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    PRODUCT ||--o{ LINE-ITEM : "is in"',
  },
  {
    label: 'gantt',
    code: 'gantt\n    title Project Timeline\n    dateFormat YYYY-MM-DD\n    section Phase 1\n    Task A :a1, 2024-01-01, 30d\n    Task B :after a1, 20d',
  },
  {
    label: 'pie',
    code: 'pie title Distribution\n    "Category A" : 40\n    "Category B" : 30\n    "Category C" : 30',
  },
  {
    label: 'architecture',
    code: 'architecture-beta\n    group api(cloud)[API]\n    service server(server)[Server] in api\n    service db(database)[DB] in api\n    server:R --> L:db',
  },
];

function loadSavedDiagrams(): SavedDiagram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDiagrams(diagrams: SavedDiagram[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
}

let renderCounter = 0;

export function DiagramEditor() {
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [svgOutput, setSvgOutput] = useState('');
  const [error, setError] = useState('');
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>(loadSavedDiagrams);
  const [saveName, setSaveName] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const renderTimeout = useRef<ReturnType<typeof setTimeout>>();
  const previewRef = useRef<HTMLDivElement>(null);

  const renderDiagram = useCallback(async (source: string) => {
    if (!source.trim()) {
      setSvgOutput('');
      setError('');
      return;
    }
    try {
      renderCounter++;
      const id = `diagram-preview-${renderCounter}`;
      const { svg } = await mermaid.render(id, source);
      setSvgOutput(svg);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'invalid diagram syntax');
      setSvgOutput('');
      // Clean up any orphaned render elements
      const el = document.getElementById(`d${renderCounter}`);
      if (el) el.remove();
    }
  }, []);

  useEffect(() => {
    clearTimeout(renderTimeout.current);
    renderTimeout.current = setTimeout(() => {
      renderDiagram(code);
    }, 400);
    return () => clearTimeout(renderTimeout.current);
  }, [code, renderDiagram]);

  const flash = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(''), 1500);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    flash('copied code');
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText('```mermaid\n' + code + '\n```');
    flash('copied markdown');
  };

  const copySvg = () => {
    if (svgOutput) {
      navigator.clipboard.writeText(svgOutput);
      flash('copied svg');
    }
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const updated = savedDiagrams.filter(d => d.name !== name);
    updated.unshift({ name, code, savedAt: Date.now() });
    setSavedDiagrams(updated);
    saveDiagrams(updated);
    setSaveName('');
    flash('saved');
  };

  const handleLoad = (diagram: SavedDiagram) => {
    setCode(diagram.code);
    setShowSaved(false);
  };

  const handleDelete = (name: string) => {
    const updated = savedDiagrams.filter(d => d.name !== name);
    setSavedDiagrams(updated);
    saveDiagrams(updated);
  };

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--accent-primary)',
    padding: '4px 10px',
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    borderRadius: 0,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  };

  const btnActiveStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--accent-primary)',
    color: 'var(--bg-primary)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Template picker */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        paddingBottom: 12,
        borderBottom: '1px solid var(--border)',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
          marginRight: 4,
        }}>
          templates:
        </span>
        {TEMPLATES.map(t => (
          <button
            key={t.label}
            onClick={() => setCode(t.code)}
            style={btnStyle}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Actions bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 12,
        flexWrap: 'wrap',
      }}>
        <button onClick={copyCode} style={btnStyle}>copy code</button>
        <button onClick={copyMarkdown} style={btnStyle}>copy as markdown</button>
        <button onClick={copySvg} style={btnStyle} disabled={!svgOutput}>copy svg</button>

        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />

        <button
          onClick={() => setShowSaved(!showSaved)}
          style={showSaved ? btnActiveStyle : btnStyle}
        >
          saved ({savedDiagrams.length})
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="diagram name"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '4px 6px',
              width: 120,
              outline: 'none',
              borderRadius: 0,
            }}
          />
          <button onClick={handleSave} style={btnStyle} disabled={!saveName.trim()}>
            save
          </button>
        </div>

        {copyFeedback && (
          <span style={{
            fontSize: '10px',
            color: 'var(--accent-green)',
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: 4,
          }}>
            {copyFeedback}
          </span>
        )}
      </div>

      {/* Saved diagrams dropdown */}
      {showSaved && savedDiagrams.length > 0 && (
        <div style={{
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          marginBottom: 12,
          maxHeight: 160,
          overflowY: 'auto',
        }}>
          {savedDiagrams.map(d => (
            <div
              key={d.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderBottom: '1px solid var(--border)',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <button
                onClick={() => handleLoad(d)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                {d.name}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
                  {new Date(d.savedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(d.name)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-pink)',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    padding: 0,
                  }}
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Split pane */}
      <div style={{
        flex: 1,
        display: 'flex',
        minHeight: 0,
        border: '1px solid var(--border)',
      }}>
        {/* Left: code editor */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          minWidth: 0,
        }}>
          <div style={{
            padding: '6px 10px',
            borderBottom: '1px solid var(--border)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
          }}>
            mermaid code
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: 'none',
              padding: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              width: '100%',
              minHeight: 0,
              borderRadius: 0,
            }}
          />
        </div>

        {/* Right: preview */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          <div style={{
            padding: '6px 10px',
            borderBottom: '1px solid var(--border)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.02em',
          }}>
            preview
          </div>
          <div
            ref={previewRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px',
              display: 'flex',
              alignItems: error ? 'flex-start' : 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
            }}
          >
            {error ? (
              <div style={{
                color: 'var(--accent-pink)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: '8px',
                borderLeft: '2px solid var(--accent-pink)',
              }}>
                {error}
              </div>
            ) : svgOutput ? (
              <div
                dangerouslySetInnerHTML={{ __html: svgOutput }}
                style={{ maxWidth: '100%', overflow: 'auto' }}
              />
            ) : (
              <span style={{
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
              }}>
                enter mermaid code to preview
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
