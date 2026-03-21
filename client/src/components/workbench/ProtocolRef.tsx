import { useState } from 'react';
import { OspfRef } from './protocols/OspfRef';
import { BgpRef } from './protocols/BgpRef';
import { IsisRef } from './protocols/IsisRef';
import { PimRef } from './protocols/PimRef';
import { EigrpRef } from './protocols/EigrpRef';
import { MplsRef } from './protocols/MplsRef';
import { VxlanRef } from './protocols/VxlanRef';
import { StpRef } from './protocols/StpRef';

const PROTOCOLS = [
  { id: 'ospf', label: 'ospf' },
  { id: 'bgp', label: 'bgp' },
  { id: 'isis', label: 'is-is' },
  { id: 'pim', label: 'pim' },
  { id: 'eigrp', label: 'eigrp' },
  { id: 'mpls', label: 'mpls' },
  { id: 'vxlan', label: 'vxlan/evpn' },
  { id: 'stp', label: 'stp' },
] as const;

type ProtocolId = typeof PROTOCOLS[number]['id'];

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

export function ProtocolRef() {
  const [active, setActive] = useState<ProtocolId>('ospf');

  return (
    <div>
      {/* Protocol sub-tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 16,
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {PROTOCOLS.map(p => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: active === p.id ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              color: active === p.id ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              padding: '6px 12px',
              fontSize: '11px',
              ...mono,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        {active === 'ospf' && <OspfRef />}
        {active === 'bgp' && <BgpRef />}
        {active === 'isis' && <IsisRef />}
        {active === 'pim' && <PimRef />}
        {active === 'eigrp' && <EigrpRef />}
        {active === 'mpls' && <MplsRef />}
        {active === 'vxlan' && <VxlanRef />}
        {active === 'stp' && <StpRef />}
      </div>
    </div>
  );
}
