// src/ui/hooks/useNetworkManager.ts
// Hook orquestador de UI: compone modulos (scanner/audit/router/jammer/logs/bootstrap) y expone una API estable para App/layouts.

import { useEffect, useMemo, useState } from 'react';
import { DeviceDTO } from '../../shared/dtos/NetworkDTOs';
import { deviceAliasRegistry } from "../../core/logic/deviceAliasRegistry";

// Importamos los modulos de negocio de UI.
import { useSocketLogs } from './modules/network/useSocketLogs';
import { useScanner } from './modules/network/useScanner';
import { usePortAuditor } from './modules/network/usePortAuditor';
import { useRouterHacker } from './modules/network/useRouterHacker';
import { useJamming } from './modules/network/useJamming';
import { useBootstrapNetwork } from './modules/network/useBootstrapNetwork';

interface UseNetworkManagerOptions {
  enableAutoBootstrap?: boolean;
  enableScannerHydration?: boolean;
}

export const useNetworkManager = (options?: UseNetworkManagerOptions) => {
  // 1. Logs (Base)
  const { deviceLogs, systemLogs, addLog, clearLogs, clearSystemLogs, setActiveTarget } = useSocketLogs();

  // 2. Scanner (Core)
  const { devices, setDevices, history, intruders, scanning, startScan, loadSession } = useScanner(
    options?.enableScannerHydration ?? true
  );

  // 3. Auditor (Ports)
  const { auditing, auditResults, startAudit, clearResults } = usePortAuditor(addLog);

  // 4. Hacker (Router)
  const { routerRisk, setRouterRisk, checkRouterSecurity } = useRouterHacker(addLog, setDevices, setActiveTarget);

  // 5. Bootstrap (identidad + autoscan + autosync de gateway)
  const { identity, deriveCidr } = useBootstrapNetwork({
    startScan,
    setDevices,
    enableAutoBootstrap: options?.enableAutoBootstrap ?? true,
  });

  // 6. Jammer (Active Countermeasures)
  // Usamos el gatewayIp de identity como fallback porque el inventario puede tardar en marcar isGateway.
  const { jammedDevices, jamPendingDevices, toggleJammer } = useJamming(devices, addLog, { gatewayIpOverride: identity?.gatewayIp ?? null });

  // Asegurar que el host (la maquina que ejecuta NetSentinel) exista en el inventario con MAC real.
  // Motivo: el router puede no listar al propio host en su UI, o no exponer MAC; ARP local tampoco siempre
  // resuelve la propia IP => termina como 00:00.. y el nodo no se identifica como "self".
  useEffect(() => {
    if (!identity?.ip || !identity?.mac) return;

    const idIp = identity.ip.trim();
    const idMac = identity.mac.trim().toUpperCase().replace("-", ":");

    setDevices((prev) => {
      const idx = prev.findIndex((d) => (d.ip ?? "").trim() === idIp);
      if (idx === -1) {
        return [
          ...prev,
          {
            ip: idIp,
            mac: idMac,
            vendor: "NETSENTINEL (ME)",
            name: "HOST",
            hostname: prev.find((d) => (d.vendor ?? "").includes("NETSENTINEL"))?.hostname,
            isGateway: false,
          },
        ];
      }

      const existing = prev[idx];
      const next = [...prev];
      next[idx] = {
        ...existing,
        ip: idIp,
        mac: idMac,
        vendor: (existing.vendor ?? "").includes("NETSENTINEL") ? existing.vendor : "NETSENTINEL (ME)",
      };
      return next;
    });
  }, [identity?.ip, identity?.mac, setDevices]);

  // Asegurar que el gateway tenga una etiqueta clara aunque el router no se liste como "cliente"
  // y aunque el escaner no haya resuelto hostname.
  useEffect(() => {
    if (!identity?.gatewayIp) return;
    const gwIp = identity.gatewayIp.trim();
    if (!gwIp) return;

    setDevices((prev) => {
      const idx = prev.findIndex((d) => (d.ip ?? "").trim() === gwIp);
      if (idx === -1) return prev;

      const existing = prev[idx];
      const next = [...prev];
      next[idx] = {
        ...existing,
        isGateway: true,
        name: existing.name ?? existing.hostname ?? "GATEWAY",
        hostname: existing.hostname ?? existing.name ?? "GATEWAY",
      };
      return next;
    });
  }, [identity?.gatewayIp, setDevices]);

  // Si cambia la identidad (por ejemplo, Ghost Mode), eliminamos clones stale del host del inventario.
  // Esto evita duplicados del mismo dispositivo con MAC antigua en la escena.
  useEffect(() => {
    if (!identity?.mac || !identity?.ip) return;
    const idMac = identity.mac.trim().toUpperCase();
    const idIp = identity.ip.trim();

    setDevices((prev) => {
      const next = prev.filter((d) => {
        const vendor = (d.vendor ?? "");
        const looksLikeHost = vendor.includes("NETSENTINEL") || vendor.includes("(ME)");
        if (!looksLikeHost) return true;

        const dMac = (d.mac ?? "").trim().toUpperCase();
        const dIp = (d.ip ?? "").trim();

        // Mantener solo el host "real" (IP o MAC actuales). El resto son stale.
        if (dIp === idIp) return dMac === idMac || !dMac;
        return dMac === idMac;
      });
      return next;
    });
  }, [identity?.ip, identity?.mac, setDevices]);

  // Memoria UX: aprendemos labels/hostnames de dispositivos y los reutilizamos si un scan futuro no los devuelve.
  useEffect(() => {
    deviceAliasRegistry.rememberFromDevices(devices);
  }, [devices]);

  // Fuerza repaint cuando el operador edita un alias manual (localStorage no dispara renders por si solo).
  const [aliasTick, setAliasTick] = useState(0);
  useEffect(() => {
    const handler = () => setAliasTick((t) => t + 1);
    window.addEventListener("netsentinel://aliases-updated", handler as EventListener);
    return () => window.removeEventListener("netsentinel://aliases-updated", handler as EventListener);
  }, []);

  // Multi-ventana: cuando el alias se edita en otra ventana, localStorage dispara `storage` en esta.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      if (!e.key) return;
      if (e.key === "netsentinel.deviceAliases:v1" || e.key === "netsentinel.deviceAliases:v2") {
        setAliasTick((t) => t + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const devicesWithAliases = useMemo(() => deviceAliasRegistry.applyAliases(devices), [devices, aliasTick]);

  // 7. Estado local de UI (seleccion)
  // Guardamos solo la IP para que el objeto seleccionado se refresque cuando cambian aliases/inventario.
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const selectedDevice = useMemo(() => {
    if (!selectedIp) return null;
    return devicesWithAliases.find((d) => (d.ip ?? "").trim() === selectedIp) ?? null;
  }, [devicesWithAliases, selectedIp]);

  // Ghost Mode: el backend devuelve el MAC generado pero la identidad real puede tardar en refrescarse.
  // Actualizamos el inventario del host de forma optimista para evitar duplicados visuales y mostrar el MAC nuevo.
  useEffect(() => {
    const handler = (evt: Event) => {
      const custom = evt as CustomEvent<{ hostIp?: string; newMac?: string }>;
      const hostIp = custom.detail?.hostIp;
      const newMac = custom.detail?.newMac;
      if (!hostIp || !newMac) return;

      setDevices((prev) => {
        const normalizedNew = newMac.trim().toUpperCase();
        return prev
          .map((d) => {
            if (d.ip !== hostIp) return d;
            return { ...d, mac: normalizedNew };
          })
          // Si existian clones (mismo nombre/vendor NETSENTINEL) con otra IP/MAC vieja, los eliminamos.
          .filter((d) => {
            const vendor = (d.vendor ?? "");
            const looksLikeHost = vendor.includes("NETSENTINEL") || vendor.includes("(ME)");
            if (!looksLikeHost) return true;
            if (d.ip === hostIp) return true;
            const dMac = (d.mac ?? "").trim().toUpperCase();
            return dMac === normalizedNew;
          });
      });
    };

    window.addEventListener("netsentinel://ghost-mode-applied", handler as EventListener);
    return () => window.removeEventListener("netsentinel://ghost-mode-applied", handler as EventListener);
  }, [setDevices]);

  // Helpers UI
  const selectDevice = (d: DeviceDTO | null) => {
    const nextIp = d?.ip ?? null;
    setSelectedIp(nextIp);
    if (nextIp !== selectedIp) clearResults();
  };

  const dismissRisk = () => setRouterRisk(null);

  return {
    // Datos
    devices: devicesWithAliases, selectedDevice, history, intruders,
    auditResults, routerRisk, jammedDevices, jamPendingDevices,
    consoleLogs: selectedDevice ? (deviceLogs[selectedDevice.ip] || []) : [],
    deviceLogsByIp: deviceLogs,
    systemLogs,
    identity,

    // Estados
    scanning, auditing,

    // Acciones (delegadas a hooks especializados)
    // Importante: TopBar pasa el evento si se asigna directamente como handler.
    // Exponemos un wrapper sin argumentos para evitar regresiones.
    startScan: (range?: string) => startScan(range ?? deriveCidr()),
    startAudit, 
    checkRouterSecurity,
    selectDevice, 
    loadSession, 
    toggleJammer,
    dismissRisk, 
    clearLogs: () => selectedDevice && clearLogs(selectedDevice.ip),
    clearSystemLogs,
  };
};
