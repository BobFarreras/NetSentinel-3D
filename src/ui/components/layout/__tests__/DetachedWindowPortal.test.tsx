import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { DetachedWindowPortal } from "../DetachedWindowPortal";

describe("DetachedWindowPortal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("debe hacer fallback en overlay cuando window.open esta bloqueado", () => {
    vi.spyOn(window, "open").mockReturnValue(null);

    render(
      <DetachedWindowPortal title="X" onClose={vi.fn()}>
        <div data-testid="detached-child">DETACHED</div>
      </DetachedWindowPortal>
    );

    expect(screen.getByTestId("detached-child")).toBeInTheDocument();
    expect(document.querySelector("[data-detached-fallback='true']")).toBeTruthy();
  });

  it("debe permitir mover el fallback por pantalla con drag", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);

    render(
      <DetachedWindowPortal title="Mover" onClose={vi.fn()}>
        <div>CONTENIDO</div>
      </DetachedWindowPortal>
    );

    const host = document.querySelector("[data-detached-fallback='true']") as HTMLDivElement;
    const drag = screen.getByTestId("detached-fallback-drag");
    expect(host).toBeTruthy();
    expect(host.style.left).toBe("48px");
    expect(host.style.top).toBe("48px");

    fireEvent.mouseDown(drag, { clientX: 60, clientY: 60 });
    fireEvent.mouseMove(window, { clientX: 240, clientY: 180 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(host.style.left).not.toBe("48px");
      expect(host.style.top).not.toBe("48px");
    });
  });
});
