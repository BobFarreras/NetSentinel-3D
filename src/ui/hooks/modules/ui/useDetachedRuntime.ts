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
    const onPageHide = () => {
      void windowingAdapter.emitDockPanel(panel);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [detachedContext]);

  return { detachedPanelReady };
};
