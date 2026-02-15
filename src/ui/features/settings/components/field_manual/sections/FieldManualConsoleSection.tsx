// src/ui/features/settings/components/field_manual/sections/FieldManualConsoleSection.tsx
// Descripcion: seccion Console del Field Manual (telemetria + pistas de diagnostico).

import { useI18n } from "../../../../../i18n";
import { card, paragraph, sectionTitle } from "../fieldManualStyles";

export const FieldManualConsoleSection: React.FC = () => {
  const { t } = useI18n();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={sectionTitle}>{t("manual.console.title")}</div>
      <div style={paragraph}>{t("manual.console.desc")}</div>
      <div style={card}>
        <div style={sectionTitle}>{t("manual.console.lookFor.title")}</div>
        <div style={paragraph}>{t("manual.console.lookFor.item1")}</div>
        <div style={paragraph}>{t("manual.console.lookFor.item2")}</div>
        <div style={paragraph}>{t("manual.console.lookFor.item3")}</div>
      </div>
    </div>
  );
};
