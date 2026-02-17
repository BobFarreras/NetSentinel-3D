// src/ui/hooks/modules/ui/useDetachedRuntime.ts
// Hook de runtime para paneles desacoplados: coordina "ready" post-mount.
// Nota: NO gestiona cierre/redock. El cierre de ventana debe ser nativo (X) y el core detecta el cierre desde el main.

import { useEffect, useState } from "react";
import { type DetachedPanelContext } from "../../../../adapters/windowingAdapter";

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

  return { detachedPanelReady };
};
