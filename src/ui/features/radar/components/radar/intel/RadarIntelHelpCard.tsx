// src/ui/features/radar/components/radar/intel/RadarIntelHelpCard.tsx
// Tarjeta de ayuda del Intel Panel: explicacion breve del significado de filtros y estado del nodo.

import React from "react";
import { useI18n } from "../../../../../i18n";

export const RadarIntelHelpCard: React.FC = () => {
  const { t } = useI18n();
  return (
    <div
      style={{
        marginBottom: 10,
        padding: 10,
        border: "1px solid rgba(0,255,136,0.18)",
        background: "rgba(0,0,0,0.35)",
        color: "rgba(183,255,226,0.85)",
        fontSize: 11,
        lineHeight: 1.45,
      }}
    >
      <div style={{ color: "#00ff88", fontWeight: 900, marginBottom: 6 }}>{t("radar.intel.help.title")}</div>
      <div style={{ marginBottom: 6 }}>
        <b>{t("radar.intel.help.riskLabel")}</b>: {t("radar.intel.help.riskDesc")}
      </div>
      <div style={{ marginBottom: 6 }}>
        <b>{t("radar.intel.help.bandLabel")}</b>: {t("radar.intel.help.bandDesc")}
      </div>
      <div style={{ marginBottom: 6 }}>
        <b>{t("radar.intel.help.channelLabel")}</b>: {t("radar.intel.help.channelDesc")}
      </div>
      <div>
        <b>{t("radar.intel.help.queryLabel")}</b>: {t("radar.intel.help.queryDesc")}
      </div>
    </div>
  );
};
