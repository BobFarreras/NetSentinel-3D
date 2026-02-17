// src/ui/features/settings/components/field_manual/sections/FieldManualAttackLabSection.tsx
// Descripcion: seccion Attack Lab del Field Manual. Renderiza escenarios + manual didactico por idioma.

import { useMemo } from "react";
import { HUD_TYPO } from "../../../../../styles/hudTokens";
import { useI18n } from "../../../../../i18n";
import { getAttackLabScenarios } from "../../../../attack_lab/catalog/attackLabScenarios";
import { getScenarioManual } from "../../../field_manual/attackScenarioManual";
import { card, paragraph, sectionTitle } from "../fieldManualStyles";

export const FieldManualAttackLabSection: React.FC = () => {
  const { t, language } = useI18n();
  const scenarios = useMemo(() => getAttackLabScenarios(), []);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={sectionTitle}>{t("manual.attackLab.title")}</div>
      <div style={paragraph}>{t("manual.attackLab.desc")}</div>

      <div style={{ display: "grid", gap: 10 }}>
        {scenarios.map((s) => {
          const manual = getScenarioManual(s.id, language);
          return (
            <div key={s.id} style={card}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <div style={{ ...sectionTitle, marginBottom: 0 }}>{s.title}</div>
                <div style={{ fontFamily: HUD_TYPO.mono, fontSize: 11, color: "rgba(183,255,226,0.55)" }}>{s.category}</div>
              </div>
              <div style={{ ...paragraph, marginTop: 6 }}>{s.description}</div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div>
                  <div style={{ ...sectionTitle, fontSize: 11 }}>{t("manual.attackLab.card.how")}</div>
                  <div style={paragraph}>{manual.how}</div>
                </div>
                <div>
                  <div style={{ ...sectionTitle, fontSize: 11 }}>{t("manual.attackLab.card.mitigations")}</div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {manual.mitigations.map((m) => (
                      <div key={m} style={paragraph}>
                        - {m}
                      </div>
                    ))}
                  </div>
                </div>
                {manual.notes && manual.notes.length > 0 && (
                  <div>
                    <div style={{ ...sectionTitle, fontSize: 11 }}>{t("manual.attackLab.card.notes")}</div>
                    <div style={{ display: "grid", gap: 4 }}>
                      {manual.notes.map((n) => (
                        <div key={n} style={paragraph}>
                          - {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
