import React from 'react';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const cell: React.CSSProperties = { ...mono, padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid var(--border)' };
const th: React.CSSProperties = { ...cell, fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: '2px solid var(--border)', position: 'sticky' as const, top: 0, background: 'var(--bg-primary)', zIndex: 1 };
const heading: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', marginTop: '20px', marginBottom: '8px', paddingLeft: '8px' };

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ ...heading, borderLeft: `3px solid ${accent}`, color: 'var(--text-primary)' }}>{title}</div>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={{ ...th, textAlign: 'left' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ ...cell, color: 'var(--text-secondary)' }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PimRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)' }}>

      {/* overview */}
      <Section title="overview" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div><span style={{ color: 'var(--accent-primary)' }}>protocol independent multicast</span> — multicast routing protocol family</div>
          <div>ip protocol <span style={{ color: 'var(--accent-tertiary)' }}>103</span> | relies on unicast routing table for RPF checks</div>
          <div>rfc <span style={{ color: 'var(--accent-primary)' }}>7761</span> (PIM-SM) | does not build its own routing table</div>
          <div>uses <span style={{ color: 'var(--accent-secondary)' }}>igmp</span> (ipv4) or <span style={{ color: 'var(--accent-secondary)' }}>mld</span> (ipv6) for host-to-router signaling</div>
        </div>
      </Section>

      {/* pim modes */}
      <Section title="pim modes" accent="var(--accent-secondary)">
        <Table
          headers={['mode', 'description', 'use case']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>PIM-SM</span>, 'sparse mode — explicit join, shared + shortest-path trees', 'most deployments, any-to-many'],
            [<span style={{ color: 'var(--accent-primary)' }}>PIM-DM</span>, 'dense mode — flood-and-prune, implicit join', 'small/dense networks, lab'],
            [<span style={{ color: 'var(--accent-primary)' }}>PIM-SSM</span>, 'source-specific multicast — no RP, (S,G) only', 'iptv, known-source streaming'],
            [<span style={{ color: 'var(--accent-primary)' }}>PIM-BiDir</span>, 'bidirectional — shared tree only, no source registration', 'many-to-many (video conferencing)'],
          ]}
        />
      </Section>

      {/* pim-sm operation */}
      <Section title="pim-sm operation" accent="var(--accent-tertiary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '11px', borderLeft: '1px solid var(--border)', marginBottom: '12px' }}>
          <div><span style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>phase 1</span> — receiver joins shared tree (*,G) toward RP</div>
          <div><span style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>phase 2</span> — source registers with RP via unicast encapsulation</div>
          <div><span style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>phase 3</span> — RP joins source-specific tree (S,G) toward source</div>
          <div><span style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>phase 4</span> — last-hop router switches to SPT (S,G) for optimal path</div>
        </div>
        <Table
          headers={['tree', 'notation', 'root', 'state']}
          rows={[
            [<span style={{ color: 'var(--accent-secondary)' }}>shared / RPT</span>, '(*,G)', 'rendezvous point (RP)', 'created by receiver join'],
            [<span style={{ color: 'var(--accent-green)' }}>shortest-path / SPT</span>, '(S,G)', 'source', 'created by SPT switchover'],
          ]}
        />
      </Section>

      {/* message types */}
      <Section title="message types" accent="var(--accent-primary)">
        <Table
          headers={['type', 'name', 'purpose']}
          rows={[
            ['0', <span style={{ color: 'var(--accent-primary)' }}>hello</span>, 'neighbor discovery, DR election, holdtime advertisement'],
            ['1', <span style={{ color: 'var(--accent-primary)' }}>register</span>, 'unicast-encapsulated multicast from first-hop to RP'],
            ['2', <span style={{ color: 'var(--accent-primary)' }}>register-stop</span>, 'RP tells source DR to stop encapsulating'],
            ['3', <span style={{ color: 'var(--accent-primary)' }}>join/prune</span>, 'request to join or leave multicast tree branch'],
            ['4', <span style={{ color: 'var(--accent-primary)' }}>bootstrap</span>, 'BSR distributes RP-to-group mappings domain-wide'],
            ['5', <span style={{ color: 'var(--accent-primary)' }}>assert</span>, 'resolves duplicate multicast forwarder on a segment'],
            ['8', <span style={{ color: 'var(--accent-primary)' }}>candidate-rp</span>, 'candidate RP advertisement to BSR'],
          ]}
        />
      </Section>

      {/* rp discovery */}
      <Section title="rp discovery" accent="var(--accent-secondary)">
        <Table
          headers={['method', 'description', 'standard']}
          rows={[
            [<span style={{ color: 'var(--accent-secondary)' }}>static RP</span>, 'manually configured on every router', 'n/a'],
            [<span style={{ color: 'var(--accent-secondary)' }}>auto-rp</span>, 'cisco proprietary, uses 224.0.1.39/40', 'cisco'],
            [<span style={{ color: 'var(--accent-secondary)' }}>BSR</span>, 'bootstrap router floods RP info hop-by-hop', 'RFC 5059'],
            [<span style={{ color: 'var(--accent-secondary)' }}>anycast RP</span>, 'multiple RPs share same IP, MSDP sync', 'RFC 4610'],
            [<span style={{ color: 'var(--accent-secondary)' }}>embedded RP</span>, 'RP address encoded in IPv6 group address', 'RFC 3956'],
          ]}
        />
      </Section>

      {/* igmp versions */}
      <Section title="igmp versions" accent="var(--accent-green)">
        <Table
          headers={['feature', 'igmpv1', 'igmpv2', 'igmpv3']}
          rows={[
            ['rfc', 'RFC 1112', 'RFC 2236', 'RFC 3376'],
            ['leave mechanism', 'timeout only', 'explicit leave', 'explicit leave'],
            ['group-specific query', <span style={{ color: 'var(--text-muted)' }}>✗</span>, <span style={{ color: 'var(--accent-green)' }}>✓</span>, <span style={{ color: 'var(--accent-green)' }}>✓</span>],
            ['source filtering', <span style={{ color: 'var(--text-muted)' }}>✗</span>, <span style={{ color: 'var(--text-muted)' }}>✗</span>, <span style={{ color: 'var(--accent-green)' }}>✓ (include/exclude)</span>],
            ['querier election', <span style={{ color: 'var(--text-muted)' }}>✗</span>, <span style={{ color: 'var(--accent-green)' }}>✓ (lowest IP)</span>, <span style={{ color: 'var(--accent-green)' }}>✓ (lowest IP)</span>],
            ['SSM support', <span style={{ color: 'var(--text-muted)' }}>✗</span>, <span style={{ color: 'var(--text-muted)' }}>✗</span>, <span style={{ color: 'var(--accent-green)' }}>✓</span>],
          ]}
        />
      </Section>

      {/* multicast address ranges */}
      <Section title="multicast address ranges" accent="var(--accent-primary)">
        <div style={{ ...heading, fontSize: '11px', marginTop: '8px', borderLeft: 'none', paddingLeft: 0, color: 'var(--text-muted)' }}>ipv4 well-known</div>
        <Table
          headers={['address', 'assignment']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.1</span>, 'all hosts on segment'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.2</span>, 'all multicast routers'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.5</span>, 'OSPF all routers'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.6</span>, 'OSPF designated routers'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.9</span>, 'RIPv2'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.10</span>, 'EIGRP'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.13</span>, 'PIM (all PIM routers)'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.0.22</span>, 'IGMPv3'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.1.39</span>, 'auto-rp announce'],
            [<span style={{ color: 'var(--accent-primary)' }}>224.0.1.40</span>, 'auto-rp discovery'],
            [<span style={{ color: 'var(--accent-primary)' }}>232.0.0.0/8</span>, 'SSM range'],
            [<span style={{ color: 'var(--accent-primary)' }}>239.0.0.0/8</span>, 'administratively scoped'],
          ]}
        />
        <div style={{ ...heading, fontSize: '11px', marginTop: '14px', borderLeft: 'none', paddingLeft: 0, color: 'var(--text-muted)' }}>ipv6 well-known</div>
        <Table
          headers={['address', 'assignment']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::1</span>, 'all nodes (link-local)'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::2</span>, 'all routers (link-local)'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::5</span>, 'OSPFv3 all routers'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::6</span>, 'OSPFv3 designated routers'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::d</span>, 'PIM routers'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::16</span>, 'MLDv2'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff02::1:ff00:0/104</span>, 'solicited-node multicast'],
            [<span style={{ color: 'var(--accent-primary)' }}>ff3x::/32</span>, 'SSM range (IPv6)'],
          ]}
        />
      </Section>

      {/* rpf check */}
      <Section title="rpf check" accent="var(--accent-tertiary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div><span style={{ color: 'var(--accent-tertiary)', fontWeight: 600 }}>reverse path forwarding</span> — anti-loop mechanism for multicast</div>
          <div style={{ marginTop: '6px' }}>1. packet arrives on an interface from source <span style={{ color: 'var(--accent-primary)' }}>S</span></div>
          <div>2. router looks up <span style={{ color: 'var(--accent-primary)' }}>S</span> in unicast routing table (or MRIB)</div>
          <div>3. if incoming interface matches the next-hop interface toward <span style={{ color: 'var(--accent-primary)' }}>S</span> → <span style={{ color: 'var(--accent-green)' }}>RPF pass → forward</span></div>
          <div>4. if incoming interface does NOT match → <span style={{ color: 'var(--accent-secondary)' }}>RPF fail → drop</span></div>
          <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>RPF interface = the interface the router would use to reach the source via unicast</div>
          <div style={{ color: 'var(--text-muted)' }}>for (*,G) state the RPF check is toward the RP; for (S,G) it is toward the source</div>
        </div>
      </Section>

      {/* igmp snooping */}
      <Section title="igmp snooping" accent="var(--accent-green)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div><span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>layer 2 multicast optimization</span> — switch inspects IGMP messages</div>
          <div style={{ marginTop: '6px' }}>• without snooping: multicast flooded to all ports in VLAN (like broadcast)</div>
          <div>• with snooping: switch builds MAC-to-port table for multicast groups</div>
          <div>• only forwards multicast to ports with interested receivers + mrouter port</div>
          <div style={{ marginTop: '6px' }}>
            <span style={{ color: 'var(--accent-primary)' }}>mrouter port</span> — port connected to multicast router, always receives all multicast
          </div>
          <div>
            <span style={{ color: 'var(--accent-primary)' }}>querier</span> — required for snooping to work; if no router, configure snooping querier on switch
          </div>
          <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>enabled by default on most managed switches | may need fast-leave for latency-sensitive flows</div>
        </div>
      </Section>

      {/* timers */}
      <Section title="timers" accent="var(--accent-secondary)">
        <Table
          headers={['timer', 'default', 'notes']}
          rows={[
            ['hello interval', <span style={{ color: 'var(--accent-primary)' }}>30s</span>, 'PIM neighbor keepalive'],
            ['hello holdtime', <span style={{ color: 'var(--accent-primary)' }}>105s</span>, '3.5× hello interval'],
            ['join/prune interval', <span style={{ color: 'var(--accent-primary)' }}>60s</span>, 'periodic refresh of tree state'],
            ['join/prune holdtime', <span style={{ color: 'var(--accent-primary)' }}>210s</span>, '3.5× join/prune interval'],
            ['register suppression', <span style={{ color: 'var(--accent-primary)' }}>60s</span>, 'pause register after register-stop'],
            ['register probe', <span style={{ color: 'var(--accent-primary)' }}>5s</span>, 'before suppression expires, send null register'],
            ['assert timeout', <span style={{ color: 'var(--accent-primary)' }}>180s</span>, 'assert winner holdtime'],
            ['SPT switchover threshold', <span style={{ color: 'var(--accent-primary)' }}>0 kbps</span>, 'immediate by default (first packet)'],
            ['IGMP query interval', <span style={{ color: 'var(--accent-primary)' }}>125s</span>, 'general query period'],
            ['IGMP max response time', <span style={{ color: 'var(--accent-primary)' }}>10s</span>, 'max delay before host reports'],
            ['IGMP group membership timeout', <span style={{ color: 'var(--accent-primary)' }}>260s</span>, '2× query interval + max response'],
          ]}
        />
      </Section>

    </div>
  );
}
