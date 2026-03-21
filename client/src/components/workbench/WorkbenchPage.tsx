import { useState } from 'react';
import { PixelWrench } from '../shared/PixelArt';
import { CidrChart } from './CidrChart';
import { SubnetCalc } from './SubnetCalc';
import { SizeCalc } from './SizeCalc';
import { RateCalc } from './RateCalc';
import { EpochCalc } from './EpochCalc';
import { CronBuilder } from './CronBuilder';
import { PortRef } from './PortRef';
import { RfcRef } from './RfcRef';
import { DiagramEditor } from './DiagramEditor';
import { ProtocolRef } from './ProtocolRef';

// Top-level tools — networking is a group with sub-tabs
const TOP_TOOLS = [
  { id: 'networking', label: 'networking' },
  { id: 'size', label: 'data size' },
  { id: 'rate', label: 'data rate' },
  { id: 'epoch', label: 'epoch' },
  { id: 'cron', label: 'cron' },
  { id: 'diagrams', label: 'diagrams' },
] as const;

const NET_TABS = [
  { id: 'cidr', label: 'cidr' },
  { id: 'subnet', label: 'subnet calc' },
  { id: 'ports', label: 'ports' },
  { id: 'rfcs', label: 'rfcs' },
  { id: 'protocols', label: 'routing protocols' },
] as const;

type TopId = typeof TOP_TOOLS[number]['id'];
type NetId = typeof NET_TABS[number]['id'];

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

function TabBar({ items, active, onSelect, accentColor }: {
  items: readonly { id: string; label: string }[];
  active: string;
  onSelect: (id: string) => void;
  accentColor?: string;
}) {
  const accent = accentColor || 'var(--accent-primary)';
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: active === item.id ? `2px solid ${accent}` : '2px solid transparent',
            color: active === item.id ? accent : 'var(--text-secondary)',
            padding: '8px 14px',
            fontSize: '12px',
            ...mono,
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function WorkbenchPage() {
  const [active, setActive] = useState<TopId>('networking');
  const [netTab, setNetTab] = useState<NetId>('cidr');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PixelWrench size={20} />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            letterSpacing: '-0.03em',
          }}>
            workbench
          </h1>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: 4,
          marginLeft: 30,
          letterSpacing: '0.02em',
        }}>
          tools for the job
        </div>

        {/* Top-level tabs */}
        <div style={{ marginTop: 16 }}>
          <TabBar
            items={TOP_TOOLS}
            active={active}
            onSelect={id => setActive(id as TopId)}
          />
        </div>

        {/* Networking sub-tabs */}
        {active === 'networking' && (
          <div style={{ marginTop: 0, paddingLeft: 8 }}>
            <TabBar
              items={NET_TABS}
              active={netTab}
              onSelect={id => setNetTab(id as NetId)}
              accentColor="var(--accent-tertiary)"
            />
          </div>
        )}
      </div>

      {/* Tool content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {active === 'networking' && netTab === 'cidr' && <CidrChart />}
        {active === 'networking' && netTab === 'subnet' && <SubnetCalc />}
        {active === 'networking' && netTab === 'ports' && <PortRef />}
        {active === 'networking' && netTab === 'rfcs' && <RfcRef />}
        {active === 'networking' && netTab === 'protocols' && <ProtocolRef />}
        {active === 'size' && <SizeCalc />}
        {active === 'rate' && <RateCalc />}
        {active === 'epoch' && <EpochCalc />}
        {active === 'cron' && <CronBuilder />}
        {active === 'diagrams' && <DiagramEditor />}
      </div>
    </div>
  );
}
