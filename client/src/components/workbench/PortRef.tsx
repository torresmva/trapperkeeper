import { useState, useMemo } from 'react';

interface PortEntry {
  port: number | string;
  proto: string;
  service: string;
  description: string;
}

const PORTS: PortEntry[] = [
  // System / well-known
  { port: 20, proto: 'TCP', service: 'FTP Data', description: 'File transfer (data channel)' },
  { port: 21, proto: 'TCP', service: 'FTP', description: 'File transfer (control)' },
  { port: 22, proto: 'TCP', service: 'SSH', description: 'Secure shell, SCP, SFTP' },
  { port: 23, proto: 'TCP', service: 'Telnet', description: 'Unencrypted remote login' },
  { port: 25, proto: 'TCP', service: 'SMTP', description: 'Mail transfer' },
  { port: 53, proto: 'TCP/UDP', service: 'DNS', description: 'Domain name resolution' },
  { port: 67, proto: 'UDP', service: 'DHCP Server', description: 'Dynamic host config (server)' },
  { port: 68, proto: 'UDP', service: 'DHCP Client', description: 'Dynamic host config (client)' },
  { port: 69, proto: 'UDP', service: 'TFTP', description: 'Trivial file transfer' },
  { port: 80, proto: 'TCP', service: 'HTTP', description: 'Web traffic' },
  { port: 88, proto: 'TCP/UDP', service: 'Kerberos', description: 'Authentication protocol' },
  { port: 110, proto: 'TCP', service: 'POP3', description: 'Post office protocol' },
  { port: 111, proto: 'TCP/UDP', service: 'RPCbind', description: 'ONC RPC portmapper' },
  { port: 119, proto: 'TCP', service: 'NNTP', description: 'Usenet news transfer' },
  { port: 123, proto: 'UDP', service: 'NTP', description: 'Network time protocol' },
  { port: 135, proto: 'TCP', service: 'MS RPC', description: 'Microsoft RPC endpoint mapper' },
  { port: 137, proto: 'UDP', service: 'NetBIOS NS', description: 'NetBIOS name service' },
  { port: 138, proto: 'UDP', service: 'NetBIOS DGM', description: 'NetBIOS datagram' },
  { port: 139, proto: 'TCP', service: 'NetBIOS SSN', description: 'NetBIOS session (SMB over NBT)' },
  { port: 143, proto: 'TCP', service: 'IMAP', description: 'Internet message access' },
  { port: 161, proto: 'UDP', service: 'SNMP', description: 'Simple network management' },
  { port: 162, proto: 'UDP', service: 'SNMP Trap', description: 'SNMP notifications' },
  { port: 179, proto: 'TCP', service: 'BGP', description: 'Border gateway protocol' },
  { port: 194, proto: 'TCP', service: 'IRC', description: 'Internet relay chat' },
  { port: 389, proto: 'TCP/UDP', service: 'LDAP', description: 'Lightweight directory access' },
  { port: 443, proto: 'TCP', service: 'HTTPS', description: 'HTTP over TLS' },
  { port: 445, proto: 'TCP', service: 'SMB', description: 'Server message block (direct)' },
  { port: 464, proto: 'TCP/UDP', service: 'Kerberos pwd', description: 'Kerberos password change' },
  { port: 465, proto: 'TCP', service: 'SMTPS', description: 'SMTP over TLS (implicit)' },
  { port: 500, proto: 'UDP', service: 'IKE', description: 'IPsec key exchange' },
  { port: 514, proto: 'UDP', service: 'Syslog', description: 'System logging' },
  { port: 515, proto: 'TCP', service: 'LPD', description: 'Line printer daemon' },
  { port: 520, proto: 'UDP', service: 'RIP', description: 'Routing information protocol' },
  { port: 546, proto: 'UDP', service: 'DHCPv6 Client', description: 'DHCPv6 client' },
  { port: 547, proto: 'UDP', service: 'DHCPv6 Server', description: 'DHCPv6 server' },
  { port: 554, proto: 'TCP', service: 'RTSP', description: 'Real time streaming protocol' },
  { port: 587, proto: 'TCP', service: 'Submission', description: 'Mail submission (STARTTLS)' },
  { port: 636, proto: 'TCP', service: 'LDAPS', description: 'LDAP over TLS' },
  { port: 853, proto: 'TCP', service: 'DoT', description: 'DNS over TLS' },
  { port: 993, proto: 'TCP', service: 'IMAPS', description: 'IMAP over TLS' },
  { port: 995, proto: 'TCP', service: 'POP3S', description: 'POP3 over TLS' },

  // Routing & network infrastructure
  { port: 1080, proto: 'TCP', service: 'SOCKS', description: 'SOCKS proxy' },
  { port: 1194, proto: 'UDP', service: 'OpenVPN', description: 'OpenVPN tunnel' },
  { port: 1433, proto: 'TCP', service: 'MSSQL', description: 'Microsoft SQL Server' },
  { port: 1521, proto: 'TCP', service: 'Oracle DB', description: 'Oracle database listener' },
  { port: 1701, proto: 'UDP', service: 'L2TP', description: 'Layer 2 tunneling protocol' },
  { port: 1723, proto: 'TCP', service: 'PPTP', description: 'Point-to-point tunneling' },
  { port: 1812, proto: 'UDP', service: 'RADIUS Auth', description: 'RADIUS authentication' },
  { port: 1813, proto: 'UDP', service: 'RADIUS Acct', description: 'RADIUS accounting' },
  { port: 1883, proto: 'TCP', service: 'MQTT', description: 'Message queuing telemetry' },
  { port: 2049, proto: 'TCP/UDP', service: 'NFS', description: 'Network file system' },
  { port: 2379, proto: 'TCP', service: 'etcd client', description: 'etcd client communication' },
  { port: 2380, proto: 'TCP', service: 'etcd peer', description: 'etcd peer communication' },
  { port: 2484, proto: 'TCP', service: 'Oracle TLS', description: 'Oracle DB over TLS' },
  { port: 3128, proto: 'TCP', service: 'Squid', description: 'Squid HTTP proxy' },
  { port: 3268, proto: 'TCP', service: 'LDAP GC', description: 'Active Directory global catalog' },
  { port: 3269, proto: 'TCP', service: 'LDAP GC SSL', description: 'AD global catalog over TLS' },
  { port: 3306, proto: 'TCP', service: 'MySQL', description: 'MySQL / MariaDB' },
  { port: 3389, proto: 'TCP', service: 'RDP', description: 'Remote desktop protocol' },
  { port: 4443, proto: 'TCP', service: 'Pharos', description: 'Common alt-HTTPS' },
  { port: 4500, proto: 'UDP', service: 'IPsec NAT-T', description: 'IPsec NAT traversal' },
  { port: 5060, proto: 'TCP/UDP', service: 'SIP', description: 'Session initiation protocol' },
  { port: 5061, proto: 'TCP', service: 'SIP TLS', description: 'SIP over TLS' },
  { port: 5432, proto: 'TCP', service: 'PostgreSQL', description: 'PostgreSQL database' },
  { port: 5672, proto: 'TCP', service: 'AMQP', description: 'RabbitMQ / AMQP' },
  { port: 5900, proto: 'TCP', service: 'VNC', description: 'Virtual network computing' },
  { port: 5938, proto: 'TCP', service: 'TeamViewer', description: 'TeamViewer remote' },
  { port: 6379, proto: 'TCP', service: 'Redis', description: 'Redis key-value store' },
  { port: 6443, proto: 'TCP', service: 'K8s API', description: 'Kubernetes API server' },
  { port: 6514, proto: 'TCP', service: 'Syslog TLS', description: 'Syslog over TLS' },
  { port: 6660, proto: 'TCP', service: 'IRC alt', description: 'IRC (alternate)' },
  { port: 6697, proto: 'TCP', service: 'IRC TLS', description: 'IRC over TLS' },
  { port: 7946, proto: 'TCP/UDP', service: 'Docker Swarm', description: 'Docker Swarm gossip' },
  { port: 8080, proto: 'TCP', service: 'HTTP alt', description: 'Alternate HTTP / proxy' },
  { port: 8443, proto: 'TCP', service: 'HTTPS alt', description: 'Alternate HTTPS' },
  { port: 8883, proto: 'TCP', service: 'MQTT TLS', description: 'MQTT over TLS' },
  { port: 8888, proto: 'TCP', service: 'HTTP alt', description: 'Alternate HTTP / dev servers' },
  { port: 9090, proto: 'TCP', service: 'Prometheus', description: 'Prometheus metrics server' },
  { port: 9092, proto: 'TCP', service: 'Kafka', description: 'Apache Kafka broker' },
  { port: 9100, proto: 'TCP', service: 'Node Exporter', description: 'Prometheus node exporter' },
  { port: 9200, proto: 'TCP', service: 'Elasticsearch', description: 'Elasticsearch HTTP' },
  { port: 9300, proto: 'TCP', service: 'ES Transport', description: 'Elasticsearch node-to-node' },
  { port: 9418, proto: 'TCP', service: 'Git', description: 'Git protocol (unauthenticated)' },
  { port: 9443, proto: 'TCP', service: 'HTTPS alt', description: 'Alt HTTPS (Portainer, etc.)' },
  { port: 10250, proto: 'TCP', service: 'Kubelet', description: 'Kubernetes kubelet API' },
  { port: 10443, proto: 'TCP', service: 'HTTPS alt', description: 'Alt HTTPS (Rancher, etc.)' },
  { port: 11211, proto: 'TCP/UDP', service: 'Memcached', description: 'Memcached cache' },
  { port: 15672, proto: 'TCP', service: 'RabbitMQ Mgmt', description: 'RabbitMQ management UI' },
  { port: 27017, proto: 'TCP', service: 'MongoDB', description: 'MongoDB database' },
  { port: 30000, proto: 'TCP', service: 'K8s NodePort', description: 'Kubernetes NodePort range start' },
  { port: 32767, proto: 'TCP', service: 'K8s NodePort', description: 'Kubernetes NodePort range end' },
  { port: 43, proto: 'TCP', service: 'WHOIS', description: 'WHOIS directory service' },
  { port: 47, proto: 'N/A', service: 'GRE', description: 'Generic routing encapsulation (IP protocol 47)' },
  { port: 51820, proto: 'UDP', service: 'WireGuard', description: 'WireGuard VPN' },
];

// Sort by port number
const SORTED_PORTS = [...PORTS].sort((a, b) => {
  const ap = typeof a.port === 'number' ? a.port : parseInt(a.port);
  const bp = typeof b.port === 'number' ? b.port : parseInt(b.port);
  return ap - bp;
});

const cellStyle: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '12px',
  fontFamily: "'JetBrains Mono', monospace",
  borderBottom: '1px solid var(--border)',
};

const headerStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '2px solid var(--border)',
  position: 'sticky' as const,
  top: 0,
  background: 'var(--bg-primary)',
  zIndex: 1,
};

export function PortRef() {
  const [search, setSearch] = useState('');
  const [protoFilter, setProtoFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return SORTED_PORTS.filter(p => {
      if (protoFilter !== 'all' && !p.proto.includes(protoFilter)) return false;
      if (!q) return true;
      return (
        String(p.port).includes(q) ||
        p.service.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [search, protoFilter]);

  return (
    <div>
      {/* Search & filter */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              padding: '6px 0',
              width: '100%',
              outline: 'none',
            }}
            placeholder="search port, service, or description..."
            spellCheck={false}
          />
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {['all', 'TCP', 'UDP'].map(p => (
            <button
              key={p}
              onClick={() => setProtoFilter(p)}
              style={{
                background: protoFilter === p ? 'var(--accent-primary)' : 'transparent',
                color: protoFilter === p ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${protoFilter === p ? 'var(--accent-primary)' : 'var(--border)'}`,
                padding: '5px 12px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                fontWeight: protoFilter === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginBottom: 8,
      }}>
        {filtered.length} port{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: 70 }}>port</th>
              <th style={{ ...headerStyle, width: 70 }}>proto</th>
              <th style={{ ...headerStyle, width: 130 }}>service</th>
              <th style={headerStyle}>description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const isWellKnown = typeof p.port === 'number' && p.port < 1024;
              return (
                <tr key={i} style={{ cursor: 'default' }}>
                  <td style={{
                    ...cellStyle,
                    color: isWellKnown ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                  }}>
                    {p.port}
                  </td>
                  <td style={{
                    ...cellStyle,
                    color: p.proto.includes('UDP')
                      ? p.proto.includes('TCP') ? 'var(--accent-tertiary)' : 'var(--accent-secondary)'
                      : 'var(--text-secondary)',
                    fontSize: '11px',
                  }}>
                    {p.proto}
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {p.service}
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {p.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
