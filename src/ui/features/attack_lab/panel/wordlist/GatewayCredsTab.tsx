// src/ui/features/attack_lab/panel/wordlist/GatewayCredsTab.tsx
// Tab de Password Vault para gestionar credenciales del gateway (keyring) y presets por gateway con UI cyberpunk.

import React from "react";
import { useI18n } from "../../../../i18n";
import type { GatewayCredentialPresetDTO } from "../../../../../shared/dtos/NetworkDTOs";
import type { GatewayCredsVaultActions, GatewayCredsVaultState } from "./hooks/useGatewayCredsVault";
import { GatewayTargetSection } from "./gateway_creds/GatewayTargetSection";
import { GatewayMissingIpNotice } from "./gateway_creds/GatewayMissingIpNotice";
import { GatewayCredsForm } from "./gateway_creds/GatewayCredsForm";
import { GatewayBatchTargets } from "./gateway_creds/GatewayBatchTargets";
import { GatewayPresetsSection } from "./gateway_creds/GatewayPresetsSection";
import { GatewayStatusFooter } from "./gateway_creds/GatewayStatusFooter";
import { statusToText, statusToneToColor } from "./gateway_creds/gatewayCredsStatus";
import { CyberConfirmDialog } from "./CyberConfirmDialog";

export const GatewayCredsTab: React.FC<{
  vault: { state: GatewayCredsVaultState; actions: GatewayCredsVaultActions };
}> = ({ vault }) => {
  const { t } = useI18n();
  const { state, actions } = vault;

  const status = statusToText((k) => t(k as any), state.status);
  const statusColor = status ? statusToneToColor(status.tone) : null;

  const [confirm, setConfirm] = React.useState<
    | null
    | { kind: "delete_preset_one"; preset: GatewayCredentialPresetDTO }
    | { kind: "delete_preset_selected"; count: number }
  >(null);

  const runDeletePreset = async (preset: GatewayCredentialPresetDTO) => {
    try {
      actions.setStatus({ kind: "idle" });
      await actions.presets.actions.remove(preset);
      actions.setStatus({ kind: "preset_deleted", count: 1 });
    } catch (e) {
      actions.setStatus({ kind: "preset_delete_error", error: String(e) });
    }
  };

  const runDeleteSelectedPresets = async () => {
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
      {confirm && (
        <CyberConfirmDialog
          count={confirm.kind === "delete_preset_one" ? 1 : confirm.count}
          word={confirm.kind === "delete_preset_one" ? `${confirm.preset.gatewayIp} / ${confirm.preset.user}` : "presets"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const snapshot = confirm;
            setConfirm(null);
            if (snapshot.kind === "delete_preset_one") {
              void runDeletePreset(snapshot.preset);
            } else {
              void runDeleteSelectedPresets();
            }
          }}
        />
      )}

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
        <GatewayPresetsSection
          actions={actions}
          t={t}
          onDeletePreset={(preset) => setConfirm({ kind: "delete_preset_one", preset })}
          onDeleteSelectedPresets={() => setConfirm({ kind: "delete_preset_selected", count: actions.presets.state.selected.size })}
        />
        <GatewayStatusFooter state={state} t={t} statusText={status?.text ?? null} statusColor={status ? statusColor : null} />
      </div>
    </div>
  );
};
