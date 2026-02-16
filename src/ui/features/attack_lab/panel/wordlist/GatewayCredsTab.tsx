// src/ui/features/attack_lab/panel/wordlist/GatewayCredsTab.tsx
// Tab de Password Vault para gestionar credenciales del gateway (keyring) y presets por gateway con UI cyberpunk.

import React from "react";
import { useI18n } from "../../../../i18n";
import { btnStyle, inputStyle } from "./wordlistManagerModalStyles";
import type { GatewayCredsVaultActions, GatewayCredsVaultState, VaultStatus } from "./hooks/useGatewayCredsVault";

const statusToText = (t: (k: string) => string, status: VaultStatus): { text: string; tone: "ok" | "warn" | "error" } | null => {
  switch (status.kind) {
    case "idle":
      return null;
    case "load_timeout":
      return { text: t("settings.passwords.status.loadTimeout"), tone: "warn" };
    case "load_error":
      return { text: `${t("settings.passwords.status.loadError")}: ${status.error}`, tone: "error" };
    case "save_not_verified":
      return { text: t("settings.passwords.status.saveNotVerified"), tone: "warn" };
    case "saved":
      return { text: t("settings.passwords.status.saved"), tone: "ok" };
    case "save_error":
      return { text: `${t("settings.passwords.status.saveError")}: ${status.error}`, tone: "error" };
    case "delete_not_verified":
      return { text: t("settings.passwords.status.deleteNotVerified"), tone: "warn" };
    case "deleted":
      return { text: t("settings.passwords.status.deleted"), tone: "ok" };
    case "delete_error":
      return { text: `${t("settings.passwords.status.deleteError")}: ${status.error}`, tone: "error" };
    case "preset_deleted":
      return { text: `${t("settings.passwords.gateway.presets.status.deleted")}: ${status.count}`, tone: "ok" };
    case "preset_delete_error":
      return { text: `${t("settings.passwords.gateway.presets.status.deleteError")}: ${status.error}`, tone: "error" };
    default:
      return null;
  }
};

export const GatewayCredsTab: React.FC<{
  vault: { state: GatewayCredsVaultState; actions: GatewayCredsVaultActions };
}> = ({ vault }) => {
  const { t } = useI18n();
  const { state, actions } = vault;

  const status = statusToText((k) => t(k as any), state.status);
  const statusColor =
    status?.tone === "error"
      ? "#ff6677"
      : status?.tone === "warn"
        ? "rgba(255,220,170,0.95)"
        : "#00ff88";

  return (
    <div className="cyber-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 15, background: "rgba(0,0,0,0.3)", minHeight: 0 }}>
      <div style={{ color: "rgba(183,255,226,0.8)", fontSize: 11, lineHeight: 1.45, marginBottom: 10 }}>
        {t("settings.passwords.gateway.help")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

        {!state.canManageCreds && (
          <div
            style={{
              border: "1px solid rgba(255,180,0,0.28)",
              background: "rgba(255,180,0,0.08)",
              color: "rgba(255,220,170,0.95)",
              padding: "10px 10px",
              borderRadius: 2,
              fontSize: 11,
              lineHeight: 1.35,
            }}
            aria-label="VAULT_GATEWAY_MISSING_IP"
          >
            {t("settings.passwords.gateway.missingGatewayIp")}
          </div>
        )}

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
          <button
            type="button"
            style={btnStyle("danger")}
            onClick={actions.deleteCreds}
            disabled={!state.canManageCreds || state.loadingCreds}
            aria-label="VAULT_GATEWAY_DELETE"
          >
            {t("settings.passwords.gateway.delete")}
          </button>
        </div>

        {state.gatewayCandidates.length > 0 && state.showBatchTargets && (
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
        )}

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
              <button
                type="button"
                style={{ ...btnStyle("danger"), flex: 2 }}
                onClick={async () => {
                  try {
                    actions.setStatus({ kind: "idle" });
                    const count = actions.presets.state.selected.size;
                    await actions.presets.actions.removeSelected();
                    actions.setStatus({ kind: "preset_deleted", count });
                  } catch (e) {
                    actions.setStatus({ kind: "preset_delete_error", error: String(e) });
                  }
                }}
              >
                {t("settings.passwords.gateway.presets.deleteSelected")}
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "rgba(183,255,226,0.75)", lineHeight: 1.45 }}>
          {state.loadingCreds ? t("settings.passwords.status.loading") : ""}
          {!state.loadingCreds && state.creds?.savedAt ? (
            <div>
              {t("settings.passwords.gateway.savedAt")}: {new Date(state.creds.savedAt).toLocaleString()}
            </div>
          ) : null}
          {status ? <div style={{ marginTop: 6, color: statusColor }}>{status.text}</div> : null}
        </div>
      </div>
    </div>
  );
};
