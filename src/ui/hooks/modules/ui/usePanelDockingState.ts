// src/ui/hooks/modules/ui/usePanelDockingState.ts
// Hook de docking/undocking: gestiona estado de paneles desacoplados y coordina apertura/cierre de ventanas (Tauri/portal).

import { useCallback, useEffect, useRef, useState } from "react";
import { windowingAdapter, type DetachablePanelId } from "../../../../adapters/windowingAdapter";
import { uiLogger } from "../../../utils/logger";

type DetachedPanels = Record<DetachablePanelId, boolean>;
type DetachedModes = Record<DetachablePanelId, "portal" | "tauri" | null>;

interface UsePanelDockingStateParams {
  selectedDeviceIp?: string;
  attackLabTargetIp?: string;
  attackLabScenarioId?: string | null;
  showRadar: boolean;
  showAttackLab: boolean;
  showSettings: boolean;
}

const initialPanels: DetachedPanels = { console: false, device: false, radar: false, attack_lab: false, scene3d: false, settings: false };
const initialModes: DetachedModes = { console: null, device: null, radar: null, attack_lab: null, scene3d: null, settings: null };

export const usePanelDockingState = ({
  selectedDeviceIp,
  attackLabTargetIp,
  attackLabScenarioId,
  showRadar,
  showAttackLab,
  showSettings,
}: UsePanelDockingStateParams) => {
  const [detachedPanels, setDetachedPanels] = useState<DetachedPanels>(initialPanels);
  const [detachedModes, setDetachedModes] = useState<DetachedModes>(initialModes);
  const closeWatchersRef = useRef<Partial<Record<DetachablePanelId, number>>>({});

  // CLOSE & DOCK
  const dockPanel = useCallback(async (key: DetachablePanelId) => {
    const watcher = closeWatchersRef.current[key];
    if (watcher) {
      window.clearInterval(watcher);
      delete closeWatchersRef.current[key];
    }
    if (detachedModes[key] === "tauri") {
      await windowingAdapter.closeDetachedPanelWindow(key);
    }
    setDetachedPanels((prev) => ({ ...prev, [key]: false }));
    setDetachedModes((prev) => ({ ...prev, [key]: null }));
  }, [detachedModes]);

  // UNDOCK (Obrir finestra independent)
  const undockPanel = useCallback(async (key: DetachablePanelId) => {
    // Captura critica: aseguramos que pasamos los datos actuales en el momento de abrir.
    const targetIp = key === "attack_lab" ? attackLabTargetIp : key === "device" ? selectedDeviceIp : undefined;
    const scenarioId = key === "attack_lab" ? (attackLabScenarioId || undefined) : undefined;
    
    uiLogger.info(`[docking] Undocking panel '${key}'`, { targetIp, scenarioId });

    const openedTauri = await windowingAdapter.openDetachedPanelWindow({ panel: key, targetIp, scenarioId });
    
    setDetachedPanels((prev) => ({ ...prev, [key]: true }));
    setDetachedModes((prev) => ({ ...prev, [key]: openedTauri ? "tauri" : "portal" }));

    // Watchdog: en algunos entornos el evento de cierre no llega desde la ventana hija.
    // Si el usuario cierra con X, detectamos la ausencia de ventana por label y redockeamos.
    if (openedTauri) {
      const existing = closeWatchersRef.current[key];
      if (existing) {
        window.clearInterval(existing);
      }
      closeWatchersRef.current[key] = window.setInterval(() => {
        void windowingAdapter.isDetachedPanelWindowOpen(key).then((isOpen) => {
          if (isOpen) return;
          const watcherId = closeWatchersRef.current[key];
          if (watcherId) {
            window.clearInterval(watcherId);
            delete closeWatchersRef.current[key];
          }
          setDetachedPanels((prev) => ({ ...prev, [key]: false }));
          setDetachedModes((prev) => ({ ...prev, [key]: null }));
        });
      }, 600);
    }
  }, [attackLabScenarioId, attackLabTargetIp, selectedDeviceIp]);

  // LISTEN FOR CLOSE EVENTS (Finestra filla es tanca manualment)
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const boot = async () => {
      unlisten = await windowingAdapter.listenDockPanel((panel) => {
        // La ventana hija indica "me cierro, vuelve a acoplarme".
        uiLogger.info(`[docking] Child window '${panel}' closed. Redocking.`);
        // Importante: si por cualquier motivo la ventana no se ha cerrado aun,
        // cerramos por label y reseteamos estado en main.
        void dockPanel(panel);
      });
    };
    void boot();
    return () => { if (unlisten) unlisten(); };
  }, [dockPanel]);

  useEffect(() => {
    return () => {
      for (const key of Object.keys(closeWatchersRef.current) as DetachablePanelId[]) {
        const id = closeWatchersRef.current[key];
        if (id) window.clearInterval(id);
      }
      closeWatchersRef.current = {};
    };
  }, []);

  // Nota: eliminamos el polling y efectos automaticos que causaban parpadeos.
  // Confiamos en eventos (dock desde ventana) y accion del usuario.

  return {
    detachedPanels,
    detachedModes,
    dockPanel,
    undockPanel,
    showDockRadar: showRadar && !detachedPanels.radar,
    showDockAttackLab: showAttackLab && !detachedPanels.attack_lab,
    showDockSettings: showSettings && !detachedPanels.settings,
    showDockScene: !detachedPanels.scene3d,
    showDockConsole: !detachedPanels.console,
    showDockDevice: !detachedPanels.device,
  };
};
