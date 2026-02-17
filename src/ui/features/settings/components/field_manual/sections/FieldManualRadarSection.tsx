// src/ui/features/settings/components/field_manual/sections/FieldManualRadarSection.tsx
// Descripcion: seccion Radar del Field Manual (recon pasivo + flujo recomendado).

import { useI18n } from "../../../../../i18n";
import { card, paragraph, sectionTitle } from "../fieldManualStyles";

export const FieldManualRadarSection: React.FC = () => {
  const { t } = useI18n();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={sectionTitle}>{t("manual.radar.title")}</div>
      <div style={paragraph}>{t("manual.radar.desc")}</div>
      <div style={card}>
        <div style={sectionTitle}>{t("manual.radar.flow.title")}</div>
        <div style={paragraph}>{t("manual.radar.flow.step1")}</div>
        <div style={paragraph}>{t("manual.radar.flow.step2")}</div>
        <div style={paragraph}>{t("manual.radar.flow.step3")}</div>
      </div>
    </div>
  );
};
