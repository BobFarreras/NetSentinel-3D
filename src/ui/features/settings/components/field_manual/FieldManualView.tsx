// src/ui/features/settings/components/field_manual/FieldManualView.tsx
// Descripcion: vista "Field Manual" dentro de Settings. Documenta secciones (Radar/Attack/Console/etc.) y leyenda 3D jugable.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { HUD_COLORS, HUD_TYPO } from "../../../../styles/hudTokens";
import { useI18n } from "../../../../i18n";
import { LegendArena3D, type LegendNodeId } from "./LegendArena3D";
import { getAttackLabScenarios } from "../../../attack_lab/catalog/attackLabScenarios";
import { getScenarioManual } from "../../field_manual/attackScenarioManual";

type ManualSection = "legend" | "radar" | "attack_lab" | "console" | "storage";

const navBtn = (active: boolean, narrow: boolean): React.CSSProperties => ({
  height: 34,
  width: narrow ? "auto" : "100%",
  minWidth: narrow ? 140 : undefined,
  textAlign: narrow ? "center" : "left",
  padding: "0 10px",
  borderRadius: 2,
  border: `1px solid ${active ? "rgba(0,229,255,0.55)" : "rgba(0,255,136,0.18)"}`,
  background: active ? "rgba(0,229,255,0.10)" : "rgba(0,0,0,0.25)",
  color: active ? HUD_COLORS.accentCyan : "rgba(183,255,226,0.85)",
  cursor: "pointer",
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

const sectionTitle: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1.1,
  textTransform: "uppercase",
  color: HUD_COLORS.textMain,
  marginBottom: 6,
};

const paragraph: React.CSSProperties = {
  fontFamily: HUD_TYPO.mono,
  fontSize: 11,
  lineHeight: 1.5,
  color: "rgba(183,255,226,0.75)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(0,255,136,0.12)",
  background: "rgba(0,0,0,0.35)",
  borderRadius: 2,
  padding: 10,
};

export function FieldManualView() {
  const { t, language } = useI18n();
  const [section, setSection] = useState<ManualSection>("legend");
  const [legendSelected, setLegendSelected] = useState<LegendNodeId | null>("router");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      // 760px es el umbral donde el panel empieza a quedarse sin espacio en split/detached.
      setIsNarrow(Boolean(w && w < 760));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const legendNodes = useMemo(
    () => [
      {
        id: "router" as const,
        title: t("settings.legend.router"),
        color: "#0088ff",
        subtitle: language === "en" ? "Central node (gateway)." : language === "ca" ? "Node central (gateway)." : "Nodo central (gateway).",
      },
      {
        id: "host" as const,
        title: t("settings.legend.host"),
        color: "#00ff00",
        subtitle: language === "en" ? "Your local host." : language === "ca" ? "El teu host local." : "Tu host local.",
      },
      {
        id: "intruder" as const,
        title: t("settings.legend.intruder"),
        color: "#ff0000",
        subtitle: language === "en" ? "Flagged as intruder." : language === "ca" ? "Marcat com a intrus." : "Marcado como intruso.",
      },
      {
        id: "wifi" as const,
        title: t("settings.legend.wifiIntel"),
        color: "#ff00ff",
        subtitle: language === "en" ? "Node with WiFi telemetry." : language === "ca" ? "Node amb telemetria WiFi." : "Nodo con telemetria WiFi.",
      },
      {
        id: "default" as const,
        title: t("settings.legend.default"),
        color: "#ff4444",
        subtitle: language === "en" ? "Default device." : language === "ca" ? "Dispositiu default." : "Dispositivo default.",
      },
    ],
    [language, t]
  );

  const legendInfo = useMemo(() => {
    const selected = legendNodes.find((n) => n.id === legendSelected) ?? legendNodes[0];
    if (!selected) return null;
    switch (selected.id) {
      case "router":
        return language === "en"
          ? [
              "Represents the gateway/core of the network. Often the first hop and the source of truth for inventory (router sync).",
              "Typical actions: gateway audit, direct login with saved creds, client enumeration.",
            ]
          : language === "ca"
          ? [
              "Representa el gateway/centre de la xarxa. Sovint es el primer salt i el punt de veritat per l'inventari (router sync).",
              "Accions tipiques: gateway audit, login directe amb credencials guardades, enumeracio de clients.",
            ]
          : [
              "Representa el gateway/centro de la red. Suele ser el primer salto y el punto de verdad para inventario (router sync).",
              "Acciones tipicas: gateway audit, login directo con credenciales guardadas, enumeracion de clientes.",
            ];
      case "host":
        return language === "en"
          ? [
              "Your local machine. Painted green for quick identification.",
              "If you enable OpSec/Ghost Mode, MAC is updated and stale clones are removed from inventory.",
            ]
          : language === "ca"
          ? [
              "El teu equip local. Es pinta verd per identificar-te rapid.",
              "Si actives OpSec/Ghost Mode, la MAC s'actualitza i l'inventari elimina clones stale.",
            ]
          : [
              "Tu equipo local. Se pinta verde para identificarte rapido.",
              "Si activas OpSec/Ghost Mode, la MAC se actualiza y el inventario elimina clones stale.",
            ];
      case "intruder":
        return language === "en"
          ? [
              "Flags a new device vs history/network fingerprint. An alarm ring is shown in the scene.",
              "Mitigation: re-scan to confirm; validate vendor/OUI and check DHCP/ARP at the router.",
            ]
          : language === "ca"
          ? [
              "Marca un dispositiu nou respecte historial/empremta de xarxa. A l'escena apareix un anell d'alarma.",
              "Mitigacio: re-scan per confirmar; valida vendor/OUI i revisa DHCP/ARP al router.",
            ]
          : [
              "Marca un dispositivo nuevo respecto a historial/huellas de red. En la escena aparece un anillo de alarma.",
              "Mitigacion: re-scan para confirmar; valida vendor/OUI y revisa DHCP/ARP en el router.",
            ];
      case "wifi":
        return language === "en"
          ? [
              "Node with WiFi data (band/RSSI). Signals the device provides extra telemetry.",
              "Use: enrich environment reading and prioritize audits/segmentation.",
            ]
          : language === "ca"
          ? [
              "Node amb dades WiFi (banda/RSSI). Senyal que el dispositiu aporta telemetria extra.",
              "Us: enriquir lectura de l'entorn i prioritzar auditories/segmentacio.",
            ]
          : [
              "Nodo con datos WiFi (banda/RSSI) detectados. Es señal de que el dispositivo aporta telemetria adicional.",
              "Uso: enriquecer lectura del entorno y priorizar auditorias/segmentacion.",
            ];
      default:
        return language === "en"
          ? [
              "Default node (no WiFi metadata or non-host).",
              "Use: base inventory and entry point for non-intrusive audits.",
            ]
          : language === "ca"
          ? [
              "Node default (sense metadades WiFi o no-host).",
              "Us: inventari base i punt d'entrada per auditories no intrusives.",
            ]
          : [
              "Nodo default (sin metadatos WiFi o no-host).",
              "Uso: inventario base y punto de entrada para auditorias no intrusivas.",
            ];
    }
  }, [language, legendNodes, legendSelected]);

  const scenarios = useMemo(() => getAttackLabScenarios(), []);

  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        gap: 12,
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        flexDirection: isNarrow ? "column" : "row",
      }}
    >
      <div
        style={{
          width: isNarrow ? "100%" : 210,
          flexShrink: 0,
          display: "flex",
          flexDirection: isNarrow ? "row" : "column",
          gap: 8,
          flexWrap: isNarrow ? "wrap" : "nowrap",
          alignItems: isNarrow ? "center" : "stretch",
          overflowX: isNarrow ? "auto" : "visible",
          paddingBottom: isNarrow ? 2 : 0,
        }}
      >
        <div style={{ fontFamily: HUD_TYPO.mono, fontSize: 11, fontWeight: 950, letterSpacing: 1.0, color: HUD_COLORS.accentGreen, textTransform: "uppercase" }}>
          {t("settings.manual.title")}
        </div>
        <button style={navBtn(section === "legend", isNarrow)} onClick={() => setSection("legend")} aria-label="MANUAL_SECTION_LEGEND">
          {t("settings.manual.sections.legend")}
        </button>
        <button style={navBtn(section === "radar", isNarrow)} onClick={() => setSection("radar")} aria-label="MANUAL_SECTION_RADAR">
          {t("settings.manual.sections.radar")}
        </button>
        <button style={navBtn(section === "attack_lab", isNarrow)} onClick={() => setSection("attack_lab")} aria-label="MANUAL_SECTION_ATTACK_LAB">
          {t("settings.manual.sections.attackLab")}
        </button>
        <button style={navBtn(section === "console", isNarrow)} onClick={() => setSection("console")} aria-label="MANUAL_SECTION_CONSOLE">
          {t("settings.manual.sections.console")}
        </button>
        <button style={navBtn(section === "storage", isNarrow)} onClick={() => setSection("storage")} aria-label="MANUAL_SECTION_STORAGE">
          {t("settings.manual.sections.storage")}
        </button>

        <div style={{ ...card, marginTop: 8, width: isNarrow ? "100%" : "auto" }}>
          <div style={{ ...sectionTitle, marginBottom: 4 }}>DOCS</div>
          <div style={paragraph}>
            <div>
              <code style={{ color: HUD_COLORS.accentCyan }}>docs/RADAR_VIEW.md</code>
            </div>
            <div>
              <code style={{ color: HUD_COLORS.accentCyan }}>docs/EXTERNAL_AUDIT.md</code>
            </div>
            <div>
              <code style={{ color: HUD_COLORS.accentCyan }}>docs/OPSEC_GHOST_MODE.md</code>
            </div>
            <div>
              <code style={{ color: HUD_COLORS.accentCyan }}>docs/ARCHITECTURE.md</code>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "auto", paddingRight: 2 }}>
        {section === "legend" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={sectionTitle}>{t("manual.legend.title")}</div>
            <div style={paragraph}>{t("manual.legend.desc")}</div>
            <div style={{ ...paragraph, color: "rgba(0,229,255,0.82)" }}>{t("manual.legend.selectHint")}</div>

            <LegendArena3D
              nodes={legendNodes}
              selectedId={legendSelected}
              onSelect={(id) => setLegendSelected(id)}
            />

            <div style={card}>
              <div style={{ ...sectionTitle, marginBottom: 6 }}>{legendNodes.find((n) => n.id === legendSelected)?.title}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {legendInfo?.map((line) => (
                  <div key={line} style={paragraph}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "radar" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={sectionTitle}>{t("manual.radar.title")}</div>
            <div style={paragraph}>{t("manual.radar.desc")}</div>
            <div style={card}>
              <div style={sectionTitle}>
                {language === "en" ? "Recommended Flow" : language === "ca" ? "Flux recomanat" : "Flujo recomendado"}
              </div>
              {language === "en" ? (
                <>
                  <div style={paragraph}>1. Scan airwaves to see APs, channel and security.</div>
                  <div style={paragraph}>2. Select a target network and open Attack Lab with context.</div>
                  <div style={paragraph}>3. If you switch networks, prioritize a new scan and rebuild real inventory.</div>
                </>
              ) : language === "ca" ? (
                <>
                  <div style={paragraph}>1. Scan airwaves per veure APs, canal i seguretat.</div>
                  <div style={paragraph}>2. Selecciona xarxa objectiu i obre Attack Lab amb context.</div>
                  <div style={paragraph}>3. Si canvies de xarxa, prioritzes nou escaneig i reconstruir inventari real.</div>
                </>
              ) : (
                <>
                  <div style={paragraph}>1. Scan airwaves para ver APs, canal y seguridad.</div>
                  <div style={paragraph}>2. Selecciona red objetivo y abre Attack Lab con contexto.</div>
                  <div style={paragraph}>3. Si cambias de red, prioriza un nuevo escaneo y rehacer inventario real.</div>
                </>
              )}
            </div>
          </div>
        )}

        {section === "console" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={sectionTitle}>{t("manual.console.title")}</div>
            <div style={paragraph}>{t("manual.console.desc")}</div>
            <div style={card}>
              <div style={sectionTitle}>Que buscar</div>
              <div style={paragraph}>- Sync complete/imported nodes</div>
              <div style={paragraph}>- Eventos OpSec (ghost-mode-applied)</div>
              <div style={paragraph}>- Errores de drivers/permiso (elevacion) y timeouts</div>
            </div>
          </div>
        )}

        {section === "storage" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={sectionTitle}>{t("manual.storage.title")}</div>
            <div style={paragraph}>{t("manual.storage.desc")}</div>
            <div style={card}>
              <div style={sectionTitle}>Componentes</div>
              <div style={paragraph}>- History: sesiones de scan para comparar deltas.</div>
              <div style={paragraph}>- Snapshot: arranque rapido con la ultima foto valida.</div>
              <div style={paragraph}>- Credenciales de gateway: keyring local para login directo.</div>
            </div>
          </div>
        )}

        {section === "attack_lab" && (
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
                          <div style={{ ...sectionTitle, fontSize: 11 }}>Notas</div>
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
        )}
      </div>
    </div>
  );
}
