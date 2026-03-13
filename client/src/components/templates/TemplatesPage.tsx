import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import {
  PixelScroll, PixelBorder, PixelGhost, PixelCoffee, PixelCrown,
  PixelSword, PixelSkull, PixelShield, PixelLightning, PixelStar,
} from '../shared/PixelArt';

const TEMPLATE_ICONS: Record<string, (s: number) => React.ReactNode> = {
  daily: (s) => <PixelCoffee size={s} color="var(--accent-primary)" />,
  weekly: (s) => <PixelScroll size={s} color="var(--accent-secondary)" />,
  monthly: (s) => <PixelCrown size={s} color="var(--accent-tertiary)" />,
  meeting: (s) => <PixelGhost size={s} color="var(--accent-green)" />,
  incident: (s) => <PixelSkull size={s} color="var(--danger)" />,
  decision: (s) => <PixelShield size={s} color="var(--accent-tertiary)" />,
  '1on1': (s) => <PixelSword size={s} color="var(--accent-secondary)" />,
  'project-update': (s) => <PixelLightning size={s} color="var(--accent-primary)" />,
};

const DEFAULT_ICON = (s: number) => <PixelStar size={s} color="var(--text-muted)" />;

interface TemplateData {
  name: string;
  raw: string;
  expanded: string;
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.listTemplates();
      setTemplates(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectTemplate = async (name: string) => {
    if (dirty && !confirm('discard unsaved changes?')) return;
    setActive(name);
    setDirty(false);
    setSaveMsg('');
    setPreviewMode(false);
    try {
      const data = await api.getTemplate(name);
      setTemplateData(data);
      setEditContent(data.raw);
    } catch {
      setTemplateData(null);
      setEditContent('');
    }
  };

  const handleSave = async () => {
    if (!active || !editContent.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/templates/${active}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      setTemplateData(data);
      setDirty(false);
      setSaveMsg('saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg('error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!name) return;
    const defaultContent = `---
title: "${name} — {{DATE_SHORT}}"
date: "{{DATE_ISO}}"
type: "note"
category: "journal"
tags: []
collections: []
created: "{{NOW_ISO}}"
modified: "{{NOW_ISO}}"
---

# ${name}

`;
    try {
      await fetch(`/api/templates/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: defaultContent }),
      });
      setShowNew(false);
      setNewName('');
      await load();
      selectTemplate(name);
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!active) return;
    if (!confirm(`delete template "${active}"?`)) return;
    try {
      await fetch(`/api/templates/${active}`, { method: 'DELETE' });
      setActive(null);
      setTemplateData(null);
      setEditContent('');
      setDirty(false);
      await load();
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (dirty) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dirty, editContent, active]);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelScroll size={20} color="var(--accent-secondary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            templates
          </h1>
          <button
            onClick={() => setShowNew(true)}
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
          blueprints for your entries. edit frontmatter and body templates here.
        </div>
      </div>

      {/* New template dialog */}
      {showNew && (
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          border: '1px solid var(--accent-primary)',
          background: 'var(--bg-surface)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            fontSize: '10px',
            color: 'var(--accent-primary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            new template
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="template-name"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--accent-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                padding: '6px 0',
                outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{
                color: 'var(--accent-primary)',
                fontSize: '11px',
                padding: '4px 10px',
                border: '1px solid var(--accent-primary)',
                background: 'transparent',
              }}
            >
              create
            </button>
            <button
              onClick={() => { setShowNew(false); setNewName(''); }}
              style={{
                color: 'var(--text-muted)',
                fontSize: '11px',
                padding: '4px 10px',
                background: 'transparent',
                border: 'none',
              }}
            >
              cancel
            </button>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 6, opacity: 0.5 }}>
            lowercase, hyphens and underscores only. e.g. "standup", "retro-notes"
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Template list */}
        <div style={{
          width: 180,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          paddingRight: 16,
        }}>
          {loading ? (
            <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '11px' }}>
              loading...
            </div>
          ) : templates.length === 0 ? (
            <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '11px' }}>
              no templates yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {templates.map(name => {
                const isActive = name === active;
                const iconFn = TEMPLATE_ICONS[name] || DEFAULT_ICON;
                return (
                  <button
                    key={name}
                    onClick={() => selectTemplate(name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderLeft: isActive
                        ? '2px solid var(--accent-primary)'
                        : '2px solid transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'lowercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {iconFn(12)}
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!active ? (
            <div style={{
              padding: '48px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              <PixelScroll size={28} color="var(--text-muted)" />
              <p style={{
                fontSize: '13px',
                marginTop: 12,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                select a template to edit
              </p>
              <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic', opacity: 0.6 }}>
                templates use {'{{VARIABLES}}'} that expand when creating entries.
              </p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                borderBottom: '1px solid var(--border)',
                paddingBottom: 8,
              }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  flex: 1,
                }}>
                  {active}
                </span>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    color: previewMode ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderBottom: previewMode
                      ? '1px solid var(--accent-primary)'
                      : '1px solid transparent',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  {previewMode ? 'edit' : 'preview'}
                </button>

                {saveMsg && (
                  <span style={{
                    fontSize: '10px',
                    color: saveMsg === 'saved' ? 'var(--accent-green)' : 'var(--danger)',
                  }}>
                    {saveMsg}
                  </span>
                )}

                {dirty && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      color: 'var(--accent-primary)',
                      fontSize: '10px',
                      padding: '3px 10px',
                      border: '1px solid var(--accent-primary)',
                      background: 'transparent',
                    }}
                  >
                    {saving ? 'saving...' : 'save'}
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    padding: '3px 8px',
                    background: 'transparent',
                    border: 'none',
                    opacity: 0.5,
                  }}
                >
                  delete
                </button>
              </div>

              {/* Variable reference */}
              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 12,
                padding: '6px 0',
              }}>
                {[
                  '{{DATE_LONG}}', '{{DATE_SHORT}}', '{{DATE_ISO}}',
                  '{{NOW_ISO}}', '{{YEAR}}', '{{MONTH}}', '{{WEEK_NUMBER}}',
                ].map(v => (
                  <button
                    key={v}
                    onClick={() => {
                      if (!previewMode) {
                        setEditContent(prev => prev + v);
                        setDirty(true);
                      }
                    }}
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      color: 'var(--accent-primary)',
                      background: 'var(--accent-primary-dim)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: previewMode ? 0.3 : 1,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Editor / Preview */}
              {previewMode ? (
                <div style={{
                  padding: '16px 0',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  minHeight: 300,
                }}>
                  <div style={{
                    fontSize: '9px',
                    color: 'var(--accent-tertiary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}>
                    expanded preview
                  </div>
                  {templateData?.expanded || editContent}
                </div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={e => {
                    setEditContent(e.target.value);
                    setDirty(true);
                  }}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    minHeight: 400,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    padding: 16,
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.7,
                    resize: 'vertical',
                    tabSize: 2,
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <PixelBorder />
      </div>
    </div>
  );
}
