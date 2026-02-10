import type { DeviceDTO, ExternalAuditRequestDTO, HostIdentity } from "../../shared/dtos/NetworkDTOs";

export type ScenarioMode = "external" | "simulated";

export type ScenarioSupport = {
  supported: boolean;
  reason?: string;
};

export type SimStep = {
  delayMs: number;
  stream: "stdout" | "stderr";
  line: string;
};

export type ExternalAuditScenario = {
  id: string;
  title: string;
  description: string;
  mode: ScenarioMode;
  category: "ROUTER" | "DEVICE" | "WIFI" | "IOT" | "EDU";
  // Cuando existe target, el escenario puede cambiar su default.
  buildRequest?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => ExternalAuditRequestDTO;
  simulate?: (ctx: { device: DeviceDTO; identity: HostIdentity | null }) => SimStep[];
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
    {
      id: "router_recon_ping_tracert",
      title: "Router: Recon basico (PING + TRACERT)",
      description:
        "Ejecuta un reconocimiento basico no intrusivo contra el router: latencia (ping) y ruta (tracert).",
      mode: "external",
      category: "ROUTER",
      isSupported: () => {
        if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows (ping/tracert). Usa modo CUSTOM en otros SO." };
        return { supported: true };
      },
      buildRequest: ({ device }) => {
        // Usamos PowerShell para ejecutar ambas ordenes de forma secuencial y capturar output.
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
        if (!isWindows()) return { supported: false, reason: "Preset pensado para Windows (PowerShell). Usa modo CUSTOM en otros SO." };
        return { supported: true };
      },
      buildRequest: ({ device }) => {
        const ip = device.ip;
        return {
          binaryPath: "powershell.exe",
          args: [
            "-NoProfile",
            "-Command",
            // Nota: -Method Head reduce payload.
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
        "Simulacion didactica: explica el concepto de PMKID (client-less) y como mitigarlo (WPA3, PMF/802.11w, firmware, desactivar transiciones inseguras). No ejecuta ataques.",
      mode: "simulated",
      category: "WIFI",
      simulate: ({ device, identity }) => {
        const gw = identity?.gatewayIp || "<gateway>";
        const target = isGateway(device, identity) ? "router/gateway" : "AP cercano";
        return [
          { delayMs: 0, stream: "stdout", line: `LAB: PMKID (SIMULADO) sobre ${target}` },
          { delayMs: 250, stream: "stdout", line: `Contexto: IP=${device.ip} GW=${gw}` },
          { delayMs: 500, stream: "stdout", line: "Modelo: en routers vulnerables, ciertos flujos pueden exponer material derivado (PMKID) sin clientes." },
          { delayMs: 800, stream: "stderr", line: "Nota: Esta practica NO ejecuta el ataque. Solo documenta señales y mitigaciones." },
          { delayMs: 1100, stream: "stdout", line: "Mitigacion: WPA3-Personal (SAE), PMF/802.11w habilitado, firmware actualizado." },
          { delayMs: 1400, stream: "stdout", line: "Mitigacion: desactivar modos legacy/transicion (WPA2/WPA3 mixed) si es posible." },
          { delayMs: 1700, stream: "stdout", line: "Verificacion: comprobar RSN/PMF en configuracion del AP y re-auditar tras cambios." },
        ];
      },
    },
    {
      id: "edu_iot_risk_profile",
      title: "IoT: Perfilado de riesgo por vendor/OUI [SIMULADO]",
      description:
        "Simulacion didactica: usa el vendor detectado para explicar riesgo tipico IoT y controles defensivos (segmentacion, DNS, bloqueo de puertos, actualizaciones).",
      mode: "simulated",
      category: "IOT",
      simulate: ({ device }) => {
        const vendor = (device.vendor || "Unknown").trim();
        const label = vendor && vendor.toLowerCase() !== "unknown" ? vendor : device.mac;
        return [
          { delayMs: 0, stream: "stdout", line: `LAB: IoT Risk Profile (SIMULADO) sobre ${label}` },
          { delayMs: 250, stream: "stdout", line: `Target: IP=${device.ip} MAC=${device.mac}` },
          { delayMs: 600, stream: "stdout", line: "Heuristica: vendors IoT suelen tener ciclos de parcheo mas lentos y servicios expuestos por defecto." },
          { delayMs: 900, stream: "stdout", line: "Mitigacion: segmentar en VLAN/SSID IoT, aislar clientes, bloquear administracion remota." },
          { delayMs: 1200, stream: "stdout", line: "Mitigacion: permitir solo DNS/HTTP(s) saliente necesario, deshabilitar UPnP en router." },
          { delayMs: 1500, stream: "stdout", line: "Verificacion: inventario, reglas de firewall, y monitorizacion de trafico (Live Traffic) para detectar drift." },
        ];
      },
    },
  ];
};

