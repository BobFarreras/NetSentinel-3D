// src/ui/components/layout/topbar/TopBarPanelControls.tsx
// Controles de paneles en TopBar: scan + toggles (History/Radar/AttackLab/Settings) en modo inline o menu responsive.

import React from "react";
import { TopBarIcons } from "./topbarIcons";
import { topbarBtnBase, topbarBtnDot } from "./topbarStyles";

export const TopBarPanelControls: React.FC<{
  scanning: boolean;
  onScan: () => void;
  showHistory: boolean;
  showRadar: boolean;
  showAttackLab: boolean;
  showSettings: boolean;
  onHistoryToggle: () => void;
  onRadarToggle: () => void;
  onAttackLabToggle: () => void;
  onSettingsToggle: () => void;
  compact: boolean;
  menuMode: boolean;
  iconMode: boolean;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  t: (k: any) => string;
}> = (props) => {
  const {
    scanning,
    onScan,
    showHistory,
    showRadar,
    showAttackLab,
    showSettings,
    onHistoryToggle,
    onRadarToggle,
    onAttackLabToggle,
    onSettingsToggle,
    compact,
    menuMode,
    iconMode,
    menuOpen,
    setMenuOpen,
    menuRef,
    t,
  } = props;

  return (
    <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
      <button
        onClick={() => onScan()}
        disabled={scanning}
        style={{
          ...topbarBtnBase({ active: false, accent: "#00ff88", border: "rgba(0,255,136,0.25)", compact }),
          background: scanning ? "rgba(0,255,136,0.08)" : "rgba(0,0,0,0.25)",
          color: scanning ? "rgba(0,255,136,0.60)" : "rgba(183,255,226,0.78)",
          border: scanning ? "1px solid rgba(0,255,136,0.35)" : "1px solid rgba(0,255,136,0.25)",
          cursor: scanning ? "wait" : "pointer",
          minWidth: compact ? 94 : 120,
        }}
        aria-label="TOPBAR_SCAN"
      >
        <span style={topbarBtnDot(scanning, "#00ff88")} />
        <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.scan(scanning ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
        {!menuMode && !iconMode && <span>{scanning ? t("topbar.scanning") : t("topbar.scan")}</span>}
        {!menuMode && iconMode && <span>{scanning ? t("topbar.scanningShort") : t("topbar.scanShort")}</span>}
      </button>

      {!menuMode ? (
        <>
          <button
            onClick={onHistoryToggle}
            style={topbarBtnBase({ active: showHistory, accent: "#00ff88", border: "rgba(0,255,136,0.25)", compact })}
            aria-pressed={showHistory}
            aria-label="TOPBAR_HISTORY"
            title={t("topbar.history")}
          >
            <span style={topbarBtnDot(showHistory, "#00ff88")} />
            <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.history(showHistory ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
            {!iconMode && <span>{t("topbar.history")}</span>}
          </button>

          <button
            onClick={onRadarToggle}
            style={topbarBtnBase({ active: showRadar, accent: "#66ffcc", border: "rgba(0,102,68,0.45)", compact })}
            aria-pressed={showRadar}
            aria-label="TOPBAR_RADAR"
            title={t("topbar.radar")}
          >
            <span style={topbarBtnDot(showRadar, "#66ffcc")} />
            <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.radar(showRadar ? "#66ffcc" : "rgba(183,255,226,0.78)")}</span>
            {!iconMode && <span>{t("topbar.radar")}</span>}
          </button>

          <button
            onClick={onAttackLabToggle}
            style={topbarBtnBase({ active: showAttackLab, accent: "#00e5ff", border: "rgba(0,58,69,0.55)", compact })}
            aria-pressed={showAttackLab}
            aria-label="TOPBAR_ATTACK_LAB"
            title={t("topbar.attackLab")}
          >
            <span style={topbarBtnDot(showAttackLab, "#00e5ff")} />
            <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.lab(showAttackLab ? "#00e5ff" : "rgba(183,255,226,0.78)")}</span>
            {!iconMode && <span>{t("topbar.attackLab")}</span>}
          </button>

          <button
            onClick={onSettingsToggle}
            style={topbarBtnBase({ active: showSettings, accent: "#ffd36b", border: "rgba(74,58,16,0.65)", compact })}
            aria-pressed={showSettings}
            aria-label="TOPBAR_SETTINGS"
            title={t("topbar.settings")}
          >
            <span style={topbarBtnDot(showSettings, "#ffd36b")} />
            <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.settings(showSettings ? "#ffd36b" : "rgba(183,255,226,0.78)")}</span>
            {!iconMode && <span>{t("topbar.settings")}</span>}
          </button>
        </>
      ) : (
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={topbarBtnBase({
              active: menuOpen || showHistory || showRadar || showAttackLab || showSettings,
              accent: "#66ffcc",
              border: "rgba(0,102,68,0.45)",
              compact,
            })}
            aria-label="TOPBAR_MENU"
            aria-expanded={menuOpen}
          >
            <span style={topbarBtnDot(menuOpen || showHistory || showRadar || showAttackLab || showSettings, "#66ffcc")} />
            <span>{t("topbar.menu.panels")}</span>
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
              <button
                onClick={() => {
                  onHistoryToggle();
                  setMenuOpen(false);
                }}
                style={topbarBtnBase({ active: showHistory, accent: "#00ff88", border: "rgba(0,255,136,0.25)", compact })}
                aria-label="MENU_HISTORY"
              >
                <span style={topbarBtnDot(showHistory, "#00ff88")} />
                <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.history(showHistory ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
                <span>{t("topbar.history")}</span>
              </button>
              <button
                onClick={() => {
                  onRadarToggle();
                  setMenuOpen(false);
                }}
                style={topbarBtnBase({ active: showRadar, accent: "#66ffcc", border: "rgba(0,102,68,0.45)", compact })}
                aria-label="MENU_RADAR"
              >
                <span style={topbarBtnDot(showRadar, "#66ffcc")} />
                <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.radar(showRadar ? "#66ffcc" : "rgba(183,255,226,0.78)")}</span>
                <span>{t("topbar.radar")}</span>
              </button>
              <button
                onClick={() => {
                  onAttackLabToggle();
                  setMenuOpen(false);
                }}
                style={topbarBtnBase({ active: showAttackLab, accent: "#00e5ff", border: "rgba(0,58,69,0.55)", compact })}
                aria-label="MENU_ATTACK_LAB"
              >
                <span style={topbarBtnDot(showAttackLab, "#00e5ff")} />
                <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.lab(showAttackLab ? "#00e5ff" : "rgba(183,255,226,0.78)")}</span>
                <span>{t("topbar.attackLab")}</span>
              </button>
              <button
                onClick={() => {
                  onSettingsToggle();
                  setMenuOpen(false);
                }}
                style={topbarBtnBase({ active: showSettings, accent: "#ffd36b", border: "rgba(74,58,16,0.65)", compact })}
                aria-label="MENU_SETTINGS"
              >
                <span style={topbarBtnDot(showSettings, "#ffd36b")} />
                <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.settings(showSettings ? "#ffd36b" : "rgba(183,255,226,0.78)")}</span>
                <span>{t("topbar.settings")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
