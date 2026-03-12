import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Snippet } from '../../types';
import { PixelLightning, PixelBorder, PixelGhost } from '../shared/PixelArt';
import { TagBadge } from '../shared/TagBadge';

const LANGUAGES = ['text', 'bash', 'sql', 'javascript', 'typescript', 'python', 'go', 'json', 'yaml', 'css', 'html'];

const LANG_COLORS: Record<string, string> = {
  bash: 'var(--accent-green)',
  sql: 'var(--accent-secondary)',
  javascript: 'var(--accent-tertiary)',
  typescript: 'var(--accent-primary)',
  python: 'var(--accent-tertiary)',
  go: 'var(--accent-primary)',
  json: 'var(--text-secondary)',
  yaml: 'var(--text-secondary)',
  css: 'var(--accent-secondary)',
  html: 'var(--accent-tertiary)',
  text: 'var(--text-muted)',
};

export function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('bash');
  const [newTags, setNewTags] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterLang, setFilterLang] = useState<string>('');

  const loadSnippets = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterLang) params.language = filterLang;
      const data = await api.listSnippets(params);
      setSnippets(data);
    } finally {
      setLoading(false);
    }
  }, [filterLang]);

  useEffect(() => { loadSnippets(); }, [loadSnippets]);

  const handleAdd = async () => {
    if (!newCode.trim()) return;
    await api.createSnippet({
      code: newCode,
      title: newTitle.trim(),
      language: newLang,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setNewCode(''); setNewTitle(''); setNewTags('');
    setShowAdd(false);
    loadSnippets();
  };

  const handleCopy = async (snippet: Snippet) => {
    await navigator.clipboard.writeText(snippet.code);
    api.copySnippet(snippet.id);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async (id: string) => {
    await api.deleteSnippet(id);
    loadSnippets();
  };

  // Collect all languages present
  const usedLangs = [...new Set(snippets.map(s => s.language))];

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelLightning size={20} color="var(--accent-tertiary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            snippets
          </h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              color: 'var(--accent-primary)',
              fontSize: '11px',
              padding: '4px 10px',
              border: '1px solid var(--accent-primary)',
              background: 'transparent',
            }}
          >
            + new
          </button>
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
          paddingLeft: 32,
        }}>
          copy-paste is not a crime
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{
          marginBottom: 24,
          padding: '16px',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="title (optional)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={newLang}
                onChange={e => setNewLang(e.target.value)}
                style={{
                  ...inputStyle,
                  width: 110,
                  color: LANG_COLORS[newLang] || 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <textarea
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="paste your code / command here..."
              spellCheck={false}
              style={{
                ...inputStyle,
                minHeight: 100,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                lineHeight: 1.6,
                resize: 'vertical',
                whiteSpace: 'pre',
              }}
            />
            <input
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              placeholder="tags (comma-separated)"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={cancelBtn}>cancel</button>
              <button onClick={handleAdd} disabled={!newCode.trim()} style={submitBtn}>save snippet</button>
            </div>
          </div>
        </div>
      )}

      {/* Language filter */}
      <div style={{
        display: 'flex',
        gap: 2,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setFilterLang('')}
          style={langBtnStyle(!filterLang)}
        >
          all
        </button>
        {usedLangs.map(l => (
          <button
            key={l}
            onClick={() => setFilterLang(filterLang === l ? '' : l)}
            style={{
              ...langBtnStyle(filterLang === l),
              color: filterLang === l ? (LANG_COLORS[l] || 'var(--accent-primary)') : 'var(--text-muted)',
              borderBottomColor: filterLang === l ? (LANG_COLORS[l] || 'var(--accent-primary)') : 'transparent',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>loading snippets...</p>
        </div>
      ) : snippets.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
          <PixelLightning size={24} color="var(--accent-tertiary)" />
          <p style={{ fontSize: '13px', marginTop: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            no snippets yet
          </p>
          <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic' }}>
            that command you always forget? put it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {snippets.map(snippet => (
            <div
              key={snippet.id}
              style={{
                borderLeft: `2px solid ${LANG_COLORS[snippet.language] || 'var(--border)'}`,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px 4px',
              }}>
                <span style={{
                  fontSize: '9px',
                  color: LANG_COLORS[snippet.language] || 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  {snippet.language}
                </span>
                {snippet.title && (
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                  }}>
                    {snippet.title}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.5 }}>
                  {snippet.copyCount > 0 ? `${snippet.copyCount}x` : ''}
                </span>
                <button
                  onClick={() => handleCopy(snippet)}
                  style={{
                    ...actionBtn,
                    color: copiedId === snippet.id ? 'var(--accent-green)' : 'var(--accent-primary)',
                    border: `1px solid ${copiedId === snippet.id ? 'var(--accent-green)' : 'var(--border)'}`,
                    padding: '2px 8px',
                  }}
                >
                  {copiedId === snippet.id ? 'copied!' : 'copy'}
                </button>
                <button onClick={() => handleDelete(snippet.id)} style={{ ...actionBtn, opacity: 0.4 }}>del</button>
              </div>

              {/* Code block */}
              <pre style={{
                margin: 0,
                padding: '8px 12px',
                background: 'var(--code-bg)',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.6,
                overflow: 'auto',
                maxHeight: 200,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {snippet.code}
              </pre>

              {/* Tags */}
              {snippet.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, padding: '6px 12px' }}>
                  {snippet.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <PixelBorder />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: 12,
  padding: '8px 0',
  outline: 'none',
  fontFamily: "'JetBrains Mono', monospace",
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 11,
  cursor: 'pointer',
  padding: '6px 12px',
};

const submitBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--accent-primary)',
  color: 'var(--accent-primary)',
  fontSize: 11,
  cursor: 'pointer',
  padding: '6px 14px',
};

const actionBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 10,
  cursor: 'pointer',
  padding: '2px 4px',
  fontFamily: "'JetBrains Mono', monospace",
};

function langBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '3px 8px',
    fontSize: '10px',
    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
    borderBottom: active ? '1px solid var(--accent-primary)' : '1px solid transparent',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  };
}
