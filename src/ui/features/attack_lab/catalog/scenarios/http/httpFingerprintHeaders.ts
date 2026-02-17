// src/ui/features/attack_lab/catalog/scenarios/http/httpFingerprintHeaders.ts
// Escenario DEVICE native: fingerprint HTTP (HEAD en 80/443) via backend Rust, sin PowerShell (cross-platform).

import type { AttackLabScenario } from "../../types";
import { invoke } from "@tauri-apps/api/core";
import type { HttpFingerprintResultDTO } from "../../../../../../shared/dtos/NetworkDTOs";

export const httpFingerprintHeadersScenario: AttackLabScenario = {
  id: "device_http_headers",
  title: "HTTP: Fingerprint de cabeceras (HEAD)",
  description:
    "Auditoria de superficie web (pasiva): HEAD en HTTP/HTTPS, captura status/redirects/headers (auth, cookies, security headers) y genera un VERDICT accionable.",
  mode: "native",
  category: "DEVICE",
  // Evitamos bucles: HTTP -> IoT -> HTTP. Si el operador quiere IoT, lo lanza manualmente.
  nextScenarioIds: ["device_recon_ping_tracert"],
  isSupported: () => ({ supported: true }),
  executeNative: async ({ onLog, device }) => {
    const targetIp = device?.ip ?? "";
    onLog("stdout", "=== HTTP: FINGERPRINT (RUST) ===");
    onLog("stdout", `TARGET_IP: ${targetIp}`);
    onLog("stdout", `TIMESTAMP: ${new Date().toISOString()}`);
    onLog("stdout", "");

    let res: HttpFingerprintResultDTO;
    try {
      res = await invoke<HttpFingerprintResultDTO>("fingerprint_http_headers", { targetIp });
    } catch (e) {
      onLog("stderr", `ERROR: backend http fingerprint fallo: ${String(e)}`);
      return;
    }

    const printProbe = (label: string, p?: HttpFingerprintResultDTO["http"]) => {
      onLog("stdout", `== ${label} ==`);
      if (!p) {
        onLog("stdout", "STATUS: <no response>");
        return;
      }
      onLog("stdout", `URL: ${p.url}`);
      onLog("stdout", `STATUS: ${p.status ?? "<unknown>"}`);
      if (p.server) onLog("stdout", `Server: ${p.server}`);
      if (p.wwwAuthenticate) onLog("stdout", `WWW-Authenticate: ${p.wwwAuthenticate}`);
      if (p.location) onLog("stdout", `Location: ${p.location}`);
      if (p.setCookie) onLog("stdout", `Set-Cookie: ${p.setCookie}`);
      if (p.strictTransportSecurity) onLog("stdout", `Strict-Transport-Security: ${p.strictTransportSecurity}`);
      if (p.xFrameOptions) onLog("stdout", `X-Frame-Options: ${p.xFrameOptions}`);
      if (p.contentSecurityPolicy) onLog("stdout", `Content-Security-Policy: ${p.contentSecurityPolicy}`);
    };

    printProbe("HTTP (80)", res.http);
    onLog("stdout", "");
    printProbe("HTTPS (443)", res.https);
    onLog("stdout", "");
    onLog("stdout", "== VERDICT ==");
    onLog("stdout", `VERDICT: ${res.verdict}`);
    onLog("stdout", "WHY:");
    res.why.forEach((line) => onLog("stdout", `- ${line}`));
    onLog("stdout", "");
    onLog("stdout", "NEXT:");
    res.next.forEach((line) => onLog("stdout", line));
  },
};
