import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditAdapter } from '../auditAdapter';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

describe('auditAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe devolver openPorts al auditar puertos', async () => {
    invokeMock.mockResolvedValue({
      targetIp: '192.168.1.50',
      openPorts: [{ port: 22, status: 'Open', service: 'SSH', riskLevel: 'SAFE' }],
      riskLevel: 'LOW',
      vulnerabilities: [],
    });

    const ports = await auditAdapter.auditTargetPorts('192.168.1.50');

    expect(invokeMock).toHaveBeenCalledWith('audit_target', { ip: '192.168.1.50' });
    expect(ports).toHaveLength(1);
    expect(ports[0].port).toBe(22);
  });

  it('debe devolver array vacio si openPorts no existe', async () => {
    invokeMock.mockResolvedValue({
      targetIp: '192.168.1.50',
      riskLevel: 'LOW',
      vulnerabilities: [],
    });

    const ports = await auditAdapter.auditTargetPorts('192.168.1.50');

    expect(ports).toEqual([]);
  });

  it('debe invocar audit_router con gatewayIp', async () => {
    invokeMock.mockResolvedValue({ vulnerable: false, message: 'ok' });

    await auditAdapter.auditRouter('192.168.1.1');

    expect(invokeMock).toHaveBeenCalledWith('audit_router', { gatewayIp: '192.168.1.1' });
  });

  it('debe invocar fetch_router_devices con credenciales', async () => {
    invokeMock.mockResolvedValue([]);

    await auditAdapter.fetchRouterDevices('192.168.1.1', 'admin', '1234');

    expect(invokeMock).toHaveBeenCalledWith('fetch_router_devices', {
      gatewayIp: '192.168.1.1',
      user: 'admin',
      pass: '1234',
    });
  });
});
