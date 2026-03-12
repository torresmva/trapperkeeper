import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { PixelFire } from './PixelArt';

interface Sprint {
  name: string;
  startDate: string;
  endDate: string;
  major: string;
  minor: string;
}

export function SprintCard() {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Sprint>({ name: '', startDate: '', endDate: '', major: '', minor: '' });

  useEffect(() => {
    api.getSprint().then(data => {
      if (data) {
        setSprint(data);
        setForm(data);
      }
    });
  }, []);

  const handleSave = async () => {
    const saved = await api.saveSprint(form);
    setSprint(saved);
    setEditing(false);
  };

  // Calculate days remaining
  const daysLeft = sprint?.endDate
    ? Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '8px 16px',
    }}>
      {!editing ? (
        <div
          onClick={() => { setForm(sprint || { name: '', startDate: '', endDate: '', major: '', minor: '' }); setEditing(true); }}
          style={{ cursor: 'pointer' }}
        >
          {sprint?.name ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
              }}>
                <PixelFire size={10} color="var(--accent-secondary)" />
                <span style={{
                  fontSize: '10px',
                  color: 'var(--accent-secondary)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}>
                  {sprint.name}
                </span>
                {daysLeft !== null && (
                  <span style={{
                    fontSize: '9px',
                    color: daysLeft <= 3 ? 'var(--accent-tertiary)' : 'var(--text-muted)',
                    marginLeft: 'auto',
                  }}>
                    {daysLeft}d left
                  </span>
                )}
              </div>
              {sprint.major && (
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  marginBottom: 2,
                  paddingLeft: 16,
                  lineHeight: 1.4,
                }}>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '8px', marginRight: 4 }}>▲</span>
                  {sprint.major}
                </div>
              )}
              {sprint.minor && (
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  paddingLeft: 16,
                  lineHeight: 1.4,
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '8px', marginRight: 4 }}>▽</span>
                  {sprint.minor}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>
              set sprint →
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn 0.15s ease' }}>
          <input
            autoFocus
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="sprint name (e.g., sprint 14)"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <input
            value={form.major}
            onChange={e => setForm({ ...form, major: e.target.value })}
            placeholder="▲ major commitment"
            style={inputStyle}
          />
          <input
            value={form.minor}
            onChange={e => setForm({ ...form, minor: e.target.value })}
            placeholder="▽ minor commitment"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '10px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontSize: '10px',
                cursor: 'pointer',
                padding: '4px 10px',
              }}
            >
              save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: '10px',
  padding: '4px 0',
  outline: 'none',
  fontFamily: "'JetBrains Mono', monospace",
};
