import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

describe("useNetworkNodeState", () => {
  it("debe exponer estado visual seleccionado", async () => {
    const onClick = vi.fn();
    const { useNetworkNodeState } = await import("../scene3d/useNetworkNodeState");
    const { result } = renderHook(() =>
      useNetworkNodeState({
        isSelected: true,
        color: "#00ff00",
        name: "192.168.1.10",
        onClick,
      })
    );

    expect(result.current.scale).toBe(1.5);
    expect(result.current.emissiveIntensity).toBe(2);
    expect(result.current.nodeColor).toBe("#ffd700");
  });

  it("debe cambiar cursor en hover y ejecutar click", async () => {
    const onClick = vi.fn();
    const stopPropagation = vi.fn();
    const { useNetworkNodeState } = await import("../scene3d/useNetworkNodeState");
    const { result } = renderHook(() =>
      useNetworkNodeState({
        isSelected: false,
        color: "#00ff00",
        name: "192.168.1.20",
        onClick,
      })
    );

    act(() => {
      result.current.handlePointerOver();
    });
    expect(document.body.style.cursor).toBe("pointer");

    act(() => {
      result.current.handleClick({ stopPropagation });
    });
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handlePointerOut();
    });
    expect(document.body.style.cursor).toBe("auto");
  });
});
