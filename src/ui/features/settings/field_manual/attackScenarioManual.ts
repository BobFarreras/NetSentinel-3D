// src/ui/features/settings/field_manual/attackScenarioManual.ts
// Descripcion: contenido didactico (alto nivel) para escenarios del Attack Lab. Enfatiza mitigacion/hardening.

import type { UILanguage } from "../../../../shared/dtos/SettingsDTOs";

export type ScenarioManual = {
  how: string;
  mitigations: string[];
  notes?: string[];
};

// Importante: esto NO es un tutorial operativo paso-a-paso.
// La idea es dar contexto y defensas a un operador/junior dentro del producto.
export const getScenarioManual = (scenarioId: string, lang: UILanguage): ScenarioManual => {
  const ES = lang === "es";
  const CA = lang === "ca";

  switch (scenarioId) {
    case "router_recon_ping_tracert":
      return {
        how: ES
          ? "Recon no intrusivo: mide latencia y traza la ruta hacia el gateway. Se usa para detectar saltos inesperados, NATs, latencia anomala o segmentacion."
          : CA
          ? "Recon no intrusiu: mesura latencia i traça la ruta cap al gateway. Serveix per detectar salts inesperats, NATs, latencia anomala o segmentacio."
          : "Non-intrusive recon: measures latency and traces the route to the gateway. Used to detect unexpected hops, NATs, anomalous latency or segmentation.",
        mitigations: [
          ES ? "Filtrar ICMP en bordes (sin romper MTU/diagnostico interno)." : CA ? "Filtrar ICMP a la vora (sense trencar MTU/diagnostic intern)." : "Filter ICMP at edges (without breaking MTU/internal diagnostics).",
          ES ? "Reducir superficie del router (panel admin solo LAN, desactivar servicios remotos)." : CA ? "Reduir superficie del router (admin nomes LAN, desactivar serveis remots)." : "Reduce router surface (admin LAN-only, disable remote services).",
          ES ? "Segmentar: red de invitados separada del management." : CA ? "Segmentar: xarxa de convidats separada del management." : "Segment: guest network separated from management.",
        ],
      };
    case "device_http_headers":
      return {
        how: ES
          ? "Fingerprint de cabeceras HTTP: identifica software/stack expuesto (Server, WWW-Authenticate, cookies) sin autenticacion. Ayuda a priorizar hardening y detectar defaults."
          : CA
          ? "Fingerprint de capçaleres HTTP: identifica software/stack exposat (Server, WWW-Authenticate, cookies) sense autenticacio. Ajuda a prioritzar hardening i detectar defaults."
          : "HTTP header fingerprinting: identifies exposed software/stack (Server, WWW-Authenticate, cookies) without auth. Helps prioritize hardening and detect defaults.",
        mitigations: [
          ES ? "Deshabilitar servicios HTTP no necesarios en dispositivos IoT/routers." : CA ? "Deshabilitar serveis HTTP no necessaris en IoT/routers." : "Disable unnecessary HTTP services on IoT/routers.",
          ES ? "Ocultar/versionar minimamente banners (cuando sea posible) y forzar TLS." : CA ? "Minimitzar banners (si es possible) i forçar TLS." : "Minimize banners (when possible) and enforce TLS.",
          ES ? "Cambiar credenciales por defecto y limitar origen (ACL/firewall LAN)." : CA ? "Canviar credencials per defecte i limitar origen (ACL/firewall LAN)." : "Change default credentials and restrict origin (LAN ACL/firewall).",
        ],
      };
    case "wifi_brute_force_dict":
      return {
        how: ES
          ? "Ataque activo de diccionario: prueba un conjunto de credenciales contra un SSID objetivo. Es un caso de laboratorio para entender la importancia de una passphrase robusta."
          : CA
          ? "Atac actiu de diccionari: prova un conjunt de credencials contra un SSID objectiu. Es un cas de laboratori per entendre la importancia d'una passphrase robusta."
          : "Active dictionary attempt: tries a credential set against a target SSID. Lab case to understand the importance of a strong passphrase.",
        mitigations: [
          ES ? "WPA3-Personal (SAE) si el hardware lo soporta." : CA ? "WPA3-Personal (SAE) si el hardware ho suporta." : "Use WPA3-Personal (SAE) if supported.",
          ES ? "Passphrase larga (>= 16-20) y no derivada del SSID ni patrones tipicos." : CA ? "Passphrase llarga (>= 16-20) i no derivada de l'SSID ni patrons tipics." : "Long passphrase (>= 16-20) not derived from SSID/patterns.",
          ES ? "Desactivar WPS y revisar listas de clientes autorizados." : CA ? "Desactivar WPS i revisar clients autoritzats." : "Disable WPS and review allowed clients.",
          ES ? "Rotar credenciales ante sospecha y segmentar IoT/Guest." : CA ? "Rotar credencials si hi ha sospita i segmentar IoT/Guest." : "Rotate credentials on suspicion and segment IoT/Guest.",
        ],
        notes: [
          ES ? "En redes reales, la defensa principal es una passphrase fuerte + WPA3; no hay atajos." : CA ? "En xarxes reals, la defensa principal es una passphrase forta + WPA3; no hi ha dreceres." : "In real networks, the primary defense is a strong passphrase + WPA3; there are no shortcuts.",
        ],
      };
    case "edu_pmkid_exposure_sim":
      return {
        how: ES
          ? "Simulacion: ilustra el concepto de exposicion PMKID en ciertos equipos/configuraciones. No ejecuta acciones ofensivas reales."
          : CA
          ? "Simulacio: il·lustra el concepte d'exposicio PMKID en alguns equips/configuracions. No executa accions ofensives reals."
          : "Simulation: illustrates PMKID exposure concept on some gear/configs. No real offensive actions are executed.",
        mitigations: [
          ES ? "WPA3-Personal (SAE) y PMF/802.11w habilitado." : CA ? "WPA3-Personal (SAE) i PMF/802.11w habilitat." : "Use WPA3-Personal (SAE) and enable PMF/802.11w.",
          ES ? "Actualizar firmware del AP/router." : CA ? "Actualitzar firmware de l'AP/router." : "Update AP/router firmware.",
          ES ? "Deshabilitar modos legacy cuando no sean necesarios." : CA ? "Deshabilitar modes legacy quan no siguin necessaris." : "Disable legacy modes when not needed.",
        ],
      };
    case "edu_iot_risk_profile":
      return {
        how: ES
          ? "Simulacion: usa el vendor/OUI para explicar riesgos tipicos IoT (firmware desactualizado, servicios expuestos, credenciales por defecto)."
          : CA
          ? "Simulacio: usa el vendor/OUI per explicar riscos tipics IoT (firmware desactualitzat, serveis exposats, credencials per defecte)."
          : "Simulation: uses vendor/OUI to explain typical IoT risks (outdated firmware, exposed services, default creds).",
        mitigations: [
          ES ? "VLAN/SSID IoT separado." : CA ? "VLAN/SSID IoT separat." : "Separate IoT VLAN/SSID.",
          ES ? "Bloquear trafico lateral y solo permitir destinos necesarios." : CA ? "Bloquejar trafic lateral i nomes permetre destins necessaris." : "Block lateral traffic and allow only necessary destinations.",
          ES ? "Actualizar firmware y deshabilitar UPnP si no es imprescindible." : CA ? "Actualitzar firmware i deshabilitar UPnP si no es imprescindible." : "Update firmware and disable UPnP unless required.",
        ],
      };
    default:
      return {
        how: ES
          ? "Escenario sin manual especifico. Revisa la descripcion del catalogo y los docs del repo."
          : CA
          ? "Escenari sense manual especific. Revisa la descripcio del cataleg i els docs del repo."
          : "Scenario without a dedicated manual. Check catalog description and repo docs.",
        mitigations: [
          ES
            ? "Aplicar hardening basico: segmentacion, actualizaciones, minimo privilegio, logs y monitorizacion."
            : CA
            ? "Aplicar hardening basic: segmentacio, actualitzacions, minim privilegi, logs i monitoritzacio."
            : "Apply baseline hardening: segmentation, updates, least privilege, logs and monitoring.",
        ],
      };
  }
};
