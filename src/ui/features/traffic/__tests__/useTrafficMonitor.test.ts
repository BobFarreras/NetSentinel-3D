// src/ui/features/traffic/__tests__/useTrafficMonitor.test.ts
// Tests del hook useTrafficMonitor: start/stop, procesado de eventos y calculo de velocidad.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTrafficMonitor } from '../hooks/useTrafficMonitor';
import type { TrafficPacket } from '../../../../shared/dtos/NetworkDTOs';

const { invokeCommandMock, listenEventMock } = vi.hoisted(() => ({
  invokeCommandMock: vi.fn(),
  listenEventMock: vi.fn(),
}));

vi.mock('../../../../shared/tauri/bridge', () => ({
  invokeCommand: invokeCommandMock,
  listenEvent: listenEventMock,
}));

describe('useTrafficMonitor', () => {
  let trafficHandler: ((event: { payload: TrafficPacket }) => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    trafficHandler = null;

    listenEventMock.mockImplementation(async (_eventName: string, handler: (event: { payload: TrafficPacket }) => void) => {
      trafficHandler = handler;
      return () => {};
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('debe iniciar y detener el monitoreo', async () => {
    const { result } = renderHook(() => useTrafficMonitor());

    await act(async () => {
      await Promise.resolve();
    });

    expect(listenEventMock).toHaveBeenCalled();

    await act(async () => {
      await result.current.toggleMonitoring();
    });

    expect(invokeCommandMock).toHaveBeenCalledWith('start_traffic_sniffing');
    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await result.current.toggleMonitoring();
    });

    expect(invokeCommandMock).toHaveBeenCalledWith('stop_traffic_sniffing');
    expect(result.current.isActive).toBe(false);
  });

  it('debe procesar paquetes y calcular velocidad', async () => {
    const { result } = renderHook(() => useTrafficMonitor());

    await act(async () => {
      await Promise.resolve();
    });

    expect(trafficHandler).not.toBeNull();

    await act(async () => {
      await result.current.toggleMonitoring();
    });

    const packetA: TrafficPacket = {
      id: 1,
      timestamp: Date.now(),
      sourceIp: '192.168.1.10',
      destinationIp: '8.8.8.8',
      protocol: 'TCP',
      length: 100,
      info: 'HTTPS',
      isIntercepted: false,
    };

    const packetB: TrafficPacket = {
      id: 2,
      timestamp: Date.now(),
      sourceIp: '192.168.1.33',
      destinationIp: '192.168.1.1',
      protocol: 'UDP',
      length: 50,
      info: 'DNS',
      isIntercepted: true,
    };

    act(() => {
      trafficHandler?.({ payload: packetA });
      trafficHandler?.({ payload: packetB });
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.packets).toHaveLength(2);
    expect(result.current.jammedPackets).toHaveLength(1);
    expect(result.current.speed).toBe(750);
  });

  it('debe limpiar buffers y velocidad con clearPackets', async () => {
    const { result } = renderHook(() => useTrafficMonitor());

    await act(async () => {
      await Promise.resolve();
    });

    expect(trafficHandler).not.toBeNull();

    await act(async () => {
      await result.current.toggleMonitoring();
    });

    const packet: TrafficPacket = {
      id: 10,
      timestamp: Date.now(),
      sourceIp: '192.168.1.22',
      destinationIp: '192.168.1.1',
      protocol: 'TCP',
      length: 40,
      info: 'Test',
      isIntercepted: true,
    };

    act(() => {
      trafficHandler?.({ payload: packet });
      vi.advanceTimersByTime(200);
    });

    expect(result.current.packets.length).toBeGreaterThan(0);
    expect(result.current.jammedPackets.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearPackets();
    });

    expect(result.current.packets).toEqual([]);
    expect(result.current.jammedPackets).toEqual([]);
    expect(result.current.speed).toBe(0);
  });
});
