import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

describe("useNetworkSceneState", () => {
  it("debe detectar gateway por identity.gatewayIp y separar orbita", async () => {
    const { useNetworkSceneState } = await import("../scene3d/useNetworkSceneState");
    const devices = [
      { ip: "192.168.1.1", mac: "AA", vendor: "Router" },
      { ip: "192.168.1.20", mac: "BB", vendor: "Laptop" },
    ];
    const identity = { ip: "192.168.1.20", gatewayIp: "192.168.1.1", interfaceName: "Wi-Fi" };

    const { result } = renderHook(() =>
      useNetworkSceneState({
        devices: devices as any,
        identity: identity as any,
        intruders: [],
      })
    );

    expect(result.current.centerNode?.ip).toBe("192.168.1.1");
    expect(result.current.orbitingNodes).toHaveLength(1);
  });

  it("debe persistir toggle de labels en localStorage", async () => {
    localStorage.removeItem("netsentinel.showNodeLabels");
    const { useNetworkSceneState } = await import("../scene3d/useNetworkSceneState");
    const { result } = renderHook(() =>
      useNetworkSceneState({
        devices: [] as any,
        identity: null,
        intruders: [],
      })
    );

    expect(result.current.showLabels).toBe(true);
    act(() => {
      result.current.toggleLabels();
    });
    expect(localStorage.getItem("netsentinel.showNodeLabels")).toBe("false");
  });
});
