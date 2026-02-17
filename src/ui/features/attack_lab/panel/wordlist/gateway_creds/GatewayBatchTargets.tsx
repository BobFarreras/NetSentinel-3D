// src/ui/features/attack_lab/panel/wordlist/gateway_creds/GatewayBatchTargets.tsx
// Lista batch de gateways detectados con multiseleccion para borrado rapido de credenciales.

import React from "react";
import { btnStyle } from "../wordlistManagerModalStyles";
import type { GatewayCredsVaultActions, GatewayCredsVaultState } from "../hooks/useGatewayCredsVault";

export const GatewayBatchTargets: React.FC<{
  state: GatewayCredsVaultState;
  actions: GatewayCredsVaultActions;
  t: (k: any) => string;
}> = ({ state, actions, t }) => {
  if (!(state.gatewayCandidates.length > 0 && state.showBatchTargets)) return null;

  return (
    <div style={{ marginTop: 8, borderTop: "1px solid rgba(0,255,136,0.12)", paddingTop: 10 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 8 }}>
        {t("settings.passwords.gateway.targetsTitle")} ({state.selectedGateways.size})
      </div>

      <div
        className="cyber-scrollbar"
        style={{
          maxHeight: 160,
          overflowY: "auto",
          border: "1px solid rgba(0,255,136,0.14)",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 2,
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
        aria-label="VAULT_GATEWAY_BATCH_LIST"
      >
        {state.gatewayCandidates.map((c) => {
          const checked = state.selectedGateways.has(c.ip);
          const active = state.activeGateway === c.ip;
          return (
            <label
              key={c.ip}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: 2,
                cursor: "pointer",
                border: `1px solid ${active ? "rgba(0,229,255,0.35)" : "rgba(0,255,136,0.10)"}`,
                background: active ? "rgba(0,229,255,0.06)" : "rgba(0,0,0,0.25)",
              }}
              aria-label={`VAULT_GATEWAY_BATCH_ITEM_${c.ip}`}
              onClick={() => actions.activateGateway(c.ip)}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => actions.toggleGatewaySelected(c.ip, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, letterSpacing: 0.4, color: active ? "#00e5ff" : "#00ff88", fontSize: 12 }}>{c.ip}</div>
                <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>
              </div>
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          style={{ ...btnStyle("ghost"), flex: 1 }}
          onClick={actions.clearSelectedGateways}
          disabled={state.selectedGateways.size === 0}
        >
          {t("settings.passwords.gateway.deselectAll")}
        </button>
        <button
          type="button"
          style={{ ...btnStyle("danger"), flex: 2 }}
          onClick={actions.deleteSelectedGateways}
          disabled={state.selectedGateways.size === 0 || state.loadingCreds}
        >
          {t("settings.passwords.gateway.deleteSelected")}
        </button>
      </div>
    </div>
  );
};

