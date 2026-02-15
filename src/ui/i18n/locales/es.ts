// src/ui/i18n/locales/es.ts
// Descripcion: traducciones en castellano (ES). Debe cubrir todas las claves definidas en `src/ui/i18n/keys.ts`.

import type { I18nKey } from "../keys";

export const ES_STRINGS: Record<I18nKey, string> = {
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
  "settings.close": "X",
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
  "settings.legend.killNet": "KILL NET (JAMMER ACTIVO)",
  "settings.legend.selected": "SELECCIONADO (RESALTE)",
  "settings.legend.hover": "HOVER (CURSOR)",
  "settings.legend.note":
    "Tip: si haces un nuevo scan/audit y no hay dispositivos nuevos, se mantiene el inventario actual para evitar flicker.",

  "settings.manual.title": "FIELD MANUAL",
  "settings.manual.sections.legend": "ESCENA 3D // LEYENDA",
  "settings.manual.sections.radar": "RADAR // RECON",
  "settings.manual.sections.attackLab": "ATTACK LAB // ESCENARIOS",
  "settings.manual.sections.console": "CONSOLE // TELEMETRIA",
  "settings.manual.sections.storage": "STORAGE // MEMORIA",

  "manual.legend.title": "Leyenda 3D (jugable)",
  "manual.legend.desc": "Selecciona un nodo de demostracion para ver su significado, señales y acciones tipicas.",
  "manual.legend.selectHint": "Tip: esta es una leyenda (no interactiva). El estado SELECTED se muestra en la tarjeta demo.",

  "manual.legend.nodes.router.subtitle": "Nodo central (gateway).",
  "manual.legend.nodes.router.info1":
    "Representa el gateway/centro de la red. Suele ser el primer salto y el punto de verdad para inventario (router sync).",
  "manual.legend.nodes.router.info2":
    "Acciones tipicas: gateway audit, login directo con credenciales guardadas, enumeracion de clientes.",

  "manual.legend.nodes.host.subtitle": "Tu host local.",
  "manual.legend.nodes.host.info1": "Tu equipo local. Se pinta verde para identificarte rapido.",
  "manual.legend.nodes.host.info2":
    "Si activas OpSec/Ghost Mode, la MAC se actualiza y el inventario elimina clones stale.",

  "manual.legend.nodes.intruder.subtitle": "Marcado como intruso.",
  "manual.legend.nodes.intruder.info1":
    "Marca un dispositivo nuevo respecto a historial/huellas de red. En la escena aparece un anillo de alarma.",
  "manual.legend.nodes.intruder.info2":
    "Mitigacion: re-scan para confirmar; valida vendor/OUI y revisa DHCP/ARP en el router.",

  "manual.legend.nodes.wifi.subtitle": "Nodo con telemetria WiFi.",
  "manual.legend.nodes.wifi.info1": "Nodo con datos WiFi (banda/RSSI) detectados. Aporta telemetria adicional.",
  "manual.legend.nodes.wifi.info2": "Uso: enriquecer lectura del entorno y priorizar auditorias/segmentacion.",

  "manual.legend.nodes.default.subtitle": "Dispositivo default.",
  "manual.legend.nodes.default.info1": "Nodo default (sin metadatos WiFi o no-host).",
  "manual.legend.nodes.default.info2": "Uso: inventario base y punto de entrada para auditorias no intrusivas.",

  "manual.legend.nodes.jammed.subtitle": "Kill Net activo (swarm + rayos).",
  "manual.legend.nodes.jammed.info1": "Kill Net activo: hay un bucle de ARP poisoning contra este dispositivo.",
  "manual.legend.nodes.jammed.info2":
    "FX: swarm de naves + anillo pulsante + rayos intermitentes para señalar jamming activo.",

  "manual.legend.nodes.selected.title": "Nodo seleccionado (demo)",
  "manual.legend.nodes.selected.subtitle": "Así se ve un nodo cuando lo seleccionas en la escena 3D.",
  "manual.legend.nodes.selected.info1": "El resaltado comunica foco operativo: acciones y paneles apuntan a este target.",
  "manual.legend.nodes.selected.info2": "Tip: si ves un nodo con este estilo, es el objetivo activo del operador.",

  "manual.radar.title": "Radar View",
  "manual.radar.desc":
    "Recon pasivo de redes WiFi: canal, RSSI, seguridad y vendor. Sirve para priorizar objetivos y entender el entorno sin tocar trafico.",
  "manual.radar.flow.title": "Flujo recomendado",
  "manual.radar.flow.step1": "1. Scan airwaves para ver APs, canal y seguridad.",
  "manual.radar.flow.step2": "2. Selecciona red objetivo y abre Attack Lab con contexto.",
  "manual.radar.flow.step3": "3. Si cambias de red, prioriza un nuevo escaneo y rehacer inventario real.",

  "manual.attackLab.title": "Attack Lab (catalogo)",
  "manual.attackLab.desc":
    "Escenarios predefinidos para auditoria y aprendizaje. Aqui se explica que observan, el impacto y como mitigarlo. No es un tutorial paso-a-paso.",
  "manual.attackLab.card.how": "Como funciona (alto nivel)",
  "manual.attackLab.card.mitigations": "Como evitarlo / hardening",
  "manual.attackLab.card.notes": "Notas",

  "manual.console.title": "Console Logs",
  "manual.console.desc":
    "Telemetria de runtime: eventos del scanner, gateway audit, OpSec, traffic y ventanas detached. Es tu caja negra.",
  "manual.console.lookFor.title": "Que buscar",
  "manual.console.lookFor.item1": "- Sync complete/imported nodes",
  "manual.console.lookFor.item2": "- Eventos OpSec (ghost-mode-applied)",
  "manual.console.lookFor.item3": "- Errores de drivers/permiso (elevacion) y timeouts",

  "manual.storage.title": "Storage",
  "manual.storage.desc":
    "Persistencia local: history (sesiones), snapshot (arranque rapido) y credenciales de gateway (keyring). Se usa para continuidad operativa sin mezclar redes distintas.",
  "manual.storage.components.title": "Componentes",
  "manual.storage.components.item1": "- History: sesiones de scan para comparar deltas.",
  "manual.storage.components.item2": "- Snapshot: arranque rapido con la ultima foto valida.",
  "manual.storage.components.item3": "- Credenciales de gateway: keyring local para login directo.",
};
