// src/ui/features/attack_lab/panel/wordlist/gateway_creds/GatewayPresetsSection.tsx
// Seccion de presets (user/pass) por gateway: listado, multiseleccion y borrado.

import React from "react";
import { btnStyle } from "../wordlistManagerModalStyles";
import type { GatewayCredsVaultActions } from "../hooks/useGatewayCredsVault";

export const GatewayPresetsSection: React.FC<{
  actions: GatewayCredsVaultActions;
  t: (k: any) => string;
  onDeleteSelectedPresets: () => void | Promise<void>;
}> = ({ actions, t, onDeleteSelectedPresets }) => {
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.6)" }}>
          {t("settings.passwords.gateway.presetsLabel")}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {actions.presets.state.loading ? (
          <div style={{ color: "rgba(183,255,226,0.6)", fontSize: 11 }}>{t("settings.passwords.status.loading")}</div>
        ) : actions.presets.state.items.length === 0 ? (
          <div style={{ color: "rgba(183,255,226,0.55)", fontSize: 11 }}>{t("settings.passwords.gateway.presets.empty")}</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }} aria-label="GATEWAY_PRESET_LIST">
            {actions.presets.state.items.map((p) => {
              const key = `${p.gatewayIp}\n${p.user}\n${p.pass}`;
              const selected = actions.presets.state.selected.has(key);
              const isGlobal = p.gatewayIp === "*";
              return (
                <div
                  key={key}
                  className={`word-chip ${selected ? "selected" : ""}`}
                  onClick={() => actions.applyPresetToForm(p.user, p.pass)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    actions.presets.actions.toggle(p);
                  }}
                  title={t("settings.passwords.gateway.presets.hint")}
                  style={{
                    background: "#111",
                    border: selected ? "1px solid #00ff88" : isGlobal ? "1px solid rgba(0,180,255,0.35)" : "1px solid rgba(0,255,136,0.18)",
                    color: selected ? "#000" : "#ccc",
                    padding: "6px 10px",
                    fontSize: "0.85rem",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  aria-label={`GATEWAY_PRESET_${p.gatewayIp}_${p.user}_${p.pass}`}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      padding: "2px 5px",
                      borderRadius: 2,
                      border: isGlobal ? "1px solid rgba(0,180,255,0.5)" : "1px solid rgba(0,255,136,0.25)",
                      color: isGlobal ? "rgba(120,220,255,0.95)" : "rgba(183,255,226,0.75)",
                      background: isGlobal ? "rgba(0,180,255,0.08)" : "rgba(0,255,136,0.06)",
                    }}
                    title={isGlobal ? t("settings.passwords.gateway.presets.scope.global") : p.gatewayIp}
                  >
                    {isGlobal ? t("settings.passwords.gateway.presets.scope.global") : p.gatewayIp}
                  </span>
                  <span style={{ fontWeight: 900, color: selected ? "#000" : "#00ff88" }}>{p.user}</span>
                  <span style={{ opacity: 0.9 }}>/</span>
                  <span style={{ fontWeight: 700 }}>{p.pass}</span>
                </div>
              );
            })}
          </div>
        )}

        {actions.presets.state.selected.size > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button type="button" style={{ ...btnStyle("ghost"), flex: 1 }} onClick={actions.presets.actions.deselectAll}>
              {t("settings.passwords.gateway.presets.deselect")} ({actions.presets.state.selected.size})
            </button>
            <button type="button" style={{ ...btnStyle("danger"), flex: 2 }} onClick={onDeleteSelectedPresets}>
              {t("settings.passwords.gateway.presets.deleteSelected")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
