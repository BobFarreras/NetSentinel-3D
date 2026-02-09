import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouterHacker } from '../useRouterHacker';
import { auditAdapter } from '../../../../adapters/auditAdapter';
import { DeviceDTO } from '../../../../shared/dtos/NetworkDTOs';

// 1. MOCK DE L'ADAPTADOR
vi.mock('../../../../adapters/auditAdapter', () => ({
  auditAdapter: {
    auditRouter: vi.fn(),
    fetchRouterDevices: vi.fn()
  }
}));

// Dades Mock
const mockExistingDevices: DeviceDTO[] = [
  { ip: '192.168.1.50', mac: 'AA:BB:CC', vendor: 'Generic', hostname: 'Unknown' }
];

describe('💀 Integration: useRouterHacker Hook', () => {
  // Spies (Espies) per veure si el hook crida a aquestes funcions
  const mockAddLog = vi.fn();
  const mockSetDevices = vi.fn(); // Això simularà el setState de React
  const mockSetActiveTarget = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('🛡️ Hauria de gestionar un Router SEGUR (No vulnerable)', async () => {
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
    // No hauria d'haver intentat buscar dispositius ni actualitzar la llista
    expect(auditAdapter.fetchRouterDevices).not.toHaveBeenCalled();
    expect(mockSetDevices).not.toHaveBeenCalled();
  });

  it('🔓 Hauria de FUSIONAR dades quan el router és VULNERABLE', async () => {
    // ARRANGE
    // 1. El router diu que sí
    (auditAdapter.auditRouter as any).mockResolvedValue({
      vulnerable: true,
      credentials_found: 'admin:1234',
      message: 'Success'
    });

    // 2. El router ens torna una llista amb més detalls del dispositiu .50
    (auditAdapter.fetchRouterDevices as any).mockResolvedValue([
      { 
        ip: '192.168.1.50', // Mateixa IP que teníem
        mac: 'ROUTER_AUTH', 
        vendor: 'Super Gaming PC', // 👈 Nom millorat!
        hostname: 'GAMING-RIG',     // 👈 Hostname millorat!
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
    
    // 🔥 EL TEST DE FOC: Comprovar la lògica de FUSIÓ
    // mockSetDevices es crida amb una funció callback (prev => ...).
    // Hem d'executar aquesta funció manualment per veure si fusiona bé.
    
    // 1. Recuperem la funció que el hook ha passat a setDevices
    const updateFunction = mockSetDevices.mock.calls[0][0]; 
    
    // 2. L'executem passant-li els dispositius antics
    const mergedDevices = updateFunction(mockExistingDevices);

    // 3. Verifiquem que s'han barrejat correctament
    expect(mergedDevices.length).toBe(1);
    expect(mergedDevices[0].ip).toBe('192.168.1.50');
    expect(mergedDevices[0].vendor).toBe('Super Gaming PC'); // Ha d'haver agafat el nom nou!
    expect(mergedDevices[0].hostname).toBe('GAMING-RIG');    // Ha d'haver agafat el hostname nou!
    expect(mergedDevices[0].mac).toBe('AA:BB:CC');           // Ha de MANTENIR la MAC original (l'escaneig ARP és més fiable per MACs)
  });
});