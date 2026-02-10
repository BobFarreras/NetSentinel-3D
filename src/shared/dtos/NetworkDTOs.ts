// --- DTOs COMPARTITS (FRONTEND <-> BACKEND) ---

// 1. Definició de la Vulnerabilitat (Intel·ligència)
export interface VulnerabilityDTO {
  id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

// 2. Definició d'un Port Obert
export interface OpenPortDTO {
  port: number;
  status: string; // 👈 AQUESTA ÉS LA QUE FALTAVA (Error 2)
  service: string; // 'http', 'ssh', 'unknown'
  riskLevel: 'SAFE' | 'POTENTIAL' | 'DANGER'; 
  description?: string;
  version?: string;
  
  // Camp opcional per si trobem info de seguretat
  vulnerability?: VulnerabilityDTO; 
}

// 3. Report Final d'Auditoria
export interface SecurityReportDTO {
  targetIp: string;
  openPorts: OpenPortDTO[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerabilities: string[]; // Resum de text per llistats ràpids
}

// 4. Progrés en temps real (Console Logs)
export interface AuditProgressDTO {
  // 👇 AFEGIT 'WARNING' PER SOLUCIONAR L'ERROR 1
  type: 'ERROR' | 'INFO' | 'FOUND' | 'WARNING'; 
  message: string;
  port?: number;
}

// 5. Dispositiu bàsic (Escaneig ARP)
export interface DeviceDTO {
  ip: string;
  mac: string;
  vendor: string;
  name?: string;
  isGateway?: boolean; // Per pintar el sol al centre
  ping?: number; 
  hostname?: string; 
  signal_strength?: number; 
  signal_rate?: number; 
  wifi_band?: string; 
}

export interface RouterAuditResult {
  vulnerable: boolean;
  credentials_found?: string;
  message: string;
}


export interface ScanSession {
  id: string;
  timestamp: number;
  devices: DeviceDTO[];
  label: string;
}

export interface HostIdentity {
  ip: string;
  mac: string;
  netmask: string;
  gatewayIp: string;
  interfaceName: string;
  dnsServers: string[];
}

export interface LatestSnapshotDTO {
  timestamp: number;
  devices: DeviceDTO[];
}

export interface GatewayCredentialsDTO {
  gatewayIp: string;
  user: string;
  pass: string;
  savedAt: number;
}

export interface TrafficPacket {
  id: number;
  timestamp: number;
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  length: number;
  info: string;
  isIntercepted: boolean;
}

// 6. WiFi Radar View (scan_airwaves)
export interface WifiNetworkDTO {
  bssid: string;
  ssid: string;
  channel?: number;
  signalLevel: number;
  securityType: string;
  vendor: string;
  distanceMock: number;
  riskLevel: 'HARDENED' | 'STANDARD' | 'LEGACY' | 'OPEN' | (string & {});
  isTargetable: boolean;
  isConnected: boolean;
}

// 7. External Audit (Wrapper CLI)
export interface ExternalAuditEnvVarDTO {
  key: string;
  value: string;
}

export interface ExternalAuditRequestDTO {
  binaryPath: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
  env?: ExternalAuditEnvVarDTO[];
}

export interface ExternalAuditLogEvent {
  auditId: string;
  stream: 'stdout' | 'stderr';
  line: string;
}

export interface ExternalAuditExitEvent {
  auditId: string;
  success: boolean;
  exitCode?: number;
  durationMs: number;
  error?: string;
}
