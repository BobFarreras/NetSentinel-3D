// src/ui/features/attack_lab/panel/wordlist/__tests__/useGatewayCredsVault.test.ts
// Tests del hook useGatewayCredsVault: inicializacion por identity, carga de candidatos y estado basico del vault.

import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { GatewayCredentialsDTO, HostIdentity, LatestSnapshotDTO } from "../../../../../../shared/dtos/NetworkDTOs";

const { networkAdapterMock, presetsMock } = vi.hoisted(() => {
  const presets = {
    state: { loading: false, items: [], selected: new Set<string>() },
    actions: {
      load: vi.fn(async () => undefined),
      add: vi.fn(async () => []),
      toggle: vi.fn(),
      deselectAll: vi.fn(),
      removeSelected: vi.fn(async () => []),
    },
  };

  return {
    networkAdapterMock: {
      loadLatestSnapshot: vi.fn(async () => null) as unknown as () => Promise<LatestSnapshotDTO | null>,
      getGatewayCredentials: vi.fn(async () => null) as unknown as (gatewayIp: string) => Promise<GatewayCredentialsDTO | null>,
      saveGatewayCredentials: vi.fn(async () => undefined) as unknown as (gatewayIp: string, user: string, pass: string) => Promise<void>,
      deleteGatewayCredentials: vi.fn(async () => undefined) as unknown as (gatewayIp: string) => Promise<void>,
    } as any,
    presetsMock: presets,
  };
});

vi.mock("../../../../../../adapters/networkAdapter", () => ({
  networkAdapter: networkAdapterMock,
}));

vi.mock("../hooks/useGatewayCredentialPresets", () => ({
  useGatewayCredentialPresets: () => presetsMock,
}));

describe("useGatewayCredsVault", () => {
  it("debe inicializar gatewayIp/activo desde identity al abrir", async () => {
    const { useGatewayCredsVault } = await import("../hooks/useGatewayCredsVault");
    const identity: HostIdentity = {
      ip: "192.168.1.143",
      mac: "AA:BB:CC:DD:EE:FF",
      netmask: "255.255.255.0",
      gatewayIp: "192.168.1.1",
      interfaceName: "Ethernet",
      dnsServers: ["1.1.1.1"],
    };

    const { result, rerender } = renderHook(
      ({ open, id }: { open: boolean; id: HostIdentity | null }) => useGatewayCredsVault(open, id),
      { initialProps: { open: false, id: identity } }
    );

    expect(result.current.state.gatewayIpInput).toBe("");

    await act(async () => {
      rerender({ open: true, id: identity });
    });

    await waitFor(() => {
      expect(result.current.state.gatewayIpInput).toBe("192.168.1.1");
      expect(result.current.state.activeGateway).toBe("192.168.1.1");
    });
  });

  it("debe cargar candidatos desde snapshot (dedup por IP)", async () => {
    networkAdapterMock.loadLatestSnapshot.mockResolvedValueOnce({
      timestamp: Date.now(),
      devices: [
        { ip: "192.168.1.1", mac: "11:11:11:11:11:11", name: "GATEWAY", vendor: "Xiaomi" },
        { ip: "192.168.1.10", mac: "22:22:22:22:22:22", name: "A", vendor: "Generic" },
        { ip: "192.168.1.10", mac: "22:22:22:22:22:22", name: "A2", vendor: "Generic" },
      ],
    });

    const { useGatewayCredsVault } = await import("../hooks/useGatewayCredsVault");

    const { result } = renderHook(() => useGatewayCredsVault(true, null));

    await waitFor(() => {
      expect(result.current.state.gatewayCandidates.map((c) => c.ip)).toEqual(["192.168.1.1", "192.168.1.10"]);
    });
  });
});
