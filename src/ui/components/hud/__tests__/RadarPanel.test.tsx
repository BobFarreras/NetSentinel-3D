import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../hooks/modules/useWifiRadar", () => ({
  useWifiRadar: () => ({
    scanning: false,
    error: null,
    lastScanAt: Date.now(),
    scan: vi.fn(),
    networks: [
      {
        bssid: "AA:AA:AA:AA:AA:01",
        ssid: "LAB_OPEN",
        channel: 1,
        signalLevel: -60,
        securityType: "OPEN",
        vendor: "Generic Device",
        distanceMock: 40,
        riskLevel: "OPEN",
        isTargetable: true,
        isConnected: false,
      },
      {
        bssid: "BB:BB:BB:BB:BB:02",
        ssid: "LAB_WPA2",
        channel: 6,
        signalLevel: -45,
        securityType: "WPA2-PSK",
        vendor: "TP-Link",
        distanceMock: 25,
        riskLevel: "STANDARD",
        isTargetable: false,
        isConnected: true,
      },
    ],
  }),
}));

import { RadarPanel } from "../RadarPanel";

describe("RadarPanel", () => {
  beforeEach(() => {
    localStorage.setItem("netsentinel.radar.legalAccepted", "true");
  });

  it("debe mostrar contador VISIBLE y filtrar por riesgo", () => {
    render(<RadarPanel onClose={() => {}} />);

    expect(screen.getByText(/NETWORKS:\s*2/i)).toBeInTheDocument();
    expect(screen.getByText(/VISIBLE:\s*2/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("FILTER_RISK_SELECT"), { target: { value: "OPEN" } });
    expect(screen.getByText(/VISIBLE:\s*1/i)).toBeInTheDocument();
  });

  it("debe filtrar por canal", () => {
    render(<RadarPanel onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("FILTER_CH_SELECT"), { target: { value: "6" } });
    expect(screen.getByText(/VISIBLE:\s*1/i)).toBeInTheDocument();
  });
});
