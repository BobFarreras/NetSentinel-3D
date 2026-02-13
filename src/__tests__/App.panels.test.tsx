// src/__tests__/App.panels.test.tsx
// Test de UI: docking/undocking de paneles principales (console, radar, attack_lab) y render esperado.

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";
import App from "../App";

vi.mock("../ui/components/layout/TopBar", () => ({
  TopBar: ({ onRadarToggle, onAttackLabToggle }: { onRadarToggle: () => void; onAttackLabToggle: () => void }) => (
    <div data-testid="topbar">
      <button onClick={onRadarToggle}>TOGGLE_RADAR</button>
      <button onClick={onAttackLabToggle}>TOGGLE_ATTACK_LAB</button>
    </div>
  ),
}));

vi.mock("../ui/components/layout/DetachedWindowPortal", () => ({
  DetachedWindowPortal: ({ children }: { children: ReactNode }) => (
    <div data-testid="detached-portal">{children}</div>
  ),
}));

vi.mock("../ui/features/history/components/HistoryPanel", () => ({
  HistoryPanel: () => <div data-testid="history-panel">HISTORY</div>,
}));

vi.mock("../ui/features/radar/components/RadarPanel", () => ({
  RadarPanel: () => <div data-testid="radar-panel">RADAR</div>,
}));

vi.mock("../ui/features/attack_lab/panel/AttackLabPanel", () => ({
  AttackLabPanel: () => <div data-testid="attack-lab-panel">ATTACK-LAB</div>,
}));

vi.mock("../ui/features/scene3d/components/NetworkScene", () => ({
  NetworkScene: () => <div data-testid="network-scene">SCENE</div>,
}));

vi.mock("../ui/features/device_detail/components/DeviceDetailPanel", () => ({
  DeviceDetailPanel: ({ device }: { device: DeviceDTO }) => (
    <div data-testid="device-detail-panel">DETAIL:{device.ip}</div>
  ),
}));

vi.mock("../ui/features/console_logs/components/ConsoleLogs", () => ({
  ConsoleLogs: () => <div data-testid="console-logs">CONSOLE</div>,
}));

vi.mock("../ui/hooks/useNetworkManager", async () => {
  const ReactModule = await import("react");
  const devices: DeviceDTO[] = [
    { ip: "192.168.1.10", mac: "AA:AA", vendor: "Laptop" },
  ];

  return {
    useNetworkManager: () => {
      const [selectedDevice] = ReactModule.useState<DeviceDTO | null>(devices[0]);
      return {
        devices,
        selectedDevice,
        scanning: false,
        auditing: false,
        auditResults: [],
        consoleLogs: [],
        startScan: vi.fn(),
        startAudit: vi.fn(),
        selectDevice: vi.fn(),
        loadSession: vi.fn(),
        jammedDevices: [],
        jamPendingDevices: [],
        toggleJammer: vi.fn(),
        checkRouterSecurity: vi.fn(),
        systemLogs: [],
        clearSystemLogs: vi.fn(),
        intruders: [],
        identity: null,
      };
    },
  };
});

describe("App panels docking", () => {
  it("debe permitir undock de consola y mostrar contenedor desacoplado", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("UNLOCK_CONSOLE"));
    return waitFor(() => {
      expect(screen.getByLabelText("DOCK_CONSOLE")).toBeInTheDocument();
      expect(screen.getByTestId("detached-portal")).toBeInTheDocument();
    });
  });

  it("debe mostrar radar + attack lab con split independiente y permitir undock attack lab", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("TOGGLE_RADAR"));
    fireEvent.click(screen.getByText("TOGGLE_ATTACK_LAB"));

    expect(screen.getByLabelText("RESIZE_DOCK_SPLIT")).toBeInTheDocument();
    expect(screen.getByLabelText("UNLOCK_RADAR")).toBeInTheDocument();
    expect(screen.getByLabelText("UNLOCK_ATTACK_LAB")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("UNLOCK_ATTACK_LAB"));
    await waitFor(() => {
      expect(screen.queryByLabelText("UNLOCK_ATTACK_LAB")).not.toBeInTheDocument();
      expect(screen.getByLabelText("DOCK_ATTACK_LAB")).toBeInTheDocument();
    });
  });
});
