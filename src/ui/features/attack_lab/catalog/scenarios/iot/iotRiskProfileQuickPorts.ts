// src/ui/features/attack_lab/catalog/scenarios/iot/iotRiskProfileQuickPorts.ts
// Escenario IOT native: perfilado rápido usando el motor Rust (multihilo) con validación de IP.

import type { AttackLabScenario } from "../../types";
import { invoke } from "@tauri-apps/api/core";

// Helper simple per validar IPv4
const isIPv4 = (ip: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip);

export const iotRiskProfileQuickPortsScenario: AttackLabScenario = {
  id: "iot_risk_profile_quick_ports",
  title: "IoT: Perfilado de riesgo (NATIVE RUST)",
  description:
    "Auditoría de precisión usando NetSentinel Core. Ejecuta un 'Connect Scan' multihilo contra puertos críticos (MQTT, RTSP, Telnet).",
  mode: "native",
  category: "IOT",
  nextScenarioIds: ["device_http_headers"],
  
  isSupported: () => ({ supported: true }),

  executeNative: async (ctx) => {
    // 1. Extracció segura (Safe Destructuring)
    const { target, onLog, device } = ctx;

    onLog("stdout", `>> INICIANDO KILL CHAIN IOT (RUST KERNEL)`);
    onLog("stdout", `>> TARGET NAME: ${target}`);
    
    // 2. Resolució d'IP Defensiva (Evitar Crash 'undefined')
    let targetIp = target;
    const deviceIp = device?.ip; // Optional chaining '?' salva la vida
    const deviceVendor = device?.vendor || "UNKNOWN";
    const deviceSecurity = device?.security || "UNKNOWN";  
    // Si el target no és una IP (és un nom com 'iRobot'), intentem resoldre
    if (!isIPv4(targetIp)) {
        if (deviceIp && isIPv4(deviceIp) && deviceIp !== "0.0.0.0") {
            targetIp = deviceIp;
            onLog("stdout", `>> RESOLVED IP: ${targetIp}`);
        } else {
            // AQUI ÉS ON ABANS PETAVA. ARA GESTIONEM L'ERROR TÀCTICAMENT.
            targetIp = ""; 
            onLog("stderr", "ALERTA: Objectiu sense adreça IP Layer 3 (Target detectat via Radar/RF).");
            onLog("stdout", "IMPOSSIBLE ESTABLIR CONNEXIÓ TCP/IP.");
        }
    } else {
        onLog("stdout", `>> TARGET IP: ${targetIp}`);
    }

    onLog("stdout", `>> VENDOR: ${deviceVendor}`);
    onLog("stdout", `>> L2 SECURITY: ${deviceSecurity}`);
    onLog("stdout", "------------------------------------------------");

    // Dades per a l'anàlisi creuat
    const isWifiOpen = deviceSecurity.toUpperCase().includes("OPEN");
    
    // 3. Execució Condicional (Només si tenim IP)
    let report: any = { open_ports: [], risk_level: "UNKNOWN" };

    if (targetIp) {
        try {
            onLog("stdout", "[*] Cargando módulos de explotación TCP...");
            report = await invoke("run_iot_scan", { targetIp: targetIp });
        } catch (error) {
            onLog("stderr", `[X] ERROR AL MOTOR RUST: ${String(error)}`);
            onLog("stdout", "[*] Fallback: Analitzant dades passives...");
        }
    } else {
        onLog("stdout", "[!] Saltant escaneig actiu (Manca d'IP). Analitzant exposició radioelèctrica...");
    }

    // 4. Reporting Intel·ligent
    const hasPorts = report.open_ports && report.open_ports.length > 0;

    if (hasPorts) {
        onLog("stdout", "== PUERTOS COMPROMETIBLES DETECTADOS ==");
        report.open_ports.forEach((p: any) => {
            const riskBadge = p.risk_level === "CRITICAL" ? "[!!!]" : p.risk_level === "HIGH" ? "[!]" : "[+]";
            onLog("stdout", `${riskBadge} PORT ${p.port}/TCP: ${p.status}`);
            if (p.service) onLog("stdout", `    PAYLOAD: ${p.service}`);
        });
    } else if (targetIp) {
        onLog("stdout", "[-] Scan TCP finalizado. Sin respuesta (RST/DROP).");
    }

    onLog("stdout", "");
    onLog("stdout", "== INFORME FINAL DE INTELIGENCIA ==");

    // VEREDICTE FINAL
    if (report.risk_level === "CRITICAL") {
        onLog("stderr", "ESTADO: CRÍTICO (RCE PROBABLE)");
        onLog("stdout", "RAZÓN: Servicios remotos inseguros detectados.");
    } 
    else if (!hasPorts && isWifiOpen) {
        // CAS RADAR (El teu cas actual)
        onLog("stderr", "ESTADO: VULNERABLE (CAPA 2 / WI-FI)");
        onLog("stdout", "RAZÓN: No tenim IP per atacar ports, PERÒ la xarxa Wi-Fi és OBERTA.");
        onLog("stdout", "VECTOR DE ATAQUE:");
        onLog("stdout", "1. Sniffing passiu del trànsit aeri (Monitor Mode).");
        onLog("stdout", "2. Tot el trànsit d'aquest dispositiu és capturable sense autenticació.");
    }
    else if (report.risk_level === "FILTERED") {
         onLog("stdout", "ESTADO: PROTEGIDO (FIREWALL)");
    }
    else {
        onLog("stdout", "ESTADO: TARGET INVISIBLE / SAFE");
    }
  },
};