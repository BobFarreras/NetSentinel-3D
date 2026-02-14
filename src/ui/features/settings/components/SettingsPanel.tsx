// src/ui/features/settings/components/SettingsPanel.tsx
// Descripcion: panel de settings (UX). Incluye selector de idioma e "Field Manual" con leyenda visual del 3D.

import React from "react";
import { HUD_COLORS, HUD_TYPO } from "../../../styles/hudTokens";
import { useSettingsPanelState } from "../hooks/useSettingsPanelState";
import { useI18n } from "../../../i18n";
import { FieldManualView } from "./field_manual/FieldManualView";

const panelStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,16,10,0.86) 100%)",
  border: `1px solid ${HUD_COLORS.borderSoft}`,
  boxShadow: "0 0 24px rgba(0,255,136,0.12), inset 0 0 0 1px rgba(0,229,255,0.06)",
  borderRadius: 2,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  position: "relative",
};

const headerStyle: React.CSSProperties = {
  height: 44,
  padding: "0 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: `1px solid ${HUD_COLORS.borderSoft}`,
  background: "linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.2))",
};

const titleStyle: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  fontWeight: 800,
  letterSpacing: 1.2,
  color: HUD_COLORS.textMain,
  fontSize: 12,
  textTransform: "uppercase",
};

const closeBtnStyle: React.CSSProperties = {
  height: 26,
  padding: "0 10px",
  borderRadius: 2,
  border: `1px solid rgba(0,229,255,0.35)`,
  background: "rgba(0,0,0,0.55)",
  color: HUD_COLORS.accentCyan,
  cursor: "pointer",
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.8,
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "10px 12px",
  borderBottom: "1px solid rgba(0,255,136,0.15)",
  background: "rgba(0,0,0,0.45)",
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  height: 30,
  padding: "0 12px",
  borderRadius: 2,
  border: `1px solid ${active ? "rgba(0,229,255,0.55)" : "rgba(0,255,136,0.25)"}`,
  background: active ? "rgba(0,229,255,0.12)" : "rgba(0,0,0,0.35)",
  color: active ? HUD_COLORS.accentCyan : HUD_COLORS.accentGreen,
  cursor: "pointer",
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: "uppercase",
});

const bodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  padding: 12,
  overflow: "auto",
  backgroundImage:
    "repeating-linear-gradient(180deg, rgba(0,255,136,0.02) 0px, rgba(0,255,136,0.02) 1px, transparent 1px, transparent 4px)",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  color: HUD_COLORS.textMain,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.1,
  textTransform: "uppercase",
  margin: "10px 0 6px",
};

const helpText: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  color: "rgba(183,255,226,0.7)",
  lineHeight: 1.45,
};

const formRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 10px",
  border: "1px solid rgba(0,255,136,0.12)",
  background: "rgba(0,0,0,0.45)",
  borderRadius: 2,
  // Responsive: en ventanas estrechas (detached o split), el selector debe bajar de linea en vez de forzar overflow.
  flexWrap: "wrap",
};

const selectStyle: React.CSSProperties = {
  width: "min(220px, 100%)",
  maxWidth: "100%",
  height: 32,
  background: "rgba(0,0,0,0.75)",
  border: "1px solid rgba(0,229,255,0.35)",
  color: HUD_COLORS.textMain,
  borderRadius: 2,
  fontFamily: HUD_TYPO.mono,
  fontSize: 12,
  padding: "0 10px",
};

export const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const state = useSettingsPanelState();
  const { t } = useI18n();

  const bodyStyleForTab: React.CSSProperties = {
    ...bodyStyle,
    // Field manual ya gestiona scroll interno para UX "jugable".
    overflow: state.tab === "field_manual" ? "hidden" : "auto",
  };

  return (
    <div style={panelStyle} role="dialog" aria-label="SETTINGS_PANEL">
      <div style={headerStyle}>
        <div style={titleStyle}>{t("settings.title")}</div>
        <button onClick={onClose} style={closeBtnStyle} aria-label="CLOSE_SETTINGS">
          {t("settings.close")}
        </button>
      </div>

      <div style={tabBarStyle}>
        <button onClick={() => state.setTab("general")} style={tabBtn(state.tab === "general")} aria-label="SETTINGS_TAB_GENERAL">
          {t("settings.tabs.general")}
        </button>
        <button
          onClick={() => state.setTab("field_manual")}
          style={tabBtn(state.tab === "field_manual")}
          aria-label="SETTINGS_TAB_FIELD_MANUAL"
        >
          {t("settings.tabs.fieldManual")}
        </button>
      </div>

      <div style={bodyStyleForTab}>
        {state.tab === "general" && (
          <>
            <div style={sectionTitle}>{t("settings.language.label")}</div>
            <div style={formRow}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ ...helpText, fontWeight: 900, color: HUD_COLORS.accentGreen }}>{t("settings.language.label")}</div>
                <div style={helpText}>{t("settings.language.help")}</div>
              </div>
              <select
                value={state.language}
                onChange={(e) => state.setLanguage(e.target.value as any)}
                style={selectStyle}
                aria-label="SETTINGS_LANGUAGE_SELECT"
              >
                {state.languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {state.tab === "field_manual" && (
          <FieldManualView />
        )}
      </div>
    </div>
  );
};
