import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Task } from '../../types';
import { PixelSword } from '../shared/PixelArt';

type ViewTab = 'active' | 'completed' | 'archived';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--accent-secondary)',
  normal: 'var(--accent-primary)',
  low: 'var(--text-muted)',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '!!!',
  normal: '!!',
  low: '!',
};

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date(new Date().toISOString().split('T')[0]);
}

function formatDate(iso: string): string {
  return iso.split('T')[0];
}

function daysUntil(deadline: string): number {
  const now = new Date(new Date().toISOString().split('T')[0]);
  const d = new Date(deadline);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<ViewTab>('active');
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.listTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const filtered = tasks.filter(t => t.status === tab);

  // Sort: high priority first, then by deadline (soonest first), then by created
  const sorted = [...filtered].sort((a, b) => {
    const pOrder = { high: 0, normal: 1, low: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.created.localeCompare(a.created);
  });

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await api.createTask({
      title: newTitle.trim(),
      deadline: newDeadline || undefined,
      priority: newPriority,
    });
    setNewTitle('');
    setNewDeadline('');
    setNewPriority('normal');
    loadTasks();
  };

  const handleComplete = async (id: string) => {
    await api.completeTask(id);
    loadTasks();
  };

  const handleArchive = async (id: string) => {
    await api.archiveTask(id);
    loadTasks();
  };

  const handleReopen = async (id: string) => {
    await api.reopenTask(id);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    await api.deleteTask(id);
    loadTasks();
  };

  const handleEditSave = async (id: string) => {
    if (!editTitle.trim()) return;
    await api.updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
    loadTasks();
  };

  const counts = {
    active: tasks.filter(t => t.status === 'active').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    archived: tasks.filter(t => t.status === 'archived').length,
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>loading tasks...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <PixelSword size={20} />
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.03em',
        }}>
          task board
        </h1>
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginLeft: 4,
        }}>
          {counts.active} active
        </span>
      </div>

      {/* Add task */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="add task..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 13,
              padding: '8px 0',
              outline: 'none',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>
        <input
          type="date"
          value={newDeadline}
          onChange={e => setNewDeadline(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            padding: '8px 0',
            outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            width: 130,
          }}
        />
        <select
          value={newPriority}
          onChange={e => setNewPriority(e.target.value as any)}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: PRIORITY_COLORS[newPriority],
            fontSize: 11,
            padding: '8px 4px',
            outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
          }}
        >
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          style={{
            background: 'transparent',
            color: newTitle.trim() ? 'var(--accent-primary)' : 'var(--text-muted)',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: newTitle.trim() ? 'pointer' : 'default',
            padding: '8px 0',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          + add
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        {(['active', 'completed', 'archived'] as ViewTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'transparent',
              color: tab === t ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
              fontSize: 11,
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.04em',
              marginBottom: -1,
            }}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Task list */}
      {sorted.length === 0 && (
        <div style={{
          padding: '40px 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
        }}>
          {tab === 'active' ? 'no active tasks — add one above' :
           tab === 'completed' ? 'no completed tasks yet' :
           'archive is empty'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sorted.map(task => {
          const overdue = tab === 'active' && isOverdue(task.deadline);
          const days = task.deadline ? daysUntil(task.deadline) : null;

          return (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                borderLeft: `2px solid ${PRIORITY_COLORS[task.priority]}`,
                paddingLeft: 12,
              }}
            >
              {/* Checkbox / status */}
              {tab === 'active' && (
                <button
                  onClick={() => handleComplete(task.id)}
                  title="complete"
                  style={{
                    width: 16,
                    height: 16,
                    border: `1px solid ${PRIORITY_COLORS[task.priority]}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 10,
                  }}
                >
                  &nbsp;
                </button>
              )}
              {tab === 'completed' && (
                <span style={{
                  width: 16,
                  height: 16,
                  border: '1px solid var(--accent-green)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-green)',
                  fontSize: 10,
                  flexShrink: 0,
                }}>
                  x
                </span>
              )}

              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSave(task.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleEditSave(task.id)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--accent-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      padding: '2px 0',
                      outline: 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      if (tab === 'active') {
                        setEditingId(task.id);
                        setEditTitle(task.title);
                      }
                    }}
                    style={{
                      fontSize: 13,
                      color: tab === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: tab === 'completed' ? 'line-through' : 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: tab === 'active' ? 'text' : 'default',
                    }}
                  >
                    {task.title}
                  </span>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 12, marginTop: 3, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10,
                    color: PRIORITY_COLORS[task.priority],
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>

                  {task.deadline && (
                    <span style={{
                      fontSize: 10,
                      color: overdue ? 'var(--danger)' : days !== null && days <= 2 ? 'var(--accent-tertiary)' : 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {overdue ? `overdue ${task.deadline}` :
                       days === 0 ? `due today` :
                       days === 1 ? `due tomorrow` :
                       `due ${task.deadline}`}
                    </span>
                  )}

                  <span style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    added {formatDate(task.created)}
                  </span>

                  {task.completed && (
                    <span style={{
                      fontSize: 10,
                      color: 'var(--accent-green)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      done {formatDate(task.completed)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {tab === 'active' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    style={actionBtn}
                    title="complete"
                  >
                    done
                  </button>
                )}
                {tab === 'completed' && (
                  <>
                    <button
                      onClick={() => handleReopen(task.id)}
                      style={actionBtn}
                      title="reopen"
                    >
                      reopen
                    </button>
                    <button
                      onClick={() => handleArchive(task.id)}
                      style={actionBtn}
                      title="archive"
                    >
                      archive
                    </button>
                  </>
                )}
                {tab === 'archived' && (
                  <button
                    onClick={() => handleReopen(task.id)}
                    style={actionBtn}
                    title="reopen"
                  >
                    reopen
                  </button>
                )}
                <button
                  onClick={() => handleDelete(task.id)}
                  style={{ ...actionBtn, color: 'var(--danger)' }}
                  title="delete"
                >
                  del
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 10,
  cursor: 'pointer',
  padding: '2px 4px',
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '0.04em',
};
