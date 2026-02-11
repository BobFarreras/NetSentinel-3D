import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";
import App from "../App";

vi.mock("../ui/components/layout/TopBar", () => ({
  TopBar: ({ onRadarToggle, onExternalAuditToggle }: { onRadarToggle: () => void; onExternalAuditToggle: () => void }) => (
    <div data-testid="topbar">
      <button onClick={onRadarToggle}>TOGGLE_RADAR</button>
      <button onClick={onExternalAuditToggle}>TOGGLE_EXTERNAL</button>
    </div>
  ),
}));

vi.mock("../ui/components/layout/DetachedWindowPortal", () => ({
  DetachedWindowPortal: ({ children }: { children: ReactNode }) => (
    <div data-testid="detached-portal">{children}</div>
  ),
}));

vi.mock("../ui/components/hud/HistoryPanel", () => ({
  HistoryPanel: () => <div data-testid="history-panel">HISTORY</div>,
}));

vi.mock("../ui/components/hud/RadarPanel", () => ({
  RadarPanel: () => <div data-testid="radar-panel">RADAR</div>,
}));

vi.mock("../ui/components/hud/ExternalAuditPanel", () => ({
  ExternalAuditPanel: () => <div data-testid="external-audit-panel">EXT-AUDIT</div>,
}));

vi.mock("../ui/components/3d/NetworkScene", () => ({
  NetworkScene: () => <div data-testid="network-scene">SCENE</div>,
}));

vi.mock("../ui/components/hud/DeviceDetailPanel", () => ({
  DeviceDetailPanel: ({ device }: { device: DeviceDTO }) => (
    <div data-testid="device-detail-panel">DETAIL:{device.ip}</div>
  ),
}));

vi.mock("../ui/components/panels/ConsoleLogs", () => ({
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

  it("debe mostrar radar + external con split independiente y permitir undock external", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("TOGGLE_RADAR"));
    fireEvent.click(screen.getByText("TOGGLE_EXTERNAL"));

    expect(screen.getByLabelText("RESIZE_DOCK_SPLIT")).toBeInTheDocument();
    expect(screen.getByLabelText("UNLOCK_RADAR")).toBeInTheDocument();
    expect(screen.getByLabelText("UNLOCK_EXTERNAL")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("UNLOCK_EXTERNAL"));
    await waitFor(() => {
      expect(screen.queryByLabelText("UNLOCK_EXTERNAL")).not.toBeInTheDocument();
      expect(screen.getByLabelText("DOCK_EXTERNAL")).toBeInTheDocument();
    });
  });
});
