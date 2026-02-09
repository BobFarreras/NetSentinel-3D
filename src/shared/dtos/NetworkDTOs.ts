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