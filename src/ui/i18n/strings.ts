// src/ui/i18n/strings.ts
// Descripcion: diccionario de traducciones (CA/ES/EN). Se usa via `useI18n().t(key)`.

import type { UILanguage } from "../../shared/dtos/SettingsDTOs";

export type I18nKey =
  | "topbar.scan"
  | "topbar.scanning"
  | "topbar.history"
  | "topbar.hideLogs"
  | "topbar.radar"
  | "topbar.hideRadar"
  | "topbar.attackLab"
  | "topbar.closeLab"
  | "topbar.settings"
  | "topbar.nodes"
  | "settings.title"
  | "settings.close"
  | "settings.tabs.general"
  | "settings.tabs.fieldManual"
  | "settings.language.label"
  | "settings.language.help"
  | "settings.legend.title"
  | "settings.legend.subtitle"
  | "settings.legend.router"
  | "settings.legend.host"
  | "settings.legend.intruder"
  | "settings.legend.wifiIntel"
  | "settings.legend.default"
  | "settings.legend.selected"
  | "settings.legend.hover"
  | "settings.legend.note"
  | "settings.manual.title"
  | "settings.manual.sections.legend"
  | "settings.manual.sections.radar"
  | "settings.manual.sections.attackLab"
  | "settings.manual.sections.console"
  | "settings.manual.sections.storage"
  | "manual.radar.title"
  | "manual.radar.desc"
  | "manual.console.title"
  | "manual.console.desc"
  | "manual.attackLab.title"
  | "manual.attackLab.desc"
  | "manual.attackLab.card.how"
  | "manual.attackLab.card.mitigations"
  | "manual.storage.title"
  | "manual.storage.desc"
  | "manual.legend.title"
  | "manual.legend.desc"
  | "manual.legend.selectHint";

type Dict = Record<I18nKey, string>;

export const STRINGS: Record<UILanguage, Dict> = {
  es: {
    "topbar.scan": "SCAN NET",
    "topbar.scanning": "SCANNING...",
    "topbar.history": "HISTORY",
    "topbar.hideLogs": "HIDE LOGS",
    "topbar.radar": "RADAR",
    "topbar.hideRadar": "HIDE RADAR",
    "topbar.attackLab": "ATTACK LAB",
    "topbar.closeLab": "CLOSE LAB",
    "topbar.settings": "SETTINGS",
    "topbar.nodes": "NODES",
    "settings.title": "SETTINGS // CONTROL CORE",
    "settings.close": "CERRAR",
    "settings.tabs.general": "GENERAL",
    "settings.tabs.fieldManual": "FIELD MANUAL",
    "settings.language.label": "IDIOMA DE INTERFAZ",
    "settings.language.help": "Afecta a la UI. Se persiste localmente (backend settings).",
    "settings.legend.title": "LEYENDA VISUAL: ESCENA 3D",
    "settings.legend.subtitle": "Colores, estados y señales. Misma paleta que el escenario.",
    "settings.legend.router": "ROUTER/GATEWAY (CENTRO)",
    "settings.legend.host": "HOST (TU EQUIPO)",
    "settings.legend.intruder": "INTRUSO (ANILLO DE ALARMA)",
    "settings.legend.wifiIntel": "WIFI INTEL (DATOS RSSI/BANDA)",
    "settings.legend.default": "DISPOSITIVO (DEFAULT)",
    "settings.legend.selected": "SELECCIONADO (RESALTE)",
    "settings.legend.hover": "HOVER (CURSOR)",
    "settings.legend.note": "Tip: si haces un nuevo scan/audit y no hay dispositivos nuevos, se mantiene el inventario actual para evitar flicker.",
    "settings.manual.title": "FIELD MANUAL",
    "settings.manual.sections.legend": "ESCENA 3D // LEYENDA",
    "settings.manual.sections.radar": "RADAR // RECON",
    "settings.manual.sections.attackLab": "ATTACK LAB // ESCENARIOS",
    "settings.manual.sections.console": "CONSOLE // TELEMETRIA",
    "settings.manual.sections.storage": "STORAGE // MEMORIA",
    "manual.legend.title": "Leyenda 3D (jugable)",
    "manual.legend.desc": "Selecciona un nodo de demostracion para ver su significado, señales y acciones tipicas.",
    "manual.legend.selectHint": "Tip: click en un nodo para fijarlo. Hover para previsualizar.",
    "manual.radar.title": "Radar View",
    "manual.radar.desc": "Recon pasivo de redes WiFi: canal, RSSI, seguridad y vendor. Sirve para priorizar objetivos y entender el entorno sin tocar trafico.",
    "manual.attackLab.title": "Attack Lab (catalogo)",
    "manual.attackLab.desc": "Escenarios predefinidos para auditoria y aprendizaje. Aqui se explica que observan, el impacto y como mitigarlo. No es un tutorial paso-a-paso.",
    "manual.attackLab.card.how": "Como funciona (alto nivel)",
    "manual.attackLab.card.mitigations": "Como evitarlo / hardening",
    "manual.console.title": "Console Logs",
    "manual.console.desc": "Telemetria de runtime: eventos del scanner, gateway audit, OpSec, traffic y ventanas detached. Es tu caja negra.",
    "manual.storage.title": "Storage",
    "manual.storage.desc": "Persistencia local: history (sesiones), snapshot (arranque rapido) y credenciales de gateway (keyring). Se usa para continuidad operativa sin mezclar redes distintas.",
  },
  ca: {
    "topbar.scan": "ESCANEJA",
    "topbar.scanning": "ESCANEJANT...",
    "topbar.history": "HISTORIAL",
    "topbar.hideLogs": "AMAGA LOGS",
    "topbar.radar": "RADAR",
    "topbar.hideRadar": "AMAGA RADAR",
    "topbar.attackLab": "ATTACK LAB",
    "topbar.closeLab": "TANCA LAB",
    "topbar.settings": "AJUSTOS",
    "topbar.nodes": "NODES",
    "settings.title": "AJUSTOS // CONTROL CORE",
    "settings.close": "TANCAR",
    "settings.tabs.general": "GENERAL",
    "settings.tabs.fieldManual": "FIELD MANUAL",
    "settings.language.label": "IDIOMA D'INTERFICIE",
    "settings.language.help": "Afecta la UI. Es persisteix localment (backend settings).",
    "settings.legend.title": "LLEGENDA VISUAL: ESCENA 3D",
    "settings.legend.subtitle": "Colors, estats i senyals. Mateixa paleta que l'escenari.",
    "settings.legend.router": "ROUTER/GATEWAY (CENTRE)",
    "settings.legend.host": "HOST (EL TEU EQUIP)",
    "settings.legend.intruder": "INTRÚS (ANELL D'ALARMA)",
    "settings.legend.wifiIntel": "WIFI INTEL (DADES RSSI/BANDA)",
    "settings.legend.default": "DISPOSITIU (DEFAULT)",
    "settings.legend.selected": "SELECCIONAT (RESSALT)",
    "settings.legend.hover": "HOVER (CURSOR)",
    "settings.legend.note": "Tip: si fas un nou scan/audit i no hi ha dispositius nous, es manté l'inventari actual per evitar flicker.",
    "settings.manual.title": "FIELD MANUAL",
    "settings.manual.sections.legend": "ESCENA 3D // LLEGENDA",
    "settings.manual.sections.radar": "RADAR // RECON",
    "settings.manual.sections.attackLab": "ATTACK LAB // ESCENARIS",
    "settings.manual.sections.console": "CONSOLE // TELEMETRIA",
    "settings.manual.sections.storage": "STORAGE // MEMORIA",
    "manual.legend.title": "Llegend 3D (jugable)",
    "manual.legend.desc": "Selecciona un node de demostracio per veure significat, senyals i accions tipiques.",
    "manual.legend.selectHint": "Tip: click en un node per fixar-lo. Hover per previsualitzar.",
    "manual.radar.title": "Radar View",
    "manual.radar.desc": "Recon passiu de xarxes WiFi: canal, RSSI, seguretat i vendor. Serveix per prioritzar objectius sense tocar trafic.",
    "manual.attackLab.title": "Attack Lab (cataleg)",
    "manual.attackLab.desc": "Escenaris predefinits per auditoria i aprenentatge. S'explica que observen i com mitigar-ho. No es un tutorial pas-a-pas.",
    "manual.attackLab.card.how": "Com funciona (alt nivell)",
    "manual.attackLab.card.mitigations": "Com evitar-ho / hardening",
    "manual.console.title": "Console Logs",
    "manual.console.desc": "Telemetria de runtime: events de scanner, gateway audit, OpSec, traffic i finestres detached.",
    "manual.storage.title": "Storage",
    "manual.storage.desc": "Persistencia local: history, snapshot i credencials de gateway (keyring). Evita barrejar xarxes diferents.",
  },
  en: {
    "topbar.scan": "SCAN NET",
    "topbar.scanning": "SCANNING...",
    "topbar.history": "HISTORY",
    "topbar.hideLogs": "HIDE LOGS",
    "topbar.radar": "RADAR",
    "topbar.hideRadar": "HIDE RADAR",
    "topbar.attackLab": "ATTACK LAB",
    "topbar.closeLab": "CLOSE LAB",
    "topbar.settings": "SETTINGS",
    "topbar.nodes": "NODES",
    "settings.title": "SETTINGS // CONTROL CORE",
    "settings.close": "CLOSE",
    "settings.tabs.general": "GENERAL",
    "settings.tabs.fieldManual": "FIELD MANUAL",
    "settings.language.label": "UI LANGUAGE",
    "settings.language.help": "Affects UI. Persisted locally (backend settings).",
    "settings.legend.title": "VISUAL LEGEND: 3D SCENE",
    "settings.legend.subtitle": "Colors, states and signals. Same palette as the scene.",
    "settings.legend.router": "ROUTER/GATEWAY (CENTER)",
    "settings.legend.host": "HOST (YOU)",
    "settings.legend.intruder": "INTRUDER (ALARM RING)",
    "settings.legend.wifiIntel": "WIFI INTEL (RSSI/BAND DATA)",
    "settings.legend.default": "DEVICE (DEFAULT)",
    "settings.legend.selected": "SELECTED (HIGHLIGHT)",
    "settings.legend.hover": "HOVER (CURSOR)",
    "settings.legend.note": "Tip: if a new scan/audit finds nothing new, the current inventory is kept to avoid flicker.",
    "settings.manual.title": "FIELD MANUAL",
    "settings.manual.sections.legend": "3D SCENE // LEGEND",
    "settings.manual.sections.radar": "RADAR // RECON",
    "settings.manual.sections.attackLab": "ATTACK LAB // SCENARIOS",
    "settings.manual.sections.console": "CONSOLE // TELEMETRY",
    "settings.manual.sections.storage": "STORAGE // MEMORY",
    "manual.legend.title": "3D Legend (playable)",
    "manual.legend.desc": "Select a demo node to see meaning, signals and typical actions.",
    "manual.legend.selectHint": "Tip: click a node to pin it. Hover to preview.",
    "manual.radar.title": "Radar View",
    "manual.radar.desc": "Passive WiFi recon: channel, RSSI, security and vendor. Helps prioritization without touching traffic.",
    "manual.attackLab.title": "Attack Lab (catalog)",
    "manual.attackLab.desc": "Preset scenarios for audit and learning. Explains what they observe, impact and mitigations. Not a step-by-step tutorial.",
    "manual.attackLab.card.how": "How it works (high level)",
    "manual.attackLab.card.mitigations": "How to prevent / hardening",
    "manual.console.title": "Console Logs",
    "manual.console.desc": "Runtime telemetry: scanner, gateway audit, OpSec, traffic and detached windows. Your black box.",
    "manual.storage.title": "Storage",
    "manual.storage.desc": "Local persistence: history, snapshot and gateway credentials (keyring). Keeps continuity without mixing networks.",
  },
};

export const DEFAULT_LANGUAGE: UILanguage = "es";
