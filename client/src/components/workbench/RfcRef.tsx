import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api/client';

interface RfcEntry {
  number: number;
  title: string;
  section: string;
  year: number;
  note: string;
}

function parseRfcTables(markdown: string): RfcEntry[] {
  const rfcs: RfcEntry[] = [];
  let currentSection = '';

  for (const line of markdown.split('\n')) {
    // Track section headers (## Section Name)
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].trim();
      continue;
    }

    // Parse table rows: | RFC | Title | Year | Notes |
    const rowMatch = line.match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d{4})\s*\|\s*(.*?)\s*\|/);
    if (rowMatch) {
      rfcs.push({
        number: parseInt(rowMatch[1]),
        title: rowMatch[2].trim(),
        section: currentSection,
        year: parseInt(rowMatch[3]),
        note: rowMatch[4].trim(),
      });
    }
  }

  return rfcs;
}

const SECTION_COLORS: Record<string, string> = {
  'IP & Addressing': 'var(--accent-primary)',
  'IPv6': 'var(--accent-primary)',
  'Multicast': 'var(--accent-secondary)',
  'Routing': 'var(--accent-tertiary)',
  'Transport': 'var(--accent-green)',
  'DNS': 'var(--accent-primary)',
  'DHCP': 'var(--text-secondary)',
  'Security': 'var(--accent-secondary)',
  'Tunneling': 'var(--accent-green)',
  'MPLS': 'var(--accent-tertiary)',
  'NAT': 'var(--accent-secondary)',
  'Switching': 'var(--accent-green)',
  'QoS': 'var(--text-secondary)',
  'HTTP': 'var(--accent-tertiary)',
  'Network Management': 'var(--text-secondary)',
  'Automation': 'var(--accent-primary)',
  'Meta': 'var(--text-muted)',
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

const cell: React.CSSProperties = {
  ...mono,
  padding: '3px 8px',
  fontSize: '11px',
  borderBottom: '1px solid var(--border)',
};

const th: React.CSSProperties = {
  ...cell,
  fontSize: '9px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  borderBottom: '2px solid var(--border)',
  position: 'sticky' as const,
  top: 0,
  background: 'var(--bg-primary)',
  zIndex: 1,
};

export function RfcRef() {
  const [rfcs, setRfcs] = useState<RfcEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('all');
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    api.search('', 'rfc-reference')
      .then(entries => {
        if (entries.length > 0) {
          const entry = entries[0];
          setNoteId(entry.id);
          setRfcs(parseRfcTables(entry.body));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sections = useMemo(() => {
    const s = new Set(rfcs.map(r => r.section));
    return ['all', ...Array.from(s)];
  }, [rfcs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rfcs
      .filter(r => {
        if (section !== 'all' && r.section !== section) return false;
        if (!q) return true;
        return (
          String(r.number).includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.number - b.number);
  }, [rfcs, search, section]);

  const copyRfc = useCallback((rfc: RfcEntry) => {
    navigator.clipboard.writeText(`RFC ${rfc.number} — ${rfc.title}`);
    setCopied(rfc.number);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '12px', ...mono }}>loading rfcs...</div>;
  }

  if (rfcs.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '12px', ...mono }}>
        no RFC reference note found. create a note tagged <span style={{ color: 'var(--accent-primary)' }}>#rfc-reference</span> with
        markdown tables (| RFC | Title | Year | Notes |) to populate this view.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-primary)',
            ...mono,
            fontSize: '12px',
            padding: '5px 0',
            width: '100%',
            maxWidth: 400,
            outline: 'none',
          }}
          placeholder="search RFC number, title, or keyword..."
          spellCheck={false}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 12 }}>
        {sections.map(s => (
          <button
            key={s}
            onClick={() => setSection(prev => prev === s ? 'all' : s)}
            style={{
              background: section === s ? 'var(--accent-primary)' : 'transparent',
              color: section === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${section === s ? 'var(--accent-primary)' : 'var(--border)'}`,
              padding: '2px 8px',
              fontSize: '10px',
              ...mono,
              cursor: 'pointer',
              fontWeight: section === s ? 600 : 400,
            }}
          >
            {s === 'all' ? 'all' : s.toLowerCase()}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 6, ...mono }}>
        {filtered.length} rfc{filtered.length !== 1 ? 's' : ''}
        {noteId && (
          <a
            href={`/editor/${encodeURIComponent(noteId)}`}
            style={{ marginLeft: 8, color: 'var(--accent-primary)', textDecoration: 'none' }}
            title="edit RFC reference note"
          >
            edit note
          </a>
        )}
      </div>

      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 55 }}>rfc</th>
              <th style={th}>title</th>
              <th style={{ ...th, width: 80 }}>section</th>
              <th style={{ ...th, width: 40 }}>year</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr
                key={`${r.number}-${r.section}`}
                style={{ cursor: 'pointer' }}
                onClick={() => copyRfc(r)}
                title="click to copy"
              >
                <td style={{
                  ...cell,
                  color: copied === r.number ? 'var(--accent-green)' : 'var(--accent-primary)',
                  fontWeight: 600,
                }}>
                  {copied === r.number ? 'copied' : r.number}
                </td>
                <td style={{ ...cell, color: 'var(--text-primary)' }}>
                  {r.title}
                  {r.note && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: 8 }}>
                      — {r.note}
                    </span>
                  )}
                </td>
                <td style={{
                  ...cell,
                  color: SECTION_COLORS[r.section] || 'var(--text-muted)',
                  fontSize: '10px',
                }}>
                  {r.section.toLowerCase()}
                </td>
                <td style={{ ...cell, color: 'var(--text-muted)', fontSize: '10px' }}>
                  {r.year}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
