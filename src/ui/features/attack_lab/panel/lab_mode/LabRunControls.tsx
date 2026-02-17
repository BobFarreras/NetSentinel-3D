// src/ui/features/attack_lab/panel/lab_mode/LabRunControls.tsx
// Controles de ejecución del LAB: botón EXECUTE/estado running + botón STOP (estilo terminal).

import React from "react";
import { useI18n } from "../../../../i18n";
import { blinkCssText, btnStyle } from "./labModeViewStyles";

export const LabRunControls: React.FC<{
  canRun: boolean;
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
}> = ({ canRun, isRunning, onRun, onCancel }) => {
  const { t } = useI18n();

  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {isRunning ? (
          <button
            disabled
            style={{
              ...btnStyle(false),
              borderColor: "#00e5ff",
              color: "#00e5ff",
              opacity: 1,
              cursor: "wait",
              flex: "1 1 160px",
              minWidth: 160,
            }}
          >
            <span className="blink">⚠️ {t("attackLab.lab.running")}</span>
          </button>
        ) : (
          <button onClick={onRun} disabled={!canRun} style={{ ...btnStyle(canRun), flex: "1 1 160px", minWidth: 160 }}>
            {t("attackLab.lab.execute")}
          </button>
        )}

        <button
          onClick={onCancel}
          disabled={!isRunning}
          style={{
            ...btnStyle(isRunning),
            borderColor: isRunning ? "#f55" : "rgba(0,255,136,0.2)",
            color: "#f55",
            flex: "1 1 90px",
            minWidth: 90,
          }}
        >
          {t("attackLab.lab.stop")}
        </button>
      </div>

      <style>{blinkCssText}</style>
    </>
  );
};

