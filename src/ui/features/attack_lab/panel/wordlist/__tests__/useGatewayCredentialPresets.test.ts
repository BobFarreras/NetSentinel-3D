// src/ui/features/attack_lab/panel/wordlist/__tests__/useGatewayCredentialPresets.test.ts
// Tests del hook useGatewayCredentialPresets: carga inicial al abrir y invocaciones via invoke mockeado.

import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("useGatewayCredentialPresets", () => {
  it("debe cargar presets al abrir", async () => {
    invokeMock.mockResolvedValueOnce([
      { gatewayIp: "192.168.1.1", user: "admin", pass: "admin" },
      { gatewayIp: "192.168.1.1", user: "admin", pass: "1234" },
    ]);

    const { useGatewayCredentialPresets } = await import("../hooks/useGatewayCredentialPresets");
    type Props = { open: boolean; gw: string | null };
    const { result, rerender } = renderHook(
      ({ open, gw }: Props) => useGatewayCredentialPresets(open, gw),
      { initialProps: { open: false, gw: null } as Props }
    );

    expect(result.current.state.items).toEqual([]);

    await act(async () => {
      rerender({ open: true, gw: "192.168.1.1" });
    });

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.items.length).toBe(2);
    });
  });
});
