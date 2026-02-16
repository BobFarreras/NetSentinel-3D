// src/ui/features/attack_lab/panel/lab_mode/WifiEvidenceImportCard.tsx
// Card de evidencia WiFi: import/clear de evidencia y resumen parseado (usa parseWifiEvidence).

import React, { useState } from "react";
import type { ParsedWifiEvidence } from "../../logic/parseWifiEvidence";
import { parseWifiEvidence } from "../../logic/parseWifiEvidence";
import { useI18n } from "../../../../i18n";
import { btnStyle, inputStyle } from "./labModeViewStyles";

export const WifiEvidenceImportCard: React.FC<{
  isRunning: boolean;
  wifiEvidence: ParsedWifiEvidence | null;
  onImported?: (raw: string, parsed: ParsedWifiEvidence | null) => void;
  onCleared?: () => void;
}> = ({ isRunning, wifiEvidence, onImported, onCleared }) => {
  const { t } = useI18n();
  const [isImportingEvidence, setIsImportingEvidence] = useState(false);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: "#5c7", fontSize: 10, marginBottom: 4 }}>{t("attackLab.lab.evidence")}</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: isRunning ? "not-allowed" : "pointer" }}>
          <input
            type="file"
            accept=".txt,.22000,.hccapx,.cap,.pcap,.pcapng"
            disabled={isRunning || isImportingEvidence}
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              try {
                setIsImportingEvidence(true);
                const raw = await file.text();
                const parsed = parseWifiEvidence(raw);
                onImported?.(raw, parsed);
              } finally {
                setIsImportingEvidence(false);
                // Permite re-importar el mismo fichero.
                e.target.value = "";
              }
            }}
          />
          <span style={{ ...btnStyle(!isRunning), padding: "6px 10px" }}>
            {isImportingEvidence ? t("attackLab.lab.evidenceImporting") : t("attackLab.lab.evidenceImport")}
          </span>
        </label>

        <button
          type="button"
          onClick={() => onCleared?.()}
          disabled={isRunning || !wifiEvidence}
          style={{ ...btnStyle(!isRunning && Boolean(wifiEvidence)), padding: "6px 10px" }}
        >
          {t("attackLab.lab.evidenceClear")}
        </button>
      </div>

      <div style={{ marginTop: 8, ...inputStyle, whiteSpace: "pre-wrap", lineHeight: 1.35, opacity: 0.95 }}>
        {!wifiEvidence ? (
          <span style={{ color: "rgba(183,255,226,0.75)" }}>{t("attackLab.lab.evidenceEmpty")}</span>
        ) : (
          <>
            <div style={{ color: "#00ff88", fontWeight: 700 }}>{t("attackLab.lab.evidenceLoaded")}</div>
            <div>
              {t("attackLab.lab.evidenceKind")}: {wifiEvidence.kind}
            </div>
            <div>
              {t("attackLab.lab.evidenceSsid")}: {wifiEvidence.ssid ?? "-"}
            </div>
            <div>
              {t("attackLab.lab.evidenceAp")}: {wifiEvidence.apMac ?? "-"}
            </div>
            <div>
              {t("attackLab.lab.evidenceSta")}: {wifiEvidence.staMac ?? "-"}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

