// src/ui/components/layout/topbar/useTopBarState.ts
// Hook de estado del TopBar: responsive mode, selector de identidad, menu y controles de ventana (Tauri).

import { useEffect, useMemo, useRef, useState } from "react";
import type { HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { useI18n } from "../../../i18n";
import { windowingAdapter } from "../../../../adapters/windowingAdapter";

export type TopBarLayoutMode = "full" | "compact" | "icon" | "menu";
export type IdentitySlot = "ip" | "gw" | "iface" | "mac" | "all";

const computeLayoutMode = (w: number): TopBarLayoutMode => {
  if (w < 760) return "menu";
  if (w < 980) return "icon";
  if (w < 1180) return "compact";
  return "full";
};

export const useTopBarState = (params: { identity: HostIdentity | null }) => {
  const { identity } = params;
  const { t } = useI18n();

  const [layoutMode, setLayoutMode] = useState<TopBarLayoutMode>(() => {
    if (typeof window === "undefined") return "full";
    return computeLayoutMode(window.innerWidth);
  });

  const compact = layoutMode !== "full";
  const menuMode = layoutMode === "menu";
  const iconMode = layoutMode === "icon";

  const [identitySlot, setIdentitySlot] = useState<IdentitySlot>(() => {
    try {
      const raw = localStorage.getItem("netsentinel.topbar.identitySlot");
      if (raw === "ip" || raw === "gw" || raw === "iface" || raw === "mac" || raw === "all") return raw;
      return "ip";
    } catch {
      return "ip";
    }
  });

  useEffect(() => {
    const onResize = () => setLayoutMode(computeLayoutMode(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("netsentinel.topbar.identitySlot", identitySlot);
    } catch {
      // ignore
    }
  }, [identitySlot]);

  const identityLine = useMemo(() => {
    if (!identity) return null;
    const mac = identity.mac ? identity.mac.toUpperCase().replace("-", ":") : "";
    switch (identitySlot) {
      case "ip":
        return `${t("topbar.identity.prefix.ip")}: ${identity.ip}`;
      case "gw":
        return `${t("topbar.identity.prefix.gw")}: ${identity.gatewayIp}`;
      case "iface":
        return `${t("topbar.identity.prefix.iface")}: ${identity.interfaceName}`;
      case "mac":
        return `${t("topbar.identity.prefix.mac")}: ${mac || "?"}`;
      default:
        return `${t("topbar.identity.prefix.ip")}: ${identity.ip}  |  ${t("topbar.identity.prefix.iface")}: ${identity.interfaceName}  |  ${t("topbar.identity.prefix.gw")}: ${identity.gatewayIp}`;
    }
  }, [identity, identitySlot, t]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!menuRef.current) return;
      if (menuRef.current.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!windowingAdapter.isTauriRuntime()) return;
    let cancelled = false;
    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const w = getCurrentWindow();
        const max = await w.isMaximized();
        if (!cancelled) setIsMaximized(Boolean(max));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maybeStartDragging = async (evt: React.MouseEvent) => {
    if (!windowingAdapter.isTauriRuntime()) return;
    if (evt.button !== 0) return;
    const target = evt.target as HTMLElement | null;
    if (target && target.closest("button,select,option,input,a,textarea,label")) return;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {
      // ignore
    }
  };

  const onMinimize = async () => {
    if (!windowingAdapter.isTauriRuntime()) return;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch {}
  };

  const onToggleMaximize = async () => {
    if (!windowingAdapter.isTauriRuntime()) return;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const w = getCurrentWindow();
      await w.toggleMaximize();
      const max = await w.isMaximized();
      setIsMaximized(Boolean(max));
    } catch {}
  };

  const onCloseWindow = async () => {
    await windowingAdapter.closeCurrentWindow();
  };

  return {
    t,
    layoutMode,
    compact,
    menuMode,
    iconMode,
    identitySlot,
    setIdentitySlot,
    identityLine,
    menuOpen,
    setMenuOpen,
    menuRef,
    isMaximized,
    maybeStartDragging,
    onMinimize,
    onToggleMaximize,
    onCloseWindow,
  };
};

