// src/ui/components/layout/TopBar.tsx
// Barra superior: acciones globales (scan/history/radar/attack lab) e informacion de identidad local.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HostIdentity } from '../../../shared/dtos/NetworkDTOs';
import { useI18n } from '../../i18n';
import { windowingAdapter } from '../../../adapters/windowingAdapter';
interface TopBarProps {
  scanning: boolean;
  activeNodes: number;
  onScan: () => void;
  onHistoryToggle: () => void;
  onRadarToggle: () => void;
  onAttackLabToggle: () => void;
  onSettingsToggle: () => void;
  showHistory: boolean;
  showRadar: boolean;
  showAttackLab: boolean;
  showSettings: boolean;
  identity: HostIdentity | null;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  scanning, activeNodes, onScan, onHistoryToggle, onRadarToggle, onAttackLabToggle, onSettingsToggle, showHistory, showRadar, showAttackLab, showSettings, identity
}) => {
  const { t } = useI18n();

  type LayoutMode = "full" | "compact" | "icon" | "menu";
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window === "undefined") return "full";
    const w = window.innerWidth;
    if (w < 760) return "menu";
    if (w < 980) return "icon";
    if (w < 1180) return "compact";
    return "full";
  });

  const compact = layoutMode !== "full";
  const menuMode = layoutMode === "menu";
  const iconMode = layoutMode === "icon";

  const [identitySlot, setIdentitySlot] = useState<"ip" | "gw" | "iface" | "mac" | "all">(() => {
    try {
      const raw = localStorage.getItem("netsentinel.topbar.identitySlot");
      if (raw === "ip" || raw === "gw" || raw === "iface" || raw === "mac" || raw === "all") return raw;
      return "ip";
    } catch {
      return "ip";
    }
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setLayoutMode(w < 760 ? "menu" : w < 980 ? "icon" : w < 1180 ? "compact" : "full");
    };
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
        return `IP: ${identity.ip}`;
      case "gw":
        return `GW: ${identity.gatewayIp}`;
      case "iface":
        return `IF: ${identity.interfaceName}`;
      case "mac":
        return `MAC: ${mac || "?"}`;
      default:
        return `IP: ${identity.ip}  |  IF: ${identity.interfaceName}  |  GW: ${identity.gatewayIp}`;
    }
  }, [identity, identitySlot]);

  const btnBase = (active: boolean, accent: string, border: string): React.CSSProperties => ({
    background: active ? `linear-gradient(180deg, rgba(0,0,0,0.55), ${accent}22)` : 'rgba(0,0,0,0.25)',
    color: active ? accent : 'rgba(183,255,226,0.78)',
    border: `1px solid ${active ? accent : border}`,
    borderRadius: '2px',
    padding: compact ? '5px 10px' : '6px 12px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontFamily: 'inherit',
    letterSpacing: 0.6,
    fontWeight: 900,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 30,
    boxShadow: active ? `0 0 14px ${accent}22` : 'none',
  });

  const btnDot = (active: boolean, color: string): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: 99,
    background: active ? color : 'rgba(0,255,136,0.10)',
    boxShadow: active ? `0 0 10px ${color}99` : 'none',
    flexShrink: 0,
  });

  const iconStroke = (color: string) => ({ stroke: color, fill: "none", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
  const Icons = {
    history: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7" {...iconStroke(color)} />
        <path d="M3 4v5h5" {...iconStroke(color)} />
        <path d="M12 7v6l4 2" {...iconStroke(color)} />
      </svg>
    ),
    radar: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12l7-7" {...iconStroke(color)} />
        <circle cx="12" cy="12" r="9" {...iconStroke(color)} />
        <path d="M12 3v3" {...iconStroke(color)} />
        <path d="M21 12h-3" {...iconStroke(color)} />
      </svg>
    ),
    lab: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 2v6l-5.5 9.5A4 4 0 0 0 8 22h8a4 4 0 0 0 3.5-4.5L14 8V2" {...iconStroke(color)} />
        <path d="M8 16h8" {...iconStroke(color)} />
      </svg>
    ),
    settings: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" {...iconStroke(color)} />
        <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.8a8 8 0 0 0-1.7-1l-.3-2.4H9.1l-.3 2.4a8 8 0 0 0-1.7 1l-2.3-.8-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.8c.5.4 1.1.7 1.7 1l.3 2.4h5.8l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.8 2-3.4-2-1.2z" {...iconStroke(color)} />
      </svg>
    ),
    scan: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7V4h3" {...iconStroke(color)} />
        <path d="M20 7V4h-3" {...iconStroke(color)} />
        <path d="M4 17v3h3" {...iconStroke(color)} />
        <path d="M20 17v3h-3" {...iconStroke(color)} />
        <path d="M7 12h10" {...iconStroke(color)} />
      </svg>
    ),
  };

  // --- Menu para pantallas pequeñas ---
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

  // --- Titlebar custom (Tauri): drag + controles ventana ---
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
    if (target && target.closest("button,select,option,input,a,textarea,label")) {
      return;
    }
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {
      // ignore
    }
  };

  const winBtn: React.CSSProperties = {
    width: 34,
    height: 30,
    borderRadius: 2,
    border: "1px solid rgba(0,229,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(183,255,226,0.80)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontFamily: "monospace",
    fontWeight: 900,
    letterSpacing: 0.6,
    userSelect: "none",
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
    // Reusa el adapter (ya resuelve destroy/close segun entorno).
    await windowingAdapter.closeCurrentWindow();
  };

  return (
    <div style={{
      height: '44px',
      width: "100%",
      background: '#020202',
      borderBottom: '1px solid #004400', // Vora més fina
      display: 'flex',
      alignItems: 'center',
      // En Windows (decorations: false) existe un borde de resize invisible que puede recortar el ultimo boton.
      // Reservamos un poco mas de "safe area" a la derecha para que la X nunca quede cortada.
      padding: '0 16px 0 10px',
      justifyContent: 'space-between',
      boxShadow: '0 5px 15px rgba(0, 255, 0, 0.02)',
      zIndex: 50,
      userSelect: 'none', // Evita seleccionar text per error
      boxSizing: "border-box",
      gap: 10,
    }}
    onMouseDown={maybeStartDragging}
    aria-label="TOPBAR_ROOT"
    >
      {/* Izquierda: logo e identidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Marca compacta (si hace falta espacio, eliminamos texto largo) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 8px',
            height: 30,
            border: '1px solid rgba(0,255,136,0.22)',
            background: 'rgba(0,0,0,0.35)',
            borderRadius: 2,
            boxShadow: 'inset 0 0 0 1px rgba(0,229,255,0.04)',
            flexShrink: 0,
          }}
          title="NetSentinel"
        >
          <span style={{ color: '#00ff88', fontFamily: 'monospace', fontWeight: 950, letterSpacing: 1.2 }}>
            {compact ? 'NS' : 'NETSENTINEL'}
          </span>
          {scanning && (
            <span
              title="Scanner activo"
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: '#00ff88',
                boxShadow: '0 0 12px rgba(0,255,136,0.65)',
                animation: 'nsScanPulse 1.0s ease-in-out infinite',
              }}
            />
          )}
          <style>{`
            @keyframes nsScanPulse {
              0% { transform: scale(0.9); opacity: 0.55; }
              50% { transform: scale(1.25); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0.55; }
            }
          `}</style>
        </div>

        {/* Selector de identidad (para ganar espacio) */}
        {identity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <select
              value={identitySlot}
              onChange={(e) => setIdentitySlot(e.target.value as any)}
              aria-label="TOPBAR_IDENTITY_SLOT"
              style={{
                height: 30,
                borderRadius: 2,
                border: '1px solid rgba(0,229,255,0.20)',
                background: 'rgba(0,0,0,0.45)',
                color: 'rgba(183,255,226,0.85)',
                fontFamily: 'monospace',
                fontSize: 12,
                padding: '0 8px',
              }}
            >
              <option value="ip">IP</option>
              <option value="gw">GW</option>
              <option value="iface">IF</option>
              <option value="mac">MAC</option>
              <option value="all">ALL</option>
            </select>
            <div
              title="Identidad local"
              style={{
                height: 30,
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                borderRadius: 2,
                border: '1px solid rgba(0,255,136,0.12)',
                background: 'rgba(0,0,0,0.25)',
                color: '#88ffcc',
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: menuMode ? 100 : compact ? 120 : 320,
                maxWidth: menuMode ? 140 : compact ? 180 : 520,
              }}
            >
              {identityLine}
            </div>
          </div>
        )}
      </div>

      {/* Centro: controles */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: "center" }}>
        <button
          onClick={() => onScan()}
          disabled={scanning}
          style={{
            ...btnBase(false, '#00ff88', 'rgba(0,255,136,0.25)'),
            background: scanning ? 'rgba(0,255,136,0.08)' : 'rgba(0,0,0,0.25)',
            color: scanning ? 'rgba(0,255,136,0.60)' : 'rgba(183,255,226,0.78)',
            border: scanning ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(0,255,136,0.25)',
            cursor: scanning ? 'wait' : 'pointer',
            minWidth: compact ? 94 : 120,
          }}
          aria-label="TOPBAR_SCAN"
        >
          <span style={btnDot(scanning, '#00ff88')} />
          <span style={{ display: "grid", placeItems: "center" }}>{Icons.scan(scanning ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
          {!menuMode && !iconMode && <span>{scanning ? t('topbar.scanning') : t('topbar.scan')}</span>}
          {!menuMode && iconMode && <span>{scanning ? "..." : "SCAN"}</span>}
        </button>

        {!menuMode ? (
          <>
            <button
              onClick={onHistoryToggle}
              style={btnBase(showHistory, '#00ff88', 'rgba(0,255,136,0.25)')}
              aria-pressed={showHistory}
              aria-label="TOPBAR_HISTORY"
              title={t("topbar.history")}
            >
              <span style={btnDot(showHistory, '#00ff88')} />
              <span style={{ display: "grid", placeItems: "center" }}>{Icons.history(showHistory ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
              {!iconMode && <span>{t('topbar.history')}</span>}
            </button>

            <button
              onClick={onRadarToggle}
              style={btnBase(showRadar, '#66ffcc', 'rgba(0,102,68,0.45)')}
              aria-pressed={showRadar}
              aria-label="TOPBAR_RADAR"
              title={t("topbar.radar")}
            >
              <span style={btnDot(showRadar, '#66ffcc')} />
              <span style={{ display: "grid", placeItems: "center" }}>{Icons.radar(showRadar ? "#66ffcc" : "rgba(183,255,226,0.78)")}</span>
              {!iconMode && <span>{t('topbar.radar')}</span>}
            </button>

            <button
              onClick={onAttackLabToggle}
              style={btnBase(showAttackLab, '#00e5ff', 'rgba(0,58,69,0.55)')}
              aria-pressed={showAttackLab}
              aria-label="TOPBAR_ATTACK_LAB"
              title={t("topbar.attackLab")}
            >
              <span style={btnDot(showAttackLab, '#00e5ff')} />
              <span style={{ display: "grid", placeItems: "center" }}>{Icons.lab(showAttackLab ? "#00e5ff" : "rgba(183,255,226,0.78)")}</span>
              {!iconMode && <span>{t('topbar.attackLab')}</span>}
            </button>

            <button
              onClick={onSettingsToggle}
              style={btnBase(showSettings, '#ffd36b', 'rgba(74,58,16,0.65)')}
              aria-pressed={showSettings}
              aria-label="TOPBAR_SETTINGS"
              title={t("topbar.settings")}
            >
              <span style={btnDot(showSettings, '#ffd36b')} />
              <span style={{ display: "grid", placeItems: "center" }}>{Icons.settings(showSettings ? "#ffd36b" : "rgba(183,255,226,0.78)")}</span>
              {!iconMode && <span>{t('topbar.settings')}</span>}
            </button>
          </>
        ) : (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={btnBase(menuOpen || showHistory || showRadar || showAttackLab || showSettings, "#66ffcc", "rgba(0,102,68,0.45)")}
              aria-label="TOPBAR_MENU"
              aria-expanded={menuOpen}
            >
              <span style={btnDot(menuOpen || showHistory || showRadar || showAttackLab || showSettings, "#66ffcc")} />
              <span>PANELS</span>
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 36,
                  right: 0,
                  width: 220,
                  background: "linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,10,6,0.92))",
                  border: "1px solid rgba(0,229,255,0.22)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.55), 0 0 18px rgba(0,229,255,0.10)",
                  borderRadius: 2,
                  padding: 8,
                  display: "grid",
                  gap: 6,
                  zIndex: 120,
                }}
                aria-label="TOPBAR_MENU_POPOVER"
              >
                <button onClick={() => { onHistoryToggle(); setMenuOpen(false); }} style={btnBase(showHistory, "#00ff88", "rgba(0,255,136,0.25)")} aria-label="MENU_HISTORY">
                  <span style={btnDot(showHistory, "#00ff88")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{Icons.history(showHistory ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.history")}</span>
                </button>
                <button onClick={() => { onRadarToggle(); setMenuOpen(false); }} style={btnBase(showRadar, "#66ffcc", "rgba(0,102,68,0.45)")} aria-label="MENU_RADAR">
                  <span style={btnDot(showRadar, "#66ffcc")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{Icons.radar(showRadar ? "#66ffcc" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.radar")}</span>
                </button>
                <button onClick={() => { onAttackLabToggle(); setMenuOpen(false); }} style={btnBase(showAttackLab, "#00e5ff", "rgba(0,58,69,0.55)")} aria-label="MENU_ATTACK_LAB">
                  <span style={btnDot(showAttackLab, "#00e5ff")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{Icons.lab(showAttackLab ? "#00e5ff" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.attackLab")}</span>
                </button>
                <button onClick={() => { onSettingsToggle(); setMenuOpen(false); }} style={btnBase(showSettings, "#ffd36b", "rgba(74,58,16,0.65)")} aria-label="MENU_SETTINGS">
                  <span style={btnDot(showSettings, "#ffd36b")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{Icons.settings(showSettings ? "#ffd36b" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.settings")}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Derecha: estado */}
      <div style={{ 
        fontSize: '0.8rem',
        color: '#88ff88',
        fontFamily: 'monospace',
        borderLeft: '1px solid #004400',
        paddingLeft: '10px',
        whiteSpace: 'nowrap',
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span>
          {t('topbar.nodes')}: <b style={{ color: '#fff' }}>{activeNodes}</b>
        </span>

        {/* Controles ventana (solo en runtime Tauri) */}
        {windowingAdapter.isTauriRuntime() && (
          <div style={{ display: "flex", gap: 6, marginLeft: 6 }} aria-label="TOPBAR_WINDOW_CONTROLS">
            <button style={winBtn} onClick={() => void onMinimize()} aria-label="WIN_MINIMIZE" title="Minimizar">
              _
            </button>
            <button style={winBtn} onClick={() => void onToggleMaximize()} aria-label="WIN_MAXIMIZE" title={isMaximized ? "Restaurar" : "Maximizar"}>
              {isMaximized ? "▢" : "□"}
            </button>
            <button
              style={{ ...winBtn, border: "1px solid rgba(255,85,85,0.35)", color: "rgba(255,85,85,0.95)" }}
              onClick={() => void onCloseWindow()}
              aria-label="WIN_CLOSE"
              title="Cerrar"
            >
              X
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
