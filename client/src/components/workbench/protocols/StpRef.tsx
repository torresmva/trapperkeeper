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

const yes = <span style={{ color: 'var(--accent-green)' }}>✓</span>;
const no = <span style={{ color: 'var(--text-muted)' }}>✗</span>;

export function StpRef() {
  return (
    <div style={{ ...mono, color: 'var(--text-primary)' }}>

      {/* overview */}
      <Section title="overview" accent="var(--accent-primary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div><span style={{ color: 'var(--accent-primary)' }}>802.1D</span> — STP (original spanning tree protocol)</div>
          <div><span style={{ color: 'var(--accent-primary)' }}>802.1w</span> — RSTP (rapid spanning tree protocol)</div>
          <div><span style={{ color: 'var(--accent-primary)' }}>802.1s</span> — MSTP (multiple spanning tree protocol)</div>
          <div>destination MAC: <span style={{ color: 'var(--accent-tertiary)' }}>01:80:C2:00:00:00</span></div>
          <div>prevents L2 loops by selectively blocking redundant paths</div>
        </div>
      </Section>

      {/* protocol variants */}
      <Section title="protocol variants" accent="var(--accent-secondary)">
        <Table
          headers={['protocol', 'standard', 'convergence', 'vlans']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>STP</span>, '802.1D', '30–50s', 'single instance (all VLANs)'],
            [<span style={{ color: 'var(--accent-primary)' }}>RSTP</span>, '802.1w', '1–2s', 'single instance (all VLANs)'],
            [<span style={{ color: 'var(--accent-primary)' }}>MSTP</span>, '802.1s', '1–2s', 'multiple instances (VLAN groups)'],
            [<span style={{ color: 'var(--accent-primary)' }}>PVST+</span>, 'cisco', '30–50s', 'per-VLAN instance'],
            [<span style={{ color: 'var(--accent-primary)' }}>rapid PVST+</span>, 'cisco', '1–2s', 'per-VLAN instance'],
          ]}
        />
      </Section>

      {/* bridge id */}
      <Section title="bridge id" accent="var(--accent-tertiary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderBottom: '2px solid var(--accent-tertiary)', color: 'var(--accent-tertiary)', marginRight: '4px' }}>priority (4 bits)</span>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderBottom: '2px solid var(--accent-secondary)', color: 'var(--accent-secondary)', marginRight: '4px' }}>sys-id ext (12 bits)</span>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderBottom: '2px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>MAC address (6 bytes)</span>
          </div>
          <div>total bridge ID = <span style={{ color: 'var(--accent-primary)' }}>8 bytes</span></div>
          <div>default priority = <span style={{ color: 'var(--accent-tertiary)' }}>32768</span> (0x8000)</div>
          <div>priority must be a multiple of <span style={{ color: 'var(--accent-tertiary)' }}>4096</span> (sys-id extension uses lower 12 bits for VLAN)</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>lowest bridge ID wins root bridge election</div>
        </div>
      </Section>

      {/* port states (stp) */}
      <Section title="port states (stp)" accent="var(--accent-primary)">
        <Table
          headers={['state', 'learns MAC?', 'forwards?', 'duration']}
          rows={[
            ['disabled', no, no, 'admin disabled'],
            ['blocking', no, no, '20s (max age)'],
            ['listening', no, no, '15s (forward delay)'],
            ['learning', yes, no, '15s (forward delay)'],
            ['forwarding', yes, yes, 'stable state'],
          ]}
        />
      </Section>

      {/* port states (rstp) */}
      <Section title="port states (rstp)" accent="var(--accent-secondary)">
        <Table
          headers={['state', 'stp equivalent', 'learns?', 'forwards?']}
          rows={[
            [<span style={{ color: 'var(--accent-secondary)' }}>discarding</span>, 'disabled / blocking / listening', no, no],
            [<span style={{ color: 'var(--accent-secondary)' }}>learning</span>, 'learning', yes, no],
            [<span style={{ color: 'var(--accent-secondary)' }}>forwarding</span>, 'forwarding', yes, yes],
          ]}
        />
      </Section>

      {/* port roles */}
      <Section title="port roles" accent="var(--accent-tertiary)">
        <Table
          headers={['role', 'STP', 'RSTP', 'description']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>root</span>, yes, yes, 'best path to root bridge per switch'],
            [<span style={{ color: 'var(--accent-primary)' }}>designated</span>, yes, yes, 'best port on each segment toward root'],
            [<span style={{ color: 'var(--accent-primary)' }}>blocking</span>, yes, no, 'non-designated, non-root (STP only)'],
            [<span style={{ color: 'var(--accent-primary)' }}>alternate</span>, no, yes, 'backup to root port (RSTP)'],
            [<span style={{ color: 'var(--accent-primary)' }}>backup</span>, no, yes, 'backup to designated port on shared segment (RSTP)'],
            [<span style={{ color: 'var(--accent-primary)' }}>disabled</span>, yes, yes, 'administratively shut down'],
          ]}
        />
      </Section>

      {/* root bridge election */}
      <Section title="root bridge election" accent="var(--accent-green)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--accent-green)', fontWeight: 600, marginBottom: '4px' }}>root bridge selection</div>
          <div>1. all switches start by claiming to be root (send BPDUs with own bridge ID)</div>
          <div>2. switch with <span style={{ color: 'var(--accent-tertiary)' }}>lowest bridge ID</span> wins (priority first, then MAC)</div>
          <div>3. all other switches stop generating BPDUs, only relay root's BPDUs</div>

          <div style={{ color: 'var(--accent-green)', fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>root port selection (per non-root switch)</div>
          <div>1. <span style={{ color: 'var(--accent-primary)' }}>lowest root path cost</span> — cumulative cost to root</div>
          <div>2. <span style={{ color: 'var(--accent-primary)' }}>lowest sender bridge ID</span> — upstream switch ID</div>
          <div>3. <span style={{ color: 'var(--accent-primary)' }}>lowest sender port ID</span> — upstream port priority + number</div>

          <div style={{ color: 'var(--accent-green)', fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>designated port selection (per segment)</div>
          <div>1. <span style={{ color: 'var(--accent-primary)' }}>lowest root path cost</span> — advertised by switch on segment</div>
          <div>2. <span style={{ color: 'var(--accent-primary)' }}>lowest bridge ID</span> — of the switch advertising</div>
          <div>3. <span style={{ color: 'var(--accent-primary)' }}>lowest port ID</span> — local port priority + number</div>
        </div>
      </Section>

      {/* path cost */}
      <Section title="path cost" accent="var(--accent-primary)">
        <Table
          headers={['speed', 'STP cost (802.1D)', 'RSTP cost (802.1w)']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>10 Mbps</span>, '100', '2,000,000'],
            [<span style={{ color: 'var(--accent-primary)' }}>100 Mbps</span>, '19', '200,000'],
            [<span style={{ color: 'var(--accent-primary)' }}>1 Gbps</span>, '4', '20,000'],
            [<span style={{ color: 'var(--accent-primary)' }}>10 Gbps</span>, '2', '2,000'],
            [<span style={{ color: 'var(--accent-primary)' }}>100 Gbps</span>, '—', '200'],
            [<span style={{ color: 'var(--accent-primary)' }}>1 Tbps</span>, '—', '20'],
          ]}
        />
      </Section>

      {/* timers */}
      <Section title="timers" accent="var(--accent-secondary)">
        <Table
          headers={['timer', 'default', 'range', 'purpose']}
          rows={[
            ['hello time', <span style={{ color: 'var(--accent-primary)' }}>2s</span>, '1–10s', 'interval between BPDU transmissions'],
            ['max age', <span style={{ color: 'var(--accent-primary)' }}>20s</span>, '6–40s', 'time before stored BPDU is discarded'],
            ['forward delay', <span style={{ color: 'var(--accent-primary)' }}>15s</span>, '4–30s', 'time in listening + learning states'],
          ]}
        />
      </Section>

      {/* rstp convergence */}
      <Section title="rstp convergence" accent="var(--accent-tertiary)">
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '11px', borderLeft: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--accent-tertiary)', fontWeight: 600, marginBottom: '4px' }}>proposal / agreement mechanism</div>
          <div>1. designated port sends BPDU with <span style={{ color: 'var(--accent-primary)' }}>proposal bit</span> set</div>
          <div>2. downstream switch blocks all non-edge ports (<span style={{ color: 'var(--accent-secondary)' }}>sync</span>)</div>
          <div>3. downstream switch replies with <span style={{ color: 'var(--accent-primary)' }}>agreement bit</span> set</div>
          <div>4. designated port transitions to <span style={{ color: 'var(--accent-green)' }}>forwarding immediately</span> (no timer wait)</div>
          <div>5. process cascades switch-by-switch toward network edge</div>

          <div style={{ color: 'var(--accent-tertiary)', fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>edge ports</div>
          <div>• configured as <span style={{ color: 'var(--accent-primary)' }}>portfast</span> — transition to forwarding immediately</div>
          <div>• assumed to connect to end hosts (no loops)</div>
          <div>• if BPDU is received, port loses edge status and participates in STP normally</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>RSTP uses all 3 BPDU flag bits: role, proposal, agreement — each switch generates its own BPDUs</div>
        </div>
      </Section>

      {/* mstp concepts */}
      <Section title="mstp concepts" accent="var(--accent-green)">
        <Table
          headers={['term', 'description']}
          rows={[
            [<span style={{ color: 'var(--accent-green)' }}>MST region</span>, 'group of switches with same name, revision, VLAN-to-instance mapping'],
            [<span style={{ color: 'var(--accent-green)' }}>IST (instance 0)</span>, 'internal spanning tree — default instance, carries all unmapped VLANs'],
            [<span style={{ color: 'var(--accent-green)' }}>MSTI</span>, 'MST instance — user-defined, maps specific VLAN ranges'],
            [<span style={{ color: 'var(--accent-green)' }}>CST</span>, 'common spanning tree — spans across MST regions (802.1D/w)'],
            [<span style={{ color: 'var(--accent-green)' }}>CIST</span>, 'common and internal spanning tree — IST + CST combined view'],
          ]}
        />
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '11px', borderLeft: '1px solid var(--border)', marginTop: '8px' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>configuration requirements (must match for same region)</div>
          <div>• region name (case-sensitive string)</div>
          <div>• revision number (0–65535)</div>
          <div>• VLAN-to-instance mapping table</div>
        </div>
      </Section>

      {/* protection features */}
      <Section title="protection features" accent="var(--accent-secondary)">
        <Table
          headers={['feature', 'purpose', 'behavior']}
          rows={[
            [<span style={{ color: 'var(--accent-secondary)' }}>portfast</span>, 'skip listening/learning on access ports', 'immediate forwarding; reverts if BPDU received'],
            [<span style={{ color: 'var(--accent-secondary)' }}>BPDU guard</span>, 'protect portfast ports from rogue switches', 'err-disable port if BPDU received'],
            [<span style={{ color: 'var(--accent-secondary)' }}>BPDU filter</span>, 'suppress BPDUs on a port', 'stops sending/receiving BPDUs (use with caution)'],
            [<span style={{ color: 'var(--accent-secondary)' }}>root guard</span>, 'prevent unauthorized root bridge changes', 'puts port in root-inconsistent state if superior BPDU received'],
            [<span style={{ color: 'var(--accent-secondary)' }}>loop guard</span>, 'prevent unidirectional link failures', 'puts port in loop-inconsistent state if BPDUs stop arriving'],
            [<span style={{ color: 'var(--accent-secondary)' }}>UDLD</span>, 'detect unidirectional links', 'err-disable port if unidirectional link detected'],
            [<span style={{ color: 'var(--accent-secondary)' }}>storm control</span>, 'limit broadcast/multicast/unicast flooding', 'drops or err-disables when threshold exceeded'],
          ]}
        />
        <div style={{ ...heading, fontSize: '11px', marginTop: '14px', borderLeft: 'none', paddingLeft: 0, color: 'var(--text-muted)' }}>when to use</div>
        <Table
          headers={['port type', 'recommended features']}
          rows={[
            ['access (end host)', 'portfast + BPDU guard + storm control'],
            ['trunk (switch-to-switch)', 'root guard (on non-root paths) + loop guard'],
            ['distribution/core uplinks', 'loop guard + UDLD'],
            ['unused ports', 'admin shutdown + BPDU guard'],
          ]}
        />
      </Section>

      {/* priority quick reference */}
      <Section title="priority quick reference" accent="var(--accent-primary)">
        <Table
          headers={['priority', 'use']}
          rows={[
            [<span style={{ color: 'var(--accent-primary)' }}>0</span>, 'absolute root — highest priority possible'],
            [<span style={{ color: 'var(--accent-primary)' }}>4096</span>, 'primary root bridge'],
            [<span style={{ color: 'var(--accent-primary)' }}>8192</span>, 'secondary root bridge'],
            [<span style={{ color: 'var(--accent-primary)' }}>16384</span>, 'tertiary / backup root'],
            [<span style={{ color: 'var(--accent-primary)' }}>32768</span>, 'default priority'],
            [<span style={{ color: 'var(--accent-primary)' }}>61440</span>, 'ensure switch never becomes root'],
          ]}
        />
      </Section>

    </div>
  );
}
