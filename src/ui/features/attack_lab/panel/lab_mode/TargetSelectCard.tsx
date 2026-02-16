// src/ui/features/attack_lab/panel/lab_mode/TargetSelectCard.tsx
// Card de target: selector contextual por categoria (WIFI/ROUTER/DEVICE) con fallback a "NO TARGET".

import React from "react";
import type { DeviceDTO, WifiNetworkDTO } from "../../../../../shared/dtos/NetworkDTOs";
import type { AttackLabScenario } from "../../catalog/types";
import { useI18n } from "../../../../i18n";
import { inputStyle } from "./labModeViewStyles";

export const TargetSelectCard: React.FC<{
  selectedScenario: AttackLabScenario | null;
  targetDevice: DeviceDTO | null;
  routerTargets: DeviceDTO[];
  onSelectRouterTarget?: (ip: string | null) => void;
  deviceTargets: DeviceDTO[];
  onSelectDeviceTarget?: (ip: string | null) => void;
  wifiTargets: WifiNetworkDTO[];
  onSelectWifiTarget?: (bssid: string | null) => void;
  isRunning: boolean;
  layout: "wide" | "narrow";
  children?: React.ReactNode;
}> = ({
  selectedScenario,
  targetDevice,
  routerTargets,
  onSelectRouterTarget,
  deviceTargets,
  onSelectDeviceTarget,
  wifiTargets,
  onSelectWifiTarget,
  isRunning,
  layout,
  children,
}) => {
  const { t } = useI18n();

  const targetKind =
    selectedScenario?.category === "WIFI" ? "wifi" : selectedScenario?.category === "ROUTER" ? "router" : "device";

  const showRouterTargetSelect = targetKind === "router" && routerTargets.length > 0 && Boolean(onSelectRouterTarget);
  const showWifiTargetSelect = targetKind === "wifi" && wifiTargets.length > 0 && Boolean(onSelectWifiTarget);
  const showDeviceTargetSelect = targetKind === "device" && deviceTargets.length > 0 && Boolean(onSelectDeviceTarget);

  return (
    <div style={{ width: layout === "narrow" ? "100%" : 240, minWidth: 220, display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div style={{ color: "#5c7", fontSize: 10, marginBottom: 4 }}>{t("attackLab.lab.target")}</div>

        {showWifiTargetSelect ? (
          <select
            value={targetDevice?.mac || ""}
            onChange={(e) => onSelectWifiTarget?.(e.target.value ? e.target.value : null)}
            style={inputStyle}
            disabled={isRunning}
            aria-label="ATTACK_LAB_WIFI_TARGET_SELECT"
          >
            <option value="">{t("attackLab.lab.noTarget")}</option>
            {wifiTargets.map((n) => (
              <option key={n.bssid} value={n.bssid}>
                {n.ssid || "<hidden>"}
                {n.channel ? ` (ch ${n.channel})` : ""}
              </option>
            ))}
          </select>
        ) : showRouterTargetSelect ? (
          <select
            value={targetDevice?.ip || ""}
            onChange={(e) => onSelectRouterTarget?.(e.target.value ? e.target.value : null)}
            style={inputStyle}
            disabled={isRunning}
            aria-label="ATTACK_LAB_ROUTER_TARGET_SELECT"
          >
            <option value="">{t("attackLab.lab.noTarget")}</option>
            {routerTargets.map((d) => (
              <option key={d.ip} value={d.ip}>
                {d.ip}
                {d.hostname ? ` (${d.hostname})` : d.vendor ? ` (${d.vendor})` : ""}
              </option>
            ))}
          </select>
        ) : showDeviceTargetSelect ? (
          <select
            value={targetDevice?.ip || ""}
            onChange={(e) => onSelectDeviceTarget?.(e.target.value ? e.target.value : null)}
            style={inputStyle}
            disabled={isRunning}
            aria-label="ATTACK_LAB_DEVICE_TARGET_SELECT"
          >
            <option value="">{t("attackLab.lab.noTarget")}</option>
            {deviceTargets.map((d) => (
              <option key={d.ip} value={d.ip}>
                {d.hostname || d.name || d.ip}
                {d.vendor ? ` (${d.vendor})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ ...inputStyle, opacity: 0.8 }}>
            {targetDevice
              ? `${targetDevice.hostname || targetDevice.ip} (${targetDevice.vendor || t("attackLab.lab.na")})`
              : t("attackLab.lab.noTarget")}
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
