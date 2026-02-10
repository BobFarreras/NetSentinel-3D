import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DeviceDetailPanel } from '../DeviceDetailPanel';

vi.mock('../details/ConsoleDisplay', () => ({
  ConsoleDisplay: ({ logs }: { logs: string[] }) => <div data-testid="console-display">{logs.length}</div>,
}));

vi.mock('../details/PortResults', () => ({
  PortResults: ({ results }: { results: unknown[] }) => <div data-testid="port-results">{results.length}</div>,
}));

describe('DeviceDetailPanel', () => {
  it('debe renderizar informacion base del dispositivo', () => {
    render(
      <DeviceDetailPanel
        device={{
          ip: '192.168.1.50',
          mac: 'aa:bb:cc:dd:ee:ff',
          vendor: 'ACME',
          signal_strength: -50,
          signal_rate: 300 as any,
          wifi_band: '5GHz',
        }}
        auditResults={[]}
        consoleLogs={['log1']}
        auditing={false}
        onAudit={vi.fn()}
        isJammed={false}
        onToggleJam={vi.fn()}
        onRouterAudit={vi.fn()}
        onOpenLabAudit={vi.fn()}
      />
    );

    expect(screen.getByText('DEVICE_INTEL')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.50')).toBeInTheDocument();
    expect(screen.getByText('AA:BB:CC:DD:EE:FF')).toBeInTheDocument();
    expect(screen.getByText('ACME')).toBeInTheDocument();
  });

  it('debe ejecutar acciones de audit, jam y router audit', () => {
    const onAudit = vi.fn();
    const onToggleJam = vi.fn();
    const onRouterAudit = vi.fn();
    const onOpenLabAudit = vi.fn();

    render(
      <DeviceDetailPanel
        device={{
          ip: '192.168.1.1',
          mac: 'aa:bb',
          vendor: 'Router',
          isGateway: true,
        }}
        auditResults={[]}
        consoleLogs={[]}
        auditing={false}
        onAudit={onAudit}
        isJammed={false}
        onToggleJam={onToggleJam}
        onRouterAudit={onRouterAudit}
        onOpenLabAudit={onOpenLabAudit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /DEEP AUDIT/ }));
    fireEvent.click(screen.getByRole('button', { name: /LAB AUDIT/ }));
    fireEvent.click(screen.getByRole('button', { name: /KILL NET/ }));
    fireEvent.click(screen.getByRole('button', { name: /AUDIT GATEWAY SECURITY/ }));

    expect(onAudit).toHaveBeenCalledTimes(1);
    expect(onOpenLabAudit).toHaveBeenCalledTimes(1);
    expect(onToggleJam).toHaveBeenCalledTimes(1);
    expect(onRouterAudit).toHaveBeenCalledWith('192.168.1.1');
  });
});
