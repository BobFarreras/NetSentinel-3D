import { useCallback, useEffect, useState } from "react";
import { windowingAdapter, type DetachablePanelId } from "../../../../adapters/windowingAdapter";

type DetachedPanels = Record<DetachablePanelId, boolean>;
type DetachedModes = Record<DetachablePanelId, "portal" | "tauri" | null>;

interface UsePanelDockingStateParams {
  selectedDeviceIp?: string;
  externalAuditTargetIp?: string;
  externalAuditScenarioId?: string | null;
  showRadar: boolean;
  showExternalAudit: boolean;
}

const initialPanels: DetachedPanels = {
  console: false,
  device: false,
  radar: false,
  external: false,
  scene3d: false,
};

const initialModes: DetachedModes = {
  console: null,
  device: null,
  radar: null,
  external: null,
  scene3d: null,
};

export const usePanelDockingState = ({
  selectedDeviceIp,
  externalAuditTargetIp,
  externalAuditScenarioId,
  showRadar,
  showExternalAudit,
}: UsePanelDockingStateParams) => {
  const [detachedPanels, setDetachedPanels] = useState<DetachedPanels>(initialPanels);
  const [detachedModes, setDetachedModes] = useState<DetachedModes>(initialModes);

  const dockPanel = useCallback(async (key: DetachablePanelId) => {
    if (detachedModes[key] === "tauri") {
      await windowingAdapter.closeDetachedPanelWindow(key);
    }
    setDetachedPanels((prev) => ({ ...prev, [key]: false }));
    setDetachedModes((prev) => ({ ...prev, [key]: null }));
  }, [detachedModes]);

  const undockPanel = useCallback(async (key: DetachablePanelId) => {
    const targetIp = key === "external" ? externalAuditTargetIp : key === "device" ? selectedDeviceIp : undefined;
    const scenarioId = key === "external" ? (externalAuditScenarioId || undefined) : undefined;
    const openedTauri = await windowingAdapter.openDetachedPanelWindow({ panel: key, targetIp, scenarioId });
    setDetachedPanels((prev) => ({ ...prev, [key]: true }));
    setDetachedModes((prev) => ({ ...prev, [key]: openedTauri ? "tauri" : "portal" }));
  }, [externalAuditScenarioId, externalAuditTargetIp, selectedDeviceIp]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const boot = async () => {
      unlisten = await windowingAdapter.listenDockPanel((panel) => {
        void windowingAdapter.closeDetachedPanelWindow(panel);
        setDetachedPanels((prev) => ({ ...prev, [panel]: false }));
        setDetachedModes((prev) => ({ ...prev, [panel]: null }));
      });
    };
    void boot();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const panels: DetachablePanelId[] = ["console", "device", "radar", "external", "scene3d"];
      panels.forEach((panel) => {
        if (!detachedPanels[panel]) return;
        if (detachedModes[panel] !== "tauri") return;
        void windowingAdapter.isDetachedPanelWindowOpen(panel).then((open) => {
          if (open) return;
          setDetachedPanels((prev) => ({ ...prev, [panel]: false }));
          setDetachedModes((prev) => ({ ...prev, [panel]: null }));
        });
      });
    }, 700);

    return () => {
      window.clearInterval(timer);
    };
  }, [detachedModes, detachedPanels]);

  useEffect(() => {
    if (!showRadar && detachedModes.radar === "tauri") {
      void dockPanel("radar");
    }
  }, [detachedModes.radar, dockPanel, showRadar]);

  useEffect(() => {
    if (!showExternalAudit && detachedModes.external === "tauri") {
      void dockPanel("external");
    }
  }, [detachedModes.external, dockPanel, showExternalAudit]);

  return {
    detachedPanels,
    detachedModes,
    dockPanel,
    undockPanel,
    showDockRadar: showRadar && !detachedPanels.radar,
    showDockExternal: showExternalAudit && !detachedPanels.external,
    showDockScene: !detachedPanels.scene3d,
    showDockConsole: !detachedPanels.console,
    showDockDevice: !detachedPanels.device,
  };
};
