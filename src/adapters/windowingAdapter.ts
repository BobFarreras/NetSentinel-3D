import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { UnlistenFn } from "../shared/tauri/bridge";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";

export type DetachablePanelId = "console" | "device" | "radar" | "external" | "scene3d";
export type DetachedPanelContext = {
  panel: DetachablePanelId;
  targetIp?: string;
  scenarioId?: string;
};

type OpenPanelWindowArgs = {
  panel: DetachablePanelId;
  targetIp?: string;
  scenarioId?: string;
};

type DockPanelPayload = {
  panel: DetachablePanelId;
};

type ExternalAuditContextPayload = {
  targetDevice: DeviceDTO | null;
  scenarioId?: string;
  autoRun?: boolean;
};

const DOCK_PANEL_EVENT = "netsentinel://dock-panel";
const EXTERNAL_CONTEXT_EVENT = "netsentinel://external-context";
const WINDOW_LABEL_PREFIX = "netsentinel_panel_";

const panelTitles: Record<DetachablePanelId, string> = {
  console: "NetSentinel - Console Logs",
  device: "NetSentinel - Device Detail",
  radar: "NetSentinel - Radar",
  external: "NetSentinel - External Audit",
  scene3d: "NetSentinel - Network Scene",
};

const panelSizes: Record<DetachablePanelId, { width: number; height: number }> = {
  console: { width: 980, height: 420 },
  device: { width: 540, height: 760 },
  radar: { width: 900, height: 700 },
  external: { width: 900, height: 700 },
  scene3d: { width: 1200, height: 780 },
};

const isTauriRuntime = () => {
  if (typeof window === "undefined") return false;
  const scopedWindow = window as Window & {
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: unknown;
  };
  return Boolean(scopedWindow.__TAURI_INTERNALS__ || scopedWindow.__TAURI__);
};

const getPanelLabel = (panel: DetachablePanelId) => `${WINDOW_LABEL_PREFIX}${panel}`;

const buildDetachedUrl = ({ panel, targetIp, scenarioId }: OpenPanelWindowArgs) => {
  const params = new URLSearchParams();
  params.set("detached", "1");
  params.set("panel", panel);
  if (targetIp) params.set("targetIp", targetIp);
  if (scenarioId) params.set("scenarioId", scenarioId);
  return `/?${params.toString()}`;
};

export const windowingAdapter = {
  isTauriRuntime,

  parseDetachedContextFromLocation: () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("detached") !== "1") {
      return null;
    }

    const panel = params.get("panel");
    if (panel !== "console" && panel !== "device" && panel !== "radar" && panel !== "external" && panel !== "scene3d") {
      return null;
    }

    return {
      panel,
      targetIp: params.get("targetIp") || undefined,
      scenarioId: params.get("scenarioId") || undefined,
    } as DetachedPanelContext;
  },

  openDetachedPanelWindow: async (args: OpenPanelWindowArgs): Promise<boolean> => {
    try {
      const label = getPanelLabel(args.panel);
      const existing = await WebviewWindow.getByLabel(label);
      if (existing) {
        await existing.close();
      }

      const size = panelSizes[args.panel];
      const next = new WebviewWindow(label, {
        title: panelTitles[args.panel],
        url: buildDetachedUrl(args),
        width: size.width,
        height: size.height,
        resizable: true,
        center: true,
        focus: true,
      });

      return await new Promise<boolean>((resolve) => {
        const timeout = window.setTimeout(() => resolve(false), 2500);
        void next.once("tauri://created", () => {
          window.clearTimeout(timeout);
          resolve(true);
        });
        void next.once("tauri://error", () => {
          window.clearTimeout(timeout);
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  },

  closeDetachedPanelWindow: async (panel: DetachablePanelId): Promise<void> => {
    try {
      const target = await WebviewWindow.getByLabel(getPanelLabel(panel));
      if (target) await target.close();
    } catch {
      // No hacemos nada en entorno no Tauri.
    }
  },

  isDetachedPanelWindowOpen: async (panel: DetachablePanelId): Promise<boolean> => {
    try {
      const target = await WebviewWindow.getByLabel(getPanelLabel(panel));
      return Boolean(target);
    } catch {
      return false;
    }
  },

  closeCurrentWindow: async (): Promise<void> => {
    try {
      const current = getCurrentWebviewWindow();
      await current.close();
    } catch {
      window.close();
    }
  },

  emitDockPanel: async (panel: DetachablePanelId): Promise<void> => {
    try {
      await emit(DOCK_PANEL_EVENT, { panel } satisfies DockPanelPayload);
    } catch {
      window.dispatchEvent(new CustomEvent<DockPanelPayload>(DOCK_PANEL_EVENT, { detail: { panel } }));
    }
  },

  emitExternalAuditContext: async (payload: ExternalAuditContextPayload): Promise<void> => {
    try {
      await emit(EXTERNAL_CONTEXT_EVENT, payload);
    } catch {
      window.dispatchEvent(new CustomEvent<ExternalAuditContextPayload>(EXTERNAL_CONTEXT_EVENT, { detail: payload }));
    }
  },

  listenExternalAuditContext: async (handler: (payload: ExternalAuditContextPayload) => void): Promise<UnlistenFn> => {
    try {
      const unlisten = await listen<ExternalAuditContextPayload>(EXTERNAL_CONTEXT_EVENT, (event) => {
        if (event.payload) {
          handler(event.payload);
        }
      });
      return () => {
        void unlisten();
      };
    } catch {
      const callback = (evt: Event) => {
        const custom = evt as CustomEvent<ExternalAuditContextPayload>;
        if (custom.detail) {
          handler(custom.detail);
        }
      };
      window.addEventListener(EXTERNAL_CONTEXT_EVENT, callback as EventListener);
      return () => {
        window.removeEventListener(EXTERNAL_CONTEXT_EVENT, callback as EventListener);
      };
    }
  },

  listenDockPanel: async (handler: (panel: DetachablePanelId) => void): Promise<UnlistenFn> => {
    try {
      const unlisten = await listen<DockPanelPayload>(DOCK_PANEL_EVENT, (event) => {
        if (event.payload?.panel) {
          handler(event.payload.panel);
        }
      });
      return () => {
        void unlisten();
      };
    } catch {
      const callback = (evt: Event) => {
        const custom = evt as CustomEvent<DockPanelPayload>;
        const panel = custom.detail?.panel;
        if (!panel) return;
        handler(panel);
      };
      window.addEventListener(DOCK_PANEL_EVENT, callback as EventListener);
      return () => {
        window.removeEventListener(DOCK_PANEL_EVENT, callback as EventListener);
      };
    }
  },
};
