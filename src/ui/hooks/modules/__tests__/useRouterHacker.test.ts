// src/ui/hooks/modules/__tests__/useRouterHacker.test.ts
// Tests del gateway audit: valida casos router seguro y router vulnerable con merge de inventario enriquecido.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouterHacker } from '../network/useRouterHacker';
import { auditAdapter } from '../../../../adapters/auditAdapter';
import { DeviceDTO } from '../../../../shared/dtos/NetworkDTOs';

// 1. Mock del adaptador.
vi.mock('../../../../adapters/auditAdapter', () => ({
  auditAdapter: {
    auditRouter: vi.fn(),
    fetchRouterDevices: vi.fn()
  }
}));

vi.mock('../../../../adapters/networkAdapter', () => ({
  networkAdapter: {
    saveGatewayCredentials: vi.fn(async () => undefined),
    saveLatestSnapshot: vi.fn(async () => undefined),
  },
}));

// Datos mock.
const mockExistingDevices: DeviceDTO[] = [
  { ip: '192.168.1.50', mac: 'AA:BB:CC', vendor: 'Generic', hostname: 'Unknown' }
];

describe('💀 Integration: useRouterHacker Hook', () => {
  // Spies para verificar invocaciones.
  const mockAddLog = vi.fn();
  const mockSetDevices = vi.fn(); // Simula el setState de React.
  const mockSetActiveTarget = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('🛡️ Debe gestionar un router seguro (no vulnerable)', async () => {
    // ARRANGE
    (auditAdapter.auditRouter as any).mockResolvedValue({
      vulnerable: false,
      message: 'Login Failed'
    });

    const { result } = renderHook(() => 
      useRouterHacker(mockAddLog, mockSetDevices, mockSetActiveTarget)
    );

    // ACT
    await act(async () => {
      await result.current.checkRouterSecurity('192.168.1.1');
    });

    // ASSERT
    expect(auditAdapter.auditRouter).toHaveBeenCalledWith('192.168.1.1');
    expect(mockAddLog).toHaveBeenCalledWith('192.168.1.1', expect.stringContaining('RESULT: Login Failed'));
    // No debe intentar fetch de dispositivos ni actualizar la lista.
    expect(auditAdapter.fetchRouterDevices).not.toHaveBeenCalled();
    expect(mockSetDevices).not.toHaveBeenCalled();
  });

  it('🔓 Debe fusionar datos cuando el router es vulnerable', async () => {
    // ARRANGE
    // 1. El router indica que es vulnerable.
    (auditAdapter.auditRouter as any).mockResolvedValue({
      vulnerable: true,
      credentials_found: 'admin:1234',
      message: 'Success'
    });

    // 2. El router devuelve una lista con mas detalles del dispositivo .50.
    (auditAdapter.fetchRouterDevices as any).mockResolvedValue([
      { 
        ip: '192.168.1.50', // Misma IP que ya teniamos.
        mac: 'ROUTER_AUTH', 
        vendor: 'Super Gaming PC', // Nombre mejorado.
        hostname: 'GAMING-RIG',     // Hostname mejorado.
        signal_strength: '-40'
      }
    ]);

    const { result } = renderHook(() => 
      useRouterHacker(mockAddLog, mockSetDevices, mockSetActiveTarget)
    );

    // ACT
    await act(async () => {
      await result.current.checkRouterSecurity('192.168.1.1');
    });

    // ASSERT
    expect(mockAddLog).toHaveBeenCalledWith('192.168.1.1', expect.stringContaining('PASSWORD FOUND'));
    
    // Test de fuego: comprobar la logica de fusion.
    // mockSetDevices se llama con una funcion callback (prev => ...).
    // Ejecutamos esa funcion manualmente para validar el merge.
    
    // 1. Recuperamos la funcion que el hook ha pasado a setDevices.
    const updateFunction = mockSetDevices.mock.calls[0][0]; 
    
    // 2. La ejecutamos pasando el inventario previo.
    const mergedDevices = updateFunction(mockExistingDevices);

    // 3. Verificamos el merge resultante.
    expect(mergedDevices.length).toBe(1);
    expect(mergedDevices[0].ip).toBe('192.168.1.50');
    expect(mergedDevices[0].vendor).toBe('Super Gaming PC'); // Debe tomar el vendor nuevo.
    expect(mergedDevices[0].hostname).toBe('GAMING-RIG');    // Debe tomar el hostname nuevo.
    expect(mergedDevices[0].mac).toBe('AA:BB:CC');           // Debe mantener la MAC original (ARP suele ser mas fiable).
  });
});
