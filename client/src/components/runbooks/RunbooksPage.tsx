import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Runbook, RunbookExecution } from '../../types';
import { PixelWrench, PixelBorder, PixelGhost } from '../shared/PixelArt';
import { TagBadge } from '../shared/TagBadge';

export function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeRunbook, setActiveRunbook] = useState<string | null>(null);
  const [activeExec, setActiveExec] = useState<RunbookExecution | null>(null);
  const [execLogs, setExecLogs] = useState<RunbookExecution[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // New runbook form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSteps, setNewSteps] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadRunbooks = useCallback(async () => {
    try {
      const data = await api.listRunbooks();
      setRunbooks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRunbooks(); }, [loadRunbooks]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const steps = newSteps.split('\n').filter(s => s.trim()).map(s => ({ label: s.trim() }));
    await api.createRunbook({
      title: newTitle.trim(),
      description: newDesc.trim(),
      steps: steps as any,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setNewTitle(''); setNewDesc(''); setNewSteps(''); setNewTags('');
    setShowAdd(false);
    loadRunbooks();
  };

  const handleRun = async (rb: Runbook) => {
    const exec = await api.startRunbook(rb.id);
    setActiveRunbook(rb.id);
    setActiveExec(exec);
    loadRunbooks();
  };

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    if (!activeExec) return;
    const updated = await api.updateExecution(activeExec.id, { stepId, completed });
    setActiveExec(updated);
    if (updated.completedAt) {
      loadRunbooks();
    }
  };

  const handleShowLogs = async (rbId: string) => {
    const logs = await api.getRunbookLogs(rbId);
    setExecLogs(logs);
    setShowLogs(true);
    setActiveRunbook(rbId);
  };

  const handleDelete = async (id: string) => {
    await api.deleteRunbook(id);
    if (activeRunbook === id) {
      setActiveRunbook(null);
      setActiveExec(null);
    }
    loadRunbooks();
  };

  const activeRb = runbooks.find(r => r.id === activeRunbook);

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelWrench size={20} color="var(--accent-primary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            runbooks
          </h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              color: 'var(--accent-primary)',
              fontSize: '11px',
              padding: '4px 10px',
              border: '1px solid var(--accent-primary)',
              background: 'transparent',
              cursor: 'pointer',
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
          step by step, we make it through
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
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="runbook title (e.g. switch firmware upgrade)"
              style={inputStyle}
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="description (optional)"
              style={inputStyle}
            />
            <textarea
              value={newSteps}
              onChange={e => setNewSteps(e.target.value)}
              placeholder="steps (one per line)&#10;backup running config&#10;download firmware to flash&#10;set boot variable&#10;reload and verify..."
              spellCheck={false}
              style={{
                ...inputStyle,
                minHeight: 120,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                lineHeight: 1.8,
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
              <button onClick={handleAdd} disabled={!newTitle.trim()} style={submitBtn}>save runbook</button>
            </div>
          </div>
        </div>
      )}

      {/* Active execution */}
      {activeExec && activeRb && !showLogs && (
        <div style={{
          marginBottom: 24,
          border: '1px solid var(--accent-primary)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <PixelWrench size={14} color="var(--accent-primary)" />
            <span style={{
              fontSize: '13px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              color: 'var(--text-primary)',
              flex: 1,
            }}>
              {activeRb.title}
            </span>
            {activeExec.completedAt ? (
              <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600 }}>
                complete
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: 'var(--accent-tertiary)' }}>
                {activeExec.steps.filter(s => s.completed).length}/{activeExec.steps.length}
              </span>
            )}
            <button
              onClick={() => { setActiveExec(null); setActiveRunbook(null); }}
              style={{ ...actionBtn, opacity: 0.6 }}
            >
              close
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'var(--border)' }}>
            <div style={{
              height: '100%',
              width: `${(activeExec.steps.filter(s => s.completed).length / activeExec.steps.length) * 100}%`,
              background: activeExec.completedAt ? 'var(--accent-green)' : 'var(--accent-primary)',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Steps */}
          <div style={{ padding: '8px 0' }}>
            {activeExec.steps.map((step, i) => {
              const rbStep = activeRb.steps.find(s => s.id === step.stepId);
              return (
                <button
                  key={step.stepId}
                  onClick={() => handleStepToggle(step.stepId, !step.completed)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderLeft: step.completed
                      ? '2px solid var(--accent-green)'
                      : '2px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '14px',
                    lineHeight: 1,
                    color: step.completed ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                    width: 16,
                  }}>
                    {step.completed ? '[x]' : '[ ]'}
                  </span>
                  <div>
                    <span style={{
                      fontSize: '12px',
                      color: step.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: step.completed ? 'line-through' : 'none',
                      opacity: step.completed ? 0.6 : 1,
                    }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginRight: 6 }}>{i + 1}.</span>
                      {rbStep?.label}
                    </span>
                    {rbStep?.notes && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                        {rbStep.notes}
                      </div>
                    )}
                    {step.completedAt && (
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 2, opacity: 0.5 }}>
                        {new Date(step.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {activeExec.completedAt && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--accent-green)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              all steps completed — {new Date(activeExec.completedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Execution logs */}
      {showLogs && activeRb && (
        <div style={{
          marginBottom: 24,
          border: '1px solid var(--border)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              fontSize: '12px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              color: 'var(--text-primary)',
              flex: 1,
            }}>
              run history — {activeRb.title}
            </span>
            <button onClick={() => setShowLogs(false)} style={{ ...actionBtn, opacity: 0.6 }}>close</button>
          </div>
          {execLogs.length === 0 ? (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>
              no runs yet
            </div>
          ) : (
            <div>
              {execLogs.map(log => (
                <div key={log.id} style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: log.completedAt ? 'var(--accent-green)' : 'var(--accent-tertiary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    width: 50,
                  }}>
                    {log.completedAt ? 'done' : `${log.steps.filter(s => s.completed).length}/${log.steps.length}`}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>
                    {new Date(log.startedAt).toLocaleDateString()} {new Date(log.startedAt).toLocaleTimeString()}
                  </span>
                  {log.completedAt && (
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.5 }}>
                      {Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 60000)}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Runbook list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>loading runbooks...</p>
        </div>
      ) : runbooks.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
          <PixelWrench size={24} color="var(--accent-primary)" />
          <p style={{ fontSize: '13px', marginTop: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            no runbooks yet
          </p>
          <p style={{ fontSize: '11px', marginTop: 4, fontStyle: 'italic' }}>
            that procedure you do every time? write it down once, run it forever.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {runbooks.map(rb => (
            <div
              key={rb.id}
              style={{
                borderLeft: `2px solid ${activeRunbook === rb.id ? 'var(--accent-primary)' : 'var(--border)'}`,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
              }}>
                <PixelWrench size={12} color="var(--accent-primary)" />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {rb.title}
                  </div>
                  {rb.description && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                      {rb.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {rb.steps.length} steps
                    </span>
                    {rb.runCount > 0 && (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.6 }}>
                        {rb.runCount} runs
                      </span>
                    )}
                    {rb.lastRun && (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.5 }}>
                        last: {new Date(rb.lastRun).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRun(rb)}
                  style={{
                    ...actionBtn,
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    padding: '3px 10px',
                    fontSize: '10px',
                  }}
                >
                  run
                </button>
                <button
                  onClick={() => handleShowLogs(rb.id)}
                  style={{ ...actionBtn, opacity: 0.5 }}
                >
                  logs
                </button>
                <button onClick={() => handleDelete(rb.id)} style={{ ...actionBtn, opacity: 0.4 }}>del</button>
              </div>
              {rb.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, padding: '0 12px 8px' }}>
                  {rb.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
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
