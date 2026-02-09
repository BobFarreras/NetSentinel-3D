import { beforeEach, describe, expect, it, vi } from 'vitest';
import { networkAdapter } from '../networkAdapter';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

describe('networkAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar scan_network con el rango por defecto', async () => {
    invokeMock.mockResolvedValue([]);

    await networkAdapter.scanNetwork();

    expect(invokeMock).toHaveBeenCalledWith('scan_network', { range: '192.168.1.0/24' });
  });

  it('debe invocar scan_network con un rango personalizado', async () => {
    invokeMock.mockResolvedValue([]);

    await networkAdapter.scanNetwork('10.0.0.0/24');

    expect(invokeMock).toHaveBeenCalledWith('scan_network', { range: '10.0.0.0/24' });
  });

  it('debe invocar save_scan con la lista de dispositivos', async () => {
    const devices = [{ ip: '192.168.1.10', mac: 'AA:BB', vendor: 'Test' }];
    invokeMock.mockResolvedValue(undefined);

    await networkAdapter.saveScan(devices as any);

    expect(invokeMock).toHaveBeenCalledWith('save_scan', { devices });
  });

  it('debe invocar get_history sin payload', async () => {
    invokeMock.mockResolvedValue([]);

    await networkAdapter.getHistory();

    expect(invokeMock).toHaveBeenCalledWith('get_history');
  });

  it('debe invocar get_identity sin payload', async () => {
    invokeMock.mockResolvedValue({
      ip: '192.168.1.20',
      mac: 'AA:BB:CC',
      netmask: '255.255.255.0',
      gatewayIp: '192.168.1.1',
      interfaceName: 'Wi-Fi',
      dnsServers: ['1.1.1.1'],
    });

    await networkAdapter.getHostIdentity();

    expect(invokeMock).toHaveBeenCalledWith('get_identity');
  });
});
