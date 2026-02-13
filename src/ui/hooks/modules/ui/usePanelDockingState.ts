// src/ui/hooks/modules/ui/usePanelDockingState.ts
// Hook de docking/undocking: gestiona estado de paneles desacoplados y coordina apertura/cierre de ventanas (Tauri/portal).

import { useCallback, useEffect, useState } from "react";
import { windowingAdapter, type DetachablePanelId } from "../../../../adapters/windowingAdapter";

type DetachedPanels = Record<DetachablePanelId, boolean>;
type DetachedModes = Record<DetachablePanelId, "portal" | "tauri" | null>;

interface UsePanelDockingStateParams {
  selectedDeviceIp?: string;
  attackLabTargetIp?: string;
  attackLabScenarioId?: string | null;
  showRadar: boolean;
  showAttackLab: boolean;
}

const initialPanels: DetachedPanels = { console: false, device: false, radar: false, attack_lab: false, scene3d: false };
const initialModes: DetachedModes = { console: null, device: null, radar: null, attack_lab: null, scene3d: null };

export const usePanelDockingState = ({
  selectedDeviceIp,
  attackLabTargetIp,
  attackLabScenarioId,
  showRadar,
  showAttackLab,
}: UsePanelDockingStateParams) => {
  const [detachedPanels, setDetachedPanels] = useState<DetachedPanels>(initialPanels);
  const [detachedModes, setDetachedModes] = useState<DetachedModes>(initialModes);

  // CLOSE & DOCK
  const dockPanel = useCallback(async (key: DetachablePanelId) => {
    if (detachedModes[key] === "tauri") {
      await windowingAdapter.closeDetachedPanelWindow(key);
    }
    setDetachedPanels((prev) => ({ ...prev, [key]: false }));
    setDetachedModes((prev) => ({ ...prev, [key]: null }));
  }, [detachedModes]);

  // UNDOCK (Obrir finestra independent)
  const undockPanel = useCallback(async (key: DetachablePanelId) => {
    // CAPTURA CRÍTICA: Assegurem que passem les dades actuals en el moment d'obrir
    const targetIp = key === "attack_lab" ? attackLabTargetIp : key === "device" ? selectedDeviceIp : undefined;
    const scenarioId = key === "attack_lab" ? (attackLabScenarioId || undefined) : undefined;
    
    console.log(`🪟 [DOCKING] Undocking panel '${key}' with Target: ${targetIp}`);

    const openedTauri = await windowingAdapter.openDetachedPanelWindow({ panel: key, targetIp, scenarioId });
    
    setDetachedPanels((prev) => ({ ...prev, [key]: true }));
    setDetachedModes((prev) => ({ ...prev, [key]: openedTauri ? "tauri" : "portal" }));
  }, [attackLabScenarioId, attackLabTargetIp, selectedDeviceIp]);

  // LISTEN FOR CLOSE EVENTS (Finestra filla es tanca manualment)
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const boot = async () => {
      unlisten = await windowingAdapter.listenDockPanel((panel) => {
        // La finestra filla diu "em tanco, torna'm al dock"
        console.log(`🪟 [DOCKING] Child window '${panel}' closed. Redocking.`);
        setDetachedPanels((prev) => ({ ...prev, [panel]: false }));
        setDetachedModes((prev) => ({ ...prev, [panel]: null }));
      });
    };
    void boot();
    return () => { if (unlisten) unlisten(); };
  }, []);

  // NOTA: Hem eliminat el 'polling' i els 'useEffect' automàtics que causaven parpadejos.
  // Ara confiem en l'usuari i els events.

  return {
    detachedPanels,
    detachedModes,
    dockPanel,
    undockPanel,
    showDockRadar: showRadar && !detachedPanels.radar,
    showDockAttackLab: showAttackLab && !detachedPanels.attack_lab,
    showDockScene: !detachedPanels.scene3d,
    showDockConsole: !detachedPanels.console,
    showDockDevice: !detachedPanels.device,
  };
};
