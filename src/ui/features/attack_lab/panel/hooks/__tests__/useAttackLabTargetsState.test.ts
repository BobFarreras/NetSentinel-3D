// src/ui/features/attack_lab/panel/hooks/__tests__/useAttackLabTargetsState.test.ts
// Tests del hook de targets del Attack Lab: carga WiFi targets y sincroniza seleccion/emision de contexto.

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = { selectedBssid: null as string | null };
  return {
    invoke: vi.fn(),
    windowingAdapter: {
      emitAttackLabContext: vi.fn(),
      listenAttackLabContext: vi.fn(),
    },
    wifiRadar: {
      state,
      useWifiRadarSelection: () => ({ selectedBssid: state.selectedBssid }),
      setSelectedWifiBssid: vi.fn(),
    },
  };
});

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mocks.invoke,
}));

vi.mock("../../../../../../adapters/windowingAdapter", () => ({
  windowingAdapter: mocks.windowingAdapter,
}));

vi.mock("../../../../radar/hooks/useWifiRadarSelection", () => ({
  useWifiRadarSelection: mocks.wifiRadar.useWifiRadarSelection,
  setSelectedWifiBssid: mocks.wifiRadar.setSelectedWifiBssid,
}));

import { useAttackLabTargetsState } from "../useAttackLabTargetsState";

describe("useAttackLabTargetsState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.wifiRadar.state.selectedBssid = null;
    mocks.windowingAdapter.listenAttackLabContext.mockResolvedValue(() => undefined);
  });

  it("debe cargar wifiTargets (ordenado y sin duplicados) cuando el escenario es WIFI", async () => {
    mocks.invoke.mockResolvedValue([
      { ssid: "A", bssid: "aa", signalLevel: -20 },
      { ssid: "B", bssid: "bb", signalLevel: -10 },
      { ssid: "B2", bssid: "bb", signalLevel: -5 }, // duplicado por bssid
    ]);

    const { result } = renderHook(() =>
      useAttackLabTargetsState({
        selectedScenario: { id: "wifi_dictionary", category: "WIFI" } as any,
        scenarioId: "wifi_dictionary",
        setScenarioId: vi.fn(),
        setMode: vi.fn(),
        bumpAutoRunToken: vi.fn(),
        identity: null,
        propTargetDevice: null,
        availableDevices: [],
        availableRouters: [],
        persistedTargetIp: null,
      })
    );

    await waitFor(() => {
      expect(result.current.wifiTargets.length).toBe(2);
    });

    expect(result.current.wifiTargets[0]?.bssid).toBe("bb");
    expect(result.current.wifiTargets[1]?.bssid).toBe("aa");
  });

  it("debe emitir contexto al seleccionar router target", async () => {
    const setMode = vi.fn();

    const { result } = renderHook(() =>
      useAttackLabTargetsState({
        selectedScenario: { id: "router_recon_baseline", category: "ROUTER" } as any,
        scenarioId: "router_recon_baseline",
        setScenarioId: vi.fn(),
        setMode,
        bumpAutoRunToken: vi.fn(),
        identity: null,
        propTargetDevice: null,
        availableDevices: [],
        availableRouters: [{ ip: "192.168.1.1", mac: "", vendor: "", hostname: "gw", isGateway: true, openPorts: [] } as any],
        persistedTargetIp: null,
      })
    );

    await act(async () => {
      result.current.selectRouterTarget("192.168.1.1");
    });

    expect(mocks.windowingAdapter.emitAttackLabContext).toHaveBeenCalled();
  });
});

