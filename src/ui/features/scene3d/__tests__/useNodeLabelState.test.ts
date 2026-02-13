// src/ui/features/scene3d/__tests__/useNodeLabelState.test.ts
// Tests del hook useNodeLabelState: calculo de badge y limites de confianza.

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

describe("useNodeLabelState", () => {
  it("debe calcular nivel HIGH para confianza alta", async () => {
    const { useNodeLabelState } = await import("../hooks/useNodeLabelState");
    const { result } = renderHook(() => useNodeLabelState({ type: "ROUTER", confidence: 93.3 }));
    expect(result.current.confidenceBadge).toEqual({ pct: 93, level: "HIGH" });
    expect(result.current.palette.fg).toBeTruthy();
  });

  it("debe acotar confianza y asignar LOW", async () => {
    const { useNodeLabelState } = await import("../hooks/useNodeLabelState");
    const { result } = renderHook(() => useNodeLabelState({ type: "UNKNOWN", confidence: -20 }));
    expect(result.current.confidenceBadge).toEqual({ pct: 0, level: "LOW" });
  });
});
