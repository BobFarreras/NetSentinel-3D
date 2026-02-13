// src/adapters/windowingAdapter.ts
// Adapter de windowing: gestiona paneles desacoplados (Tauri/portal) y eventos internos de docking + sincronizacion de contexto entre ventanas.

import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { UnlistenFn } from "../shared/tauri/bridge";
import type { DeviceDTO } from "../shared/dtos/NetworkDTOs";

export type DetachablePanelId = "console" | "device" | "radar" | "attack_lab" | "scene3d" | "settings";
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

type AttackLabContextPayload = {
  targetDevice: DeviceDTO | null;
  scenarioId?: string;
  autoRun?: boolean;
};

const DOCK_PANEL_EVENT = "netsentinel://dock-panel";
const ATTACK_LAB_CONTEXT_EVENT = "netsentinel://attack-lab-context";
const WINDOW_LABEL_PREFIX = "netsentinel_panel_";
const ATTACK_LAB_BOOTSTRAP_KEY = "netsentinel:attack-lab-detached-bootstrap:v1";

// Feature flag local: permite deshabilitar ventanas nativas Tauri si un entorno concreto falla.
// Por defecto lo dejamos en false: la UX objetivo es ventana independiente movible.
const DISABLE_TAURI_DETACHED_WINDOWS = false;

const panelTitles: Record<DetachablePanelId, string> = {
  console: "NetSentinel - Console Logs",
  device: "NetSentinel - Device Detail",
  radar: "NetSentinel - Radar",
  attack_lab: "NetSentinel - Attack Lab",
  scene3d: "NetSentinel - Network Scene",
  settings: "NetSentinel - Settings / Field Manual",
};

const panelSizes: Record<DetachablePanelId, { width: number; height: number }> = {
  console: { width: 980, height: 420 },
  device: { width: 540, height: 760 },
  radar: { width: 900, height: 700 },
  attack_lab: { width: 900, height: 700 },
  scene3d: { width: 1200, height: 780 },
  settings: { width: 980, height: 740 },
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
  if (panel === "console" || panel === "device" || panel === "radar" || panel === "attack_lab" || panel === "scene3d" || panel === "settings") {
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
    if (DISABLE_TAURI_DETACHED_WINDOWS) {
      return false;
    }
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
    if (DISABLE_TAURI_DETACHED_WINDOWS) {
      return;
    }
    try {
      const target = await WebviewWindow.getByLabel(getPanelLabel(panel));
      if (target) await target.close();
    } catch {
      // No hacemos nada en entorno no Tauri.
    }
  },

  isDetachedPanelWindowOpen: async (panel: DetachablePanelId): Promise<boolean> => {
    if (DISABLE_TAURI_DETACHED_WINDOWS) {
      return false;
    }
    try {
      const target = await WebviewWindow.getByLabel(getPanelLabel(panel));
      return Boolean(target);
    } catch {
      return false;
    }
  },

  closeCurrentWindow: async (): Promise<void> => {
    try {
      const current = getCurrentWindow();
      await current.close();
    } catch {
      // En Tauri, `window.close()` no garantiza cierre nativo y puede dejar la webview en blanco.
      // En web/portal, si falla Tauri, usamos el cierre del navegador.
      if (!isTauriRuntime()) {
        window.close();
      }
    }
  },

  // Cierre forzado de la ventana actual (evita bucles de onCloseRequested).
  destroyCurrentWindow: async (): Promise<void> => {
    try {
      const current = getCurrentWindow();
      await current.destroy();
    } catch {
      if (!isTauriRuntime()) {
        window.close();
      }
    }
  },

  // Hook para capturar el cierre nativo (boton X) en ventanas Tauri.
  // En web/portal no existe, devolvemos un unlisten no-op.
  listenCurrentWindowCloseRequested: async (handler: (event: { preventDefault: () => void }) => void | Promise<void>): Promise<UnlistenFn> => {
    try {
      const current = getCurrentWindow();
      const unlisten = await current.onCloseRequested(async (event) => {
        await handler(event);
      });
      return () => {
        void unlisten();
      };
    } catch {
      return () => {};
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
    } catch {
      window.dispatchEvent(new CustomEvent<AttackLabContextPayload>(ATTACK_LAB_CONTEXT_EVENT, { detail: payload }));
    }
  },

  listenAttackLabContext: async (handler: (payload: AttackLabContextPayload) => void): Promise<UnlistenFn> => {
    try {
      const unlisten1 = await listen<AttackLabContextPayload>(ATTACK_LAB_CONTEXT_EVENT, (event) => {
        if (event.payload) {
          handler(event.payload);
        }
      });
      return () => {
        void unlisten1();
      };
    } catch {
      const callback = (evt: Event) => {
        const custom = evt as CustomEvent<AttackLabContextPayload>;
        if (custom.detail) {
          handler(custom.detail);
        }
      };
      window.addEventListener(ATTACK_LAB_CONTEXT_EVENT, callback as EventListener);
      return () => {
        window.removeEventListener(ATTACK_LAB_CONTEXT_EVENT, callback as EventListener);
      };
    }
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

  // Persistencia ligera de contexto para evitar carreras al abrir una ventana desacoplada.
  // Caso real: Attack Lab undock -> la ventana nueva puede no estar lista para escuchar eventos aun.
  // Al guardar un bootstrap, la ventana hija puede consumirlo al arrancar y pintar el target/escenario.
  setAttackLabDetachedBootstrap: (payload: { targetDevice: DeviceDTO | null; scenarioId?: string | null }) => {
    try {
      const record = {
        ts: Date.now(),
        targetDevice: payload.targetDevice,
        scenarioId: payload.scenarioId ?? undefined,
      };
      localStorage.setItem(ATTACK_LAB_BOOTSTRAP_KEY, JSON.stringify(record));
    } catch {
      // No hacemos nada si localStorage no esta disponible.
    }
  },

  consumeAttackLabDetachedBootstrap: (): { targetDevice: DeviceDTO | null; scenarioId?: string } | null => {
    try {
      const raw = localStorage.getItem(ATTACK_LAB_BOOTSTRAP_KEY);
      if (!raw) return null;

      // Consumimos siempre: si es stale, lo descartamos igualmente para evitar sorpresas.
      localStorage.removeItem(ATTACK_LAB_BOOTSTRAP_KEY);

      const parsed = JSON.parse(raw) as { ts?: number; targetDevice: DeviceDTO | null; scenarioId?: string };
      const ts = typeof parsed.ts === "number" ? parsed.ts : 0;

      // TTL corto: este bootstrap solo tiene sentido justo despues de abrir la ventana.
      if (!ts || Date.now() - ts > 15_000) return null;

      return { targetDevice: parsed.targetDevice ?? null, scenarioId: parsed.scenarioId };
    } catch {
      return null;
    }
  },
};
