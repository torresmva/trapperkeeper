import React from 'react';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const heading: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };
const cell: React.CSSProperties = { ...mono, padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', textAlign: 'left' as const, verticalAlign: 'top' };
const th: React.CSSProperties = { ...cell, fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: '2px solid var(--border)', position: 'sticky' as const, top: 0, background: 'var(--bg-primary)', zIndex: 1 };

function Section({ title, accent = 'var(--accent-primary)', children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ ...heading, fontSize: '13px', fontWeight: 600, marginTop: '20px', marginBottom: '8px', borderLeft: `3px solid ${accent}`, paddingLeft: '8px', color: 'var(--text-primary)', textTransform: 'lowercase' as const }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((c, j) => <td key={j} style={cell}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Accent({ color = 'var(--accent-primary)', children }: { color?: string; children: React.ReactNode }) {
  return <span style={{ color }}>{children}</span>;
}

export function VxlanRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)' }}>

      {/* overview */}
      <Section title="overview" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent-primary)' }}>l2 overlay over l3 underlay</span> — extends layer 2 segments across layer 3 infrastructure<br />
          port: <span style={{ color: 'var(--accent-tertiary)' }}>udp 4789</span><br />
          standards: rfc 7348 (vxlan) · rfc 7432 (evpn) · rfc 8365 (evpn-vxlan)
        </div>
      </Section>

      {/* vxlan header */}
      <Section title="vxlan header — encapsulation" accent="var(--accent-secondary)">
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          total overhead: <span style={{ color: 'var(--accent-tertiary)' }}>50 bytes</span> (outer eth 14 + outer ip 20 + udp 8 + vxlan 8 = 50)
        </div>
        <div style={{ display: 'flex', border: '1px solid var(--border)', width: 'fit-content', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--border)', color: 'var(--text-primary)', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>outer eth</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>14b</div>
          </div>
          <div style={{ background: 'var(--accent-primary)', color: '#000', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>outer ip</div>
            <div style={{ fontSize: '9px', opacity: 0.8 }}>20b · vtep src/dst</div>
          </div>
          <div style={{ background: 'var(--accent-secondary)', color: '#000', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>udp</div>
            <div style={{ fontSize: '9px', opacity: 0.8 }}>8b · dst 4789</div>
          </div>
          <div style={{ background: 'var(--accent-tertiary)', color: '#000', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>vxlan</div>
            <div style={{ fontSize: '9px', opacity: 0.8 }}>8b · I flag + vni</div>
          </div>
          <div style={{ background: 'var(--accent-green)', color: '#000', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>inner frame</div>
            <div style={{ fontSize: '9px', opacity: 0.8 }}>original l2</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          vxlan header: flags (8b) · reserved (24b) · <span style={{ color: 'var(--accent-primary)' }}>vni (24 bits = 16M segments)</span> · reserved (8b)<br />
          I flag must be 1 · udp src port = hash of inner frame (ecmp entropy)
        </div>
      </Section>

      {/* key concepts */}
      <Section title="key concepts" accent="var(--accent-primary)">
        <Table
          headers={['term', 'description']}
          rows={[
            [<Accent>vtep</Accent>, 'vxlan tunnel endpoint — encapsulates/decapsulates vxlan. can be switch, hypervisor, or router'],
            [<Accent>vni</Accent>, 'vxlan network identifier — 24-bit segment id (like vlan id but 16M scale)'],
            [<Accent>l2 vni</Accent>, 'maps to a vlan / bridge domain — provides l2 connectivity within a segment'],
            [<Accent>l3 vni</Accent>, 'maps to a vrf — provides inter-vni routing (symmetric irb)'],
            [<Accent>nve</Accent>, 'network virtualization edge — logical vtep interface on the switch'],
            [<Accent>underlay</Accent>, 'physical l3 network (typically ospf/isis/bgp on spine-leaf) carrying vxlan-encapped traffic'],
            [<Accent>overlay</Accent>, 'virtual l2/l3 network built on top of the underlay via vxlan tunnels'],
          ]}
        />
      </Section>

      {/* bum traffic */}
      <Section title="bum traffic handling" accent="var(--accent-tertiary)">
        <Table
          headers={['method', 'description', 'pros / cons']}
          rows={[
            [<Accent color="var(--accent-tertiary)">multicast underlay</Accent>, 'map vni to multicast group; bum flooded via multicast tree', 'efficient forwarding / requires pim + rp, complex to manage'],
            [<Accent color="var(--accent-tertiary)">ingress replication</Accent>, 'vtep unicast-copies bum to all remote vteps in vni', 'simple, no multicast needed / n^2 replication at scale'],
            [<Accent color="var(--accent-tertiary)">evpn arp suppression</Accent>, 'vtep answers arp locally from evpn-learned mac/ip cache', 'eliminates most bum / requires evpn control plane'],
          ]}
        />
      </Section>

      {/* evpn route types */}
      <Section title="evpn route types" accent="var(--accent-secondary)">
        <Table
          headers={['type', 'name', 'carries', 'purpose']}
          rows={[
            [<Accent color="var(--accent-primary)">1</Accent>, 'ethernet auto-discovery', 'esi, ethernet tag', 'multi-homing — fast convergence, aliasing, split-horizon'],
            [<Accent color="var(--accent-secondary)">2</Accent>, 'mac/ip advertisement', 'mac, ip, label', 'core route — advertises host mac and ip for l2/l3 forwarding'],
            [<Accent color="var(--accent-tertiary)">3</Accent>, 'inclusive multicast', 'originating ip, pmsi tunnel', 'bum handling — autodiscovery of vteps per vni, builds flood list'],
            [<Accent color="var(--accent-green)">4</Accent>, 'ethernet segment', 'esi, originating ip', 'df election — elects designated forwarder per esi per vlan'],
            [<Accent>5</Accent>, 'ip prefix', 'ip prefix, gw ip, label', 'inter-subnet — advertises ip prefixes for l3 vrf routing'],
          ]}
        />
      </Section>

      {/* type-2 breakdown */}
      <Section title="type-2 mac/ip route — field breakdown" accent="var(--accent-secondary)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '4px' }}>
          {[
            { label: 'rd', desc: '8 bytes', color: 'var(--border)', text: 'var(--text-primary)' },
            { label: 'esi', desc: '10 bytes', color: 'var(--accent-primary)', text: '#000' },
            { label: 'eth tag', desc: '4 bytes', color: 'var(--accent-secondary)', text: '#000' },
            { label: 'mac len', desc: '1b', color: 'var(--border)', text: 'var(--text-primary)' },
            { label: 'mac', desc: '6 bytes', color: 'var(--accent-tertiary)', text: '#000' },
            { label: 'ip len', desc: '1b', color: 'var(--border)', text: 'var(--text-primary)' },
            { label: 'ip', desc: '0/4/16b', color: 'var(--accent-green)', text: '#000' },
            { label: 'mpls label 1', desc: 'l2 vni', color: 'var(--accent-primary)', text: '#000' },
            { label: 'mpls label 2', desc: 'l3 vni', color: 'var(--accent-secondary)', text: '#000' },
          ].map((f, i) => (
            <div key={i} style={{ background: f.color, color: f.text, padding: '4px 8px', fontSize: '10px', textAlign: 'center' }}>
              <div style={{ fontWeight: 600 }}>{f.label}</div>
              <div style={{ fontSize: '9px', opacity: 0.8 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          mac + ip together enables arp suppression · label 2 only present with symmetric irb
        </div>
      </Section>

      {/* mac learning */}
      <Section title="mac learning" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, borderLeft: '2px solid var(--accent-tertiary)', paddingLeft: '6px' }}>
          data plane — flood-and-learn
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px', paddingLeft: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>1.</span> unknown unicast flooded to all vteps in vni (ingress replication or multicast)<br />
          <span style={{ color: 'var(--text-muted)' }}>2.</span> remote vtep learns source mac from inner frame + source vtep ip from outer header<br />
          <span style={{ color: 'var(--text-muted)' }}>3.</span> return traffic unicast directly to learned vtep<br />
          <span style={{ color: 'var(--text-muted)' }}>4.</span> no control plane needed — simple but inefficient, no arp suppression
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600, borderLeft: '2px solid var(--accent-green)', paddingLeft: '6px' }}>
          control plane — evpn
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>1.</span> local mac learned on vtep access port<br />
          <span style={{ color: 'var(--text-muted)' }}>2.</span> vtep advertises mac/ip via evpn type-2 route to route reflectors<br />
          <span style={{ color: 'var(--text-muted)' }}>3.</span> rr distributes to all vteps in the vni<br />
          <span style={{ color: 'var(--text-muted)' }}>4.</span> remote vteps install mac→vtep mapping — unicast from the start, no flooding<br />
          <span style={{ color: 'var(--text-muted)' }}>5.</span> arp suppression: vtep answers arp from evpn cache, eliminates bum
        </div>
      </Section>

      {/* arp suppression */}
      <Section title="arp suppression" accent="var(--accent-green)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--accent-green)' }}>1.</span> host sends arp request on local vlan<br />
          <span style={{ color: 'var(--accent-green)' }}>2.</span> local vtep intercepts the arp request<br />
          <span style={{ color: 'var(--accent-green)' }}>3.</span> vtep checks local evpn type-2 cache for target mac/ip binding<br />
          <span style={{ color: 'var(--accent-green)' }}>4.</span> if found: vtep generates arp reply locally — <span style={{ color: 'var(--accent-primary)' }}>no bum flooding</span><br />
          <span style={{ color: 'var(--accent-green)' }}>5.</span> if not found: arp flooded normally (ingress replication / multicast)<br />
          <span style={{ color: 'var(--accent-green)' }}>6.</span> response learned and cached for future suppression
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          dramatically reduces bum traffic in large-scale fabrics · requires evpn control plane
        </div>
      </Section>

      {/* multi-homing */}
      <Section title="multi-homing (esi)" accent="var(--accent-secondary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>esi format:</span> 10-byte ethernet segment identifier · type 0 = manual · type 1 = lacp-derived · type 3 = mac-based<br />
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>df election:</span> per-vlan designated forwarder elected via type-4 route — prevents bum duplication
        </div>
        <Table
          headers={['mode', 'forwarding', 'description']}
          rows={[
            [<Accent color="var(--accent-secondary)">active-active</Accent>, 'both vteps forward', 'host lag to two vteps — both forward known unicast, df handles bum. aliasing via type-1 lets remote vteps ecmp across both'],
            [<Accent color="var(--accent-secondary)">active-standby</Accent>, 'only df forwards', 'one vtep active per vlan/esi — standby takes over on failure. simpler but no ecmp benefit'],
          ]}
        />
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          type-1 route: mass withdraw on link failure (fast convergence) + aliasing (load balancing)<br />
          type-4 route: df election — one forwarder per esi per vlan for bum traffic
        </div>
      </Section>

      {/* symmetric vs asymmetric irb */}
      <Section title="symmetric vs asymmetric irb" accent="var(--accent-primary)">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          {/* asymmetric */}
          <div style={{ flex: '1 1 280px', border: '1px solid var(--border)', padding: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-tertiary)', marginBottom: '6px', ...heading }}>asymmetric irb</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--text-muted)' }}>•</span> ingress vtep does l3 lookup + routes into destination l2 vni<br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> egress vtep does l2 forwarding only (bridge)<br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> <span style={{ color: 'var(--accent-tertiary)' }}>all l2 vnis must exist on all vteps</span><br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> asymmetric = routing at ingress, bridging at egress<br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> does not scale — every vtep needs every vni configured
            </div>
          </div>
          {/* symmetric */}
          <div style={{ flex: '1 1 280px', border: '2px solid var(--accent-green)', padding: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '6px', ...heading }}>symmetric irb — preferred</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--text-muted)' }}>•</span> ingress vtep does l3 lookup + encaps with <span style={{ color: 'var(--accent-primary)' }}>l3 vni</span><br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> egress vtep does l3 lookup + routes into local l2 vni<br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> <span style={{ color: 'var(--accent-green)' }}>only local vnis needed on each vtep</span><br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> symmetric = routing at both ingress and egress<br />
              <span style={{ color: 'var(--text-muted)' }}>•</span> scales well — vteps only need their own vnis + shared l3 vni
            </div>
            <div style={{ marginTop: '8px', padding: '4px 8px', background: 'var(--accent-green)', color: '#000', fontSize: '10px', fontWeight: 600, width: 'fit-content' }}>
              symmetric irb is preferred for production deployments
            </div>
          </div>
        </div>
      </Section>

      {/* spine-leaf design */}
      <Section title="spine-leaf design" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
          standard topology for vxlan/evpn data centers — every leaf connects to every spine
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', border: '1px solid var(--border)', padding: '8px', whiteSpace: 'pre', lineHeight: 1.8 }}>
{`         [ spine-1 ]    [ spine-2 ]    [ spine-3 ]
           / | \\ \\       / | \\ \\       / | \\ \\
          /  |  \\ \\     /  |  \\ \\     /  |  \\ \\
   [leaf-1] [leaf-2] [leaf-3] [leaf-4] [border-leaf]
     |  |     |  |     |  |     |  |       |
   hosts    hosts    hosts    hosts     wan/dc`}
        </div>
        <Table
          headers={['role', 'function', 'vtep?', 'details']}
          rows={[
            [<Accent>spine</Accent>, 'underlay routing + rr', 'no', 'pure l3 forwarder — runs ebgp underlay + ibgp evpn rr (or ebgp rr)'],
            [<Accent>leaf</Accent>, 'host-facing vtep', 'yes', 'terminates vxlan tunnels, hosts l2/l3 vnis, runs anycast gw'],
            [<Accent>border leaf</Accent>, 'dc edge vtep', 'yes', 'connects to wan/external — type-5 prefix routes, vrf-lite or mpls handoff'],
          ]}
        />
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          underlay: ebgp (spine asn per tier, unique leaf asn) or ospf/isis · overlay: ibgp evpn with spines as rr<br />
          anycast gateway: same virtual mac + ip on all leaves — seamless host mobility across racks
        </div>
      </Section>

    </div>
  );
}
