import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Evitamos dependencias de runtime (Tauri/eventos) en tests de UI.
vi.mock("../../../hooks/modules/useTrafficMonitor", () => ({
  useTrafficMonitor: () => ({
    isActive: false,
    speed: 0,
    packets: [],
    jammedPackets: [],
    toggleMonitoring: vi.fn(async () => {}),
    clearPackets: vi.fn(() => {}),
  }),
}));

import { addRadarLog, clearRadarLogs } from "../../../hooks/modules/useRadarLogs";
import { ConsoleLogs } from "../ConsoleLogs";

describe("ConsoleLogs", () => {
  beforeEach(() => {
    clearRadarLogs();
  });

  it("debe mostrar RADAR LOGS en su pestaña", () => {
    addRadarLog("scan_airwaves: 1 redes detectadas");

    render(
      <ConsoleLogs
        logs={["L1"]}
        devices={[]}
        selectedDevice={null}
        onClearSystemLogs={() => {}}
      />
    );

    fireEvent.click(screen.getByText("RADAR LOGS"));
    expect(screen.getByText(/scan_airwaves: 1 redes detectadas/i)).toBeInTheDocument();
  });

  it("debe mostrar placeholder si no hay RADAR LOGS", () => {
    render(
      <ConsoleLogs
        logs={[]}
        devices={[]}
        selectedDevice={null}
        onClearSystemLogs={() => {}}
      />
    );

    fireEvent.click(screen.getByText("RADAR LOGS"));
    expect(screen.getByText(/sin actividad/i)).toBeInTheDocument();
  });
});

