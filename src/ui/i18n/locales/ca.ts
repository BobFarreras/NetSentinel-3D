// src/ui/i18n/locales/ca.ts
// Descripcion: traduccions en catala (CA). Ha de cobrir totes les claus definides a `src/ui/i18n/keys.ts`.

import type { I18nKey } from "../keys";

export const CA_STRINGS: Record<I18nKey, string> = {
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
  "settings.close": "X",
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
  "settings.legend.killNet": "KILL NET (JAMMER ACTIU)",
  "settings.legend.selected": "SELECCIONAT (RESSALT)",
  "settings.legend.hover": "HOVER (CURSOR)",
  "settings.legend.note":
    "Tip: si fas un nou scan/audit i no hi ha dispositius nous, es manté l'inventari actual per evitar flicker.",

  "settings.manual.title": "FIELD MANUAL",
  "settings.manual.sections.legend": "ESCENA 3D // LLEGENDA",
  "settings.manual.sections.radar": "RADAR // RECON",
  "settings.manual.sections.attackLab": "ATTACK LAB // ESCENARIS",
  "settings.manual.sections.console": "CONSOLE // TELEMETRIA",
  "settings.manual.sections.storage": "STORAGE // MEMORIA",

  "manual.legend.title": "Llegenda 3D (jugable)",
  "manual.legend.desc": "Selecciona un node de demostracio per veure significat, senyals i accions tipiques.",
  "manual.legend.selectHint": "Tip: aixo es una llegenda (no interactiva). L'estat SELECTED es mostra a la targeta demo.",

  "manual.legend.nodes.router.subtitle": "Node central (gateway).",
  "manual.legend.nodes.router.info1":
    "Representa el gateway/centre de la xarxa. Sovint es el primer salt i el punt de veritat per l'inventari (router sync).",
  "manual.legend.nodes.router.info2":
    "Accions tipiques: gateway audit, login directe amb credencials guardades, enumeracio de clients.",

  "manual.legend.nodes.host.subtitle": "El teu host local.",
  "manual.legend.nodes.host.info1": "El teu equip local. Es pinta verd per identificar-te rapid.",
  "manual.legend.nodes.host.info2": "Si actives OpSec/Ghost Mode, la MAC s'actualitza i l'inventari elimina clones stale.",

  "manual.legend.nodes.intruder.subtitle": "Marcat com a intrus.",
  "manual.legend.nodes.intruder.info1":
    "Marca un dispositiu nou respecte historial/empremta de xarxa. A l'escena apareix un anell d'alarma.",
  "manual.legend.nodes.intruder.info2":
    "Mitigacio: re-scan per confirmar; valida vendor/OUI i revisa DHCP/ARP al router.",

  "manual.legend.nodes.wifi.subtitle": "Node amb telemetria WiFi.",
  "manual.legend.nodes.wifi.info1": "Node amb dades WiFi (banda/RSSI). Senyal que el dispositiu aporta telemetria extra.",
  "manual.legend.nodes.wifi.info2": "Us: enriquir lectura de l'entorn i prioritzar auditories/segmentacio.",

  "manual.legend.nodes.default.subtitle": "Dispositiu default.",
  "manual.legend.nodes.default.info1": "Node default (sense metadades WiFi o no-host).",
  "manual.legend.nodes.default.info2": "Us: inventari base i punt d'entrada per auditories no intrusives.",

  "manual.legend.nodes.jammed.subtitle": "Kill Net actiu (swarm + rajos).",
  "manual.legend.nodes.jammed.info1": "Kill Net actiu: hi ha un bucle d'ARP poisoning contra aquest dispositiu.",
  "manual.legend.nodes.jammed.info2": "FX: swarm de naus + anell pulsant + rajos intermitents per senyalitzar jamming actiu.",

  "manual.legend.nodes.selected.title": "Node seleccionat (demo)",
  "manual.legend.nodes.selected.subtitle": "Així es veu un node quan el selecciones a l'escena 3D.",
  "manual.legend.nodes.selected.info1": "El ressalt comunica focus operatiu: accions i panells apunten a aquest target.",
  "manual.legend.nodes.selected.info2": "Tip: si veus un node amb aquest estil, es l'objectiu actiu de l'operador.",

  "manual.radar.title": "Radar View",
  "manual.radar.desc":
    "Recon passiu de xarxes WiFi: canal, RSSI, seguretat i vendor. Serveix per prioritzar objectius sense tocar trafic.",
  "manual.radar.flow.title": "Flux recomanat",
  "manual.radar.flow.step1": "1. Scan airwaves per veure APs, canal i seguretat.",
  "manual.radar.flow.step2": "2. Selecciona xarxa objectiu i obre Attack Lab amb context.",
  "manual.radar.flow.step3": "3. Si canvies de xarxa, prioritza nou escaneig i reconstruir inventari real.",

  "manual.attackLab.title": "Attack Lab (cataleg)",
  "manual.attackLab.desc":
    "Escenaris predefinits per auditoria i aprenentatge. S'explica que observen i com mitigar-ho. No es un tutorial pas-a-pas.",
  "manual.attackLab.card.how": "Com funciona (alt nivell)",
  "manual.attackLab.card.mitigations": "Com evitar-ho / hardening",
  "manual.attackLab.card.notes": "Notes",

  "manual.console.title": "Console Logs",
  "manual.console.desc": "Telemetria de runtime: events de scanner, gateway audit, OpSec, traffic i finestres detached.",
  "manual.console.lookFor.title": "Que buscar",
  "manual.console.lookFor.item1": "- Sync complete/imported nodes",
  "manual.console.lookFor.item2": "- Events OpSec (ghost-mode-applied)",
  "manual.console.lookFor.item3": "- Errors de drivers/permis (elevacio) i timeouts",

  "manual.storage.title": "Storage",
  "manual.storage.desc":
    "Persistencia local: history, snapshot i credencials de gateway (keyring). Evita barrejar xarxes diferents.",
  "manual.storage.components.title": "Components",
  "manual.storage.components.item1": "- History: sessions de scan per comparar deltes.",
  "manual.storage.components.item2": "- Snapshot: arrencada rapida amb l'ultima foto valida.",
  "manual.storage.components.item3": "- Credencials de gateway: keyring local per login directe.",
};
