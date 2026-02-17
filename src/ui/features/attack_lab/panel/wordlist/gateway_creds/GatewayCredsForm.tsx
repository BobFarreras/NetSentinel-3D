// src/ui/features/attack_lab/panel/wordlist/gateway_creds/GatewayCredsForm.tsx
// Formulario de credenciales: user/pass + show/hide + guardar en keyring.

import React from "react";
import { btnStyle, inputStyle } from "../wordlistManagerModalStyles";
import type { GatewayCredsVaultActions, GatewayCredsVaultState } from "../hooks/useGatewayCredsVault";

export const GatewayCredsForm: React.FC<{
  state: GatewayCredsVaultState;
  actions: GatewayCredsVaultActions;
  t: (k: any) => string;
}> = ({ state, actions, t }) => {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 4 }}>
            {t("settings.passwords.gateway.user")}
          </div>
          <input
            value={state.user}
            onChange={(e) => actions.setUser(e.target.value)}
            style={inputStyle}
            disabled={!state.canManageCreds}
            aria-label="VAULT_GATEWAY_USER_INPUT"
          />
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 4 }}>
            {t("settings.passwords.gateway.pass")}
          </div>
          <input
            value={state.pass}
            onChange={(e) => actions.setPass(e.target.value)}
            style={inputStyle}
            type={state.showPass ? "text" : "password"}
            disabled={!state.canManageCreds}
            aria-label="VAULT_GATEWAY_PASS_INPUT"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" style={btnStyle("ghost")} onClick={actions.toggleShowPass} disabled={!state.canManageCreds || state.loadingCreds}>
          {state.showPass ? t("settings.passwords.gateway.hidePass") : t("settings.passwords.gateway.showPass")}
        </button>
        <button
          type="button"
          style={btnStyle("primary")}
          onClick={actions.saveCreds}
          disabled={!state.canManageCreds || state.loadingCreds || !state.user.trim() || !state.pass}
          aria-label="VAULT_GATEWAY_SAVE"
        >
          {t("settings.passwords.gateway.save")}
        </button>
      </div>
    </>
  );
};
