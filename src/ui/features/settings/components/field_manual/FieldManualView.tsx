// src/ui/features/settings/components/field_manual/FieldManualView.tsx
// Descripcion: vista "Field Manual" dentro de Settings. Orquesta secciones (Radar/Attack/Console/Storage) y leyenda 3D.

import { useMemo, useState } from "react";
import { HUD_COLORS, HUD_TYPO } from "../../../../styles/hudTokens";
import { useI18n } from "../../../../i18n";
import { FieldManualLegendSection } from "./sections/FieldManualLegendSection";
import { FieldManualRadarSection } from "./sections/FieldManualRadarSection";
import { FieldManualAttackLabSection } from "./sections/FieldManualAttackLabSection";
import { FieldManualConsoleSection } from "./sections/FieldManualConsoleSection";
import { FieldManualStorageSection } from "./sections/FieldManualStorageSection";

export type ManualSection = "legend" | "radar" | "attack_lab" | "console" | "storage";

export function FieldManualView() {
  const { t } = useI18n();
  const [section, setSection] = useState<ManualSection>("legend");

  const options = useMemo(
    () => [
      { value: "legend" as const, label: t("settings.manual.sections.legend") },
      { value: "radar" as const, label: t("settings.manual.sections.radar") },
      { value: "attack_lab" as const, label: t("settings.manual.sections.attackLab") },
      { value: "console" as const, label: t("settings.manual.sections.console") },
      { value: "storage" as const, label: t("settings.manual.sections.storage") },
    ],
    [t]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "8px 10px",
          border: `1px solid rgba(0,255,136,0.12)`,
          background: "rgba(0,0,0,0.35)",
          borderRadius: 2,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: HUD_TYPO.mono,
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: 1.0,
            color: HUD_COLORS.accentGreen,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {t("settings.manual.title")}
        </div>

        <select
          value={section}
          onChange={(e) => setSection(e.target.value as ManualSection)}
          aria-label="MANUAL_SECTION_SELECT"
          style={{
            width: "min(340px, 100%)",
            maxWidth: "100%",
            height: 32,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(0,229,255,0.35)",
            color: "rgba(183,255,226,0.92)",
            borderRadius: 2,
            fontFamily: HUD_TYPO.mono,
            fontSize: 12,
            padding: "0 10px",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {section === "legend" && <FieldManualLegendSection />}
      {section === "radar" && <FieldManualRadarSection />}
      {section === "attack_lab" && <FieldManualAttackLabSection />}
      {section === "console" && <FieldManualConsoleSection />}
      {section === "storage" && <FieldManualStorageSection />}
    </div>
  );
}
