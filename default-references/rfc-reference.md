---
title: RFC Reference
date: "2026-01-01"
tags:
  - rfc-reference
  - reference
  - networking
collection: references
---

## IP & Addressing

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 791 | Internet Protocol | 1981 | IPv4 specification |
| 792 | Internet Control Message Protocol | 1981 | ICMP for IPv4 |
| 826 | Ethernet Address Resolution Protocol | 1982 | ARP |
| 894 | IP over Ethernet | 1984 | Standard for IP over Ethernet |
| 903 | Reverse Address Resolution Protocol | 1984 | RARP |
| 919 | Broadcasting Internet Datagrams | 1984 | Broadcast address conventions |
| 950 | Internet Standard Subnetting Procedure | 1985 | Subnet addressing |
| 1042 | IP over Token Ring | 1988 | IP datagrams over IEEE 802 |
| 1071 | Computing the Internet Checksum | 1988 | Checksum computation |
| 1112 | Host Extensions for IP Multicasting | 1989 | IGMPv1 |
| 1122 | Requirements for Internet Hosts — Communication Layers | 1989 | Host requirements |
| 1191 | Path MTU Discovery | 1990 | PMTUD mechanism |
| 1518 | Architecture for IP Address Allocation with CIDR | 1993 | CIDR architecture |
| 1519 | Classless Inter-Domain Routing | 1993 | CIDR specification |
| 1812 | Requirements for IP Version 4 Routers | 1995 | Router requirements |
| 1918 | Address Allocation for Private Internets | 1996 | Private IP ranges 10/8, 172.16/12, 192.168/16 |
| 2474 | Definition of the DS Field in IPv4/IPv6 Headers | 1998 | DiffServ field |
| 3021 | Using 31-Bit Prefixes on Point-to-Point Links | 2000 | /31 on PtP links |
| 3927 | Dynamic Configuration of IPv4 Link-Local Addresses | 2005 | 169.254.0.0/16 |
| 4632 | CIDR: The Internet Address Assignment and Aggregation Plan | 2006 | Obsoletes RFC 1519 |
| 5737 | IPv4 Address Blocks Reserved for Documentation | 2010 | 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 |
| 6052 | IPv6 Addressing of IPv4/IPv6 Translators | 2010 | NAT64 addressing |
| 6598 | IANA-Reserved IPv4 Prefix for Shared Address Space | 2012 | 100.64.0.0/10 CGN |
| 6890 | Special-Purpose IP Address Registries | 2013 | Consolidated special-use blocks |
| 8200 | Internet Protocol, Version 6 Specification | 2017 | IPv6 (obsoletes 2460) |

## IPv6

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 2460 | Internet Protocol, Version 6 | 1998 | Original IPv6 spec |
| 2461 | Neighbor Discovery for IPv6 | 1998 | NDP (obsoleted by 4861) |
| 2462 | IPv6 Stateless Address Autoconfiguration | 1998 | SLAAC (obsoleted by 4862) |
| 2463 | ICMPv6 | 1998 | ICMP for IPv6 (obsoleted by 4443) |
| 3587 | IPv6 Global Unicast Address Format | 2003 | Global unicast structure |
| 3849 | IPv6 Address Prefix Reserved for Documentation | 2004 | 2001:DB8::/32 |
| 4193 | Unique Local IPv6 Unicast Addresses | 2005 | ULA fc00::/7 |
| 4291 | IP Version 6 Addressing Architecture | 2006 | IPv6 address types |
| 4443 | ICMPv6 | 2006 | Updated ICMPv6 |
| 4861 | Neighbor Discovery for IPv6 | 2007 | NDP: NS, NA, RS, RA |
| 4862 | IPv6 Stateless Address Autoconfiguration | 2007 | SLAAC |
| 4941 | Privacy Extensions for SLAAC | 2007 | Temporary addresses |
| 5095 | Deprecation of Type 0 Routing Headers | 2007 | Security fix |
| 6105 | IPv6 Router Advertisement Guard | 2011 | RA Guard |
| 6106 | IPv6 RA Options for DNS Configuration | 2010 | RDNSS/DNSSL |
| 6177 | IPv6 Address Assignment to End Sites | 2011 | /48 or shorter recommended |
| 6204 | Basic Requirements for IPv6 CE Routers | 2011 | CPE requirements |
| 6724 | Default Address Selection for IPv6 | 2012 | Source/dest selection |
| 7084 | Basic Requirements for IPv6 CE Routers | 2013 | Updated CPE requirements |
| 7217 | Semantically Opaque Interface Identifiers | 2014 | Stable privacy addresses |
| 7707 | Network Reconnaissance in IPv6 Networks | 2016 | IPv6 scanning techniques |
| 8028 | First-Hop Router Selection by Hosts | 2016 | Multi-prefix environments |
| 8200 | Internet Protocol, Version 6 Specification | 2017 | Current IPv6 spec |
| 8201 | IPv6 Path MTU Discovery | 2017 | Updated PMTUD for IPv6 |
| 8981 | Temporary Address Extensions for SLAAC | 2021 | Updates RFC 4941 |

## Multicast

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1112 | Host Extensions for IP Multicasting | 1989 | IGMPv1 |
| 2236 | IGMPv2 | 1997 | Internet Group Management Protocol v2 |
| 2365 | Administratively Scoped IP Multicast | 1998 | Multicast scoping |
| 2710 | Multicast Listener Discovery for IPv6 | 1999 | MLDv1 |
| 3171 | IANA Guidelines for IPv4 Multicast Allocations | 2001 | Multicast address assignment |
| 3376 | IGMPv3 | 2002 | Source-specific multicast support |
| 3569 | SSM for IP | 2003 | Source-Specific Multicast overview |
| 3618 | Multicast Source Discovery Protocol | 2003 | MSDP |
| 3810 | MLDv2 for IPv6 | 2004 | Multicast Listener Discovery v2 |
| 3973 | PIM Dense Mode | 2005 | PIM-DM specification |
| 4541 | IGMP/MLD Snooping | 2006 | L2 multicast optimization |
| 4601 | PIM Sparse Mode | 2006 | PIM-SM specification |
| 4604 | PIM-SSM for ASM | 2006 | Using IGMPv3/MLDv2 with SSM |
| 4607 | Source-Specific Multicast for IP | 2006 | SSM model |
| 4610 | Anycast-RP Using PIM | 2006 | Anycast RP with MSDP |
| 5015 | Bidirectional PIM | 2007 | PIM-BiDir specification |
| 5059 | BSR Mechanism for PIM | 2008 | Bootstrap Router |
| 5765 | Security Considerations for PIM-SM | 2010 | PIM security |
| 7761 | PIM Sparse Mode | 2016 | Updated PIM-SM (obsoletes 4601) |
| 8279 | Multicast Using Bit Index Explicit Replication | 2017 | BIER |

## Routing

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1058 | Routing Information Protocol | 1988 | RIPv1 |
| 1195 | Use of OSI IS-IS for Routing in TCP/IP | 1990 | Integrated IS-IS |
| 1247 | OSPF Version 2 | 1991 | Early OSPF (obsoleted) |
| 1771 | A Border Gateway Protocol 4 | 1995 | BGP-4 (obsoleted by 4271) |
| 1997 | BGP Communities Attribute | 1996 | Standard communities |
| 2328 | OSPF Version 2 | 1998 | Current OSPFv2 spec |
| 2453 | RIP Version 2 | 1998 | RIPv2 with CIDR support |
| 2545 | Use of BGP-4 Multiprotocol Extensions for IPv6 | 1999 | BGP for IPv6 |
| 2740 | OSPF for IPv6 | 1999 | OSPFv3 (obsoleted by 5340) |
| 2796 | BGP Route Reflection | 2000 | Route reflectors |
| 2858 | Multiprotocol Extensions for BGP-4 | 2000 | MP-BGP AFI/SAFI |
| 3065 | AS Confederations for BGP | 2001 | BGP confederations |
| 3137 | OSPF Stub Router Advertisement | 2001 | Max-metric stub |
| 4271 | A Border Gateway Protocol 4 | 2006 | Current BGP-4 spec |
| 4360 | BGP Extended Communities | 2006 | Route targets, SOO |
| 4456 | BGP Route Reflection | 2006 | Updated route reflectors |
| 4684 | Constrained Route Distribution for BGP/MPLS VPN | 2006 | RT-constrained distribution |
| 4724 | Graceful Restart Mechanism for BGP | 2007 | BGP GR |
| 4760 | Multiprotocol Extensions for BGP-4 | 2007 | MP-BGP (obsoletes 2858) |
| 4893 | BGP Support for Four-Octet AS Numbers | 2007 | 32-bit ASNs |
| 5065 | AS Path-Based Outbound Route Filter for BGP-4 | 2007 | AS path ORF |
| 5082 | Generalized TTL Security Mechanism | 2007 | GTSM for BGP |
| 5291 | Outbound Route Filtering for BGP-4 | 2008 | ORF |
| 5302 | Domain-Wide Prefix Distribution with Two-Level IS-IS | 2008 | IS-IS prefix leaking |
| 5305 | IS-IS Extensions for Traffic Engineering | 2008 | IS-IS TE |
| 5308 | Routing IPv6 with IS-IS | 2008 | IS-IS for IPv6 |
| 5340 | OSPF for IPv6 | 2008 | OSPFv3 |
| 5765 | Security Considerations for PIM-SM | 2010 | PIM security |
| 5765 | BFD | 2010 | Bidirectional Forwarding Detection |
| 5880 | Bidirectional Forwarding Detection | 2010 | BFD base specification |
| 5881 | BFD for IPv4 and IPv6 | 2010 | BFD single-hop |
| 5883 | BFD for Multihop Paths | 2010 | BFD multihop |
| 6119 | IPv6 Traffic Engineering in IS-IS | 2011 | IS-IS IPv6 TE |
| 6286 | AS-Wide Unique BGP Identifier | 2011 | BGP router ID |
| 6793 | BGP Support for Four-Octet AS Numbers | 2012 | Updated 32-bit ASN |
| 7311 | The Accumulated IGP Metric for BGP | 2014 | AIGP attribute |
| 7752 | BGP-LS (Link-State) | 2016 | North-bound IGP topology |
| 7938 | Use of BGP for Routing in Large-Scale Data Centers | 2016 | BGP in DC fabrics |
| 7999 | BLACKHOLE Community | 2016 | Remotely triggered blackhole |
| 8092 | BGP Large Communities | 2017 | 4-byte ASN communities |
| 8205 | BGPsec Protocol Specification | 2017 | BGP path validation |
| 8402 | Segment Routing Architecture | 2018 | SR architecture |
| 8665 | OSPF Extensions for Segment Routing | 2019 | OSPF SR |
| 8667 | IS-IS Extensions for Segment Routing | 2019 | IS-IS SR |
| 9012 | IS-IS Flexible Algorithm | 2021 | Flex-Algo |
| 9085 | BGP SR Policy | 2021 | SR Policy via BGP |
| 9252 | BGP Overlay Services Based on EVPN | 2022 | EVPN over SRv6 |

## Transport

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 768 | User Datagram Protocol | 1980 | UDP |
| 793 | Transmission Control Protocol | 1981 | TCP |
| 854 | Telnet Protocol Specification | 1983 | Telnet |
| 1122 | Requirements for Internet Hosts | 1989 | TCP/IP host requirements |
| 1323 | TCP High Performance Extensions | 1992 | Window scaling, timestamps |
| 2018 | TCP Selective Acknowledgements | 1996 | TCP SACK |
| 2460 | IPv6 Specification | 1998 | Flow labels |
| 2581 | TCP Congestion Control | 1999 | Slow start, congestion avoidance |
| 2960 | Stream Control Transmission Protocol | 2000 | SCTP |
| 3168 | Explicit Congestion Notification | 2001 | ECN |
| 3286 | Introduction to SCTP | 2002 | SCTP overview |
| 4960 | Stream Control Transmission Protocol | 2007 | Updated SCTP |
| 5348 | TCP Friendly Rate Control | 2008 | TFRC |
| 5681 | TCP Congestion Control | 2009 | Updated congestion control |
| 6298 | Computing TCP Retransmission Timer | 2011 | RTO computation |
| 6335 | Service Name and Transport Port Number Procedures | 2011 | Port number registry |
| 6675 | Segment-Based TCP Loss Recovery | 2012 | SACK-based recovery |
| 7323 | TCP Extensions for High Performance | 2014 | Updated timestamps/window scale |
| 7413 | TCP Fast Open | 2014 | TFO |
| 8312 | CUBIC for Fast Long-Distance Networks | 2018 | CUBIC congestion control |
| 8684 | TCP Extensions for Multipath Operation | 2020 | MPTCP v1 |
| 9000 | QUIC: A UDP-Based Multiplexed Transport | 2021 | QUIC transport |
| 9001 | QUIC Loss Detection and Congestion Control | 2021 | QUIC recovery |
| 9002 | Using TLS to Secure QUIC | 2021 | QUIC-TLS |
| 9114 | HTTP/3 | 2022 | HTTP over QUIC |

## DNS

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1034 | Domain Names — Concepts and Facilities | 1987 | DNS overview |
| 1035 | Domain Names — Implementation and Specification | 1987 | DNS wire format |
| 1101 | DNS Encoding of Network Names and Other Types | 1989 | IN-ADDR.ARPA |
| 1886 | DNS Extensions to Support IPv6 | 1995 | AAAA records (obsoleted) |
| 1995 | Incremental Zone Transfer | 1996 | IXFR |
| 1996 | DNS NOTIFY | 1996 | Zone change notification |
| 2136 | Dynamic Updates in DNS | 1997 | Dynamic DNS |
| 2181 | Clarifications to the DNS Specification | 1997 | DNS clarifications |
| 2308 | Negative Caching of DNS Queries | 1998 | NXDOMAIN caching |
| 2535 | DNS Security Extensions | 1999 | Early DNSSEC |
| 2671 | Extension Mechanisms for DNS | 1999 | EDNS0 |
| 2845 | Secret Key Transaction Authentication for DNS | 2000 | TSIG |
| 3596 | DNS Extensions to Support IPv6 | 2003 | AAAA records |
| 4033 | DNS Security Introduction and Requirements | 2005 | DNSSEC overview |
| 4034 | Resource Records for DNSSEC | 2005 | DNSKEY, RRSIG, DS, NSEC |
| 4035 | Protocol Modifications for DNSSEC | 2005 | DNSSEC validation |
| 4592 | The Role of Wildcards in DNS | 2006 | Wildcard semantics |
| 5155 | DNS Security (DNSSEC) Hashed Authenticated Denial | 2008 | NSEC3 |
| 6891 | Extension Mechanisms for DNS | 2013 | EDNS(0) updated |
| 7858 | DNS over TLS | 2016 | DoT |
| 8484 | DNS Queries over HTTPS | 2018 | DoH |
| 8499 | DNS Terminology | 2019 | Definitions |
| 8767 | Serving Stale Data to Improve DNS Resiliency | 2020 | Serve-stale |
| 9018 | Interoperable Domain Name System Server Cookies | 2021 | DNS cookies |

## DHCP

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 951 | Bootstrap Protocol | 1985 | BOOTP |
| 1542 | Clarifications and Extensions for BOOTP | 1993 | BOOTP relay |
| 2131 | Dynamic Host Configuration Protocol | 1997 | DHCPv4 |
| 2132 | DHCP Options and BOOTP Vendor Extensions | 1997 | DHCP options |
| 3046 | DHCP Relay Agent Information Option | 2001 | Option 82 |
| 3315 | DHCPv6 | 2003 | DHCPv6 specification |
| 3633 | IPv6 Prefix Options for DHCPv6 | 2003 | DHCPv6 PD |
| 3736 | Stateless DHCPv6 | 2004 | Information-Request |
| 4361 | Node-specific Client Identifiers for DHCPv4 | 2006 | DUID-based identifiers |
| 4388 | Dynamic Host Configuration Protocol Leasequery | 2006 | DHCP leasequery |
| 4702 | DHCP Client FQDN Option | 2006 | Option 81 |
| 4703 | Resolution of DNS Name Conflicts | 2006 | DHCP-DNS interaction |
| 6221 | Lightweight DHCPv6 Relay Agent | 2011 | LDRA |
| 6422 | Relay-Supplied DHCP Options | 2011 | DHCPv6 relay options |
| 7227 | Guidelines for DHCP Options | 2014 | Option guidelines |
| 8415 | DHCPv6 | 2018 | Updated DHCPv6 (obsoletes 3315) |

## Security

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 2104 | HMAC: Keyed-Hashing for Message Authentication | 1997 | HMAC |
| 2401 | Security Architecture for IP | 1998 | IPsec architecture (obsoleted) |
| 2403 | Use of HMAC-MD5-96 within ESP and AH | 1998 | IPsec HMAC-MD5 |
| 2404 | Use of HMAC-SHA-96 within ESP and AH | 1998 | IPsec HMAC-SHA |
| 2406 | IP Encapsulating Security Payload | 1998 | ESP (obsoleted by 4303) |
| 2407 | IP DOI for ISAKMP | 1998 | IPsec DOI |
| 2408 | ISAKMP | 1998 | IKE framework |
| 2409 | IKE | 1998 | IKEv1 |
| 2865 | Remote Authentication Dial In User Service | 2000 | RADIUS |
| 2866 | RADIUS Accounting | 2000 | RADIUS accounting |
| 3162 | RADIUS and IPv6 | 2001 | RADIUS IPv6 attributes |
| 3579 | RADIUS Support for EAP | 2003 | RADIUS/EAP |
| 4301 | Security Architecture for IP | 2005 | IPsec architecture |
| 4302 | IP Authentication Header | 2005 | AH |
| 4303 | IP Encapsulating Security Payload | 2005 | ESP |
| 4306 | IKEv2 | 2005 | IKEv2 (obsoleted by 7296) |
| 5246 | TLS Protocol Version 1.2 | 2008 | TLS 1.2 |
| 5280 | Internet X.509 PKI Certificate Profile | 2008 | X.509 certs |
| 5996 | IKEv2 | 2010 | Updated IKEv2 |
| 6071 | IP Security (IPsec) and IKE Document Roadmap | 2011 | IPsec roadmap |
| 6241 | Network Configuration Protocol | 2011 | NETCONF |
| 7296 | IKEv2 | 2014 | Current IKEv2 |
| 7519 | JSON Web Token | 2015 | JWT |
| 7525 | Recommendations for TLS/DTLS | 2015 | TLS best practices |
| 8446 | TLS Protocol Version 1.3 | 2018 | TLS 1.3 |
| 8996 | Deprecating TLS 1.0 and TLS 1.1 | 2021 | TLS 1.0/1.1 deprecated |

## Tunneling

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1701 | Generic Routing Encapsulation | 1994 | GRE |
| 1702 | Generic Routing Encapsulation over IPv4 | 1994 | GRE/IPv4 |
| 2473 | Generic Packet Tunneling in IPv6 | 1998 | IPv6 tunneling |
| 2529 | Transmission of IPv6 over IPv4 Domains | 1999 | 6over4 |
| 2661 | Layer Two Tunneling Protocol | 1999 | L2TP |
| 2784 | Generic Routing Encapsulation | 2000 | Updated GRE |
| 2890 | Key and Sequence Number Extensions to GRE | 2000 | GRE extensions |
| 3053 | IPv6 Tunnel Broker | 2001 | 6to4 broker |
| 3056 | Connection of IPv6 Domains via IPv4 Clouds | 2001 | 6to4 |
| 3931 | Layer Two Tunneling Protocol - Version 3 | 2005 | L2TPv3 |
| 4213 | Basic Transition Mechanisms for IPv6 | 2005 | Dual-stack, tunneling |
| 4380 | Teredo: Tunneling IPv6 over UDP through NATs | 2006 | Teredo |
| 5572 | IPv6 Tunnel Broker with TSP | 2010 | TSP |
| 6333 | Dual-Stack Lite Broadband Deployments | 2011 | DS-Lite |
| 6334 | DS-Lite Basic Bridging BroadBand Element | 2011 | DS-Lite B4 |
| 7348 | VXLAN | 2014 | Virtual Extensible LAN |
| 7432 | BGP MPLS-Based Ethernet VPN | 2015 | EVPN |
| 7637 | NVGRE | 2015 | Network Virtualization using GRE |
| 8926 | Geneve | 2020 | Generic Network Virtualization Encapsulation |
| 9136 | IP/ICMP Translation Algorithm | 2022 | SIIT update |

## MPLS

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 3031 | Multiprotocol Label Switching Architecture | 2001 | MPLS architecture |
| 3032 | MPLS Label Stack Encoding | 2001 | Label format |
| 3036 | LDP Specification | 2001 | Label Distribution Protocol |
| 3107 | Carrying Label Information in BGP-4 | 2001 | BGP labeled unicast |
| 3209 | RSVP-TE for LSP Tunnels | 2001 | MPLS TE |
| 3270 | MPLS Support of DiffServ | 2002 | MPLS QoS |
| 3443 | TTL Processing in MPLS Networks | 2003 | MPLS TTL |
| 3478 | Graceful Restart Mechanism for LDP | 2003 | LDP GR |
| 3812 | MPLS TE MIB | 2004 | MPLS TE management |
| 3813 | MPLS Label Switch Router MIB | 2004 | LSR MIB |
| 3945 | GMPLS Architecture | 2004 | Generalized MPLS |
| 4023 | Encapsulating MPLS in IP or GRE | 2005 | MPLSoGRE |
| 4206 | LSP Hierarchy with GMPLS TE | 2005 | GMPLS hierarchy |
| 4364 | BGP/MPLS IP Virtual Private Networks | 2006 | L3VPN (obsoletes 2547) |
| 4379 | Detecting MPLS Data Plane Failures | 2006 | MPLS OAM (LSP Ping) |
| 4447 | Pseudowire Setup Using LDP | 2006 | L2VPN pseudowires |
| 4448 | Encapsulation Methods for L2 Frames over MPLS | 2006 | L2 encap |
| 4761 | VPLS Using BGP | 2007 | VPLS BGP |
| 4762 | VPLS Using LDP Signaling | 2007 | VPLS LDP |
| 5036 | LDP Specification | 2007 | Updated LDP |
| 5283 | LDP Extension for Inter-Area LSPs | 2008 | Inter-area LDP |
| 5331 | MPLS Upstream Label Assignment | 2008 | Upstream labels |
| 5332 | MPLS Multicast Encapsulations | 2008 | P2MP MPLS |
| 6370 | MPLS TP Identifiers | 2011 | MPLS-TP |
| 6514 | Multicast in MPLS/BGP IP VPNs | 2012 | MVPN |
| 7274 | Allocating and Retiring Special-Purpose MPLS Labels | 2014 | Special labels |
| 8277 | Using BGP to Bind MPLS Labels to Address Prefixes | 2017 | BGP labeled unicast |
| 8660 | Segment Routing with MPLS Data Plane | 2019 | SR-MPLS |

## NAT

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1631 | The IP Network Address Translator | 1994 | Original NAT |
| 2663 | IP NAT Terminology and Considerations | 1999 | NAT terminology |
| 2766 | Network Address Translation - Protocol Translation | 2000 | NAT-PT (deprecated) |
| 3022 | Traditional IP Network Address Translator | 2001 | Traditional NAT |
| 3027 | Protocol Complications with IP NAT | 2001 | NAT issues |
| 3235 | NAT Friendly Application Design | 2002 | NAT traversal guidelines |
| 4008 | Definitions of Managed Objects for NAT | 2005 | NAT MIB |
| 4787 | NAT Behavioral Requirements for UDP | 2007 | UDP NAT requirements |
| 5128 | State of Peer-to-Peer Communication Across NATs | 2008 | NAT traversal state |
| 5135 | IP Multicast Requirements for NAT/FW | 2008 | Multicast NAT |
| 5382 | NAT Behavioral Requirements for TCP | 2008 | TCP NAT requirements |
| 5508 | NAT Behavioral Requirements for ICMP | 2009 | ICMP NAT |
| 6052 | IPv6 Addressing of IPv4/IPv6 Translators | 2010 | NAT64 addressing |
| 6144 | Framework for IPv4/IPv6 Translation | 2011 | Translation framework |
| 6145 | IP/ICMP Translation Algorithm | 2011 | SIIT |
| 6146 | Stateful NAT64 | 2011 | NAT64 |
| 6147 | DNS64 | 2011 | DNS64 |
| 6333 | Dual-Stack Lite | 2011 | DS-Lite (NAT in tunnel) |
| 6598 | Shared Address Space | 2012 | 100.64.0.0/10 for CGN |
| 7857 | Updates to NAT Behavioral Requirements | 2016 | Updated NAT reqs |

## Switching

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 826 | ARP | 1982 | Address Resolution Protocol |
| 894 | IP over Ethernet | 1984 | Ethernet framing |
| 1042 | IP over IEEE 802 | 1988 | 802.2 LLC/SNAP |
| 3069 | VLAN Aggregation for Efficient IP Address Allocation | 2001 | Super VLAN |
| 3619 | Extreme Networks' EDP in Ethernet | 2003 | EDP |
| 4541 | Considerations for IGMP/MLD Snooping | 2006 | L2 multicast |
| 5348 | IEEE 802.1AB LLDP | 2008 | Link Layer Discovery Protocol |
| 5556 | Transparent Interconnection of Lots of Links | 2009 | TRILL |
| 6325 | TRILL: Base Protocol | 2011 | RBridges |
| 7042 | IANA Considerations for IEEE 802 Numbers | 2013 | MAC addresses |
| 7348 | VXLAN | 2014 | Virtual Extensible LAN |
| 7432 | BGP MPLS-Based Ethernet VPN | 2015 | EVPN |
| 7637 | NVGRE | 2015 | GRE-based virtualization |
| 8365 | EVPN Overlay Framework | 2018 | EVPN deployment |
| 8584 | Generalized TTL Security Mechanism for Label Switched Paths | 2019 | GTSM for LSPs |
| 8926 | Geneve | 2020 | Generic encapsulation |

## QoS

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1633 | Integrated Services Architecture | 1994 | IntServ |
| 2205 | RSVP Version 1 | 1997 | Resource Reservation Protocol |
| 2210 | Use of RSVP with IETF IntServ | 1997 | RSVP/IntServ |
| 2474 | Definition of the DS Field | 1998 | DSCP |
| 2475 | Architecture for Differentiated Services | 1998 | DiffServ architecture |
| 2597 | Assured Forwarding PHB Group | 1999 | AF classes |
| 2697 | Single Rate Three Color Marker | 1999 | srTCM |
| 2698 | Two Rate Three Color Marker | 1999 | trTCM |
| 2983 | DiffServ and Tunnels | 2000 | DSCP in tunnels |
| 3246 | Expedited Forwarding PHB | 2002 | EF |
| 3260 | New Terminology and Clarifications for DiffServ | 2002 | DiffServ terms |
| 3270 | MPLS Support of DiffServ | 2002 | MPLS QoS |
| 4594 | Configuration Guidelines for DiffServ Service Classes | 2006 | QoS class recommendations |
| 5127 | Aggregation of DiffServ Service Classes | 2008 | Class aggregation |
| 5865 | A DiffServ Code Point for Capacity-Admitted Traffic | 2010 | Voice-Admit |
| 8325 | Mapping DiffServ to IEEE 802.11 | 2018 | WiFi QoS mapping |

## HTTP

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1945 | HTTP/1.0 | 1996 | HTTP/1.0 |
| 2068 | HTTP/1.1 | 1997 | Initial HTTP/1.1 |
| 2616 | HTTP/1.1 | 1999 | HTTP/1.1 (obsoleted by 723x) |
| 2617 | HTTP Authentication | 1999 | Basic, Digest auth |
| 2817 | HTTP Upgrade to TLS | 2000 | HTTP upgrade mechanism |
| 2818 | HTTP Over TLS | 2000 | HTTPS |
| 3986 | URI: Generic Syntax | 2005 | URI specification |
| 6265 | HTTP State Management Mechanism | 2011 | Cookies |
| 6585 | Additional HTTP Status Codes | 2012 | 428, 429, 431, 511 |
| 7230 | HTTP/1.1: Message Syntax and Routing | 2014 | HTTP/1.1 parsing |
| 7231 | HTTP/1.1: Semantics and Content | 2014 | Methods, status codes |
| 7232 | HTTP/1.1: Conditional Requests | 2014 | ETags, If-Match |
| 7233 | HTTP/1.1: Range Requests | 2014 | Partial content |
| 7234 | HTTP/1.1: Caching | 2014 | Cache-Control |
| 7235 | HTTP/1.1: Authentication | 2014 | Auth framework |
| 7540 | HTTP/2 | 2015 | HTTP/2 specification |
| 7541 | HPACK | 2015 | HTTP/2 header compression |
| 8164 | HTTP/2 Tunnel Proxying | 2017 | CONNECT in HTTP/2 |
| 8288 | Web Linking | 2017 | Link header |
| 8441 | Bootstrapping WebSockets with HTTP/2 | 2018 | WS over HTTP/2 |
| 8740 | Using TLS 1.3 with HTTP/2 | 2020 | TLS 1.3 + HTTP/2 |
| 9110 | HTTP Semantics | 2022 | Consolidated HTTP semantics |
| 9111 | HTTP Caching | 2022 | Updated caching |
| 9112 | HTTP/1.1 | 2022 | Updated HTTP/1.1 |
| 9113 | HTTP/2 | 2022 | Updated HTTP/2 |
| 9114 | HTTP/3 | 2022 | HTTP over QUIC |

## Network Management

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1157 | SNMP | 1990 | SNMPv1 |
| 1213 | MIB-II | 1991 | Management Information Base II |
| 1901 | Introduction to Community-based SNMPv2 | 1996 | SNMPv2c |
| 2578 | SMIv2 | 1999 | Structure of Management Information |
| 2579 | Textual Conventions for SMIv2 | 1999 | SMI textual conventions |
| 2580 | Conformance Statements for SMIv2 | 1999 | SMI conformance |
| 3164 | BSD Syslog Protocol | 2001 | Syslog |
| 3410 | Introduction to SNMPv3 | 2002 | SNMPv3 overview |
| 3411 | SNMP Architecture | 2002 | SNMPv3 architecture |
| 3412 | Message Processing/Dispatching for SNMP | 2002 | SNMPv3 messages |
| 3413 | SNMP Applications | 2002 | Manager/agent apps |
| 3414 | User-based Security Model for SNMPv3 | 2002 | USM |
| 3416 | Protocol Operations for SNMPv2 | 2002 | SNMP PDUs |
| 3418 | MIB for SNMP | 2002 | SNMP MIB |
| 5424 | The Syslog Protocol | 2009 | Updated syslog |
| 5425 | TLS Transport Mapping for Syslog | 2009 | Syslog over TLS |
| 5426 | Transmission of Syslog Messages over UDP | 2009 | Syslog/UDP |
| 7011 | Specification of IPFIX Protocol | 2013 | IP Flow Information Export |
| 7012 | IPFIX Information Model | 2013 | IPFIX data model |

## Automation

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 4741 | NETCONF Configuration Protocol | 2006 | Original NETCONF |
| 5277 | NETCONF Event Notifications | 2008 | NETCONF notifications |
| 6020 | YANG - A Data Modeling Language for NETCONF | 2010 | YANG 1.0 |
| 6241 | Network Configuration Protocol (NETCONF) | 2011 | Updated NETCONF |
| 6242 | Using NETCONF over SSH | 2011 | NETCONF/SSH |
| 6243 | With-defaults Capability for NETCONF | 2011 | Default values |
| 6470 | NETCONF Base Notifications | 2012 | Base event notifications |
| 6536 | NETCONF Access Control Model | 2012 | NACM |
| 7950 | YANG 1.1 | 2016 | Updated YANG |
| 7951 | JSON Encoding of YANG Data | 2016 | YANG/JSON |
| 8040 | RESTCONF Protocol | 2017 | REST-based NETCONF |
| 8072 | YANG Patch Media Type | 2017 | YANG patch operations |
| 8340 | YANG Tree Diagrams | 2018 | YANG visualization |
| 8341 | Network Configuration Access Control Model | 2018 | Updated NACM |
| 8342 | Network Management Datastore Architecture | 2018 | NMDA |
| 8343 | A YANG Data Model for Interface Management | 2018 | ietf-interfaces |
| 8407 | Guidelines for YANG Module Authors | 2018 | YANG best practices |
| 8528 | YANG Schema Mount | 2019 | Dynamic schema |
| 8641 | Subscription to YANG Notifications for Datastore Updates | 2019 | On-change notifications |
| 9144 | Comparison of NETCONF and RESTCONF | 2022 | Protocol comparison |

## Meta

| RFC | Title | Year | Notes |
|-----|-------|------|-------|
| 1 | Host Software | 1969 | The very first RFC |
| 2026 | The Internet Standards Process | 1996 | How standards are made |
| 2119 | Key Words for Use in RFCs | 1997 | MUST, SHALL, SHOULD, MAY |
| 2223 | Instructions to RFC Authors | 1997 | RFC formatting |
| 3552 | Guidelines for Writing RFC Text on Security | 2003 | Security considerations |
| 5000 | Internet Official Protocol Standards | 2008 | Standards summary |
| 5741 | RFC Streams, Headers, and Boilerplates | 2009 | RFC structure |
| 6648 | Deprecating the X- Prefix in Application Protocols | 2012 | No more X- headers |
| 7322 | RFC Style Guide | 2014 | Writing style |
| 7841 | RFC Streams, Headers, and Boilerplates | 2016 | Updated RFC structure |
| 7942 | Improving Awareness of Running Code | 2016 | Implementation status |
| 8174 | Ambiguity of Uppercase vs Lowercase in RFC 2119 | 2017 | Clarifies MUST/SHALL/etc. |
| 8700 | Fifty Years of RFCs | 2019 | RFC history |
| 8729 | The RFC Series and RFC Editor | 2020 | RFC process |
