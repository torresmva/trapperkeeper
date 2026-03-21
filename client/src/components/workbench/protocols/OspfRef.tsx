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

function Check() {
  return <span style={{ color: 'var(--accent-green)' }}>✓</span>;
}

function Cross() {
  return <span style={{ color: 'var(--text-muted)' }}>✗</span>;
}

export function OspfRef() {
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
          ['protocol', 'IP 89'],
          ['AD', '110'],
          ['standards', 'RFC 2328 (v2), RFC 5340 (v3)'],
        ].map(([k, v]) => (
          <span key={k}>
            <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
            <span style={{ color: 'var(--accent-primary)' }}>{v}</span>
          </span>
        ))}
      </div>

      {/* packet types */}
      <SectionHeader label="packet types" accent="var(--accent-primary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>type</th>
            <th style={thStyle}>name</th>
            <th style={thStyle}>purpose</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['1', 'hello', 'neighbor discovery, keepalive, DR/BDR election'],
            ['2', 'DBD', 'database description — summary of LSDB contents'],
            ['3', 'LSR', 'link-state request — request specific LSAs'],
            ['4', 'LSU', 'link-state update — carries full LSAs'],
            ['5', 'LSAck', 'link-state acknowledgment — confirms receipt'],
          ].map(([type, name, purpose]) => (
            <tr key={type}>
              <td style={{ ...tdStyle, color: 'var(--accent-primary)' }}>{type}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* lsa types */}
      <SectionHeader label="lsa types" accent="var(--accent-secondary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>type</th>
            <th style={thStyle}>name</th>
            <th style={thStyle}>scope</th>
            <th style={thStyle}>originated by</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['1', 'router LSA', 'area', 'every router'],
            ['2', 'network LSA', 'area', 'DR on broadcast/NBMA'],
            ['3', 'summary LSA (network)', 'area', 'ABR'],
            ['4', 'summary LSA (ASBR)', 'area', 'ABR'],
            ['5', 'AS external LSA', 'domain', 'ASBR'],
            ['6', 'group membership', 'area', 'multicast routers'],
            ['7', 'NSSA external LSA', 'area', 'ASBR in NSSA'],
            ['8', 'external attributes (OSPFv2) / link-local (OSPFv3)', 'link/domain', 'various'],
            ['9', 'opaque link-local', 'link', 'any router'],
            ['10', 'opaque area-local', 'area', 'any router'],
            ['11', 'opaque AS-scope', 'domain', 'any router'],
          ].map(([type, name, scope, orig]) => (
            <tr key={type}>
              <td style={{ ...tdStyle, color: 'var(--accent-secondary)' }}>{type}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{scope}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{orig}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* area types */}
      <SectionHeader label="area types" accent="var(--accent-tertiary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>area type</th>
            <th style={thStyle}>LSA 1-2</th>
            <th style={thStyle}>LSA 3</th>
            <th style={thStyle}>LSA 4</th>
            <th style={thStyle}>LSA 5</th>
            <th style={thStyle}>LSA 7</th>
            <th style={thStyle}>default route</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['backbone (area 0)', true, true, true, true, false, false],
            ['normal', true, true, true, true, false, false],
            ['stub', true, true, false, false, false, true],
            ['totally stub', true, false, false, false, false, true],
            ['NSSA', true, true, true, false, true, false],
            ['totally NSSA', true, false, false, false, true, true],
          ].map(([area, l12, l3, l4, l5, l7, def]) => (
            <tr key={area as string}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{area as string}</td>
              {[l12, l3, l4, l5, l7, def].map((v, i) => (
                <td key={i} style={{ ...tdStyle, textAlign: 'center' }}>
                  {v ? <Check /> : <Cross />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* neighbor states */}
      <SectionHeader label="neighbor states" accent="var(--accent-green)" />
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        marginBottom: '10px',
        padding: '6px 0',
      }}>
        {['down', 'attempt', 'init', '2-way', 'exstart', 'exchange', 'loading', 'full'].map((s, i, arr) => (
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
            ['down', 'no hello received from neighbor'],
            ['attempt', 'unicast hello sent (NBMA only), no reply yet'],
            ['init', 'hello received but own router ID not in neighbor list'],
            ['2-way', 'bidirectional communication established; DR/BDR election happens here'],
            ['exstart', 'master/slave negotiation for DBD exchange'],
            ['exchange', 'DBD packets exchanged describing LSDB contents'],
            ['loading', 'LSR/LSU exchange to sync missing LSAs'],
            ['full', 'databases fully synchronized — adjacency complete'],
          ].map(([state, desc]) => (
            <tr key={state}>
              <td style={{ ...tdStyle, color: 'var(--accent-green)', fontWeight: 600 }}>{state}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* network types */}
      <SectionHeader label="network types" accent="var(--accent-primary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>type</th>
            <th style={thStyle}>hello</th>
            <th style={thStyle}>dead</th>
            <th style={thStyle}>DR/BDR</th>
            <th style={thStyle}>neighbors</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['broadcast', '10s', '40s', 'yes', 'auto (multicast)'],
            ['NBMA', '30s', '120s', 'yes', 'manual (unicast)'],
            ['point-to-point', '10s', '40s', 'no', 'auto (multicast)'],
            ['point-to-multipoint', '30s', '120s', 'no', 'auto (multicast)'],
            ['P2MP non-broadcast', '30s', '120s', 'no', 'manual (unicast)'],
          ].map(([type, hello, dead, dr, nbr]) => (
            <tr key={type}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{type}</td>
              <td style={tdStyle}>{hello}</td>
              <td style={tdStyle}>{dead}</td>
              <td style={{ ...tdStyle, color: dr === 'yes' ? 'var(--accent-green)' : 'var(--text-muted)' }}>{dr}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{nbr}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* router types */}
      <SectionHeader label="router types" accent="var(--accent-secondary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>type</th>
            <th style={thStyle}>description</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['IR (internal router)', 'all interfaces in a single area'],
            ['ABR (area border router)', 'interfaces in multiple areas, at least one in area 0'],
            ['ASBR (AS boundary router)', 'redistributes routes from another protocol or AS'],
            ['BR (backbone router)', 'at least one interface in area 0'],
          ].map(([type, desc]) => (
            <tr key={type}>
              <td style={{ ...tdStyle, color: 'var(--accent-secondary)', fontWeight: 600 }}>{type}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* route preference */}
      <SectionHeader label="route preference" accent="var(--accent-tertiary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>code</th>
            <th style={thStyle}>type</th>
            <th style={thStyle}>description</th>
            <th style={thStyle}>preference</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['O', 'intra-area', 'routes within the same area', '1 (most preferred)'],
            ['O IA', 'inter-area', 'routes from another area via ABR', '2'],
            ['O E1', 'external type 1', 'external routes — cost = external + internal', '3'],
            ['O E2', 'external type 2', 'external routes — cost = external only (default)', '4'],
            ['O N1', 'NSSA type 1', 'NSSA external — cost = external + internal', '3'],
            ['O N2', 'NSSA type 2', 'NSSA external — cost = external only', '4'],
          ].map(([code, type, desc, pref]) => (
            <tr key={code}>
              <td style={{ ...tdStyle, color: 'var(--accent-tertiary)', fontWeight: 600 }}>{code}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{type}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{desc}</td>
              <td style={tdStyle}>{pref}</td>
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
            ['hello interval', '10s (broadcast/P2P), 30s (NBMA)', 'must match on neighbors'],
            ['dead interval', '4x hello', 'must match on neighbors'],
            ['wait timer', '= dead interval', 'wait before DR/BDR election'],
            ['retransmit interval', '5s', 'resend unacknowledged LSAs'],
            ['LSA max age', '3600s (1 hour)', 'LSA flushed from LSDB at max age'],
            ['LSA refresh', '1800s (30 min)', 're-originate LSA before max age'],
            ['SPF delay', '5s (initial)', 'delay before running SPF after topology change'],
            ['SPF hold time', '10s', 'minimum gap between consecutive SPF runs'],
          ].map(([timer, def, notes]) => (
            <tr key={timer}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{timer}</td>
              <td style={{ ...tdStyle, color: 'var(--accent-green)' }}>{def}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* cost formula */}
      <SectionHeader label="cost formula" accent="var(--accent-primary)" />
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        padding: '10px 14px',
        fontSize: '12px',
        marginBottom: '8px',
      }}>
        <div style={{ color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '8px' }}>
          cost = reference bandwidth / interface bandwidth
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '6px' }}>
          default reference: 100 Mbps (Cisco) — adjust with <span style={{ color: 'var(--accent-secondary)' }}>auto-cost reference-bandwidth</span>
        </div>
        <table style={{ ...tableStyle, width: 'auto' }}>
          <tbody>
            {[
              ['100 Gbps', '100,000 / 100,000 = 1'],
              ['10 Gbps', '100,000 / 10,000 = 10'],
              ['1 Gbps', '100,000 / 1,000 = 100'],
              ['100 Mbps', '100,000 / 100 = 1,000'],
              ['10 Mbps', '100,000 / 10 = 10,000'],
            ].map(([iface, calc]) => (
              <tr key={iface}>
                <td style={{ ...tdStyle, color: 'var(--text-secondary)', width: '100px' }}>{iface}</td>
                <td style={{ ...tdStyle, color: 'var(--accent-primary)' }}>{calc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '6px' }}>
          * examples use reference-bandwidth 100000 (100 Gbps)
        </div>
      </div>

      {/* DR/BDR election */}
      <SectionHeader label="DR/BDR election" accent="var(--accent-secondary)" />
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
        {[
          'highest OSPF interface priority wins (default 1, range 0-255)',
          'priority 0 = cannot become DR or BDR',
          'if priority ties, highest router ID wins',
          'router ID = highest loopback IP, or highest physical IP if no loopback',
          'election is non-preemptive — existing DR/BDR not replaced by higher priority router',
          'DR failure → BDR promoted to DR, new BDR elected',
        ].map((rule, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, minWidth: '16px' }}>{i + 1}.</span>
            <span>{rule}</span>
          </div>
        ))}
      </div>

      {/* ospfv2 vs ospfv3 */}
      <SectionHeader label="ospfv2 vs ospfv3" accent="var(--accent-tertiary)" />
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>feature</th>
            <th style={thStyle}>OSPFv2</th>
            <th style={thStyle}>OSPFv3</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['network layer', 'IPv4 only', 'IPv6 (+ IPv4 via AF)'],
            ['transport', 'IP protocol 89', 'IP protocol 89'],
            ['addressing', 'network statements', 'per-link (interface) config'],
            ['multicast', '224.0.0.5 / 224.0.0.6', 'FF02::5 / FF02::6'],
            ['authentication', 'built-in (MD5/cleartext)', 'relies on IPsec AH/ESP'],
            ['LSA flooding scope', 'area/AS', 'link-local/area/AS'],
            ['router/link LSA', 'type 1 includes prefixes', 'type 1 = topology only; type 9 = prefixes'],
            ['instance support', 'single per link', 'multiple instances per link'],
            ['header', 'source in IP header', 'link-local source address'],
            ['neighbors', 'identified by IP', 'identified by router ID'],
          ].map(([feat, v2, v3]) => (
            <tr key={feat}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{feat}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{v2}</td>
              <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{v3}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ height: '24px' }} />
    </div>
  );
}
