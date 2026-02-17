// src/ui/features/wordlist/__tests__/useWordlistManager.test.ts
// Tests del hook useWordlistManager: carga inicial al abrir y estado de loading con invoke mockeado.

import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

describe("useWordlistManager", () => {
  it("debe cargar diccionario al abrir el modal", async () => {
    invokeMock.mockResolvedValueOnce(["a", "b", "c"]);

    const { useWordlistManager } = await import("../hooks/useWordlistManager");
    const { result, rerender } = renderHook(({ open }: { open: boolean }) => useWordlistManager(open), {
      initialProps: { open: false },
    });

    expect(result.current.state.words).toEqual([]);

    await act(async () => {
      rerender({ open: true });
    });

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.words).toEqual(["a", "b", "c"]);
    });
  });
});

