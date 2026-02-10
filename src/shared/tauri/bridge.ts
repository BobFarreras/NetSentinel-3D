import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';
import type { DeviceDTO, TrafficPacket, WifiNetworkDTO } from '../dtos/NetworkDTOs';

type EventEnvelope<T> = { payload: T };
type EventCallback<T> = (event: EventEnvelope<T>) => void;
export type UnlistenFn = () => void;

const isE2EMock = import.meta.env.VITE_E2E_MOCK_TAURI === 'true';
type E2EScenarioFlags = {
  failScan?: boolean;
  failTrafficStart?: boolean;
  failAuditRouter?: boolean;
};

const getScenarioFlags = (): E2EScenarioFlags => {
  const scopedWindow = window as Window & { __E2E_SCENARIO__?: E2EScenarioFlags };
  return scopedWindow.__E2E_SCENARIO__ || {};
};

const listeners = new Map<string, Set<EventCallback<unknown>>>();
let trafficTimer: ReturnType<typeof setInterval> | null = null;
let packetId = 0;

const mockScanDevices: DeviceDTO[] = [
  { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01', vendor: 'Router', isGateway: true, hostname: 'gateway' },
  { ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:10', vendor: 'Workstation', hostname: 'DEV-WS' },
  { ip: '192.168.1.21', mac: 'AA:BB:CC:DD:EE:21', vendor: 'Phone', hostname: 'Unknown' },
];

const mockAirwaves: WifiNetworkDTO[] = [
  {
    bssid: 'B8:27:EB:AA:BB:CC',
    ssid: 'LAB_WIFI_01',
    channel: 6,
    signalLevel: -48,
    securityType: 'WPA2-PSK',
    vendor: 'Raspberry Pi',
    distanceMock: 28,
    riskLevel: 'STANDARD',
    isTargetable: false,
    isConnected: true,
  },
  {
    bssid: 'AA:BB:CC:DD:EE:01',
    ssid: '<hidden>',
    channel: 1,
    signalLevel: -62,
    securityType: 'OPEN',
    vendor: 'Generic Device',
    distanceMock: 42,
    riskLevel: 'OPEN',
    isTargetable: true,
    isConnected: false,
  },
  {
    bssid: '04:D9:F5:11:22:33',
    ssid: 'CAMPUS_SECURE',
    channel: 36,
    signalLevel: -55,
    securityType: 'WPA3',
    vendor: 'Asus Network',
    distanceMock: 35,
    riskLevel: 'HARDENED',
    isTargetable: false,
    isConnected: false,
  },
];

type MockSession = {
  id: string;
  timestamp: number;
  label: string;
  devices: DeviceDTO[];
};

let mockHistory: MockSession[] = [
  {
    id: 'session_bootstrap',
    timestamp: Date.now() - 60_000,
    label: 'Snapshot inicial E2E',
    devices: [
      { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01', vendor: 'Router', isGateway: true, hostname: 'gateway' },
      { ip: '192.168.1.99', mac: 'AA:BB:CC:DD:EE:99', vendor: 'LegacyHost', hostname: 'LAB-OLD' },
    ],
  },
];

const emit = <T>(eventName: string, payload: T) => {
  const eventListeners = listeners.get(eventName);
  if (!eventListeners) return;
  const envelope: EventEnvelope<T> = { payload };
  eventListeners.forEach((callback) => callback(envelope as EventEnvelope<unknown>));
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const startMockTraffic = () => {
  if (trafficTimer) return;
  trafficTimer = setInterval(() => {
    packetId += 1;
    const packet: TrafficPacket = {
      id: packetId,
      timestamp: Date.now(),
      sourceIp: packetId % 2 === 0 ? '192.168.1.10' : '192.168.1.21',
      destinationIp: packetId % 2 === 0 ? '8.8.8.8' : '192.168.1.1',
      protocol: packetId % 2 === 0 ? 'TCP' : 'UDP',
      length: packetId % 2 === 0 ? 120 : 60,
      info: packetId % 2 === 0 ? 'HTTPS Traffic' : 'DNS Query',
      isIntercepted: packetId % 5 === 0,
    };
    emit('traffic-event', packet);
  }, 250);
};

const stopMockTraffic = () => {
  if (!trafficTimer) return;
  clearInterval(trafficTimer);
  trafficTimer = null;
};

const invokeMock = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
  const scenario = getScenarioFlags();
  switch (command) {
    case 'scan_network':
      if (scenario.failScan) throw new Error('E2E mock: fallo forzado en scan_network');
      return clone(mockScanDevices) as T;
    case 'scan_airwaves':
      return clone(mockAirwaves) as T;
    case 'save_scan': {
      const devices = (args?.devices as DeviceDTO[]) || [];
      const session = {
        id: `session_${Date.now()}`,
        timestamp: Date.now(),
        label: `Scan (Items: ${devices.length})`,
        devices,
      };
      mockHistory = [session, ...mockHistory].slice(0, 50);
      return undefined as T;
    }
    case 'get_history':
      return clone(mockHistory) as T;
    case 'get_identity':
      return {
        ip: '192.168.1.200',
        mac: 'AA:AA:AA:AA:AA:AA',
        netmask: '255.255.255.0',
        gatewayIp: '192.168.1.1',
        interfaceName: 'Wi-Fi',
        dnsServers: ['1.1.1.1', '8.8.8.8'],
      } as T;
    case 'audit_target': {
      const targetIp = (args?.ip as string) || '192.168.1.10';
      return {
        targetIp,
        openPorts: [
          { port: 22, status: 'Open', service: 'SSH', riskLevel: 'SAFE', description: 'Secure Shell' },
          { port: 80, status: 'Open', service: 'HTTP', riskLevel: 'POTENTIAL', description: 'Web service' },
        ],
        riskLevel: 'LOW',
        vulnerabilities: [],
      } as T;
    }
    case 'audit_router':
      if (scenario.failAuditRouter) throw new Error('E2E mock: fallo forzado en audit_router');
      return {
        vulnerable: true,
        credentials_found: 'admin:1234',
        message: 'Default credentials detected',
      } as T;
    case 'fetch_router_devices':
      return [
        {
          ip: '192.168.1.10',
          mac: 'AA:BB:CC:DD:EE:10',
          vendor: 'Workstation Pro',
          hostname: 'DEV-WS',
          signal_strength: -45,
          signal_rate: 866,
          wifi_band: '5GHz',
        },
      ] as T;
    case 'start_traffic_sniffing':
      if (scenario.failTrafficStart) throw new Error('E2E mock: fallo forzado en start_traffic_sniffing');
      startMockTraffic();
      return undefined as T;
    case 'stop_traffic_sniffing':
      stopMockTraffic();
      return undefined as T;
    case 'start_jamming':
      emit('audit-log', `E2E MOCK: Jammer activo en ${(args?.ip as string) || 'unknown'}`);
      return undefined as T;
    case 'stop_jamming':
      emit('audit-log', `E2E MOCK: Jammer detenido en ${(args?.ip as string) || 'unknown'}`);
      return undefined as T;
    default:
      throw new Error(`E2E mock: comando no soportado (${command})`);
  }
};

export const invokeCommand = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
  if (isE2EMock) return invokeMock<T>(command, args);
  return tauriInvoke<T>(command, args);
};

export const listenEvent = async <T>(
  eventName: string,
  callback: EventCallback<T>
): Promise<UnlistenFn> => {
  if (!isE2EMock) return tauriListen<T>(eventName, callback);

  const current = listeners.get(eventName) || new Set<EventCallback<unknown>>();
  current.add(callback as EventCallback<unknown>);
  listeners.set(eventName, current);

  return () => {
    const bucket = listeners.get(eventName);
    if (!bucket) return;
    bucket.delete(callback as EventCallback<unknown>);
    if (bucket.size === 0) listeners.delete(eventName);
  };
};
