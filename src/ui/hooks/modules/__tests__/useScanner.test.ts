import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScanner } from '../useScanner';
import { networkAdapter } from '../../../../adapters/networkAdapter';
import { DeviceDTO } from '../../../../shared/dtos/NetworkDTOs';

// 1. Mock del adaptador (simulamos el backend).
vi.mock('../../../../adapters/networkAdapter', () => ({
  networkAdapter: {
    scanNetwork: vi.fn(),
    saveScan: vi.fn(),
    getHistory: vi.fn(),
    loadLatestSnapshot: vi.fn(),
    saveLatestSnapshot: vi.fn(),
  }
}));

// Datos de prueba
const mockDevices: DeviceDTO[] = [
  { ip: '192.168.1.1', mac: 'AA:BB:CC', vendor: 'Router', isGateway: true },
  { ip: '192.168.1.50', mac: '11:22:33', vendor: 'MyPC' }
];

describe('🔌 Integracion: useScanner Hook', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('🟢 Debe iniciar con estado vacio', async () => {
    // Simulamos historial vacio al inicio
    (networkAdapter.loadLatestSnapshot as any).mockResolvedValue(null);
    (networkAdapter.getHistory as any).mockResolvedValue([]);

    const { result } = renderHook(() => useScanner());
    
    // Esperamos a que el efecto inicial termine para evitar updates fuera de `act`
    await waitFor(() => {
      expect(networkAdapter.getHistory).toHaveBeenCalledTimes(1);
    });

    expect(result.current.devices).toEqual([]);
    expect(result.current.scanning).toBe(false);
  });

  it('🚀 Debe ejecutar un scan y actualizar estado', async () => {
    // Arrange (preparamos respuestas)
    (networkAdapter.loadLatestSnapshot as any).mockResolvedValue(null);
    (networkAdapter.scanNetwork as any).mockResolvedValue(mockDevices);
    (networkAdapter.saveLatestSnapshot as any).mockResolvedValue(undefined);
    (networkAdapter.saveScan as any).mockResolvedValue(undefined);
    (networkAdapter.getHistory as any).mockResolvedValue([]);

    const { result } = renderHook(() => useScanner());

    // Act
    await act(async () => {
      await result.current.startScan();
    });

    // Assert
    expect(networkAdapter.scanNetwork).toHaveBeenCalledWith('192.168.1.0/24');
    expect(networkAdapter.saveLatestSnapshot).toHaveBeenCalledTimes(1);
    
    expect(result.current.devices).toEqual(mockDevices);
    
    expect(result.current.scanning).toBe(false);
  });

  it('🚨 Debe detectar un intruso real durante el scan', async () => {
    // 1. Preparamos historial previo (Router + PC)
    (networkAdapter.loadLatestSnapshot as any).mockResolvedValue(null);
    (networkAdapter.getHistory as any).mockResolvedValue([{
      id: 'session_1', timestamp: 1000, label: 'Old', 
      devices: mockDevices // 2 conocidos
    }]);

    const { result } = renderHook(() => useScanner());

    // Esperamos a que cargue el historial
    await waitFor(() => {
      expect(result.current.history.length).toBe(1);
    });

    // 2. Preparamos un scan nuevo con un intruso
    const newScan = [
      ...mockDevices,
      { ip: '192.168.1.99', mac: 'FF:FF:FF', vendor: 'EVIL_HACKER' }
    ];
    (networkAdapter.scanNetwork as any).mockResolvedValue(newScan);
    (networkAdapter.saveLatestSnapshot as any).mockResolvedValue(undefined);

    // ACT
    await act(async () => {
      await result.current.startScan();
    });

    // ASSERT
    expect(result.current.devices.length).toBe(3);
    expect(result.current.intruders).toContain('192.168.1.99');
  });

  it('🧩 No debe reducir el inventario si el scan devuelve menos dispositivos', async () => {
    (networkAdapter.loadLatestSnapshot as any).mockResolvedValue(null);
    (networkAdapter.getHistory as any).mockResolvedValue([]);
    (networkAdapter.saveLatestSnapshot as any).mockResolvedValue(undefined);
    (networkAdapter.saveScan as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useScanner());

    // Inventario previo (ej: enriquecido por audit_router) con 5 dispositivos.
    const prev: DeviceDTO[] = [
      { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01', vendor: 'Router', isGateway: true },
      { ip: '192.168.1.130', mac: 'AA:AA:AA:AA:AA:01', vendor: 'Xiaomi', name: 'Redmi-15' },
      { ip: '192.168.1.131', mac: 'BB:BB:BB:BB:BB:01', vendor: 'Microsoft', name: 'DESKTOP' },
      { ip: '192.168.1.136', mac: 'CC:CC:CC:CC:CC:01', vendor: 'Tuya', name: 'T20' },
      { ip: '192.168.1.139', mac: 'DD:DD:DD:DD:DD:01', vendor: 'Generic', name: 'M2004J19C' },
    ];

    await act(async () => {
      result.current.setDevices(prev);
    });

    // Scan devuelve solo 3 (por ejemplo, ARP ve menos en ese momento).
    const scan: DeviceDTO[] = [
      { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01', vendor: 'Router', isGateway: true },
      { ip: '192.168.1.130', mac: 'AA:AA:AA:AA:AA:01', vendor: 'Xiaomi', name: 'Redmi-15' },
      { ip: '192.168.1.131', mac: 'BB:BB:BB:BB:BB:01', vendor: 'Microsoft', name: 'DESKTOP' },
    ];
    (networkAdapter.scanNetwork as any).mockResolvedValue(scan);

    await act(async () => {
      await result.current.startScan();
    });

    expect(result.current.devices.length).toBe(5);
    expect(result.current.devices.map((d) => d.ip)).toEqual(prev.map((d) => d.ip));
  });
});
