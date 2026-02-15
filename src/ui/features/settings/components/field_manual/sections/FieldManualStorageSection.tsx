// src/ui/features/settings/components/field_manual/sections/FieldManualStorageSection.tsx
// Descripcion: seccion Storage del Field Manual (history/snapshot/credenciales).

import { useI18n } from "../../../../../i18n";
import { card, paragraph, sectionTitle } from "../fieldManualStyles";

export const FieldManualStorageSection: React.FC = () => {
  const { t } = useI18n();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={sectionTitle}>{t("manual.storage.title")}</div>
      <div style={paragraph}>{t("manual.storage.desc")}</div>
      <div style={card}>
        <div style={sectionTitle}>{t("manual.storage.components.title")}</div>
        <div style={paragraph}>{t("manual.storage.components.item1")}</div>
        <div style={paragraph}>{t("manual.storage.components.item2")}</div>
        <div style={paragraph}>{t("manual.storage.components.item3")}</div>
      </div>
    </div>
  );
};
