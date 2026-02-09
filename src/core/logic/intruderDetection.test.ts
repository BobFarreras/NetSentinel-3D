import { describe, it, expect } from 'vitest';
import { detectIntruders } from './intruderDetection';
import { DeviceDTO, ScanSession } from '../../shared/dtos/NetworkDTOs';

// --- HELPER PER CREAR DADES FALSES RÀPIDAMENT ---
const mockDevice = (ip: string, name: string): DeviceDTO => ({
  ip,
  mac: `00:00:00:00:00:${ip.split('.')[3]}`,
  vendor: name,
  hostname: name,
  name,
  isGateway: false
});

describe('🧠 Logic: Intruder Detection', () => {

  it('🟢 Hauria de retornar buit si no hi ha historial previ', () => {
    const currentDevices = [mockDevice('192.168.1.50', 'MyPC')];
    const history: ScanSession[] = []; // Historial buit

    const intruders = detectIntruders(currentDevices, history);
    
    expect(intruders).toEqual([]); 
    // Lògica: La primera vegada no volem espantar l'usuari marcant-ho tot com a intrús.
  });

  it('🚨 Hauria de detectar una IP nova com a intrús', () => {
    // 1. Historial: Tenim el PC i el Router
    const history: ScanSession[] = [{
      id: 'session_1',
      timestamp: 1000,
      label: 'Old Scan',
      devices: [
        mockDevice('192.168.1.1', 'Router'),
        mockDevice('192.168.1.50', 'MyPC')
      ]
    }];

    // 2. Escaneig Actual: Apareix un HACKER (.66)
    const currentScan = [
      mockDevice('192.168.1.1', 'Router'),
      mockDevice('192.168.1.50', 'MyPC'),
      mockDevice('192.168.1.66', 'Unknown Device') // 👈 EL NOU
    ];

    const intruders = detectIntruders(currentScan, history);

    expect(intruders).toContain('192.168.1.66');
    expect(intruders.length).toBe(1);
  });

  it('🟢 No hauria de marcar dispositius coneguts com a intrusos', () => {
    // Tot igual que abans
    const history: ScanSession[] = [{
      id: 'session_1',
      timestamp: 1000,
      label: 'Old Scan',
      devices: [mockDevice('192.168.1.50', 'MyPC')]
    }];

    const currentScan = [mockDevice('192.168.1.50', 'MyPC')];

    const intruders = detectIntruders(currentScan, history);
    expect(intruders).toEqual([]);
  });

  it('🛡️ Hauria de gestionar múltiples intrusos alhora', () => {
    const history: ScanSession[] = [{
        id: '1', timestamp: 0, label: '', 
        devices: [mockDevice('192.168.1.1', 'Router')]
    }];

    const current = [
        mockDevice('192.168.1.1', 'Router'),
        mockDevice('192.168.1.100', 'Hacker1'),
        mockDevice('192.168.1.101', 'Hacker2')
    ];

    const intruders = detectIntruders(current, history);
    expect(intruders).toEqual(['192.168.1.100', '192.168.1.101']);
  });
});