import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Entry } from '../../types';
import { NoteCard } from './NoteCard';
import { PixelGhost, PixelKey } from '../shared/PixelArt';

export function NoteList() {
  const [notes, setNotes] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.listNotes()
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleQuickNote = async () => {
    const entry = await api.quickNote({});
    navigate(`/notes/${entry.id}`);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        marginBottom: 32,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          flex: 1,
        }}>
          notes
        </h1>
        <button
          onClick={handleQuickNote}
          style={{
            color: 'var(--accent-secondary)',
            fontSize: '11px',
            padding: '4px 10px',
            border: '1px solid var(--accent-secondary)',
            background: 'transparent',
          }}
        >
          + quick note
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '32px 0' }}>
          <PixelGhost size={18} color="var(--text-muted)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
            conjuring notes from the ether...
          </p>
        </div>
      ) : notes.length === 0 ? (
        <div style={{ padding: '48px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <PixelKey size={20} color="var(--accent-secondary)" />
            <p style={{ fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>nothing captured yet</p>
          </div>
          <p style={{ fontSize: '11px', paddingLeft: 30 }}>
            press <span style={{ color: 'var(--accent-primary)' }}>ctrl+k</span> to start a quick capture. it's dangerous to go alone.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {notes.map(note => (
            <NoteCard
              key={note.id}
              entry={note}
              onClick={() => navigate(`/notes/${note.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
