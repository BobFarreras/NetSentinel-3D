import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { addRadarLog, clearRadarLogs, useRadarLogs } from "../useRadarLogs";

describe("useRadarLogs", () => {
  it("debe añadir y limpiar logs", () => {
    clearRadarLogs();

    const { result } = renderHook(() => useRadarLogs());
    expect(result.current.logs).toEqual([]);

    act(() => {
      addRadarLog("scan_airwaves: 2 redes detectadas");
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toContain("scan_airwaves: 2 redes detectadas");

    act(() => {
      result.current.clear();
    });

    expect(result.current.logs).toEqual([]);
  });
});

