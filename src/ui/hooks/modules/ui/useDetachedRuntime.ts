// src/ui/hooks/modules/ui/useDetachedRuntime.ts
// Hook de runtime para paneles desacoplados: coordina "ready" post-mount y re-dock al salir (pagehide).

import { useEffect, useState } from "react";
import { windowingAdapter, type DetachedPanelContext } from "../../../../adapters/windowingAdapter";

export const useDetachedRuntime = (detachedContext: DetachedPanelContext | null) => {
  const [detachedPanelReady, setDetachedPanelReady] = useState(!detachedContext);

  useEffect(() => {
    if (!detachedContext) {
      setDetachedPanelReady(true);
      return;
    }

    setDetachedPanelReady(false);
    const timer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setDetachedPanelReady(true);
        });
      });
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [detachedContext?.panel]);

  useEffect(() => {
    if (!detachedContext) return;
    const panel = detachedContext.panel;
    const emitDock = () => {
      void windowingAdapter.emitDockPanel(panel);
    };

    // Browser events (portal o navegadores): cubrimos ambos.
    window.addEventListener("pagehide", emitDock);
    window.addEventListener("beforeunload", emitDock);

    // Tauri native close (X): pagehide no siempre dispara en webviews.
    let unlistenClose: (() => void) | null = null;
    void windowingAdapter.listenCurrentWindowCloseRequested(emitDock).then((unlisten) => {
      unlistenClose = unlisten;
    });

    return () => {
      window.removeEventListener("pagehide", emitDock);
      window.removeEventListener("beforeunload", emitDock);
      if (unlistenClose) unlistenClose();
    };
  }, [detachedContext]);

  return { detachedPanelReady };
};
