// src/ui/components/layout/TopBar.tsx
// Barra superior: acciones globales (scan/history/radar/attack lab) e informacion de identidad local.

import React from 'react';
import { HostIdentity } from '../../../shared/dtos/NetworkDTOs';
import { windowingAdapter } from '../../../adapters/windowingAdapter';
import { TopBarIcons } from './topbar/topbarIcons';
import { topbarBtnBase, topbarBtnDot, topbarWinBtn } from './topbar/topbarStyles';
import { useTopBarState } from './topbar/useTopBarState';
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
  const st = useTopBarState({ identity });
  const { t } = st;

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
    onMouseDown={st.maybeStartDragging}
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
            {st.compact ? 'NS' : 'NETSENTINEL'}
          </span>
          {scanning && (
            <span
              title={t("topbar.scan.activeTitle")}
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
              value={st.identitySlot}
              onChange={(e) => st.setIdentitySlot(e.target.value as any)}
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
              <option value="ip">{t("topbar.identity.slot.ip")}</option>
              <option value="gw">{t("topbar.identity.slot.gw")}</option>
              <option value="iface">{t("topbar.identity.slot.iface")}</option>
              <option value="mac">{t("topbar.identity.slot.mac")}</option>
              <option value="all">{t("topbar.identity.slot.all")}</option>
            </select>
            <div
              title={t("topbar.identity.title")}
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
                minWidth: st.menuMode ? 100 : st.compact ? 120 : 320,
                maxWidth: st.menuMode ? 140 : st.compact ? 180 : 520,
              }}
            >
              {st.identityLine}
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
            ...topbarBtnBase({ active: false, accent: '#00ff88', border: 'rgba(0,255,136,0.25)', compact: st.compact }),
            background: scanning ? 'rgba(0,255,136,0.08)' : 'rgba(0,0,0,0.25)',
            color: scanning ? 'rgba(0,255,136,0.60)' : 'rgba(183,255,226,0.78)',
            border: scanning ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(0,255,136,0.25)',
            cursor: scanning ? 'wait' : 'pointer',
            minWidth: st.compact ? 94 : 120,
          }}
          aria-label="TOPBAR_SCAN"
        >
          <span style={topbarBtnDot(scanning, '#00ff88')} />
          <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.scan(scanning ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
          {!st.menuMode && !st.iconMode && <span>{scanning ? t('topbar.scanning') : t('topbar.scan')}</span>}
          {!st.menuMode && st.iconMode && <span>{scanning ? t("topbar.scanningShort") : t("topbar.scanShort")}</span>}
        </button>

        {!st.menuMode ? (
          <>
            <button
              onClick={onHistoryToggle}
              style={topbarBtnBase({ active: showHistory, accent: '#00ff88', border: 'rgba(0,255,136,0.25)', compact: st.compact })}
              aria-pressed={showHistory}
              aria-label="TOPBAR_HISTORY"
              title={t("topbar.history")}
            >
              <span style={topbarBtnDot(showHistory, '#00ff88')} />
              <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.history(showHistory ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
              {!st.iconMode && <span>{t('topbar.history')}</span>}
            </button>

            <button
              onClick={onRadarToggle}
              style={topbarBtnBase({ active: showRadar, accent: '#66ffcc', border: 'rgba(0,102,68,0.45)', compact: st.compact })}
              aria-pressed={showRadar}
              aria-label="TOPBAR_RADAR"
              title={t("topbar.radar")}
            >
              <span style={topbarBtnDot(showRadar, '#66ffcc')} />
              <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.radar(showRadar ? "#66ffcc" : "rgba(183,255,226,0.78)")}</span>
              {!st.iconMode && <span>{t('topbar.radar')}</span>}
            </button>

            <button
              onClick={onAttackLabToggle}
              style={topbarBtnBase({ active: showAttackLab, accent: '#00e5ff', border: 'rgba(0,58,69,0.55)', compact: st.compact })}
              aria-pressed={showAttackLab}
              aria-label="TOPBAR_ATTACK_LAB"
              title={t("topbar.attackLab")}
            >
              <span style={topbarBtnDot(showAttackLab, '#00e5ff')} />
              <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.lab(showAttackLab ? "#00e5ff" : "rgba(183,255,226,0.78)")}</span>
              {!st.iconMode && <span>{t('topbar.attackLab')}</span>}
            </button>

            <button
              onClick={onSettingsToggle}
              style={topbarBtnBase({ active: showSettings, accent: '#ffd36b', border: 'rgba(74,58,16,0.65)', compact: st.compact })}
              aria-pressed={showSettings}
              aria-label="TOPBAR_SETTINGS"
              title={t("topbar.settings")}
            >
              <span style={topbarBtnDot(showSettings, '#ffd36b')} />
              <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.settings(showSettings ? "#ffd36b" : "rgba(183,255,226,0.78)")}</span>
              {!st.iconMode && <span>{t('topbar.settings')}</span>}
            </button>
          </>
        ) : (
          <div ref={st.menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => st.setMenuOpen((v) => !v)}
              style={topbarBtnBase({ active: st.menuOpen || showHistory || showRadar || showAttackLab || showSettings, accent: "#66ffcc", border: "rgba(0,102,68,0.45)", compact: st.compact })}
              aria-label="TOPBAR_MENU"
              aria-expanded={st.menuOpen}
            >
              <span style={topbarBtnDot(st.menuOpen || showHistory || showRadar || showAttackLab || showSettings, "#66ffcc")} />
              <span>{t("topbar.menu.panels")}</span>
            </button>
            {st.menuOpen && (
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
                <button onClick={() => { onHistoryToggle(); st.setMenuOpen(false); }} style={topbarBtnBase({ active: showHistory, accent: "#00ff88", border: "rgba(0,255,136,0.25)", compact: st.compact })} aria-label="MENU_HISTORY">
                  <span style={topbarBtnDot(showHistory, "#00ff88")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.history(showHistory ? "#00ff88" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.history")}</span>
                </button>
                <button onClick={() => { onRadarToggle(); st.setMenuOpen(false); }} style={topbarBtnBase({ active: showRadar, accent: "#66ffcc", border: "rgba(0,102,68,0.45)", compact: st.compact })} aria-label="MENU_RADAR">
                  <span style={topbarBtnDot(showRadar, "#66ffcc")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.radar(showRadar ? "#66ffcc" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.radar")}</span>
                </button>
                <button onClick={() => { onAttackLabToggle(); st.setMenuOpen(false); }} style={topbarBtnBase({ active: showAttackLab, accent: "#00e5ff", border: "rgba(0,58,69,0.55)", compact: st.compact })} aria-label="MENU_ATTACK_LAB">
                  <span style={topbarBtnDot(showAttackLab, "#00e5ff")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.lab(showAttackLab ? "#00e5ff" : "rgba(183,255,226,0.78)")}</span>
                  <span>{t("topbar.attackLab")}</span>
                </button>
                <button onClick={() => { onSettingsToggle(); st.setMenuOpen(false); }} style={topbarBtnBase({ active: showSettings, accent: "#ffd36b", border: "rgba(74,58,16,0.65)", compact: st.compact })} aria-label="MENU_SETTINGS">
                  <span style={topbarBtnDot(showSettings, "#ffd36b")} />
                  <span style={{ display: "grid", placeItems: "center" }}>{TopBarIcons.settings(showSettings ? "#ffd36b" : "rgba(183,255,226,0.78)")}</span>
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
            <button style={topbarWinBtn} onClick={() => void st.onMinimize()} aria-label="WIN_MINIMIZE" title={t("topbar.window.minimize")}>
              _
            </button>
            <button style={topbarWinBtn} onClick={() => void st.onToggleMaximize()} aria-label="WIN_MAXIMIZE" title={st.isMaximized ? t("topbar.window.restore") : t("topbar.window.maximize")}>
              {st.isMaximized ? "▢" : "□"}
            </button>
            <button
              style={{ ...topbarWinBtn, border: "1px solid rgba(255,85,85,0.35)", color: "rgba(255,85,85,0.95)" }}
              onClick={() => void st.onCloseWindow()}
              aria-label="WIN_CLOSE"
              title={t("topbar.window.close")}
            >
              X
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
