// src/adapters/windowingAdapter.ts
// Adapter de windowing: gestiona paneles desacoplados (Tauri/portal) y eventos internos de docking + sincronizacion de contexto entre ventanas.

import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { UnlistenFn } from "../shared/tauri/bridge";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";

export type DetachablePanelId = "console" | "device" | "radar" | "attack_lab" | "scene3d";
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
  panel: DetachablePanelId | "external"; // legacy
};

type AttackLabContextPayload = {
  targetDevice: DeviceDTO | null;
  scenarioId?: string;
  autoRun?: boolean;
};

const DOCK_PANEL_EVENT = "netsentinel://dock-panel";
const ATTACK_LAB_CONTEXT_EVENT = "netsentinel://attack-lab-context";
const LEGACY_EXTERNAL_CONTEXT_EVENT = "netsentinel://external-context";
const WINDOW_LABEL_PREFIX = "netsentinel_panel_";

const panelTitles: Record<DetachablePanelId, string> = {
  console: "NetSentinel - Console Logs",
  device: "NetSentinel - Device Detail",
  radar: "NetSentinel - Radar",
  attack_lab: "NetSentinel - Attack Lab",
  scene3d: "NetSentinel - Network Scene",
};

const panelSizes: Record<DetachablePanelId, { width: number; height: number }> = {
  console: { width: 980, height: 420 },
  device: { width: 540, height: 760 },
  radar: { width: 900, height: 700 },
  attack_lab: { width: 900, height: 700 },
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

const normalizePanelId = (panel: string | null): DetachablePanelId | null => {
  if (!panel) return null;
  if (panel === "external") return "attack_lab"; // legacy
  if (panel === "console" || panel === "device" || panel === "radar" || panel === "attack_lab" || panel === "scene3d") {
    return panel;
  }
  return null;
};

export const windowingAdapter = {
  isTauriRuntime,

  parseDetachedContextFromLocation: () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("detached") !== "1") {
      return null;
    }

    const panel = normalizePanelId(params.get("panel"));
    if (!panel) return null;

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

  emitAttackLabContext: async (payload: AttackLabContextPayload): Promise<void> => {
    try {
      await emit(ATTACK_LAB_CONTEXT_EVENT, payload);
      await emit(LEGACY_EXTERNAL_CONTEXT_EVENT, payload); // compat
    } catch {
      window.dispatchEvent(new CustomEvent<AttackLabContextPayload>(ATTACK_LAB_CONTEXT_EVENT, { detail: payload }));
      window.dispatchEvent(new CustomEvent<AttackLabContextPayload>(LEGACY_EXTERNAL_CONTEXT_EVENT, { detail: payload }));
    }
  },

  listenAttackLabContext: async (handler: (payload: AttackLabContextPayload) => void): Promise<UnlistenFn> => {
    try {
      const unlisten1 = await listen<AttackLabContextPayload>(ATTACK_LAB_CONTEXT_EVENT, (event) => {
        if (event.payload) {
          handler(event.payload);
        }
      });
      const unlisten2 = await listen<AttackLabContextPayload>(LEGACY_EXTERNAL_CONTEXT_EVENT, (event) => {
        if (event.payload) {
          handler(event.payload);
        }
      });
      return () => {
        void unlisten1();
        void unlisten2();
      };
    } catch {
      const callback = (evt: Event) => {
        const custom = evt as CustomEvent<AttackLabContextPayload>;
        if (custom.detail) {
          handler(custom.detail);
        }
      };
      window.addEventListener(ATTACK_LAB_CONTEXT_EVENT, callback as EventListener);
      window.addEventListener(LEGACY_EXTERNAL_CONTEXT_EVENT, callback as EventListener);
      return () => {
        window.removeEventListener(ATTACK_LAB_CONTEXT_EVENT, callback as EventListener);
        window.removeEventListener(LEGACY_EXTERNAL_CONTEXT_EVENT, callback as EventListener);
      };
    }
  },

  // Shims legacy: conservamos nombres historicos para no romper imports externos.
  emitExternalAuditContext: async (payload: AttackLabContextPayload): Promise<void> => {
    return await windowingAdapter.emitAttackLabContext(payload);
  },
  listenExternalAuditContext: async (handler: (payload: AttackLabContextPayload) => void): Promise<UnlistenFn> => {
    return await windowingAdapter.listenAttackLabContext(handler);
  },

  listenDockPanel: async (handler: (panel: DetachablePanelId) => void): Promise<UnlistenFn> => {
    try {
      const unlisten = await listen<DockPanelPayload>(DOCK_PANEL_EVENT, (event) => {
        if (event.payload?.panel) {
          const normalized = normalizePanelId(event.payload.panel);
          if (normalized) handler(normalized);
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
        const normalized = normalizePanelId(panel);
        if (normalized) handler(normalized);
      };
      window.addEventListener(DOCK_PANEL_EVENT, callback as EventListener);
      return () => {
        window.removeEventListener(DOCK_PANEL_EVENT, callback as EventListener);
      };
    }
  },
};
