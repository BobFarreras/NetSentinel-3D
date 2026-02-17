// src/ui/features/attack_lab/panel/lab_mode/ScenarioSelectCard.tsx
// Card de escenario: selector + descripcion + acceso al Password Vault cuando el escenario es WiFi.

import React from "react";
import type { AttackLabScenario } from "../../catalog/types";
import { useI18n } from "../../../../i18n";
import { inputStyle } from "./labModeViewStyles";

export const ScenarioSelectCard: React.FC<{
  scenarios: AttackLabScenario[];
  selectedId: string;
  onSelect: (id: string) => void;
  selectedScenario: AttackLabScenario | null;
  isRunning: boolean;
  onOpenVault: () => void;
}> = ({ scenarios, selectedId, onSelect, selectedScenario, isRunning, onOpenVault }) => {
  const { t } = useI18n();

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ color: "#5c7", fontSize: 10, textTransform: "uppercase" }}>{t("attackLab.lab.selectedScenario")}</div>
        {selectedScenario?.category === "WIFI" && (
          <button
            onClick={onOpenVault}
            style={{ background: "none", border: "none", color: "#00ff88", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}
          >
            [{t("attackLab.lab.manageWordlist")}]
          </button>
        )}
      </div>

      <select value={selectedId} onChange={(e) => onSelect(e.target.value)} style={inputStyle} disabled={isRunning}>
        <option value="">{t("attackLab.lab.selectVector")}</option>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>

      {selectedScenario && (
        <div style={{ marginTop: 8, color: "#8b9", fontSize: 11, lineHeight: 1.4, borderLeft: "2px solid #0f8", paddingLeft: 8 }}>
          {selectedScenario.description}
          <div style={{ marginTop: 4, color: "#0ff" }}>
            {t("attackLab.lab.modePrefix")}: {selectedScenario.mode}
          </div>
        </div>
      )}
    </div>
  );
};

