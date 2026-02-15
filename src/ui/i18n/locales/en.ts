// src/ui/i18n/locales/en.ts
// Descripcion: traducciones en ingles (EN). Debe cubrir todas las claves definidas en `src/ui/i18n/keys.ts`.

import type { I18nKey } from "../keys";

export const EN_STRINGS: Record<I18nKey, string> = {
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
  "settings.language.label": "UI LANGUAGE",
  "settings.language.help": "Affects UI. Persisted locally (backend settings).",

  "settings.legend.title": "VISUAL LEGEND: 3D SCENE",
  "settings.legend.subtitle": "Colors, states and signals. Same palette as the scene.",
  "settings.legend.router": "ROUTER/GATEWAY (CENTER)",
  "settings.legend.host": "HOST (YOU)",
  "settings.legend.intruder": "INTRUDER (ALARM RING)",
  "settings.legend.wifiIntel": "WIFI INTEL (RSSI/BAND DATA)",
  "settings.legend.default": "DEVICE (DEFAULT)",
  "settings.legend.killNet": "KILL NET (JAMMER ACTIVE)",
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
  "manual.legend.selectHint": "Tip: this is a legend (non-interactive). The SELECTED state is shown in the demo card.",

  "manual.legend.nodes.router.subtitle": "Central node (gateway).",
  "manual.legend.nodes.router.info1":
    "Represents the gateway/core of the network. Often the first hop and the source of truth for inventory (router sync).",
  "manual.legend.nodes.router.info2":
    "Typical actions: gateway audit, direct login with saved creds, client enumeration.",

  "manual.legend.nodes.host.subtitle": "Your local host.",
  "manual.legend.nodes.host.info1": "Your local machine. Painted green for quick identification.",
  "manual.legend.nodes.host.info2": "If you enable OpSec/Ghost Mode, MAC is updated and stale clones are removed from inventory.",

  "manual.legend.nodes.intruder.subtitle": "Flagged as intruder.",
  "manual.legend.nodes.intruder.info1":
    "Flags a new device vs history/network fingerprint. An alarm ring is shown in the scene.",
  "manual.legend.nodes.intruder.info2":
    "Mitigation: re-scan to confirm; validate vendor/OUI and check DHCP/ARP at the router.",

  "manual.legend.nodes.wifi.subtitle": "Node with WiFi telemetry.",
  "manual.legend.nodes.wifi.info1": "Node with WiFi data (band/RSSI). Signals the device provides extra telemetry.",
  "manual.legend.nodes.wifi.info2": "Use: enrich environment reading and prioritize audits/segmentation.",

  "manual.legend.nodes.default.subtitle": "Default device.",
  "manual.legend.nodes.default.info1": "Default node (no WiFi metadata or non-host).",
  "manual.legend.nodes.default.info2": "Use: base inventory and entry point for non-intrusive audits.",

  "manual.legend.nodes.jammed.subtitle": "Kill Net active (swarm + beams).",
  "manual.legend.nodes.jammed.info1": "Kill Net active: ARP poisoning loop is running against this device.",
  "manual.legend.nodes.jammed.info2": "FX: swarm drones orbit + red pulse ring + intermittent beams to communicate active jamming.",

  "manual.legend.nodes.selected.title": "Selected node (demo)",
  "manual.legend.nodes.selected.subtitle": "This is how a node looks when selected in the 3D scene.",
  "manual.legend.nodes.selected.info1": "Highlight communicates operational focus: actions and panels target this node.",
  "manual.legend.nodes.selected.info2": "Tip: if you see this style, it's the operator's active target.",

  "manual.radar.title": "Radar View",
  "manual.radar.desc": "Passive WiFi recon: channel, RSSI, security and vendor. Helps prioritization without touching traffic.",
  "manual.radar.flow.title": "Recommended Flow",
  "manual.radar.flow.step1": "1. Scan airwaves to see APs, channel and security.",
  "manual.radar.flow.step2": "2. Select a target network and open Attack Lab with context.",
  "manual.radar.flow.step3": "3. If you switch networks, prioritize a new scan and rebuild real inventory.",

  "manual.attackLab.title": "Attack Lab (catalog)",
  "manual.attackLab.desc":
    "Preset scenarios for audit and learning. Explains what they observe, impact and mitigations. Not a step-by-step tutorial.",
  "manual.attackLab.card.how": "How it works (high level)",
  "manual.attackLab.card.mitigations": "How to prevent / hardening",
  "manual.attackLab.card.notes": "Notes",

  "manual.console.title": "Console Logs",
  "manual.console.desc": "Runtime telemetry: scanner, gateway audit, OpSec, traffic and detached windows. Your black box.",
  "manual.console.lookFor.title": "What to watch",
  "manual.console.lookFor.item1": "- Sync complete/imported nodes",
  "manual.console.lookFor.item2": "- OpSec events (ghost-mode-applied)",
  "manual.console.lookFor.item3": "- Driver/permission errors (elevation) and timeouts",

  "manual.storage.title": "Storage",
  "manual.storage.desc":
    "Local persistence: history, snapshot and gateway credentials (keyring). Keeps continuity without mixing networks.",
  "manual.storage.components.title": "Components",
  "manual.storage.components.item1": "- History: scan sessions to compare deltas.",
  "manual.storage.components.item2": "- Snapshot: fast boot with last known good state.",
  "manual.storage.components.item3": "- Gateway credentials: local keyring for direct login.",
};
