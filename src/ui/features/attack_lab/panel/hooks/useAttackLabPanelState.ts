// src/ui/features/attack_lab/panel/hooks/useAttackLabPanelState.ts
// Hook de estado del AttackLabPanel: persistencia UI, seleccion de target/escenario, ejecucion y sincronizacion multi-ventana sin mezclar con JSX.

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceDTO, HostIdentity, WifiNetworkDTO } from "../../../../../shared/dtos/NetworkDTOs";
import { windowingAdapter } from "../../../../../adapters/windowingAdapter";
import { useI18n } from "../../../../i18n/useI18n";
import { emitSystemLog } from "../../../../utils/systemLogBus";
import { useAttackLabRuntime } from "../../../../hooks/modules/attack_lab/useAttackLabRuntime";
import { getAttackLabScenarios } from "../../catalog/attackLabScenarios";
import type { ParsedWifiEvidence } from "../../logic/parseWifiEvidence";
import { useWifiRadarSelection, setSelectedWifiBssid } from "../../../radar/hooks/useWifiRadarSelection";
import type { AttackLabScenario } from "../../catalog/types";
import type { MacSecurityStatusDTO } from "../../../../components/shared/CyberConfirmModal";

type VaultUiState = { scenarioId?: string; mode?: "LAB" | "CUSTOM"; targetIp?: string };

const UI_STATE_KEY = "netsentinel.attackLab.uiState.v1";
const WIFI_EVIDENCE_KEY = "netsentinel.attackLab.wifiEvidence.v1";

const isIpv4 = (value: string | undefined | null): boolean => {
  if (!value) return false;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
};

const mergeByIp = (base: DeviceDTO[], extra: DeviceDTO | null): DeviceDTO[] => {
  const map = new Map<string, DeviceDTO>();
  for (const d of base) map.set(d.ip, d);
  if (extra && isIpv4(extra.ip)) map.set(extra.ip, extra);
  return Array.from(map.values());
};

const loadUiState = (): VaultUiState | null => {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultUiState;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const wifiNetworkToVirtualTarget = (n: WifiNetworkDTO): DeviceDTO => {
  return {
    ip: n.ssid,
    mac: n.bssid,
    vendor: n.vendor,
    hostname: n.ssid,
    isGateway: false,
    ping: undefined,
    openPorts: [],
    os: "WiFi Access Point",
    deviceType: "ROUTER",
  };
};

export type AttackLabPanelMode = "LAB" | "CUSTOM";

export type AttackLabPanelNextStep = {
  id: string;
  title: string;
  disabled: boolean;
  onRun: () => void;
};

export const useAttackLabPanelState = (params: {
  targetDevice?: DeviceDTO | null;
  availableDevices?: DeviceDTO[];
  availableRouters?: DeviceDTO[];
  identity?: HostIdentity | null;
  defaultScenarioId?: string | null;
  autoRunToken?: number;
}) => {
  const {
    targetDevice: propTargetDevice,
    availableDevices = [],
    availableRouters = [],
    identity = null,
    defaultScenarioId = null,
    autoRunToken: propAutoRunToken = 0,
  } = params;

  const { t, language } = useI18n();
  const runtime = useAttackLabRuntime();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const wifiRadarSel = useWifiRadarSelection();

  const persisted = loadUiState();

  const [localTarget, setLocalTarget] = useState<DeviceDTO | null>(() => {
    if (propTargetDevice) return propTargetDevice;
    const ip = persisted?.targetIp;
    if (ip && isIpv4(ip)) {
      return {
        ip,
        mac: "",
        vendor: "",
        hostname: ip,
        isGateway: false,
        ping: undefined,
        openPorts: [],
        os: "",
        deviceType: "UNKNOWN",
      };
    }
    return null;
  });

  const [mode, setMode] = useState<AttackLabPanelMode>(() => persisted?.mode ?? (propTargetDevice || defaultScenarioId ? "LAB" : "CUSTOM"));
  const [scenarioId, setScenarioId] = useState<string>(() => defaultScenarioId || persisted?.scenarioId || "");
  const [wifiTargets, setWifiTargets] = useState<WifiNetworkDTO[]>([]);
  const [wifiEvidence, setWifiEvidence] = useState<ParsedWifiEvidence | null>(null);

  // ESTADOS MODAL & OPSEC
  const [showConfirm, setShowConfirm] = useState(false);
  const [macStatus, setMacStatus] = useState<MacSecurityStatusDTO | null>(null);
  const [isCheckingOpsec, setIsCheckingOpsec] = useState(false);

  const [autoRunToken, setAutoRunToken] = useState<number>(0);
  const lastExecutedToken = useRef<number>(0);
  const lastSeenPropAutoRunToken = useRef<number>(0);

  // Responsive: narrow/wide con histeresis.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") return;

    const NARROW_AT = 720;
    const WIDE_AT = 760;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (!w) return;
      setIsNarrow((prev) => {
        if (prev && w > WIDE_AT) return false;
        if (!prev && w < NARROW_AT) return true;
        return prev;
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scenarios = useMemo(() => getAttackLabScenarios(), []);
  const selectedScenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) || null, [scenarios, scenarioId]);
  const scenarioById = useMemo(() => new Map(scenarios.map((s) => [s.id, s])), [scenarios]);

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
  }, [propTargetDevice]);

  // Persistimos UI state para que abrir/cerrar otros paneles no borre inputs.
  useEffect(() => {
    try {
      localStorage.setItem(
        UI_STATE_KEY,
        JSON.stringify({
          scenarioId: scenarioId || undefined,
          mode,
          targetIp: localTarget?.ip || undefined,
        }),
      );
    } catch {
      // ignore
    }
  }, [scenarioId, mode, localTarget?.ip]);

  const onWifiEvidenceImported = (raw: string, parsed: ParsedWifiEvidence | null) => {
    try {
      localStorage.setItem(WIFI_EVIDENCE_KEY, raw);
    } catch {
      // ignore
    }
    setWifiEvidence(parsed);
    emitSystemLog({
      source: "ATTACK_LAB",
      level: parsed ? "INFO" : "WARN",
      message: parsed ? `WiFi evidence import ok kind=${parsed.kind} ssid=${parsed.ssid ?? "-"}` : "WiFi evidence import failed (format unknown)",
    });
  };

  const onWifiEvidenceCleared = () => {
    try {
      localStorage.removeItem(WIFI_EVIDENCE_KEY);
    } catch {
      // ignore
    }
    setWifiEvidence(null);
    emitSystemLog({ source: "ATTACK_LAB", level: "INFO", message: "WiFi evidence cleared" });
  };

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
      if (payload.autoRun === true) setAutoRunToken((tok) => tok + 1);
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // Auto-run explicitado por el contenedor (App/MainDockedLayout/DetachedPanelView).
  useEffect(() => {
    if (propAutoRunToken <= 0) return;
    if (lastSeenPropAutoRunToken.current === propAutoRunToken) return;
    lastSeenPropAutoRunToken.current = propAutoRunToken;
    setAutoRunToken((tok) => tok + 1);
  }, [propAutoRunToken]);

  const executeNativeAttack = async (scenario: AttackLabScenario) => {
    const targetIp = localTarget?.ip || "unknown";

    emitSystemLog({
      source: "ATTACK_LAB",
      level: "INFO",
      message: `Inicio protocolo '${scenario.id}' target=${targetIp}`,
    });

    try {
      if (!scenario.executeNative) return;
      await runtime.actions.startNative(scenario.title, targetIp, async ({ target, onLog, signal }) => {
        onLog("stdout", `🚀 ${t("attackLab.native.startingProtocolPrefix")}: ${scenario.title}`);
        await scenario.executeNative?.({
          target,
          signal,
          onLog: (stream, line) => {
            if (line.includes("🧪 TRACE")) {
              emitSystemLog({
                source: "WIFI_NATIVE",
                level: stream === "stderr" ? "ERROR" : "DEBUG",
                message: line,
              });
              return;
            }

            onLog(stream, line);

            if (line.includes("PREDATOR HIT") || line.includes("ATAQUE ABORTADO") || line.includes("DICCIONARIO AGOTADO")) {
              emitSystemLog({
                source: "WIFI_NATIVE",
                level: stream === "stderr" ? "WARN" : "INFO",
                message: line,
              });
            }
          },
        });
      });
    } catch (e) {
      runtime.actions.pushLocalLog("stderr", `❌ ${t("attackLab.native.criticalErrorPrefix")}: ${e}`);
    }
  };

  const handleRunLab = async () => {
    if (!selectedScenario || runtime.state.isRunning) return;

    if (
      selectedScenario.mode === "native" &&
      selectedScenario.category === "WIFI" &&
      selectedScenario.requiresOpsecConfirm !== false
    ) {
      setMacStatus(null);
      setIsCheckingOpsec(true);
      setShowConfirm(true);

      void (async () => {
        try {
          const status = await invoke<MacSecurityStatusDTO>("check_mac_security");
          setMacStatus(status);
          emitSystemLog({
            source: "OPSEC",
            level: status.risk_level === "HIGH" ? "WARN" : "INFO",
            message: `check_mac_security risk=${status.risk_level} mac=${status.current_mac}`,
          });
        } catch (e) {
          setMacStatus({ current_mac: "UNKNOWN", is_spoofed: false, risk_level: "HIGH" });
          emitSystemLog({
            source: "OPSEC",
            level: "ERROR",
            message: `check_mac_security error=${String(e)}`,
          });
        } finally {
          setIsCheckingOpsec(false);
        }
      })();

      return;
    }

    if (selectedScenario.mode === "native") {
      await executeNativeAttack(selectedScenario);
      return;
    }

    if (selectedScenario.mode === "simulated") {
      const steps = selectedScenario.simulate?.({ device: localTarget!, identity }) || [];
      await runtime.actions.startSimulated(selectedScenario.title, steps);
      return;
    }

    if (!localTarget) return;
    const support = selectedScenario.isSupported?.({ device: localTarget, identity }) || { supported: true };
    if (!support.supported) return;
    const req = selectedScenario.buildRequest?.({ device: localTarget, identity });
    if (!req) return;

    const baseEnv = req.env ?? [];
    const nextEnv = [...baseEnv, { key: "NETSENTINEL_UI_LANG", value: language }];
    await runtime.actions.startExternal({ ...req, env: nextEnv });
  };

  useEffect(() => {
    if (autoRunToken === 0) return;
    if (autoRunToken === lastExecutedToken.current) return;
    if (!selectedScenario || runtime.state.isRunning || !localTarget) return;

    if (selectedScenario.mode === "native") {
      lastExecutedToken.current = autoRunToken;
      runtime.actions.pushLocalLog("stdout", `🛑 ${t("attackLab.native.autoRunBlocked")}`);
      emitSystemLog({
        source: "ATTACK_LAB",
        level: "WARN",
        message: `Auto-run bloqueado para escenario native id='${selectedScenario.id}' (requiere confirmacion manual).`,
      });
      return;
    }

    lastExecutedToken.current = autoRunToken;
    void handleRunLab();
  }, [autoRunToken, selectedScenario, runtime.state.isRunning, localTarget, t]);

  const handleCancel = async () => {
    await runtime.actions.cancel();
  };

  const displayRows = runtime.state.rows;
  const canRunNext = !runtime.state.isRunning && Boolean(localTarget);

  const nextSteps: AttackLabPanelNextStep[] = useMemo(() => {
    if (!selectedScenario?.nextScenarioIds || selectedScenario.nextScenarioIds.length === 0) return [];
    if (displayRows.length === 0) return [];
    return selectedScenario.nextScenarioIds
      .map((id) => scenarioById.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({
        id: s.id,
        title: s.title,
        disabled: !canRunNext,
        onRun: () => {
          setMode("LAB");
          setScenarioId(s.id);
          setAutoRunToken((tok) => tok + 1);
          void windowingAdapter.emitAttackLabContext({ targetDevice: localTarget, scenarioId: s.id, autoRun: false });
        },
      }));
  }, [selectedScenario?.id, selectedScenario?.nextScenarioIds, scenarioById, displayRows.length, canRunNext, localTarget]);

  const statusText = (() => {
    const s = runtime.state;
    if (!s.auditId) return t("attackLab.runtime.summary.idle");
    if (s.isRunning) return `${t("attackLab.runtime.summary.running")}: ${s.auditId}`;
    if (s.lastExit) return `${t("attackLab.runtime.summary.finished")}: ${s.auditId} (exit=${s.lastExit.exitCode ?? "?"}, ok=${s.lastExit.success})`;
    return `${t("attackLab.runtime.summary.ready")}: ${s.auditId}`;
  })();

  const selectRouterTarget = (ip: string | null) => {
    if (!ip) {
      setLocalTarget(null);
      void windowingAdapter.emitAttackLabContext({ targetDevice: null, scenarioId: scenarioId || undefined, autoRun: false });
      return;
    }
    const next = routerTargetOptions.find((d) => d.ip === ip) || null;
    if (!next) return;
    setLocalTarget(next);
    void windowingAdapter.emitAttackLabContext({ targetDevice: next, scenarioId: scenarioId || undefined, autoRun: false });
  };

  const selectDeviceTarget = (ip: string | null) => {
    if (!ip) {
      setLocalTarget(null);
      void windowingAdapter.emitAttackLabContext({ targetDevice: null, scenarioId: scenarioId || undefined, autoRun: false });
      return;
    }
    const next = deviceTargetOptions.find((d) => d.ip === ip) || null;
    if (!next) return;
    setLocalTarget(next);
    void windowingAdapter.emitAttackLabContext({ targetDevice: next, scenarioId: scenarioId || undefined, autoRun: false });
  };

  const selectWifiTarget = (bssid: string | null) => {
    if (!bssid) {
      setLocalTarget(null);
      setSelectedWifiBssid(null);
      void windowingAdapter.emitAttackLabContext({ targetDevice: null, scenarioId: scenarioId || undefined, autoRun: false });
      return;
    }
    const n = wifiTargets.find((x) => x.bssid === bssid) || null;
    if (!n) return;
    const virtualTarget = wifiNetworkToVirtualTarget(n);
    setLocalTarget(virtualTarget);
    setSelectedWifiBssid(n.bssid);
    void windowingAdapter.emitAttackLabContext({ targetDevice: virtualTarget, scenarioId: scenarioId || undefined, autoRun: false });
  };

  const onOpsecConfirm = () => {
    if (!selectedScenario) return;
    setShowConfirm(false);
    emitSystemLog({ source: "OPSEC", level: "INFO", message: "Operador autorizo ejecucion nativa WiFi" });
    void executeNativeAttack(selectedScenario);
  };

  const onOpsecCancel = () => {
    setShowConfirm(false);
    emitSystemLog({ source: "OPSEC", level: "WARN", message: "Operador cancelo ejecucion nativa WiFi" });
  };

  return {
    t,
    rootRef,
    isNarrow,
    mode,
    setMode,
    scenarios,
    scenarioId,
    setScenarioId,
    selectedScenario,
    localTarget,
    setLocalTarget,
    routerTargetOptions,
    deviceTargetOptions,
    wifiTargets,
    wifiEvidence,
    onWifiEvidenceImported,
    onWifiEvidenceCleared,
    runtime,
    displayRows,
    nextSteps,
    statusText,
    showConfirm,
    macStatus,
    isCheckingOpsec,
    onOpsecConfirm,
    onOpsecCancel,
    handleRunLab,
    handleCancel,
    selectRouterTarget,
    selectDeviceTarget,
    selectWifiTarget,
  };
};

