// src/__tests__/App.integration.test.tsx
// Test de integracion: valida el flujo end-to-end entre escena 3D, detalle de dispositivo y consola/paneles.

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";
import App from "../App";
import { I18nProvider } from "../ui/i18n";

vi.mock("../ui/components/layout/TopBar", () => ({
  TopBar: () => <div data-testid="topbar">TOPBAR</div>,
}));

// Mock del layout para evitar dependencias de `React.lazy` + Three/WebGL en JSDOM.
// Este test valida el flujo de seleccion (Scene -> App state -> Console/Detail), no el layout real.
vi.mock("../ui/components/layout/MainDockedLayout", () => ({
  MainDockedLayout: ({
    devices,
    selectedDevice,
    selectDevice,
  }: {
    devices: DeviceDTO[];
    selectedDevice: DeviceDTO | null;
    selectDevice: (d: DeviceDTO | null) => void;
  }) => (
    <div>
      <div data-testid="network-scene">
        <div data-testid="scene-selected-ip">{selectedDevice?.ip ?? "NONE"}</div>
        <button onClick={() => selectDevice(devices[0])}>SELECT_NODE_1</button>
        <button onClick={() => selectDevice(null)}>CLEAR_SELECTION</button>
      </div>
      <div data-testid="console-logs">CONSOLE_SELECTED:{selectedDevice?.ip ?? "NONE"}</div>
      {selectedDevice && <div data-testid="device-detail-panel">DETAIL:{selectedDevice.ip}</div>}
    </div>
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

// Los componentes reales de Scene/Console/Detail quedan cubiertos por tests unitarios;
// aqui basta con el mock del layout.

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
    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect(await screen.findByTestId("scene-selected-ip")).toHaveTextContent("NONE");
    expect(screen.getByTestId("console-logs")).toHaveTextContent("CONSOLE_SELECTED:NONE");
    expect(screen.queryByTestId("device-detail-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("SELECT_NODE_1"));

    expect(screen.getByTestId("scene-selected-ip")).toHaveTextContent("192.168.1.10");
    expect(screen.getByTestId("console-logs")).toHaveTextContent("CONSOLE_SELECTED:192.168.1.10");
    expect(await screen.findByTestId("device-detail-panel")).toHaveTextContent("DETAIL:192.168.1.10");
  });
});
