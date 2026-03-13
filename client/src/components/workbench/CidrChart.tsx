import { useState } from 'react';

// ── IPv4 data ──
function ipv4Rows() {
  const rows = [];
  for (let prefix = 32; prefix >= 0; prefix--) {
    const hostBits = 32 - prefix;
    const addresses = Math.pow(2, hostBits);
    const maskNum = prefix === 0 ? 0 : (~0 << hostBits) >>> 0;
    const mask = [
      (maskNum >>> 24) & 255,
      (maskNum >>> 16) & 255,
      (maskNum >>> 8) & 255,
      maskNum & 255,
    ].join('.');
    const wildcard = [
      255 - ((maskNum >>> 24) & 255),
      255 - ((maskNum >>> 16) & 255),
      255 - ((maskNum >>> 8) & 255),
      255 - (maskNum & 255),
    ].join('.');
    const usable = prefix >= 31 ? addresses : Math.max(addresses - 2, 0);
    rows.push({ prefix, addresses, usable, mask, wildcard, hostBits });
  }
  return rows;
}

// ── IPv6 data ──
interface V6Row {
  prefix: number;
  hostBits: number;
  usage: string;
  scale: string;
  subnets64: string;
}

function ipv6Rows(): V6Row[] {
  const entries: { prefix: number; usage: string }[] = [
    { prefix: 128, usage: 'loopback / single host' },
    { prefix: 127, usage: 'point-to-point (RFC 6164)' },
    { prefix: 126, usage: 'point-to-point link' },
    { prefix: 112, usage: '/112 subnet' },
    { prefix: 96, usage: 'IPv4-mapped range' },
    { prefix: 80, usage: '/80 prefix' },
    { prefix: 64, usage: 'single subnet (SLAAC)' },
    { prefix: 60, usage: '/60 subnet group' },
    { prefix: 56, usage: 'small site / residential' },
    { prefix: 48, usage: 'standard site prefix' },
    { prefix: 44, usage: '/44 site' },
    { prefix: 40, usage: '/40 site' },
    { prefix: 36, usage: '/36 site' },
    { prefix: 32, usage: 'site allocation' },
    { prefix: 31, usage: '/31 alloc' },
    { prefix: 30, usage: '/30 alloc' },
    { prefix: 29, usage: 'POP / IX' },
    { prefix: 28, usage: '/28 ISP' },
    { prefix: 24, usage: '/24 ISP' },
    { prefix: 23, usage: '/23 ISP' },
    { prefix: 20, usage: '/20 block' },
    { prefix: 19, usage: 'min RIR alloc' },
    { prefix: 16, usage: '/16 block' },
    { prefix: 12, usage: 'IANA block' },
    { prefix: 8, usage: '/8 block' },
    { prefix: 4, usage: '1/16th of everything' },
    { prefix: 0, usage: 'default route' },
  ];

  return entries.map(e => {
    const hostBits = 128 - e.prefix;
    return {
      ...e,
      hostBits,
      scale: humanScale(hostBits),
      subnets64: subnets64Count(e.prefix),
    };
  });
}

function humanScale(hostBits: number): string {
  if (hostBits === 0) return '1';
  if (hostBits === 1) return '2';
  if (hostBits === 2) return '4';
  if (hostBits <= 10) return Math.pow(2, hostBits).toLocaleString();
  if (hostBits <= 32) return shortNum(Math.pow(2, hostBits));
  if (hostBits === 48) return shortNum(Math.pow(2, hostBits));
  if (hostBits === 64) return '18.4 quintillion';
  if (hostBits === 68) return '295 quintillion';
  if (hostBits === 72) return '4.7 sextillion';
  if (hostBits === 80) return '1.2 septillion';
  if (hostBits === 84) return '19.3 septillion';
  if (hostBits === 88) return '309 septillion';
  if (hostBits === 92) return '4.9 octillion';
  if (hostBits === 96) return '79.2 octillion';
  if (hostBits === 100) return '1.27 nonillion';
  if (hostBits === 104) return '20 nonillion';
  if (hostBits === 108) return '324 nonillion';
  if (hostBits === 112) return '5.2 decillion';
  if (hostBits === 116) return '83 decillion';
  if (hostBits === 120) return '1.3 undecillion';
  if (hostBits === 124) return '21 undecillion';
  if (hostBits === 128) return '340 undecillion';
  return `2^${hostBits}`;
}

function subnets64Count(prefix: number): string {
  if (prefix > 64) return '—';
  if (prefix === 64) return '1';
  const bits = 64 - prefix;
  const n = Math.pow(2, bits);
  return shortNum(n);
}

function shortNum(n: number): string {
  if (n >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, '') + ' quadrillion';
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + ' trillion';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 10000) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

const COMMON_V4 = new Set([8, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);
const COMMON_V6 = new Set([32, 48, 56, 64, 126, 127, 128]);

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

const cell: React.CSSProperties = {
  ...mono,
  padding: '3px 8px',
  fontSize: '11px',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap' as const,
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

export function CidrChart() {
  const [tab, setTab] = useState<'v4' | 'v6'>('v4');
  const v4 = ipv4Rows();
  const v6 = ipv6Rows();

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
        {(['v4', 'v6'] as const).map(v => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              background: tab === v ? 'var(--accent-primary)' : 'transparent',
              color: tab === v ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${tab === v ? 'var(--accent-primary)' : 'var(--border)'}`,
              padding: '4px 12px',
              fontSize: '11px',
              ...mono,
              cursor: 'pointer',
              fontWeight: tab === v ? 600 : 400,
            }}
          >
            IP{v}
          </button>
        ))}
      </div>

      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {tab === 'v4' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 40 }}>cidr</th>
                <th style={{ ...th, width: 90, textAlign: 'right' }}>addresses</th>
                <th style={{ ...th, width: 80, textAlign: 'right' }}>usable</th>
                <th style={{ ...th, width: 110 }}>subnet mask</th>
                <th style={{ ...th, width: 110 }}>wildcard</th>
                <th style={{ ...th, width: 30, textAlign: 'center' }}>hb</th>
              </tr>
            </thead>
            <tbody>
              {v4.map(r => {
                const common = COMMON_V4.has(r.prefix);
                return (
                  <tr key={r.prefix}>
                    <td style={{
                      ...cell,
                      color: common ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: common ? 700 : 400,
                    }}>
                      /{r.prefix}
                    </td>
                    <td style={{ ...cell, textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {r.addresses.toLocaleString()}
                    </td>
                    <td style={{ ...cell, textAlign: 'right', color: 'var(--text-muted)' }}>
                      {r.usable.toLocaleString()}
                    </td>
                    <td style={{ ...cell, color: 'var(--text-secondary)' }}>
                      {r.mask}
                    </td>
                    <td style={{ ...cell, color: 'var(--text-muted)' }}>
                      {r.wildcard}
                    </td>
                    <td style={{ ...cell, textAlign: 'center', color: 'var(--text-muted)' }}>
                      {r.hostBits}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 45 }}>cidr</th>
                <th style={{ ...th, width: 30, textAlign: 'center' }}>hb</th>
                <th style={{ ...th, minWidth: 120 }}>addresses</th>
                <th style={{ ...th, width: 80 }}>/64 subnets</th>
                <th style={th}>usage</th>
              </tr>
            </thead>
            <tbody>
              {v6.map(r => {
                const common = COMMON_V6.has(r.prefix);
                return (
                  <tr key={r.prefix}>
                    <td style={{
                      ...cell,
                      color: common ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontWeight: common ? 700 : 400,
                    }}>
                      /{r.prefix}
                    </td>
                    <td style={{ ...cell, textAlign: 'center', color: 'var(--text-muted)' }}>
                      {r.hostBits}
                    </td>
                    <td style={{ ...cell, color: 'var(--text-secondary)' }}>
                      {r.scale}
                    </td>
                    <td style={{ ...cell, color: 'var(--text-muted)' }}>
                      {r.subnets64}
                    </td>
                    <td style={{ ...cell, color: 'var(--text-muted)', fontSize: '10px' }}>
                      {r.usage}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
