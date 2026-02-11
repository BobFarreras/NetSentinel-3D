import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

describe("useDeviceDetailPanelState", () => {
  it("debe resolver nombre, MAC y bloque WiFi", async () => {
    const onRouterAudit = vi.fn();
    const onOpenLabAudit = vi.fn();
    const device = {
      ip: "192.168.1.50",
      mac: "aa:bb:cc:dd:ee:ff",
      vendor: "ACME",
      hostname: "Laptop-A",
      signal_strength: -55,
    };

    const { useDeviceDetailPanelState } = await import("../ui/useDeviceDetailPanelState");
    const { result } = renderHook(() =>
      useDeviceDetailPanelState({
        device: device as any,
        onRouterAudit,
        onOpenLabAudit,
      })
    );

    expect(result.current.resolvedName).toBe("Laptop-A");
    expect(result.current.normalizedMac).toBe("AA:BB:CC:DD:EE:FF");
    expect(result.current.hasWifiSection).toBe(true);
    expect(result.current.getSignalColor(-55)).toBe("#0f0");
    expect(result.current.getSignalColor(-80)).toBe("#ff5555");
  });

  it("debe delegar acciones de router y lab audit", async () => {
    const onRouterAudit = vi.fn();
    const onOpenLabAudit = vi.fn();
    const device = {
      ip: "192.168.1.1",
      mac: "aa:bb",
      vendor: "Router",
    };

    const { useDeviceDetailPanelState } = await import("../ui/useDeviceDetailPanelState");
    const { result } = renderHook(() =>
      useDeviceDetailPanelState({
        device: device as any,
        onRouterAudit,
        onOpenLabAudit,
      })
    );

    result.current.handleRouterAudit();
    result.current.handleOpenLabAudit();

    expect(onRouterAudit).toHaveBeenCalledWith("192.168.1.1");
    expect(onOpenLabAudit).toHaveBeenCalledWith(device);
  });
});
