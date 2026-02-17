// src/ui/features/attack_lab/panel/hooks/useAttackLabTargetsState.ts
// Hook de targets del Attack Lab: mantiene target local, opciones (router/device/WiFi) y sincroniza con Radar + ventanas desacopladas.

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceDTO, HostIdentity, WifiNetworkDTO } from "../../../../../shared/dtos/NetworkDTOs";
import { windowingAdapter } from "../../../../../adapters/windowingAdapter";
import { emitSystemLog } from "../../../../utils/systemLogBus";
import type { AttackLabScenario } from "../../catalog/types";
import { setSelectedWifiBssid, useWifiRadarSelection } from "../../../radar/hooks/useWifiRadarSelection";
import { isIpv4, mergeByIp, wifiNetworkToVirtualTarget } from "./attackLabPanelTargets";

import type { AttackLabPanelMode } from "./attackLabPanelTypes";

const createVirtualIpTarget = (ip: string): DeviceDTO => ({
  ip,
  mac: "",
  vendor: "",
  hostname: ip,
  isGateway: false,
  ping: undefined,
  openPorts: [],
  os: "",
  deviceType: "UNKNOWN",
});

export const useAttackLabTargetsState = (params: {
  selectedScenario: AttackLabScenario | null;
  scenarioId: string;
  setScenarioId: (id: string) => void;
  setMode: (mode: AttackLabPanelMode) => void;
  bumpAutoRunToken: () => void;

  identity: HostIdentity | null;
  propTargetDevice: DeviceDTO | null | undefined;
  availableDevices: DeviceDTO[];
  availableRouters: DeviceDTO[];
  persistedTargetIp: string | null | undefined;
}) => {
  const {
    selectedScenario,
    scenarioId,
    setScenarioId,
    setMode,
    bumpAutoRunToken,
    identity,
    propTargetDevice,
    availableDevices,
    availableRouters,
    persistedTargetIp,
  } = params;

  const wifiRadarSel = useWifiRadarSelection();
  const [wifiTargets, setWifiTargets] = useState<WifiNetworkDTO[]>([]);

  const [localTarget, setLocalTarget] = useState<DeviceDTO | null>(() => {
    if (propTargetDevice) return propTargetDevice;
    const ip = persistedTargetIp;
    if (ip && isIpv4(ip)) return createVirtualIpTarget(ip);
    return null;
  });

  const routerTargetOptions = useMemo(() => mergeByIp(availableRouters, localTarget), [availableRouters, localTarget]);
  const deviceTargetOptions = useMemo(() => mergeByIp(availableDevices, localTarget), [availableDevices, localTarget]);

  // Cache local de airwaves para selector rapido en escenarios WIFI.
  useEffect(() => {
    let cancelled = false;
    if (selectedScenario?.category !== "WIFI") return;

    void (async () => {
      try {
        const networks = await invoke<WifiNetworkDTO[]>("scan_airwaves");
        if (cancelled) return;
        const seen = new Set<string>();
        const sorted = [...networks]
          .sort((a, b) => (b.signalLevel ?? 0) - (a.signalLevel ?? 0))
          .filter((n) => {
            if (!n.bssid) return false;
            if (seen.has(n.bssid)) return false;
            seen.add(n.bssid);
            return true;
          });
        setWifiTargets(sorted);
      } catch (e) {
        emitSystemLog({
          source: "RADAR",
          level: "WARN",
          message: `scan_airwaves fallo desde AttackLabPanel: ${String(e)}`,
        });
        setWifiTargets([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedScenario?.category]);

  // Sync Radar(WiFi) -> Attack Lab (WiFi): refleja TARGET sin cambiar el escenario.
  useEffect(() => {
    if (selectedScenario?.category !== "WIFI") return;
    const bssid = wifiRadarSel.selectedBssid;
    if (!bssid) return;
    if (localTarget?.mac?.toLowerCase() === bssid.toLowerCase()) return;

    const n = wifiTargets.find((x) => x.bssid?.toLowerCase() === bssid.toLowerCase()) || null;
    if (!n) return;

    const virtualTarget = wifiNetworkToVirtualTarget(n);
    setLocalTarget(virtualTarget);
    void windowingAdapter.emitAttackLabContext({ targetDevice: virtualTarget, scenarioId: scenarioId || undefined, autoRun: false });
  }, [selectedScenario?.category, wifiRadarSel.selectedBssid, wifiTargets, localTarget?.mac, scenarioId]);

  // Props -> local target (Radar/Scene/Detached)
  useEffect(() => {
    if (!propTargetDevice) return;
    setLocalTarget(propTargetDevice);
    setMode("LAB");
    emitSystemLog({
      source: "ATTACK_LAB",
      level: "DEBUG",
      message: `target actualizado por props ip=${propTargetDevice.ip}`,
    });
  }, [propTargetDevice, setMode]);

  // Si no hay target pero sí routers detectados, seleccionamos el primero solo una vez.
  // Regla: NO rotar a otro router automáticamente por errores.
  const bootstrappedRouterTarget = useRef(false);
  useEffect(() => {
    if (bootstrappedRouterTarget.current) return;
    if (localTarget) return;
    if (availableRouters.length === 0) return;
    setLocalTarget(availableRouters[0]);
    bootstrappedRouterTarget.current = true;
  }, [availableRouters, localTarget]);

  // Contexto cross-window.
  useEffect(() => {
    const unlistenPromise = windowingAdapter.listenAttackLabContext((payload) => {
      if (payload.targetDevice) setLocalTarget(payload.targetDevice);
      if (payload.scenarioId) {
        setScenarioId(payload.scenarioId);
        setMode("LAB");
      }
      if (payload.autoRun === true) bumpAutoRunToken();
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [bumpAutoRunToken, setMode, setScenarioId]);

  const emitContext = (targetDevice: DeviceDTO | null) =>
    windowingAdapter.emitAttackLabContext({ targetDevice, scenarioId: scenarioId || undefined, autoRun: false });

  const selectRouterTarget = (ip: string | null) => {
    if (!ip) {
      setLocalTarget(null);
      void emitContext(null);
      return;
    }
    const next = routerTargetOptions.find((d) => d.ip === ip) || null;
    if (!next) return;
    setLocalTarget(next);
    void emitContext(next);
  };

  const selectDeviceTarget = (ip: string | null) => {
    if (!ip) {
      setLocalTarget(null);
      void emitContext(null);
      return;
    }
    const next = deviceTargetOptions.find((d) => d.ip === ip) || null;
    if (!next) return;
    setLocalTarget(next);
    void emitContext(next);
  };

  const selectWifiTarget = (bssid: string | null) => {
    if (!bssid) {
      setLocalTarget(null);
      setSelectedWifiBssid(null);
      void emitContext(null);
      return;
    }
    const n = wifiTargets.find((x) => x.bssid === bssid) || null;
    if (!n) return;
    const virtualTarget = wifiNetworkToVirtualTarget(n);
    setLocalTarget(virtualTarget);
    setSelectedWifiBssid(n.bssid);
    void emitContext(virtualTarget);
  };

  // Exposure para escenarios simulated (por si se usa).
  const getSimStepsDevice = () => {
    if (!localTarget) return null;
    return { device: localTarget, identity };
  };

  return {
    localTarget,
    setLocalTarget,
    routerTargetOptions,
    deviceTargetOptions,
    wifiTargets,
    selectRouterTarget,
    selectDeviceTarget,
    selectWifiTarget,
    wifiRadarSelectedBssid: wifiRadarSel.selectedBssid,
    getSimStepsDevice,
  };
};
