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

export function MplsRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)' }}>

      {/* overview */}
      <Section title="overview" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent-primary)' }}>label-based forwarding</span> — forwards packets using short fixed-length labels instead of long network addresses<br />
          ethertype: <span style={{ color: 'var(--accent-tertiary)' }}>0x8847</span> (unicast) / <span style={{ color: 'var(--accent-tertiary)' }}>0x8848</span> (multicast)<br />
          standards: rfc 3031 (architecture) · rfc 3032 (label stack encoding)
        </div>
      </Section>

      {/* label format */}
      <Section title="label format (32 bits)" accent="var(--accent-secondary)">
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          each label stack entry is 32 bits / 4 bytes
        </div>
        <div style={{ display: 'flex', border: '1px solid var(--border)', width: 'fit-content' }}>
          <div style={{ background: 'var(--accent-primary)', color: '#000', padding: '6px 24px', fontSize: '11px', fontWeight: 600, textAlign: 'center', minWidth: '160px' }}>
            <div>label</div>
            <div style={{ fontSize: '9px', fontWeight: 400, opacity: 0.8 }}>20 bits</div>
          </div>
          <div style={{ background: 'var(--accent-secondary)', color: '#000', padding: '6px 12px', fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>
            <div>tc</div>
            <div style={{ fontSize: '9px', fontWeight: 400, opacity: 0.8 }}>3 bits</div>
          </div>
          <div style={{ background: 'var(--accent-tertiary)', color: '#000', padding: '6px 12px', fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>
            <div>s</div>
            <div style={{ fontSize: '9px', fontWeight: 400, opacity: 0.8 }}>1 bit</div>
          </div>
          <div style={{ background: 'var(--accent-green)', color: '#000', padding: '6px 16px', fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>
            <div>ttl</div>
            <div style={{ fontSize: '9px', fontWeight: 400, opacity: 0.8 }}>8 bits</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
          tc = traffic class (qos/exp) · s = bottom-of-stack (1 = last label) · ttl = time to live
        </div>
      </Section>

      {/* reserved labels */}
      <Section title="reserved labels" accent="var(--accent-primary)">
        <Table
          headers={['label', 'name', 'purpose']}
          rows={[
            [<Accent>0</Accent>, 'explicit null (ipv4)', 'pushed to preserve qos; popped by next-hop, triggers ip lookup'],
            [<Accent>1</Accent>, 'router alert', 'examined by each lsr; like ip router alert option'],
            [<Accent>2</Accent>, 'explicit null (ipv6)', 'ipv6 version of label 0'],
            [<Accent>3</Accent>, 'implicit null', 'signaled but never appears on wire; triggers php (penultimate hop popping)'],
            [<Accent color="var(--accent-tertiary)">7</Accent>, 'entropy label indicator', 'signals next label is entropy for ecmp hashing (rfc 6790)'],
            [<Accent color="var(--accent-tertiary)">13</Accent>, 'generic associated channel (gal)', 'indicates g-ach follows for oam (rfc 5586)'],
            [<Accent color="var(--accent-tertiary)">14</Accent>, 'oam alert', 'oam processing required'],
            [<Accent color="var(--accent-tertiary)">15</Accent>, 'extension label', 'extends label space beyond 20 bits (rfc 7274)'],
          ]}
        />
      </Section>

      {/* label operations */}
      <Section title="label operations" accent="var(--accent-green)">
        <Table
          headers={['operation', 'description']}
          rows={[
            [<Accent>push</Accent>, 'add a label to the top of the stack — used at ingress lsr'],
            [<Accent>swap</Accent>, 'replace top label with a new one — used at transit lsr'],
            [<Accent>pop</Accent>, 'remove top label from the stack — used at egress or php lsr'],
            [<Accent>php</Accent>, 'penultimate hop popping — pop before egress so egress does single ip lookup'],
          ]}
        />
      </Section>

      {/* label distribution protocols */}
      <Section title="label distribution protocols" accent="var(--accent-secondary)">
        <Table
          headers={['protocol', 'description', 'use case']}
          rows={[
            [<Accent color="var(--accent-secondary)">ldp</Accent>, 'label distribution protocol (rfc 5036)', 'basic mpls transport, ldp-based l3vpn'],
            [<Accent color="var(--accent-secondary)">rsvp-te</Accent>, 'resource reservation with te extensions (rfc 3209)', 'traffic engineering, bandwidth reservation, frr'],
            [<Accent color="var(--accent-secondary)">mp-bgp</Accent>, 'multiprotocol bgp label distribution', 'l3vpn (vpnv4/v6), l2vpn (evpn), inter-as mpls'],
            [<Accent color="var(--accent-secondary)">segment routing</Accent>, 'source-routed label stacks (rfc 8402)', 'replaces ldp/rsvp-te, sr-te, sr-mpls / srv6'],
          ]}
        />
      </Section>

      {/* ldp */}
      <Section title="ldp — label distribution protocol" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          port: <span style={{ color: 'var(--accent-tertiary)' }}>tcp/udp 646</span> · discovery via udp multicast 224.0.0.2 · session via tcp
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>modes</div>
        <Table
          headers={['mode', 'description']}
          rows={[
            [<Accent>downstream unsolicited</Accent>, 'lsr distributes labels without being asked — default, most common'],
            [<Accent>downstream on demand</Accent>, 'lsr sends label only when requested by upstream'],
            [<Accent>independent control</Accent>, 'lsr assigns labels independently without waiting for downstream binding'],
            [<Accent>ordered control</Accent>, 'lsr only assigns label after receiving binding from downstream'],
            [<Accent>liberal retention</Accent>, 'keep all received label mappings even if not best-path — faster convergence'],
            [<Accent>conservative retention</Accent>, 'only keep label mappings for best next-hop — saves memory'],
          ]}
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '12px', fontWeight: 600 }}>messages</div>
        <Table
          headers={['message', 'purpose']}
          rows={[
            ['hello', 'neighbor discovery (udp)'],
            ['initialization', 'session parameter negotiation'],
            ['keepalive', 'session maintenance'],
            ['label mapping', 'advertise fec-to-label binding'],
            ['label withdraw', 'remove previously advertised binding'],
            ['label release', 'release label no longer needed'],
            ['label request', 'request binding for a fec (on-demand mode)'],
            ['notification', 'signal errors or advisory info'],
          ]}
        />
      </Section>

      {/* l3vpn */}
      <Section title="l3vpn (rfc 4364)" accent="var(--accent-tertiary)">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>vrf components</div>
        <Table
          headers={['component', 'description']}
          rows={[
            [<Accent color="var(--accent-tertiary)">vrf</Accent>, 'virtual routing and forwarding — per-customer routing table on pe'],
            [<Accent color="var(--accent-tertiary)">rd</Accent>, 'route distinguisher — makes overlapping prefixes unique in bgp (8 bytes)'],
            [<Accent color="var(--accent-tertiary)">rt</Accent>, 'route target — controls import/export of routes between vrfs (bgp extended community)'],
            [<Accent color="var(--accent-tertiary)">ce</Accent>, 'customer edge — customer router, peers with pe'],
            [<Accent color="var(--accent-tertiary)">pe</Accent>, 'provider edge — mpls router with vrfs, peers with ce and other pes'],
            [<Accent color="var(--accent-tertiary)">p</Accent>, 'provider — core mpls router, no vpn awareness, label-switches only'],
          ]}
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '12px', fontWeight: 600 }}>rd format</div>
        <Table
          headers={['type', 'format', 'example']}
          rows={[
            [<Accent>0</Accent>, '2-byte asn : 4-byte number', '65000:100'],
            [<Accent>1</Accent>, '4-byte ip : 2-byte number', '10.0.0.1:100'],
            [<Accent>2</Accent>, '4-byte asn : 2-byte number', '4200000001:100'],
          ]}
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '12px', fontWeight: 600 }}>data plane — label stack</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '10px', marginTop: '4px' }}>
          <span style={{ border: '1px solid var(--border)', padding: '4px 8px', color: 'var(--text-secondary)' }}>ce-a</span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ border: '1px solid var(--accent-primary)', padding: '4px 8px', color: 'var(--accent-primary)' }}>pe-1 <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(push transport + vpn label)</span></span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ border: '1px solid var(--accent-secondary)', padding: '4px 8px', color: 'var(--accent-secondary)' }}>p <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(swap transport label)</span></span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ border: '1px solid var(--accent-primary)', padding: '4px 8px', color: 'var(--accent-primary)' }}>pe-2 <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(pop both, route via vrf)</span></span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ border: '1px solid var(--border)', padding: '4px 8px', color: 'var(--text-secondary)' }}>ce-b</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          outer label = transport (ldp/rsvp-te/sr) · inner label = vpn (mp-bgp allocated)
        </div>
      </Section>

      {/* l2vpn services */}
      <Section title="l2vpn services" accent="var(--accent-green)">
        <Table
          headers={['service', 'protocol', 'description']}
          rows={[
            [<Accent color="var(--accent-green)">vpws</Accent>, 'pseudowire (rfc 4447)', 'point-to-point l2 circuit — replaces leased lines, atm pvcs'],
            [<Accent color="var(--accent-green)">vpls</Accent>, 'rfc 4761/4762', 'multipoint l2 lan — full mesh pseudowires, mac learning, bum flooding'],
            [<Accent color="var(--accent-green)">evpn</Accent>, 'rfc 7432 + mpls', 'next-gen multipoint — bgp control plane, active-active, mac/ip advertisement'],
          ]}
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '12px', fontWeight: 600 }}>pseudowire types</div>
        <Table
          headers={['type id', 'name', 'description']}
          rows={[
            ['0x0005', 'ethernet', 'raw ethernet frames'],
            ['0x0004', 'vlan (tagged)', 'single-tagged 802.1q frames'],
            ['0x0006', 'hdlc', 'hdlc-encapsulated frames'],
            ['0x0001', 'frame relay (dlci)', 'frame relay over mpls'],
            ['0x0019', 'vpls', 'virtual private lan service pw'],
          ]}
        />
      </Section>

      {/* mpls te */}
      <Section title="mpls te — traffic engineering" accent="var(--accent-secondary)">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>rsvp-te concepts</div>
        <Table
          headers={['concept', 'description']}
          rows={[
            ['lsp tunnel', 'explicitly routed path through the network with bandwidth reservation'],
            ['path message', 'sent downstream to establish lsp; carries ero (explicit route object)'],
            ['resv message', 'sent upstream to confirm reservation; carries label and bandwidth'],
            ['ero', 'explicit route object — ordered list of hops (strict or loose)'],
            ['rro', 'record route object — records actual path taken'],
            ['cspf', 'constrained spf — computes path considering bandwidth, affinity, etc.'],
            ['auto-bandwidth', 'periodically adjusts bandwidth reservation based on traffic measurements'],
            ['make-before-break', 'new lsp established before old one torn down — hitless re-optimization'],
          ]}
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '12px', fontWeight: 600 }}>fast reroute (frr)</div>
        <Table
          headers={['type', 'protection', 'description']}
          rows={[
            [<Accent color="var(--accent-secondary)">facility backup</Accent>, 'link / node', 'pre-computed bypass tunnel shared by multiple lsps — scalable, &lt;50ms failover'],
            [<Accent color="var(--accent-secondary)">one-to-one backup</Accent>, 'link / node', 'dedicated detour lsp per protected lsp — more resources, granular'],
            [<Accent color="var(--accent-secondary)">nhop</Accent>, 'link', 'next-hop protection — bypass around failed link to same next-hop'],
            [<Accent color="var(--accent-secondary)">nnhop</Accent>, 'node', 'next-next-hop protection — bypass around failed node entirely'],
          ]}
        />
      </Section>

      {/* segment routing */}
      <Section title="segment routing (sr-mpls)" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>segment types</div>
        <Table
          headers={['segment', 'type', 'description']}
          rows={[
            [<Accent>prefix sid</Accent>, 'global', 'identifies a prefix (loopback) — globally unique within sr domain, srgb + index'],
            [<Accent>adjacency sid</Accent>, 'local', 'identifies a link — locally significant, used for strict/explicit paths'],
            [<Accent>node sid</Accent>, 'global', 'special prefix sid representing a node loopback — most common'],
            [<Accent>anycast sid</Accent>, 'global', 'same sid on multiple nodes — ecmp / nearest-node routing'],
            [<Accent>binding sid</Accent>, 'local/global', 'maps to a policy/path — abstracts complex label stacks into one label'],
          ]}
        />

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '12px', fontWeight: 600 }}>srgb — segment routing global block</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
          reserved label range for sr prefix sids. default: <span style={{ color: 'var(--accent-primary)' }}>16000–23999</span><br />
          absolute label = srgb base + prefix sid index<br />
          example: srgb 16000, node index 10 → label <span style={{ color: 'var(--accent-primary)' }}>16010</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>sr advantages</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--accent-green)' }}>•</span> no ldp or rsvp-te needed — labels distributed via igp (isis/ospf) extensions<br />
          <span style={{ color: 'var(--accent-green)' }}>•</span> source routing — head-end encodes full path in label stack<br />
          <span style={{ color: 'var(--accent-green)' }}>•</span> ti-lfa — topology-independent loop-free alternate, &lt;50ms failover without rsvp<br />
          <span style={{ color: 'var(--accent-green)' }}>•</span> simplified control plane — fewer protocols, fewer adjacencies, less state<br />
          <span style={{ color: 'var(--accent-green)' }}>•</span> sr-te policies — flexible path steering via binding sids and candidate paths<br />
          <span style={{ color: 'var(--accent-green)' }}>•</span> interop with mpls data plane — sr-mpls uses existing mpls forwarding hardware
        </div>
      </Section>

    </div>
  );
}
