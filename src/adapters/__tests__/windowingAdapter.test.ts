import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const emitMock = vi.fn();
  const listenMock = vi.fn();
  const getByLabelMock = vi.fn();
  const currentCloseMock = vi.fn();

  let failWindowCreate = false;

  class MockWebviewWindow {
    static getByLabel = getByLabelMock;

    constructor(_label: string, _options: Record<string, unknown>) {
      if (failWindowCreate) {
        throw new Error("create error");
      }
    }

    once(event: string, cb: () => void): Promise<void> {
      if (event === "tauri://created") {
        cb();
      }
      return Promise.resolve();
    }
  }

  const getCurrentWebviewWindowMock = vi.fn(() => ({
    close: currentCloseMock,
  }));

  return {
    emitMock,
    listenMock,
    getByLabelMock,
    currentCloseMock,
    MockWebviewWindow,
    getCurrentWebviewWindowMock,
    setFailWindowCreate: (value: boolean) => {
      failWindowCreate = value;
    },
  };
});

vi.mock("@tauri-apps/api/event", () => ({
  emit: mocks.emitMock,
  listen: mocks.listenMock,
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: mocks.MockWebviewWindow,
  getCurrentWebviewWindow: mocks.getCurrentWebviewWindowMock,
}));

import { windowingAdapter } from "../windowingAdapter";

describe("windowingAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setFailWindowCreate(false);
    window.history.replaceState({}, "", "/");
  });

  it("parsea contexto detached desde query params", () => {
    window.history.replaceState({}, "", "/?detached=1&panel=scene3d&targetIp=192.168.1.10");

    const ctx = windowingAdapter.parseDetachedContextFromLocation();

    expect(ctx).toEqual({
      panel: "scene3d",
      targetIp: "192.168.1.10",
      scenarioId: undefined,
    });
  });

  it("abre ventana nativa aunque no exista bandera __TAURI_INTERNALS__", async () => {
    mocks.getByLabelMock.mockResolvedValue(null);

    const opened = await windowingAdapter.openDetachedPanelWindow({ panel: "radar" });

    expect(opened).toBe(true);
    expect(mocks.getByLabelMock).toHaveBeenCalledWith("netsentinel_panel_radar");
  });

  it("retorna false cuando falla creacion de ventana nativa", async () => {
    mocks.getByLabelMock.mockResolvedValue(null);
    mocks.setFailWindowCreate(true);

    const opened = await windowingAdapter.openDetachedPanelWindow({ panel: "attack_lab" });

    expect(opened).toBe(false);
  });

  it("informa si la ventana desacoplada existe por label", async () => {
    mocks.getByLabelMock.mockResolvedValue({ label: "netsentinel_panel_console" });

    const open = await windowingAdapter.isDetachedPanelWindowOpen("console");

    expect(open).toBe(true);
  });

  it("usa fallback CustomEvent cuando emit de Tauri falla", async () => {
    mocks.emitMock.mockRejectedValue(new Error("no tauri"));
    const handler = vi.fn();
    window.addEventListener("netsentinel://dock-panel", handler as EventListener);

    await windowingAdapter.emitDockPanel("console");

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("netsentinel://dock-panel", handler as EventListener);
  });

  it("usa fallback local para listenDockPanel cuando Tauri listen falla", async () => {
    mocks.listenMock.mockRejectedValue(new Error("no tauri"));
    const handler = vi.fn();

    const unlisten = await windowingAdapter.listenDockPanel(handler);
    window.dispatchEvent(new CustomEvent("netsentinel://dock-panel", { detail: { panel: "device" } }));

    expect(handler).toHaveBeenCalledWith("device");
    unlisten();
  });

  it("emite contexto de external por fallback cuando Tauri emit falla", async () => {
    mocks.emitMock.mockRejectedValue(new Error("no tauri"));
    const handler = vi.fn();
    window.addEventListener("netsentinel://external-context", handler as EventListener);

    await windowingAdapter.emitExternalAuditContext({
      targetDevice: { ip: "192.168.1.50", mac: "AA:BB", vendor: "TestDevice" },
      scenarioId: "device_http_headers",
      autoRun: true,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("netsentinel://external-context", handler as EventListener);
  });

  it("escucha contexto de external por fallback cuando Tauri listen falla", async () => {
    mocks.listenMock.mockRejectedValue(new Error("no tauri"));
    const handler = vi.fn();

    const unlisten = await windowingAdapter.listenExternalAuditContext(handler);
    window.dispatchEvent(new CustomEvent("netsentinel://external-context", {
      detail: {
        targetDevice: { ip: "192.168.1.77", mac: "CC:DD", vendor: "IoT" },
        scenarioId: "router_recon_ping_tracert",
        autoRun: true,
      },
    }));

    expect(handler).toHaveBeenCalledWith({
      targetDevice: { ip: "192.168.1.77", mac: "CC:DD", vendor: "IoT" },
      scenarioId: "router_recon_ping_tracert",
      autoRun: true,
    });
    unlisten();
  });

  it("hace fallback a window.close cuando cerrar ventana Tauri falla", async () => {
    const windowCloseSpy = vi.spyOn(window, "close").mockImplementation(() => undefined);
    mocks.currentCloseMock.mockRejectedValue(new Error("no tauri"));

    await windowingAdapter.closeCurrentWindow();

    expect(windowCloseSpy).toHaveBeenCalledTimes(1);
    windowCloseSpy.mockRestore();
  });
});
