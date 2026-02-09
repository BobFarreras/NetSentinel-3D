import { beforeEach, describe, expect, it, vi } from 'vitest';
import { networkAdapter } from '../networkAdapter';

const { invokeCommandMock } = vi.hoisted(() => ({
  invokeCommandMock: vi.fn(),
}));

vi.mock('../../shared/tauri/bridge', () => ({
  invokeCommand: invokeCommandMock,
}));

describe('networkAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar scan_network con el rango por defecto', async () => {
    invokeCommandMock.mockResolvedValue([]);

    await networkAdapter.scanNetwork();

    expect(invokeCommandMock).toHaveBeenCalledWith('scan_network', { range: '192.168.1.0/24' });
  });

  it('debe invocar scan_network con un rango personalizado', async () => {
    invokeCommandMock.mockResolvedValue([]);

    await networkAdapter.scanNetwork('10.0.0.0/24');

    expect(invokeCommandMock).toHaveBeenCalledWith('scan_network', { range: '10.0.0.0/24' });
  });

  it('debe invocar save_scan con la lista de dispositivos', async () => {
    const devices = [{ ip: '192.168.1.10', mac: 'AA:BB', vendor: 'Test' }];
    invokeCommandMock.mockResolvedValue(undefined);

    await networkAdapter.saveScan(devices as any);

    expect(invokeCommandMock).toHaveBeenCalledWith('save_scan', { devices });
  });

  it('debe invocar get_history sin payload', async () => {
    invokeCommandMock.mockResolvedValue([]);

    await networkAdapter.getHistory();

    expect(invokeCommandMock).toHaveBeenCalledWith('get_history');
  });

  it('debe invocar get_identity sin payload', async () => {
    invokeCommandMock.mockResolvedValue({
      ip: '192.168.1.20',
      mac: 'AA:BB:CC',
      netmask: '255.255.255.0',
      gatewayIp: '192.168.1.1',
      interfaceName: 'Wi-Fi',
      dnsServers: ['1.1.1.1'],
    });

    await networkAdapter.getHostIdentity();

    expect(invokeCommandMock).toHaveBeenCalledWith('get_identity');
  });
});
