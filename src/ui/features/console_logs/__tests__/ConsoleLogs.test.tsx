// src/ui/features/console_logs/__tests__/ConsoleLogs.test.tsx
// Tests de UI para ConsoleLogs: valida render de pestaña RADAR y placeholders sin depender de runtime Tauri.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "../../../i18n";

// Evitamos dependencias de runtime (Tauri/eventos) en tests de UI.
vi.mock("../../traffic/hooks/useTrafficMonitor", () => ({
  useTrafficMonitor: () => ({
    isActive: false,
    speed: 0,
    packets: [],
    jammedPackets: [],
    toggleMonitoring: vi.fn(async () => {}),
    clearPackets: vi.fn(() => {}),
  }),
}));

import { addRadarScanLog, clearRadarLogs } from "../../radar/hooks/useRadarLogs";
import { ConsoleLogs } from "../components/ConsoleLogs";

describe("ConsoleLogs", () => {
  beforeEach(() => {
    clearRadarLogs();
  });

  it("debe mostrar RADAR LOGS en su pestaña", () => {
    addRadarScanLog(1);

    render(
      <I18nProvider>
        <ConsoleLogs
          logs={["L1"]}
          devices={[]}
          selectedDevice={null}
          onClearSystemLogs={() => {}}
        />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText("RADAR LOGS"));
    expect(screen.getByText(/scan_airwaves: 1 redes detectadas/i)).toBeInTheDocument();
  });

  it("debe mostrar placeholder si no hay RADAR LOGS", () => {
    render(
      <I18nProvider>
        <ConsoleLogs
          logs={[]}
          devices={[]}
          selectedDevice={null}
          onClearSystemLogs={() => {}}
        />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText("RADAR LOGS"));
    expect(screen.getByText(/sin actividad/i)).toBeInTheDocument();
  });
});
