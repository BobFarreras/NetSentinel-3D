import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";
import App from "../App";

vi.mock("../ui/components/layout/TopBar", () => ({
  TopBar: () => <div data-testid="topbar">TOPBAR</div>,
}));

vi.mock("../ui/components/hud/HistoryPanel", () => ({
  HistoryPanel: () => <div data-testid="history-panel">HISTORY</div>,
}));

vi.mock("../ui/components/hud/RadarPanel", () => ({
  RadarPanel: () => <div data-testid="radar-panel">RADAR</div>,
}));

vi.mock("../ui/features/attack_lab/panel/AttackLabPanel", () => ({
  AttackLabPanel: () => <div data-testid="attack-lab-panel">ATTACK-LAB</div>,
}));

vi.mock("../ui/components/3d/NetworkScene", () => ({
  NetworkScene: ({
    devices,
    selectedIp,
    onDeviceSelect,
  }: {
    devices: DeviceDTO[];
    selectedIp?: string | null;
    onDeviceSelect?: (device: DeviceDTO | null) => void;
  }) => (
    <div data-testid="network-scene">
      <div data-testid="scene-selected-ip">{selectedIp ?? "NONE"}</div>
      <button onClick={() => onDeviceSelect?.(devices[0])}>SELECT_NODE_1</button>
      <button onClick={() => onDeviceSelect?.(null)}>CLEAR_SELECTION</button>
    </div>
  ),
}));

vi.mock("../ui/components/hud/DeviceDetailPanel", () => ({
  DeviceDetailPanel: ({ device }: { device: DeviceDTO }) => (
    <div data-testid="device-detail-panel">DETAIL:{device.ip}</div>
  ),
}));

vi.mock("../ui/components/panels/ConsoleLogs", () => ({
  ConsoleLogs: ({ selectedDevice }: { selectedDevice?: DeviceDTO | null }) => (
    <div data-testid="console-logs">CONSOLE_SELECTED:{selectedDevice?.ip ?? "NONE"}</div>
  ),
}));

vi.mock("../ui/hooks/useNetworkManager", async () => {
  const ReactModule = await import("react");
  const devices: DeviceDTO[] = [
    { ip: "192.168.1.10", mac: "AA:AA", vendor: "Laptop" },
    { ip: "192.168.1.20", mac: "BB:BB", vendor: "Phone" },
  ];

  return {
    useNetworkManager: () => {
      const [selectedDevice, setSelectedDevice] = ReactModule.useState<DeviceDTO | null>(null);
      return {
        devices,
        selectedDevice,
        scanning: false,
        auditing: false,
        auditResults: [],
        consoleLogs: [],
        startScan: vi.fn(),
        startAudit: vi.fn(),
        selectDevice: setSelectedDevice,
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

describe("App integration (3D -> detail -> console)", () => {
  it("debe sincronizar seleccion desde NetworkScene a DeviceDetail y ConsoleLogs", async () => {
    render(<App />);

    expect(await screen.findByTestId("scene-selected-ip")).toHaveTextContent("NONE");
    expect(screen.getByTestId("console-logs")).toHaveTextContent("CONSOLE_SELECTED:NONE");
    expect(screen.queryByTestId("device-detail-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("SELECT_NODE_1"));

    expect(screen.getByTestId("scene-selected-ip")).toHaveTextContent("192.168.1.10");
    expect(screen.getByTestId("console-logs")).toHaveTextContent("CONSOLE_SELECTED:192.168.1.10");
    expect(await screen.findByTestId("device-detail-panel")).toHaveTextContent("DETAIL:192.168.1.10");
  });
});
