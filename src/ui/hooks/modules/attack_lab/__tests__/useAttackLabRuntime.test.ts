// src/ui/hooks/modules/attack_lab/__tests__/useAttackLabRuntime.test.ts
// Tests del runtime persistente de Attack Lab: debe mantener estado aunque el panel se desmonte y se vuelva a montar.

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAttackLabRuntime, __resetAttackLabRuntimeForTests } from "../useAttackLabRuntime";

describe("useAttackLabRuntime", () => {
  beforeEach(() => {
    __resetAttackLabRuntimeForTests();
  });

  it("debe persistir rows/auditId entre montajes (simulated)", async () => {
    const { result, unmount } = renderHook(() => useAttackLabRuntime());

    await act(async () => {
      await result.current.actions.startSimulated("SIM", [
        { delayMs: 0, stream: "stdout", line: "step-1" },
        { delayMs: 10, stream: "stdout", line: "step-2" },
      ]);
    });

    await waitFor(() => {
      expect(result.current.state.auditId).toBeTruthy();
      expect(result.current.state.rows.length).toBeGreaterThanOrEqual(1);
    });

    const auditId = result.current.state.auditId;
    const rowsCount = result.current.state.rows.length;

    unmount();

    const { result: result2 } = renderHook(() => useAttackLabRuntime());
    expect(result2.current.state.auditId).toBe(auditId);
    expect(result2.current.state.rows.length).toBe(rowsCount);
  });
});
