// src/ui/features/attack_lab/panel/wordlist/gateway_creds/gatewayCredsStatus.ts
// Helpers puros para mapear el estado del vault (VaultStatus) a texto/tone y color de UI.

import type { VaultStatus } from "../hooks/useGatewayCredsVault";

export type StatusTone = "ok" | "warn" | "error";

export const statusToText = (
  t: (k: string) => string,
  status: VaultStatus
): { text: string; tone: StatusTone } | null => {
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

export const statusToneToColor = (tone: StatusTone): string => {
  switch (tone) {
    case "error":
      return "#ff6677";
    case "warn":
      return "rgba(255,220,170,0.95)";
    default:
      return "#00ff88";
  }
};

