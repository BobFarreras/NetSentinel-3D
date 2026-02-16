// src/ui/features/settings/components/field_manual/sections/FieldManualLegendSection.tsx
// Descripcion: seccion de leyenda 3D "jugable". Lista scroll-friendly: cada nodo en su caja con descripcion al lado.

import { useMemo } from "react";
import { useI18n } from "../../../../../i18n";
import type { LegendNodeId } from "../LegendArena3D";
import { LegendNodeCard } from "../LegendNodeCard";
import { paragraph, sectionTitle } from "../fieldManualStyles";

type LegendNode = {
  id: LegendNodeId;
  title: string;
  color: string;
  subtitle: string;
};

export const FieldManualLegendSection: React.FC = () => {
  const { t } = useI18n();

  const legendNodes = useMemo<LegendNode[]>(
    () => [
      {
        id: "router",
        title: t("settings.legend.router"),
        color: "#0088ff",
        subtitle: t("manual.legend.nodes.router.subtitle"),
      },
      {
        id: "host",
        title: t("settings.legend.host"),
        color: "#00ff00",
        subtitle: t("manual.legend.nodes.host.subtitle"),
      },
      {
        id: "intruder",
        title: t("settings.legend.intruder"),
        color: "#ff0000",
        subtitle: t("manual.legend.nodes.intruder.subtitle"),
      },
      {
        id: "wifi",
        title: t("settings.legend.wifiIntel"),
        color: "#ff00ff",
        subtitle: t("manual.legend.nodes.wifi.subtitle"),
      },
      {
        id: "default",
        title: t("settings.legend.default"),
        color: "#ff4444",
        subtitle: t("manual.legend.nodes.default.subtitle"),
      },
      {
        id: "jammed",
        title: t("settings.legend.killNet"),
        color: "#ff4444",
        subtitle: t("manual.legend.nodes.jammed.subtitle"),
      },
    ],
    [t]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={sectionTitle}>{t("manual.legend.title")}</div>
      <div style={paragraph}>{t("manual.legend.desc")}</div>
      <div style={{ ...paragraph, color: "rgba(0,229,255,0.82)" }}>
        {/* Ya no es interactivo: mostramos la idea sin sugerir clicks */}
        {t("manual.legend.selectHint")}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {legendNodes.map((n) => (
          <LegendNodeCard
            key={n.id}
            nodeKind={n.id}
            title={n.title}
            subtitle={n.subtitle}
            color={n.color}
            details={
              n.id === "router"
                ? [t("manual.legend.nodes.router.info1"), t("manual.legend.nodes.router.info2")]
                : n.id === "host"
                  ? [t("manual.legend.nodes.host.info1"), t("manual.legend.nodes.host.info2")]
                  : n.id === "intruder"
                    ? [t("manual.legend.nodes.intruder.info1"), t("manual.legend.nodes.intruder.info2")]
                    : n.id === "wifi"
                      ? [t("manual.legend.nodes.wifi.info1"), t("manual.legend.nodes.wifi.info2")]
                      : n.id === "jammed"
                        ? [t("manual.legend.nodes.jammed.info1"), t("manual.legend.nodes.jammed.info2")]
                        : [t("manual.legend.nodes.default.info1"), t("manual.legend.nodes.default.info2")]
            }
            // Importante: los nodos NO son seleccionables en Settings (es documentacion).
            isSelected={false}
          />
        ))}

        {/* Demo explicito: como se ve un nodo cuando esta seleccionado en el escenario real */}
        <LegendNodeCard
          nodeKind={"selected_demo"}
          title={t("manual.legend.nodes.selected.title")}
          subtitle={t("manual.legend.nodes.selected.subtitle")}
          color={"rgba(0,229,255,0.95)"}
          details={[t("manual.legend.nodes.selected.info1"), t("manual.legend.nodes.selected.info2")]}
          isSelected={true}
          animatePreview={true}
        />
      </div>
    </div>
  );
};
