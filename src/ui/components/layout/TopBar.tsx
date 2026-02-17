// src/ui/components/layout/TopBar.tsx
// Barra superior: acciones globales (scan/history/radar/attack lab) e informacion de identidad local.

import React from 'react';
import { HostIdentity } from '../../../shared/dtos/NetworkDTOs';
import { useTopBarState } from './topbar/useTopBarState';
import { TopBarBrand } from './topbar/TopBarBrand';
import { TopBarIdentity } from './topbar/TopBarIdentity';
import { TopBarPanelControls } from './topbar/TopBarPanelControls';
import { TopBarStatusControls } from './topbar/TopBarStatusControls';
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
        <TopBarBrand compact={st.compact} scanning={scanning} scanTitle={t("topbar.scan.activeTitle")} />

        {/* Selector de identidad (para ganar espacio) */}
        {identity && (
          <TopBarIdentity
            identitySlot={st.identitySlot}
            setIdentitySlot={st.setIdentitySlot}
            identityTitle={t("topbar.identity.title")}
            identityLine={st.identityLine ?? ""}
            menuMode={st.menuMode}
            compact={st.compact}
            tSlotIp={t("topbar.identity.slot.ip")}
            tSlotGw={t("topbar.identity.slot.gw")}
            tSlotIface={t("topbar.identity.slot.iface")}
            tSlotMac={t("topbar.identity.slot.mac")}
            tSlotAll={t("topbar.identity.slot.all")}
          />
        )}
      </div>

      {/* Centro: controles */}
      <TopBarPanelControls
        scanning={scanning}
        onScan={onScan}
        showHistory={showHistory}
        showRadar={showRadar}
        showAttackLab={showAttackLab}
        showSettings={showSettings}
        onHistoryToggle={onHistoryToggle}
        onRadarToggle={onRadarToggle}
        onAttackLabToggle={onAttackLabToggle}
        onSettingsToggle={onSettingsToggle}
        compact={st.compact}
        menuMode={st.menuMode}
        iconMode={st.iconMode}
        menuOpen={st.menuOpen}
        setMenuOpen={st.setMenuOpen}
        menuRef={st.menuRef}
        t={t}
      />

      <TopBarStatusControls
        activeNodes={activeNodes}
        nodesLabel={t("topbar.nodes")}
        onMinimize={st.onMinimize}
        onToggleMaximize={st.onToggleMaximize}
        onCloseWindow={st.onCloseWindow}
        isMaximized={st.isMaximized}
        tMinimize={t("topbar.window.minimize")}
        tMaximize={t("topbar.window.maximize")}
        tRestore={t("topbar.window.restore")}
        tClose={t("topbar.window.close")}
      />
    </div>
  );
};
