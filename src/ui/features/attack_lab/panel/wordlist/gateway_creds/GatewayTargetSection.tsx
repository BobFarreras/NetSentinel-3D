// src/ui/features/attack_lab/panel/wordlist/gateway_creds/GatewayTargetSection.tsx
// Seccion target del vault: selector de gateway detectado + toggle batch + input manual de IP.

import React from "react";
import { btnStyle, inputStyle } from "../wordlistManagerModalStyles";
import type { GatewayCredsVaultActions, GatewayCredsVaultState } from "../hooks/useGatewayCredsVault";

export const GatewayTargetSection: React.FC<{
  state: GatewayCredsVaultState;
  actions: GatewayCredsVaultActions;
  t: (k: any) => string;
}> = ({ state, actions, t }) => {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 4 }}>
        {t("settings.passwords.gateway.gatewayIp")}
      </div>

      {state.gatewayCandidates.length > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <select
            value={state.activeGateway ?? ""}
            onChange={(e) => actions.activateGateway(e.target.value || null)}
            style={{ ...inputStyle, flex: 1 }}
            aria-label="VAULT_GATEWAY_TARGET_SELECT"
            disabled={state.loadingCreds}
          >
            <option value="">{t("settings.passwords.gateway.selectTarget")}</option>
            {state.gatewayCandidates.map((c) => (
              <option key={c.ip} value={c.ip}>
                {c.ip} - {c.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            style={{ ...btnStyle("ghost"), height: 34 }}
            onClick={() => actions.setShowBatchTargets(!state.showBatchTargets)}
            disabled={state.gatewayCandidates.length === 0}
            aria-label="VAULT_GATEWAY_BATCH_TOGGLE"
            title={t("settings.passwords.gateway.targetsTitle")}
          >
            {t("settings.passwords.gateway.targetsTitle")} ({state.selectedGateways.size})
          </button>
        </div>
      )}

      <input
        value={state.gatewayIpInput}
        onChange={(e) => actions.setGatewayIpInput(e.target.value)}
        placeholder={t("settings.passwords.gateway.unknownGateway")}
        style={inputStyle}
        disabled={false}
        aria-label="VAULT_GATEWAY_IP_INPUT"
      />
    </div>
  );
};

