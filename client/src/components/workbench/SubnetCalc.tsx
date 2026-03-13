import { useState, useMemo } from 'react';

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '14px',
  padding: '6px 0',
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
  fontWeight: 600,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  fontSize: '13px',
  fontFamily: "'JetBrains Mono', monospace",
};

function parseIPv4(ip: string): number[] | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some(n => isNaN(n) || n < 0 || n > 255 || !Number.isInteger(n))) return null;
  return nums;
}

function ipToNum(octets: number[]): number {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

function numToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function ipToBinary(octets: number[]): string {
  return octets.map(o => o.toString(2).padStart(8, '0')).join('.');
}

function getClass(firstOctet: number): string {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D (multicast)';
  return 'E (reserved)';
}

function isPrivate(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

interface SubnetResult {
  network: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  mask: string;
  wildcard: string;
  totalHosts: number;
  usableHosts: number;
  binary: string;
  ipClass: string;
  isPrivate: boolean;
  prefix: number;
}

function calculate(ip: string, prefix: number): SubnetResult | null {
  const octets = parseIPv4(ip);
  if (!octets || prefix < 0 || prefix > 32) return null;

  const ipNum = ipToNum(octets);
  const maskNum = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcardNum = (~maskNum) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;
  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : Math.max(totalHosts - 2, 0);

  const networkOctets = [(networkNum >>> 24) & 255, (networkNum >>> 16) & 255, (networkNum >>> 8) & 255, networkNum & 255];

  return {
    network: numToIp(networkNum),
    broadcast: numToIp(broadcastNum),
    firstUsable: prefix >= 31 ? numToIp(networkNum) : numToIp(networkNum + 1),
    lastUsable: prefix >= 31 ? numToIp(broadcastNum) : numToIp(broadcastNum - 1),
    mask: numToIp(maskNum),
    wildcard: numToIp(wildcardNum),
    totalHosts,
    usableHosts,
    binary: ipToBinary(octets),
    ipClass: getClass(octets[0]),
    isPrivate: isPrivate(octets),
    prefix,
  };
}

export function SubnetCalc() {
  const [ip, setIp] = useState('192.168.1.100');
  const [prefix, setPrefix] = useState('24');

  const result = useMemo(() => {
    const p = parseInt(prefix);
    if (isNaN(p)) return null;
    return calculate(ip, p);
  }, [ip, prefix]);

  const fields: [string, string, string?][] = result ? [
    ['network', `${result.network}/${result.prefix}`],
    ['broadcast', result.broadcast],
    ['first usable', result.firstUsable],
    ['last usable', result.lastUsable],
    ['subnet mask', result.mask],
    ['wildcard', result.wildcard],
    ['total addresses', result.totalHosts.toLocaleString()],
    ['usable hosts', result.usableHosts.toLocaleString()],
    ['ip class', result.ipClass],
    ['private', result.isPrivate ? 'yes (RFC 1918)' : 'no'],
    ['binary', result.binary, 'var(--text-muted)'],
  ] : [];

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div style={{ flex: 2 }}>
          <div style={labelStyle}>ip address</div>
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            style={inputStyle}
            placeholder="192.168.1.0"
            spellCheck={false}
          />
        </div>
        <div style={{
          fontSize: '20px',
          color: 'var(--text-muted)',
          paddingBottom: 4,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          /
        </div>
        <div style={{ flex: 0, minWidth: 60 }}>
          <div style={labelStyle}>cidr</div>
          <input
            type="number"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            style={inputStyle}
            min="0"
            max="32"
          />
        </div>
      </div>

      {result ? (
        <div>
          {fields.map(([label, value, color]) => (
            <div key={label} style={rowStyle}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{label}</span>
              <span style={{ color: color || 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}

          {/* Visual subnet bar */}
          <div style={{ marginTop: 20 }}>
            <div style={labelStyle}>address space</div>
            <div style={{
              height: 8,
              background: 'var(--bg-surface)',
              marginTop: 8,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${Math.max((result.usableHosts / result.totalHosts) * 100, 2)}%`,
                background: 'var(--accent-primary)',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: 4,
            }}>
              <span>{result.firstUsable}</span>
              <span>{result.usableHosts.toLocaleString()} usable</span>
              <span>{result.lastUsable}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          enter a valid IPv4 address and prefix length
        </div>
      )}
    </div>
  );
}
