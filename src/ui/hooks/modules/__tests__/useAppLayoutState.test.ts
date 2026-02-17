// src/ui/hooks/modules/__tests__/useAppLayoutState.test.ts
// Tests del layout state: valida resize de sidebar via drag (mousemove/mouseup).

import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAppLayoutState } from "../ui/useAppLayoutState";

describe("useAppLayoutState", () => {
  it("debe redimensionar sidebar con drag", () => {
    const { result } = renderHook(() => useAppLayoutState());

    expect(result.current.sidebarWidth).toBe(450);

    act(() => {
      result.current.startResizingSidebar({ clientX: 500 } as never);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 460 }));
    });

    expect(result.current.sidebarWidth).toBe(490);

    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(result.current.isResizing).toBe(false);
  });
});
