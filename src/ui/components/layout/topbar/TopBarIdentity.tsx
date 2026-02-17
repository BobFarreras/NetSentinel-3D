// src/ui/components/layout/topbar/TopBarIdentity.tsx
// Bloque de identidad en TopBar: selector de slot (ip/gw/iface/mac/all) + linea compacta con ellipsis.

import React from "react";
import type { IdentitySlot } from "./useTopBarState";

export const TopBarIdentity: React.FC<{
  identitySlot: IdentitySlot;
  setIdentitySlot: (v: IdentitySlot) => void;
  identityTitle: string;
  identityLine: string;
  menuMode: boolean;
  compact: boolean;
  tSlotIp: string;
  tSlotGw: string;
  tSlotIface: string;
  tSlotMac: string;
  tSlotAll: string;
}> = (props) => {
  const {
    identitySlot,
    setIdentitySlot,
    identityTitle,
    identityLine,
    menuMode,
    compact,
    tSlotIp,
    tSlotGw,
    tSlotIface,
    tSlotMac,
    tSlotAll,
  } = props;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <select
        value={identitySlot}
        onChange={(e) => setIdentitySlot(e.target.value as IdentitySlot)}
        aria-label="TOPBAR_IDENTITY_SLOT"
        style={{
          height: 30,
          borderRadius: 2,
          border: "1px solid rgba(0,229,255,0.20)",
          background: "rgba(0,0,0,0.45)",
          color: "rgba(183,255,226,0.85)",
          fontFamily: "monospace",
          fontSize: 12,
          padding: "0 8px",
        }}
      >
        <option value="ip">{tSlotIp}</option>
        <option value="gw">{tSlotGw}</option>
        <option value="iface">{tSlotIface}</option>
        <option value="mac">{tSlotMac}</option>
        <option value="all">{tSlotAll}</option>
      </select>

      <div
        title={identityTitle}
        style={{
          height: 30,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          borderRadius: 2,
          border: "1px solid rgba(0,255,136,0.12)",
          background: "rgba(0,0,0,0.25)",
          color: "#88ffcc",
          fontFamily: "monospace",
          fontSize: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: menuMode ? 100 : compact ? 120 : 320,
          maxWidth: menuMode ? 140 : compact ? 180 : 520,
        }}
      >
        {identityLine}
      </div>
    </div>
  );
};

