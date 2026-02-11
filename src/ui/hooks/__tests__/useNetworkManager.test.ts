import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useNetworkManager } from '../useNetworkManager';

const { getHostIdentityMock } = vi.hoisted(() => ({
  getHostIdentityMock: vi.fn(),
}));

const addLogMock = vi.fn();
const clearLogsMock = vi.fn();
const setActiveTargetMock = vi.fn();
const setDevicesMock = vi.fn();
const startScanMock = vi.fn();
const loadSessionMock = vi.fn();
const startAuditMock = vi.fn();
const clearResultsMock = vi.fn();
const setRouterRiskMock = vi.fn();
const checkRouterSecurityMock = vi.fn();
const toggleJammerMock = vi.fn();

vi.mock('../../../adapters/networkAdapter', () => ({
  networkAdapter: {
    getHostIdentity: getHostIdentityMock,
    getGatewayCredentials: vi.fn(async () => null),
    saveLatestSnapshot: vi.fn(async () => undefined),
  },
}));

vi.mock('../../../adapters/auditAdapter', () => ({
  auditAdapter: {
    fetchRouterDevices: vi.fn(async () => []),
  },
}));

vi.mock('../modules/useSocketLogs', () => ({
  useSocketLogs: () => ({
    deviceLogs: {
      '192.168.1.10': ['L1', 'L2'],
    },
    systemLogs: [],
    addLog: addLogMock,
    addSystemLog: vi.fn(),
    clearLogs: clearLogsMock,
    clearSystemLogs: vi.fn(),
    setActiveTarget: setActiveTargetMock,
  }),
}));

vi.mock('../modules/useScanner', () => ({
  useScanner: () => ({
    devices: [
      { ip: '192.168.1.10', mac: 'AA', vendor: 'Laptop' },
      { ip: '192.168.1.20', mac: 'BB', vendor: 'Phone' },
    ],
    setDevices: setDevicesMock,
    history: [],
    intruders: [],
    scanning: false,
    startScan: startScanMock,
    loadSession: loadSessionMock,
  }),
}));

vi.mock('../modules/usePortAuditor', () => ({
  usePortAuditor: () => ({
    auditing: false,
    auditResults: [],
    startAudit: startAuditMock,
    clearResults: clearResultsMock,
  }),
}));

vi.mock('../modules/useRouterHacker', () => ({
  useRouterHacker: () => ({
    routerRisk: null,
    setRouterRisk: setRouterRiskMock,
    checkRouterSecurity: checkRouterSecurityMock,
  }),
}));

vi.mock('../modules/useJamming', () => ({
  useJamming: () => ({
    jammedDevices: [],
    toggleJammer: toggleJammerMock,
  }),
}));

describe('useNetworkManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('netsentinel:autoScanOnStartup', 'false');
    getHostIdentityMock.mockResolvedValue({
      ip: '192.168.1.200',
      mac: 'AA:BB:CC',
      netmask: '255.255.255.0',
      gatewayIp: '192.168.1.1',
      interfaceName: 'Wi-Fi',
      dnsServers: ['1.1.1.1'],
    });
  });

  it('debe cargar la identidad al iniciar', async () => {
    const { result } = renderHook(() => useNetworkManager());

    await waitFor(() => {
      expect(result.current.identity?.ip).toBe('192.168.1.200');
    });
  });

  it('debe limpiar resultados al cambiar de dispositivo y no limpiar si es el mismo', async () => {
    const { result } = renderHook(() => useNetworkManager());

    await waitFor(() => {
      expect(getHostIdentityMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.selectDevice({ ip: '192.168.1.10', mac: 'AA', vendor: 'Laptop' } as any);
    });
    expect(clearResultsMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.selectDevice({ ip: '192.168.1.10', mac: 'AA', vendor: 'Laptop' } as any);
    });
    expect(clearResultsMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.selectDevice({ ip: '192.168.1.20', mac: 'BB', vendor: 'Phone' } as any);
    });
    expect(clearResultsMock).toHaveBeenCalledTimes(2);
  });

  it('debe delegar clearLogs sobre el dispositivo seleccionado', async () => {
    const { result } = renderHook(() => useNetworkManager());

    await waitFor(() => {
      expect(getHostIdentityMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.selectDevice({ ip: '192.168.1.10', mac: 'AA', vendor: 'Laptop' } as any);
    });

    act(() => {
      result.current.clearLogs();
    });

    expect(clearLogsMock).toHaveBeenCalledWith('192.168.1.10');
    expect(result.current.consoleLogs).toEqual(['L1', 'L2']);
  });
});
