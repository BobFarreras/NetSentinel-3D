// src/ui/features/attack_lab/panel/wordlist/GatewayCredsTab.tsx
// Tab de Password Vault para gestionar credenciales del gateway (keyring) y presets por gateway con UI cyberpunk.

import React from "react";
import { useI18n } from "../../../../i18n";
import type { GatewayCredsVaultActions, GatewayCredsVaultState } from "./hooks/useGatewayCredsVault";
import { GatewayTargetSection } from "./gateway_creds/GatewayTargetSection";
import { GatewayMissingIpNotice } from "./gateway_creds/GatewayMissingIpNotice";
import { GatewayCredsForm } from "./gateway_creds/GatewayCredsForm";
import { GatewayBatchTargets } from "./gateway_creds/GatewayBatchTargets";
import { GatewayPresetsSection } from "./gateway_creds/GatewayPresetsSection";
import { GatewayStatusFooter } from "./gateway_creds/GatewayStatusFooter";
import { statusToText, statusToneToColor } from "./gateway_creds/gatewayCredsStatus";

export const GatewayCredsTab: React.FC<{
  vault: { state: GatewayCredsVaultState; actions: GatewayCredsVaultActions };
}> = ({ vault }) => {
  const { t } = useI18n();
  const { state, actions } = vault;

  const status = statusToText((k) => t(k as any), state.status);
  const statusColor = status ? statusToneToColor(status.tone) : null;

  const onDeleteSelectedPresets = async () => {
    try {
      actions.setStatus({ kind: "idle" });
      const count = actions.presets.state.selected.size;
      await actions.presets.actions.removeSelected();
      actions.setStatus({ kind: "preset_deleted", count });
    } catch (e) {
      actions.setStatus({ kind: "preset_delete_error", error: String(e) });
    }
  };

  return (
    <div className="cyber-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 15, background: "rgba(0,0,0,0.3)", minHeight: 0 }}>
      <div style={{ color: "rgba(183,255,226,0.8)", fontSize: 11, lineHeight: 1.45, marginBottom: 10 }}>
        {t("settings.passwords.gateway.help")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <GatewayTargetSection state={state} actions={actions} t={t} />

        {!state.canManageCreds && (
          <GatewayMissingIpNotice text={t("settings.passwords.gateway.missingGatewayIp")} />
        )}

        <GatewayCredsForm state={state} actions={actions} t={t} />
        <GatewayBatchTargets state={state} actions={actions} t={t} />
        <GatewayPresetsSection actions={actions} t={t} onDeleteSelectedPresets={onDeleteSelectedPresets} />
        <GatewayStatusFooter state={state} t={t} statusText={status?.text ?? null} statusColor={status ? statusColor : null} />
      </div>
    </div>
  );
};
