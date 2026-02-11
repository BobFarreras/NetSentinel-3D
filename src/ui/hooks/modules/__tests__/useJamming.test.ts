import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const invokeCommandMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../shared/tauri/bridge", () => ({
  invokeCommand: invokeCommandMock,
}));

import { useJamming } from "../network/useJamming";

describe("useJamming", () => {
  it("bloquea start_jamming cuando el objetivo es gateway", async () => {
    invokeCommandMock.mockResolvedValue(undefined);
    const addLog = vi.fn();

    const { result } = renderHook(() =>
      useJamming(
        [{ ip: "192.168.1.1", mac: "AA:AA:AA:AA:AA:AA", vendor: "Router", isGateway: true }],
        addLog
      )
    );

    await act(async () => {
      await result.current.toggleJammer("192.168.1.1");
    });

    expect(invokeCommandMock).not.toHaveBeenCalled();
    expect(addLog).toHaveBeenCalledWith("192.168.1.1", expect.stringContaining("JAMMER BLOQUEADO"));
  });

  it("evita reentrada mientras el mismo objetivo esta pendiente", async () => {
    let resolver: (() => void) | null = null;
    invokeCommandMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolver = () => resolve();
        })
    );

    const addLog = vi.fn();
    const { result } = renderHook(() =>
      useJamming(
        [
          { ip: "192.168.1.1", mac: "AA:AA:AA:AA:AA:AA", vendor: "Router", isGateway: true },
          { ip: "192.168.1.20", mac: "BB:BB:BB:BB:BB:BB", vendor: "Node" },
        ],
        addLog
      )
    );

    await act(async () => {
      void result.current.toggleJammer("192.168.1.20");
    });

    await act(async () => {
      void result.current.toggleJammer("192.168.1.20");
    });

    expect(invokeCommandMock).toHaveBeenCalledTimes(1);
    expect(result.current.jamPendingDevices).toContain("192.168.1.20");

    await act(async () => {
      resolver?.();
      await Promise.resolve();
    });

    expect(result.current.jamPendingDevices).not.toContain("192.168.1.20");
  });
});
