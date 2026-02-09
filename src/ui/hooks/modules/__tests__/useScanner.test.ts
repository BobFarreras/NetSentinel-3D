import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScanner } from '../useScanner';
import { networkAdapter } from '../../../../adapters/networkAdapter';
import { DeviceDTO } from '../../../../shared/dtos/NetworkDTOs';

// 1. MOCK DE L'ADAPTADOR (Enganyem al Hook)
vi.mock('../../../../adapters/networkAdapter', () => ({
  networkAdapter: {
    scanNetwork: vi.fn(),
    saveScan: vi.fn(),
    getHistory: vi.fn()
  }
}));

// Dades de prova
const mockDevices: DeviceDTO[] = [
  { ip: '192.168.1.1', mac: 'AA:BB:CC', vendor: 'Router', isGateway: true },
  { ip: '192.168.1.50', mac: '11:22:33', vendor: 'MyPC' }
];

describe('🔌 Integration: useScanner Hook', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('🟢 Hauria d\'iniciar amb l\'estat buit', () => {
    // Simulem que l'historial està buit al principi
    (networkAdapter.getHistory as any).mockResolvedValue([]);

    const { result } = renderHook(() => useScanner());

    expect(result.current.devices).toEqual([]);
    expect(result.current.scanning).toBe(false);
  });

  it('🚀 Hauria de fer un escaneig complet i actualitzar l\'estat', async () => {
    // ARRANGE (Preparem les respostes falses)
    (networkAdapter.scanNetwork as any).mockResolvedValue(mockDevices);
    (networkAdapter.saveScan as any).mockResolvedValue(undefined);
    (networkAdapter.getHistory as any).mockResolvedValue([]); // Historial buit per forçar intrusos

    const { result } = renderHook(() => useScanner());

    // ACT (Executem l'acció dins de 'act' perquè React processi els estats)
    await act(async () => {
      await result.current.startScan();
    });

    // ASSERT (Verifiquem)
    
    // 1. S'ha cridat a l'adaptador?
    expect(networkAdapter.scanNetwork).toHaveBeenCalledWith('192.168.1.0/24');
    
    // 2. S'ha actualitzat l'estat de dispositius?
    expect(result.current.devices).toEqual(mockDevices);
    
    // 3. Com que l'historial era buit, tots haurien de ser intrusos?
    // (O cap, depenent de la teva lògica de "primer escaneig no espanta").
    // En aquest cas, verifiquem simplement que l'estat ha canviat.
    expect(result.current.scanning).toBe(false);
  });

  it('🚨 Hauria de detectar un intrús real durant l\'escaneig', async () => {
    // 1. Preparem un historial previ (Router + PC)
    (networkAdapter.getHistory as any).mockResolvedValue([{
      id: 'session_1', timestamp: 1000, label: 'Old', 
      devices: mockDevices // Els 2 coneguts
    }]);

    const { result } = renderHook(() => useScanner());

    // Esperem que carregui l'historial inicial
    await waitFor(() => {
      expect(result.current.history.length).toBe(1);
    });

    // 2. Preparem l'escaneig NOU amb un INTRÚS
    const newScan = [
      ...mockDevices,
      { ip: '192.168.1.99', mac: 'FF:FF:FF', vendor: 'EVIL_HACKER' }
    ];
    (networkAdapter.scanNetwork as any).mockResolvedValue(newScan);

    // ACT
    await act(async () => {
      await result.current.startScan();
    });

    // ASSERT
    expect(result.current.devices.length).toBe(3);
    // Verifiquem que la lògica d'intrusos s'ha integrat bé amb el hook
    expect(result.current.intruders).toContain('192.168.1.99');
  });
});