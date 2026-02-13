// src/ui/features/traffic/__tests__/TrafficPanel.test.tsx
// Tests de UI para TrafficPanel: render vacio, filtros y acciones basicas.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TrafficPanel } from '../components/TrafficPanel';

const baseDevices = [
  { ip: '192.168.1.10', mac: 'AA:BB', vendor: 'Laptop', hostname: 'MY-LAPTOP' },
  { ip: '192.168.1.20', mac: 'CC:DD', vendor: 'Phone', hostname: 'Unknown' },
];

describe('TrafficPanel', () => {
  it('debe mostrar estado pausado cuando no hay paquetes y no esta activo', () => {
    render(
      <TrafficPanel
        isActive={false}
        speed={0}
        packets={[]}
        jammedPackets={[]}
        devices={baseDevices as any}
      />
    );

    expect(screen.getByText('MONITOR PAUSED')).toBeInTheDocument();
  });

  it('debe filtrar por JAMMED al pulsar el boton', () => {
    render(
      <TrafficPanel
        isActive
        speed={0}
        devices={baseDevices as any}
        packets={[
          {
            id: 1,
            timestamp: 1,
            sourceIp: '192.168.1.10',
            destinationIp: '8.8.8.8',
            protocol: 'TCP',
            length: 20,
            info: 'PKT-ALL',
            isIntercepted: false,
          },
          {
            id: 2,
            timestamp: 2,
            sourceIp: '192.168.1.20',
            destinationIp: '192.168.1.1',
            protocol: 'UDP',
            length: 10,
            info: 'PKT-JAM',
            isIntercepted: true,
          },
        ]}
        jammedPackets={[
          {
            id: 2,
            timestamp: 2,
            sourceIp: '192.168.1.20',
            destinationIp: '192.168.1.1',
            protocol: 'UDP',
            length: 10,
            info: 'PKT-JAM',
            isIntercepted: true,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /JAMMED/ }));

    expect(screen.getByText('PKT-JAM')).toBeInTheDocument();
    expect(screen.queryByText('PKT-ALL')).not.toBeInTheDocument();
  });

  it('debe activar filtro TARGET automaticamente cuando hay dispositivo seleccionado', () => {
    render(
      <TrafficPanel
        isActive
        speed={0}
        devices={baseDevices as any}
        selectedDevice={{ ip: '192.168.1.10', mac: 'AA', vendor: 'Laptop' } as any}
        packets={[
          {
            id: 1,
            timestamp: 1,
            sourceIp: '192.168.1.10',
            destinationIp: '8.8.8.8',
            protocol: 'TCP',
            length: 20,
            info: 'PKT-TARGET',
            isIntercepted: false,
          },
          {
            id: 2,
            timestamp: 2,
            sourceIp: '10.0.0.5',
            destinationIp: '10.0.0.1',
            protocol: 'TCP',
            length: 10,
            info: 'PKT-OTHER',
            isIntercepted: false,
          },
        ]}
      />
    );

    expect(screen.getByText('PKT-TARGET')).toBeInTheDocument();
    expect(screen.queryByText('PKT-OTHER')).not.toBeInTheDocument();
  });

  it('debe ejecutar onClear al pulsar CLR', () => {
    const onClear = vi.fn();

    render(
      <TrafficPanel
        isActive
        speed={0}
        packets={[]}
        jammedPackets={[]}
        devices={baseDevices as any}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /CLR/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
