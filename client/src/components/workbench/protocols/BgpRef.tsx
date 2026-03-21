import React from 'react';

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const cell: React.CSSProperties = { ...mono, padding: '3px 8px', fontSize: '11px', borderBottom: '1px solid var(--border)' };
const th: React.CSSProperties = { ...cell, fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: '2px solid var(--border)', position: 'sticky' as const, top: 0, background: 'var(--bg-primary)', zIndex: 1 };

const heading: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' };

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '20px', marginBottom: '8px' }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, borderLeft: `3px solid ${accent}`, paddingLeft: '8px', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'lowercase' as const }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ ...th, textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j} style={{ ...cell, color: j === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)', textAlign: 'left', verticalAlign: 'top' }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BgpRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)', padding: '16px', maxWidth: '900px' }}>
      <div style={heading}>bgp reference</div>

      {/* overview */}
      <Section title="overview" accent="var(--accent-primary)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '8px' }}>
          {[
            ['type', 'path-vector egp'],
            ['port', 'tcp 179'],
            ['ad (ebgp)', '20'],
            ['ad (ibgp)', '200'],
            ['rfcs', '4271, 4760'],
          ].map(([label, value], i) => (
            <div key={i} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>
              <div style={{ ...mono, fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ ...mono, fontSize: '12px', color: 'var(--accent-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ebgp vs ibgp */}
      <Section title="ebgp vs ibgp" accent="var(--accent-secondary)">
        <Table
          headers={['feature', 'ebgp', 'ibgp']}
          rows={[
            ['as relationship', 'between different AS', 'within same AS'],
            ['admin distance', '20', '200'],
            ['ttl', '1 (default)', '255'],
            ['next-hop', 'changed to self', 'not changed (default)'],
            ['as_path', 'prepended with local AS', 'not modified'],
            ['loop prevention', 'as_path — reject if own AS seen', 'split horizon / route reflectors / confederations'],
            ['full mesh', 'not required', 'required (or use RR / confederation)'],
            ['med', 'compared between neighbors in same AS', 'always compared (same AS origin)'],
          ]}
        />
      </Section>

      {/* message types */}
      <Section title="message types" accent="var(--accent-tertiary)">
        <Table
          headers={['type', 'name', 'purpose']}
          rows={[
            ['1', 'OPEN', 'initiates session — AS number, hold time, router-id, capabilities'],
            ['2', 'UPDATE', 'advertises / withdraws routes — NLRI, path attributes, withdrawn routes'],
            ['3', 'NOTIFICATION', 'error notification — closes session, includes error code/subcode'],
            ['4', 'KEEPALIVE', 'maintains session — sent every 60s (default), confirms peer alive'],
            ['5', 'ROUTE-REFRESH', 'requests re-advertisement of routes for an AFI/SAFI (RFC 2918)'],
          ]}
        />
      </Section>

      {/* bgp states (fsm) */}
      <Section title="bgp states (fsm)" accent="var(--accent-green)">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginBottom: '12px', padding: '8px', borderLeft: '2px solid var(--accent-green)' }}>
          {['Idle', 'Connect', 'Active', 'OpenSent', 'OpenConfirm', 'Established'].map((state, i, arr) => (
            <React.Fragment key={i}>
              <span style={{ ...mono, fontSize: '11px', padding: '2px 6px', background: i === arr.length - 1 ? 'var(--accent-green)' : 'transparent', color: i === arr.length - 1 ? 'var(--bg-primary)' : 'var(--accent-primary)', border: '1px solid var(--border)' }}>{state}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>&rarr;</span>}
            </React.Fragment>
          ))}
        </div>
        <Table
          headers={['state', 'description']}
          rows={[
            ['idle', 'initial state — no resources allocated, waiting for start event'],
            ['connect', 'tcp connection initiated — waiting for tcp handshake completion'],
            ['active', 'tcp connection failed — retrying connection, listening for incoming'],
            ['opensent', 'OPEN message sent — waiting for peer OPEN message'],
            ['openconfirm', 'OPEN received — waiting for KEEPALIVE or NOTIFICATION'],
            ['established', 'session up — exchanging UPDATE, KEEPALIVE, ROUTE-REFRESH'],
          ]}
        />
      </Section>

      {/* path attributes */}
      <Section title="path attributes" accent="var(--accent-primary)">
        <div style={{ marginBottom: '12px' }}>
          <Table
            headers={['class', 'mandatory?', 'transitive?', 'examples']}
            rows={[
              ['well-known mandatory', 'yes', 'yes', 'ORIGIN, AS_PATH, NEXT_HOP'],
              ['well-known discretionary', 'no', 'yes', 'LOCAL_PREF, ATOMIC_AGGREGATE'],
              ['optional transitive', 'no', 'yes', 'AGGREGATOR, COMMUNITY, EXTENDED_COMMUNITY'],
              ['optional non-transitive', 'no', 'no', 'MED, ORIGINATOR_ID, CLUSTER_LIST'],
            ]}
          />
        </div>
        <Table
          headers={['attribute', 'type code', 'description']}
          rows={[
            ['ORIGIN', '1', 'how route was injected — IGP (i), EGP (e), incomplete (?)'],
            ['AS_PATH', '2', 'ordered list of AS numbers route has traversed — loop prevention'],
            ['NEXT_HOP', '3', 'IP address of next-hop router to reach NLRI'],
            ['MED', '4', 'multi-exit discriminator — suggests preferred entry point into AS'],
            ['LOCAL_PREF', '5', 'preference within local AS — higher wins, default 100'],
            ['ATOMIC_AGGREGATE', '6', 'indicates route was aggregated, some AS_PATH info lost'],
            ['AGGREGATOR', '7', 'AS and router-id of aggregating router'],
            ['COMMUNITY', '8', '32-bit tag for route policy (RFC 1997)'],
            ['ORIGINATOR_ID', '9', 'router-id of route originator in RR cluster'],
            ['CLUSTER_LIST', '10', 'list of RR cluster-ids route has traversed — RR loop prevention'],
            ['MP_REACH_NLRI', '14', 'multiprotocol reachable NLRI — carries AFI/SAFI + next-hop + NLRI'],
            ['MP_UNREACH_NLRI', '15', 'multiprotocol unreachable NLRI — withdraws routes for AFI/SAFI'],
            ['EXTENDED_COMMUNITY', '16', '8-byte community — route targets, SoO for VPNs'],
            ['LARGE_COMMUNITY', '32', '12-byte community (RFC 8092) — 4-byte ASN support'],
          ]}
        />
      </Section>

      {/* best path selection */}
      <Section title="best path selection" accent="var(--accent-secondary)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            ['1', 'highest weight', '(cisco proprietary, local to router)'],
            ['2', 'highest local_pref', '(default 100)'],
            ['3', 'locally originated', '(network, redistribute, aggregate)'],
            ['4', 'shortest as_path', '(unless bestpath as-path ignore)'],
            ['5', 'lowest origin type', '(igp < egp < incomplete)'],
            ['6', 'lowest med', '(compared within same neighbor AS by default)'],
            ['7', 'ebgp over ibgp', '(prefer external route)'],
            ['8', 'lowest igp metric to next-hop', '(nearest exit / hot-potato)'],
            ['9', 'oldest ebgp route', '(stability, unless bestpath compare-routerid)'],
            ['10', 'lowest router-id', '(of advertising router)'],
            ['11', 'shortest cluster_list', '(fewest RR hops)'],
            ['12', 'lowest neighbor address', '(final tiebreaker)'],
          ].map(([num, rule, note]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '3px 0', borderLeft: '2px solid var(--accent-secondary)', paddingLeft: '8px' }}>
              <span style={{ ...mono, fontSize: '11px', color: 'var(--accent-secondary)', fontWeight: 700, minWidth: '18px' }}>{num}.</span>
              <span style={{ ...mono, fontSize: '11px', color: 'var(--text-primary)' }}>{rule}</span>
              <span style={{ ...mono, fontSize: '10px', color: 'var(--text-muted)' }}>{note}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* well-known communities */}
      <Section title="well-known communities" accent="var(--accent-tertiary)">
        <Table
          headers={['community', 'value', 'meaning']}
          rows={[
            ['NO_EXPORT', '0xFFFFFF01', 'do not advertise outside the local AS (or confederation)'],
            ['NO_ADVERTISE', '0xFFFFFF02', 'do not advertise to any peer at all'],
            ['NO_EXPORT_SUBCONFED', '0xFFFFFF03', 'do not advertise outside the local sub-AS (confederation)'],
            ['NOPEER', '0xFFFFFF04', 'do not advertise to bilateral peers (RFC 3765)'],
            ['BLACKHOLE', '0xFFFF029A', 'remotely triggered blackhole filtering (RFC 7999)'],
          ]}
        />
      </Section>

      {/* address families */}
      <Section title="address families" accent="var(--accent-green)">
        <Table
          headers={['afi', 'safi', 'description']}
          rows={[
            ['1 (IPv4)', '1 (unicast)', 'ipv4 unicast — standard internet routing'],
            ['1 (IPv4)', '2 (multicast)', 'ipv4 multicast — RPF lookups for multicast'],
            ['1 (IPv4)', '4 (labeled)', 'ipv4 labeled unicast — MPLS labels for ipv4 prefixes'],
            ['1 (IPv4)', '128 (VPN)', 'vpnv4 — MPLS L3VPN ipv4 routes (RD + RT)'],
            ['2 (IPv6)', '1 (unicast)', 'ipv6 unicast — standard ipv6 routing'],
            ['2 (IPv6)', '2 (multicast)', 'ipv6 multicast — RPF lookups for ipv6 multicast'],
            ['2 (IPv6)', '128 (VPN)', 'vpnv6 — MPLS L3VPN ipv6 routes'],
            ['1 (IPv4)', '133 (FlowSpec)', 'flowspec — traffic filtering rules distributed via BGP'],
            ['25 (L2VPN)', '65 (VPLS)', 'vpls — virtual private LAN service auto-discovery'],
            ['25 (L2VPN)', '70 (EVPN)', 'evpn — ethernet VPN for VXLAN / MPLS fabrics'],
            ['16388', '71 (BGP-LS)', 'bgp-ls — link-state info distribution to controllers (RFC 7752)'],
          ]}
        />
      </Section>

      {/* route reflectors */}
      <Section title="route reflectors" accent="var(--accent-primary)">
        <div style={{ ...mono, fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '8px', lineHeight: '1.6' }}>
          route reflectors eliminate full-mesh ibgp requirement. an RR reflects routes between clients and non-clients. cluster-id prevents loops. originator_id and cluster_list attributes track reflection path.
        </div>
        <Table
          headers={['learned from', 'reflect to']}
          rows={[
            ['rr client', 'all clients + all non-clients (+ originator)'],
            ['non-client (ibgp)', 'all clients only'],
            ['ebgp peer', 'all clients + all non-clients'],
          ]}
        />
      </Section>

      {/* timers */}
      <Section title="timers" accent="var(--accent-secondary)">
        <Table
          headers={['timer', 'default', 'notes']}
          rows={[
            ['keepalive', '60s', 'sent to maintain session — 1/3 of hold time'],
            ['hold time', '180s', 'session down if no keepalive received — negotiated in OPEN'],
            ['connect retry', '120s', 'interval between tcp connection attempts'],
            ['mrai (ebgp)', '30s', 'minimum route advertisement interval — dampens update storms'],
            ['mrai (ibgp)', '5s', 'minimum route advertisement interval for ibgp peers'],
            ['graceful restart', '120s', 'time peer waits for session re-establishment after restart'],
            ['long-lived stale', '0 (disabled)', 'LLGR — extended stale time for routes after GR expires'],
          ]}
        />
      </Section>
    </div>
  );
}
