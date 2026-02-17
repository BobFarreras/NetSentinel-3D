// src/ui/features/attack_lab/panel/wordlist/gateway_creds/GatewayStatusFooter.tsx
// Footer con status y metadata: loading/savedAt + status banner con color por severidad.

import React from "react";
import type { GatewayCredsVaultState } from "../hooks/useGatewayCredsVault";

export const GatewayStatusFooter: React.FC<{
  state: GatewayCredsVaultState;
  t: (k: any) => string;
  statusText: string | null;
  statusColor: string | null;
}> = ({ state, t, statusText, statusColor }) => {
  return (
    <div style={{ fontSize: 11, color: "rgba(183,255,226,0.75)", lineHeight: 1.45 }}>
      {state.loadingCreds ? t("settings.passwords.status.loading") : ""}
      {!state.loadingCreds && state.creds?.savedAt ? (
        <div>
          {t("settings.passwords.gateway.savedAt")}: {new Date(state.creds.savedAt).toLocaleString()}
        </div>
      ) : null}
      {statusText ? <div style={{ marginTop: 6, color: statusColor ?? "#00ff88" }}>{statusText}</div> : null}
    </div>
  );
};

