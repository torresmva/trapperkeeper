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

export function EigrpRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)', padding: '16px', maxWidth: '900px' }}>
      <div style={heading}>eigrp reference</div>

      {/* overview */}
      <Section title="overview" accent="var(--accent-primary)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '8px' }}>
          {[
            ['type', 'advanced distance-vector igp'],
            ['protocol', 'ip 88'],
            ['ad (internal)', '90'],
            ['ad (external)', '170'],
            ['multicast', '224.0.0.10'],
            ['rfc', '7868'],
          ].map(([label, value], i) => (
            <div key={i} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>
              <div style={{ ...mono, fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ ...mono, fontSize: '12px', color: 'var(--accent-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* dual algorithm */}
      <Section title="dual algorithm" accent="var(--accent-secondary)">
        <div style={{ ...mono, fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', borderLeft: '2px solid var(--accent-secondary)', paddingLeft: '8px', lineHeight: '1.8' }}>
          <div><span style={{ color: 'var(--accent-primary)' }}>feasible distance (FD)</span> — lowest total metric ever known to reach a destination from this router</div>
          <div><span style={{ color: 'var(--accent-primary)' }}>reported distance (RD)</span> — metric advertised by a neighbor to reach the destination (neighbor's computed cost)</div>
          <div><span style={{ color: 'var(--accent-tertiary)' }}>feasibility condition</span> — a neighbor qualifies as feasible successor if its RD &lt; current FD. guarantees loop-free alternate paths without requiring SPF computation.</div>
        </div>
        <Table
          headers={['state', 'description']}
          rows={[
            ['passive', 'stable — route has a successor, no recomputation needed'],
            ['active', 'searching — successor lost, no feasible successor available, DUAL sends queries'],
            ['stuck-in-active (SIA)', 'query not answered within SIA timer — neighbor relationship may be cleared'],
          ]}
        />
      </Section>

      {/* packet types */}
      <Section title="packet types" accent="var(--accent-tertiary)">
        <Table
          headers={['type', 'name', 'reliable?', 'purpose']}
          rows={[
            ['1', 'hello', 'no', 'neighbor discovery and keepalive — multicast 224.0.0.10'],
            ['2', 'ack', 'no', 'acknowledges reliable packets — unicast, hello with no data'],
            ['3', 'update', 'yes', 'sends route information — unicast (new neighbor) or multicast (topology change)'],
            ['4', 'query', 'yes', 'asks neighbors for a route when no feasible successor exists'],
            ['5', 'reply', 'yes', 'responds to query with route information — always unicast'],
            ['6', 'SIA-query', 'yes', 'extends active timer — asks if neighbor is still searching'],
            ['7', 'SIA-reply', 'yes', 'responds to SIA-query — confirms still actively searching'],
          ]}
        />
      </Section>

      {/* key terms */}
      <Section title="key terms" accent="var(--accent-green)">
        <Table
          headers={['term', 'definition']}
          rows={[
            ['successor', 'best route to destination — installed in routing table, lowest FD'],
            ['feasible successor', 'backup route meeting feasibility condition (RD < FD) — pre-computed, instant failover'],
            ['feasible distance (FD)', 'best metric from local router to destination ever computed'],
            ['reported distance (RD)', 'metric a neighbor advertises as its cost to destination'],
            ['computed distance (CD)', 'total metric via a neighbor — local cost to neighbor + neighbor\'s RD'],
          ]}
        />
      </Section>

      {/* classic metric */}
      <Section title="classic metric" accent="var(--accent-primary)">
        <div style={{ ...mono, fontSize: '11px', padding: '8px', borderLeft: '2px solid var(--accent-primary)', marginBottom: '12px', background: 'transparent', lineHeight: '1.8' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>formula (default k-values: k1=1, k2=0, k3=1, k4=0, k5=0)</div>
          <div style={{ color: 'var(--accent-tertiary)' }}>metric = 256 * ((10^7 / BW_min) + cumulative_delay)</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>BW in kbps, delay in tens of microseconds</div>
        </div>
        <Table
          headers={['interface', 'bandwidth (kbps)', 'delay (tens of us)', 'metric component']}
          rows={[
            ['serial (T1)', '1,544', '20,000', '6,476 + 20,000 = 26,476 * 256'],
            ['fast ethernet', '100,000', '100', '100 + 100 = 200 * 256'],
            ['gigabit ethernet', '1,000,000', '10', '10 + 10 = 20 * 256'],
            ['10g ethernet', '10,000,000', '10', '1 + 10 = 11 * 256'],
          ]}
        />
      </Section>

      {/* wide metrics */}
      <Section title="wide metrics" accent="var(--accent-secondary)">
        <div style={{ ...mono, fontSize: '11px', padding: '8px', borderLeft: '2px solid var(--accent-secondary)', marginBottom: '12px', lineHeight: '1.8' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>wide metric formula (named mode)</div>
          <div style={{ color: 'var(--accent-tertiary)' }}>throughput = K1 * (EIGRP_BANDWIDTH * 65536 / BW_min)</div>
          <div style={{ color: 'var(--accent-tertiary)' }}>latency = K3 * (cumulative_delay * 65536 / 10^6)</div>
          <div style={{ color: 'var(--accent-tertiary)' }}>metric = (throughput + latency) * 128 / 256</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
            wide metrics scale classic values by <span style={{ color: 'var(--accent-primary)' }}>65,536</span> to differentiate high-speed interfaces (10g, 40g, 100g) that classic metrics cannot distinguish. uses 64-bit values internally, compressed to 32-bit for RIB installation via right-shift.
          </div>
        </div>
      </Section>

      {/* timers */}
      <Section title="timers" accent="var(--accent-tertiary)">
        <Table
          headers={['timer', 'default', 'notes']}
          rows={[
            ['hello (high bw)', '5s', 'fast ethernet, gig, 10g — multicast on 224.0.0.10'],
            ['hello (low bw)', '60s', 'T1 and below, multipoint interfaces'],
            ['hold (high bw)', '15s', '3x hello — neighbor declared dead if no hello received'],
            ['hold (low bw)', '180s', '3x hello — low bandwidth links'],
            ['active (SIA)', '180s', 'time to wait for query replies before declaring SIA'],
            ['rtp retransmit (RTO)', 'calculated', 'smooth round-trip time — adaptive per-neighbor'],
          ]}
        />
      </Section>

      {/* stuck-in-active */}
      <Section title="stuck-in-active" accent="var(--accent-green)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            ['1', 'successor lost and no feasible successor exists — route goes active'],
            ['2', 'DUAL sends queries to all neighbors for the destination'],
            ['3', 'neighbors must reply (or forward query further if also active)'],
            ['4', 'at half the SIA timer (90s), router sends SIA-query to non-responding neighbors'],
            ['5', 'neighbor responds with SIA-reply to confirm it is still searching'],
            ['6', 'if no reply by SIA timer (180s), neighbor relationship is reset'],
            ['7', 'once all replies received, DUAL selects new successor and route goes passive'],
          ].map(([num, desc]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '3px 0', borderLeft: '2px solid var(--accent-green)', paddingLeft: '8px' }}>
              <span style={{ ...mono, fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, minWidth: '18px' }}>{num}.</span>
              <span style={{ ...mono, fontSize: '11px', color: 'var(--text-secondary)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* stub routing */}
      <Section title="stub routing" accent="var(--accent-primary)">
        <div style={{ ...mono, fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '8px', lineHeight: '1.6' }}>
          stub routers limit query scope — hub routers do not send queries to stub neighbors, reducing SIA risk and speeding convergence.
        </div>
        <Table
          headers={['stub type', 'advertises', 'receives queries?']}
          rows={[
            ['connected', 'directly connected networks only', 'no'],
            ['static', 'redistributed static routes only', 'no'],
            ['summary', 'auto-summary and manual summary routes', 'no'],
            ['redistributed', 'redistributed routes from other protocols', 'no'],
            ['receive-only', 'nothing — only receives routes', 'no'],
            ['connected static', 'connected + static (default)', 'no'],
          ]}
        />
      </Section>

      {/* route types */}
      <Section title="route types" accent="var(--accent-secondary)">
        <Table
          headers={['route', 'ad', 'description']}
          rows={[
            ['internal', '90', 'originated within the eigrp autonomous system'],
            ['summary', '5', 'auto-summary or manual summary (ip summary-address eigrp)'],
            ['external', '170', 'redistributed from another routing protocol or eigrp AS'],
          ]}
        />
      </Section>

      {/* unequal-cost load balancing */}
      <Section title="unequal-cost load balancing" accent="var(--accent-tertiary)">
        <div style={{ ...mono, fontSize: '11px', padding: '8px', borderLeft: '2px solid var(--accent-tertiary)', lineHeight: '1.8' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
            eigrp can load-balance across unequal-cost paths using the <span style={{ color: 'var(--accent-tertiary)' }}>variance</span> command. only feasible successors qualify.
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>rule</div>
          <div style={{ color: 'var(--accent-primary)' }}>
            if FD * variance &gt;= neighbor's CD, the path is eligible for load balancing
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '10px', marginBottom: '4px' }}>example</div>
          <div style={{ color: 'var(--text-secondary)' }}>
            successor FD = <span style={{ color: 'var(--accent-primary)' }}>30,720</span> &nbsp; feasible successor CD = <span style={{ color: 'var(--accent-primary)' }}>46,080</span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            variance <span style={{ color: 'var(--accent-tertiary)' }}>2</span> &rarr; 30,720 * 2 = <span style={{ color: 'var(--accent-primary)' }}>61,440</span> &gt;= 46,080 &rarr; <span style={{ color: 'var(--accent-green)' }}>eligible</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '6px' }}>
            traffic share is proportional to inverse of metric. use <span style={{ color: 'var(--accent-primary)' }}>traffic-share balanced</span> (default) or <span style={{ color: 'var(--accent-primary)' }}>traffic-share min across-interfaces</span> to install but not use.
          </div>
        </div>
      </Section>
    </div>
  );
}
