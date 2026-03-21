const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

const heading: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
};

const thStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '2px solid var(--border)',
  padding: '3px 8px',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
  background: 'var(--bg-primary)',
};

const tdStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border)',
  padding: '3px 8px',
  fontSize: '11px',
  color: 'var(--text-primary)',
  ...mono,
};

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  ...mono,
};

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{
      ...heading,
      fontSize: '13px',
      fontWeight: 600,
      color: accent,
      marginTop: '20px',
      marginBottom: '8px',
      borderLeft: `3px solid ${accent}`,
      paddingLeft: '8px',
      textTransform: 'lowercase',
    }}>
      {label}
    </div>
  );
}

export function IsisRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)', overflowY: 'auto', maxHeight: '100%' }}>

      {/* overview */}
      <SectionHeader label="overview" accent="var(--accent-primary)" />
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginBottom: '12px',
      }}>
        {[
          ['type', 'link-state IGP'],
          ['algorithm', 'dijkstra SPF'],
          ['encap', 'directly over L2 (no IP)'],
          ['standards', 'ISO 10589, RFC 1195'],
        ].map(([k, v]) => (
          <span key={k}>
            <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
            <span style={{ color: 'var(--accent-primary)' }}>{v}</span>
          </span>
        ))}
      </div>

      {/* pdu types */}
      <SectionHeader label="pdu types" accent="var(--accent-primary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>type</th>
            <th style={thStyle}>name</th>
            <th style={thStyle}>code</th>
            <th style={thStyle}>purpose</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['IIH', 'IS-IS Hello', '15/16/17', 'neighbor discovery and keepalive (L1, L2, P2P)'],
            ['LSP', 'Link State PDU', '18/20', 'carries link-state information (L1/L2)'],
            ['CSNP', 'Complete Sequence Number PDU', '24/25', 'full summary of LSDB — like OSPF DBD'],
            ['PSNP', 'Partial Sequence Number PDU', '26/27', 'request or acknowledge specific LSPs'],
          ].map(([type, name, code, purpose]) => (
            <tr key={type}>
              <td style={{ ...tdStyle, color: 'var(--accent-primary)', fontWeight: 600 }}>{type}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
              <td style={tdStyle}>{code}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* net address format */}
      <SectionHeader label="net address format" accent="var(--accent-secondary)" />
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        padding: '10px 14px',
        fontSize: '12px',
        marginBottom: '8px',
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '6px' }}>
          network entity title (NET) — CLNS address with N-selector = 00
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-muted)' }}>format: </span>
          <span style={{ color: 'var(--accent-tertiary)' }}>area ID</span>
          <span style={{ color: 'var(--text-muted)' }}> . </span>
          <span style={{ color: 'var(--accent-primary)' }}>system ID</span>
          <span style={{ color: 'var(--text-muted)' }}> . </span>
          <span style={{ color: 'var(--accent-secondary)' }}>N-selector</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px' }}>examples:</div>
        {[
          { net: '49.0001.1921.6800.1001.00', area: '49.0001', sys: '1921.6800.1001', note: '192.168.1.1 encoded' },
          { net: '49.0001.0000.0000.0001.00', area: '49.0001', sys: '0000.0000.0001', note: 'simple numbering' },
          { net: '49.0002.1720.1600.2001.00', area: '49.0002', sys: '1720.1600.2001', note: '172.16.2.1 encoded' },
        ].map((e) => (
          <div key={e.net} style={{ marginBottom: '2px' }}>
            <span style={{ color: 'var(--accent-primary)' }}>{e.net}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}> — {e.note}</span>
          </div>
        ))}
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '8px' }}>
          <span style={{ color: 'var(--accent-tertiary)' }}>area ID</span>: variable length (1-13 bytes) |{' '}
          <span style={{ color: 'var(--accent-primary)' }}>system ID</span>: always 6 bytes |{' '}
          <span style={{ color: 'var(--accent-secondary)' }}>N-sel</span>: always 00 for NET
        </div>
      </div>

      {/* level 1 vs level 2 */}
      <SectionHeader label="level 1 vs level 2" accent="var(--accent-tertiary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>feature</th>
            <th style={thStyle}>level 1</th>
            <th style={thStyle}>level 2</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['scope', 'intra-area routing', 'inter-area (backbone) routing'],
            ['LSDB', 'separate L1 database', 'separate L2 database'],
            ['adjacency', 'forms with L1 and L1/L2 in same area', 'forms with L2 and L1/L2 routers'],
            ['default route', 'L1 uses default to nearest L1/L2', 'carries full topology'],
            ['ATT bit', 'follows ATT bit to reach L2', 'sets ATT bit if connected to other areas'],
            ['route leaking', 'receives leaked L2 routes', 'can leak routes down to L1'],
            ['comparable to', 'OSPF non-backbone area', 'OSPF backbone (area 0)'],
          ].map(([feat, l1, l2]) => (
            <tr key={feat}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{feat}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{l1}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{l2}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '10px', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
        router level types
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>type</th>
            <th style={thStyle}>description</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['L1', 'level 1 only — intra-area routing, uses default to reach other areas'],
            ['L2', 'level 2 only — inter-area backbone routing'],
            ['L1/L2', 'both levels — area border, maintains separate LSDB per level, sets ATT bit'],
          ].map(([type, desc]) => (
            <tr key={type}>
              <td style={{ ...tdStyle, color: 'var(--accent-tertiary)', fontWeight: 600 }}>{type}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* adjacency states */}
      <SectionHeader label="adjacency states" accent="var(--accent-green)" />
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        marginBottom: '10px',
        padding: '6px 0',
      }}>
        {['down', 'initializing', 'up'].map((s, i, arr) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              color: i === arr.length - 1 ? 'var(--accent-green)' : 'var(--accent-primary)',
              fontWeight: i === arr.length - 1 ? 700 : 400,
            }}>{s}</span>
            {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
          </span>
        ))}
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>state</th>
            <th style={thStyle}>description</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['down', 'no IIH received from neighbor, adjacency not established'],
            ['initializing', 'IIH received but two-way communication not yet confirmed'],
            ['up', 'bidirectional communication confirmed, adjacency fully established, LSDB sync proceeds'],
          ].map(([state, desc]) => (
            <tr key={state}>
              <td style={{ ...tdStyle, color: 'var(--accent-green)', fontWeight: 600 }}>{state}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* dis */}
      <SectionHeader label="dis (designated intermediate system)" accent="var(--accent-primary)" />
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
        {[
          'elected per level on broadcast segments (L1 DIS, L2 DIS)',
          'highest interface priority wins (default 64, range 0-127)',
          'priority 0 does NOT prevent DIS election (unlike OSPF DR)',
          'tie-breaker: highest SNPA (MAC address)',
          'election IS preemptive — new higher-priority router takes over immediately',
          'no backup DIS (no BDR equivalent)',
          'DIS sends CSNPs every 10 seconds to keep LSDB synchronized',
          'DIS creates pseudonode LSP representing the broadcast segment',
          'all routers on segment form adjacencies with all others (not just DIS)',
          'DIS uses IIH hello interval of 3.3s (⅓ of normal 10s)',
        ].map((fact, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <span style={{ color: 'var(--accent-primary)' }}>•</span>
            <span>{fact}</span>
          </div>
        ))}
      </div>

      {/* metric types */}
      <SectionHeader label="metric types" accent="var(--accent-secondary)" />
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
        narrow metrics (original)
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>metric</th>
            <th style={thStyle}>range</th>
            <th style={thStyle}>notes</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['interface cost', '1-63 (6 bits)', 'default 10 for all interfaces'],
            ['path cost', '1-1023 (10 bits)', 'sum of interface costs along path'],
            ['optional metrics', 'delay, expense, error', 'rarely used, largely deprecated'],
          ].map(([m, r, n]) => (
            <tr key={m}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{m}</td>
              <td style={{ ...tdStyle, color: 'var(--accent-secondary)' }}>{r}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', marginTop: '12px', fontWeight: 600 }}>
        wide metrics (RFC 5305)
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>metric</th>
            <th style={thStyle}>range</th>
            <th style={thStyle}>notes</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['interface cost', '1-16,777,215 (24 bits)', 'allows bandwidth-based costing like OSPF'],
            ['path cost', '1-4,261,412,864 (32 bits)', 'supports large-scale networks'],
            ['TE metric', '24 bits', 'traffic engineering extensions'],
          ].map(([m, r, n]) => (
            <tr key={m}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{m}</td>
              <td style={{ ...tdStyle, color: 'var(--accent-secondary)' }}>{r}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* common tlvs */}
      <SectionHeader label="common tlvs" accent="var(--accent-tertiary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>code</th>
            <th style={thStyle}>name</th>
            <th style={thStyle}>used in</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['1', 'area addresses', 'IIH, LSP'],
            ['2', 'IS neighbors (narrow)', 'LSP'],
            ['6', 'IS neighbors (MAC address)', 'IIH (LAN)'],
            ['8', 'padding', 'IIH'],
            ['9', 'LSP entries', 'CSNP, PSNP'],
            ['10', 'authentication', 'IIH, LSP, CSNP, PSNP'],
            ['12', 'optional checksum', 'IIH'],
            ['14', 'LSP buffer size', 'IIH'],
            ['22', 'extended IS reachability (wide)', 'LSP'],
            ['128', 'IP internal reachability (narrow)', 'LSP'],
            ['129', 'protocols supported', 'IIH, LSP'],
            ['130', 'IP external reachability (narrow)', 'LSP'],
            ['132', 'IP interface address', 'IIH, LSP'],
            ['135', 'extended IP reachability (wide)', 'LSP'],
            ['137', 'dynamic hostname', 'LSP'],
            ['232', 'IPv6 reachability', 'LSP'],
            ['236', 'IPv6 interface address', 'IIH, LSP'],
            ['240', 'multi-topology', 'IIH, LSP'],
          ].map(([code, name, used]) => (
            <tr key={code}>
              <td style={{ ...tdStyle, color: 'var(--accent-tertiary)', fontWeight: 600 }}>{code}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{used}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* timers */}
      <SectionHeader label="timers" accent="var(--accent-green)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>timer</th>
            <th style={thStyle}>default</th>
            <th style={thStyle}>notes</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['hello interval', '10s (broadcast/P2P)', 'must match on neighbors (same level)'],
            ['hello interval (DIS)', '3.3s (⅓ of normal)', 'faster hellos on DIS for LAN segments'],
            ['hold time', '30s (3x hello)', 'neighbor declared dead after this'],
            ['CSNP interval', '10s', 'DIS sends CSNP on broadcast every 10s'],
            ['LSP generation', '5s (initial)', 'delay before generating new LSP'],
            ['LSP refresh', '900s (15 min)', 're-flood LSP before max age'],
            ['LSP max age', '1200s (20 min)', 'LSP purged from LSDB at max age'],
            ['SPF delay', '5.5s', 'delay before running SPF after topology change'],
            ['PSNP interval', '2s', 'interval between PSNP transmissions'],
          ].map(([timer, def, notes]) => (
            <tr key={timer}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{timer}</td>
              <td style={{ ...tdStyle, color: 'var(--accent-green)' }}>{def}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* is-is vs ospf */}
      <SectionHeader label="is-is vs ospf" accent="var(--accent-primary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>feature</th>
            <th style={thStyle}>IS-IS</th>
            <th style={thStyle}>OSPF</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['encapsulation', 'directly over L2 (CLNS)', 'IP protocol 89'],
            ['hierarchy', '2 levels (L1/L2)', 'multi-area with area 0 backbone'],
            ['area boundaries', 'on links (between routers)', 'on routers (ABR)'],
            ['address family', 'multi-topology native', 'v2 = IPv4, v3 = IPv6'],
            ['metric default', '10 (all interfaces)', 'bandwidth-based cost'],
            ['metric range (wide)', '1-16,777,215', '1-65,535'],
            ['DR equivalent', 'DIS (preemptive, no backup)', 'DR/BDR (non-preemptive)'],
            ['flooding', 'per level', 'per area'],
            ['LSA/LSP max age', '1200s (20 min)', '3600s (1 hour)'],
            ['LSA/LSP refresh', '900s (15 min)', '1800s (30 min)'],
            ['authentication', 'TLV-based (HMAC-MD5, etc.)', 'built-in or IPsec (v3)'],
            ['extensibility', 'TLV-based — easy to extend', 'new LSA types — harder to extend'],
            ['stub areas', 'not natively (overload bit)', 'stub, NSSA, totally stub'],
            ['transport', 'L2 frames — no fragmentation', 'IP — subject to fragmentation'],
            ['convergence', 'slightly faster in large SP networks', 'comparable with tuning'],
            ['typical use', 'ISP / service provider backbone', 'enterprise / campus networks'],
          ].map(([feat, isis, ospf]) => (
            <tr key={feat}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{feat}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{isis}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{ospf}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* segment routing with is-is */}
      <SectionHeader label="segment routing with is-is" accent="var(--accent-secondary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>TLV/sub-TLV</th>
            <th style={thStyle}>code</th>
            <th style={thStyle}>purpose</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['SR capability', '2 (router cap sub-TLV)', 'advertises SRGB range and SR support'],
            ['SR algorithm', '19 (router cap sub-TLV)', 'advertises supported algorithms (SPF, strict SPF)'],
            ['prefix SID', '3 (sub-TLV of TLV 135/236)', 'node or prefix segment identifier'],
            ['adjacency SID', '31/32 (sub-TLV of TLV 22)', 'label for specific adjacency (LAN/P2P)'],
            ['SID/label binding', 'TLV 149', 'mapping server entries (prefix-to-SID)'],
            ['SR local block', '22 (router cap sub-TLV)', 'SRLB range for local SIDs'],
            ['MSD (max SID depth)', '23 (router cap sub-TLV)', 'max labels router can push'],
            ['flex-algo definition', 'TLV 16 (router cap)', 'defines custom algorithm constraints'],
            ['flex-algo prefix metric', '146 (sub-TLV)', 'metric for flex-algo computation'],
            ['SRv6 locator', 'TLV 27', 'advertises SRv6 locator and END SIDs'],
            ['SRv6 end.x SID', '43 (sub-TLV of TLV 22)', 'SRv6 adjacency segment'],
            ['SRv6 capability', '25 (router cap sub-TLV)', 'advertises SRv6 support and flags'],
          ].map(([name, code, purpose]) => (
            <tr key={name}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
              <td style={{ ...tdStyle, color: 'var(--accent-secondary)' }}>{code}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ height: '24px' }} />
    </div>
  );
}
