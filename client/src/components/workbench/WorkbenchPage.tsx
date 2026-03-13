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

const TOOLS = [
  { id: 'cidr', label: 'cidr' },
  { id: 'subnet', label: 'subnet calc' },
  { id: 'size', label: 'data size' },
  { id: 'rate', label: 'data rate' },
  { id: 'epoch', label: 'epoch' },
  { id: 'cron', label: 'cron' },
  { id: 'ports', label: 'ports' },
  { id: 'rfcs', label: 'rfcs' },
] as const;

type ToolId = typeof TOOLS[number]['id'];

export function WorkbenchPage() {
  const [active, setActive] = useState<ToolId>('cidr');

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

        {/* Tool tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginTop: 16,
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActive(tool.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active === tool.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: active === tool.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '8px 14px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tool content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {active === 'cidr' && <CidrChart />}
        {active === 'subnet' && <SubnetCalc />}
        {active === 'size' && <SizeCalc />}
        {active === 'rate' && <RateCalc />}
        {active === 'epoch' && <EpochCalc />}
        {active === 'cron' && <CronBuilder />}
        {active === 'ports' && <PortRef />}
        {active === 'rfcs' && <RfcRef />}
      </div>
    </div>
  );
}
