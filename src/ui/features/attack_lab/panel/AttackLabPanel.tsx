// src/ui/features/attack_lab/panel/AttackLabPanel.tsx
// Panel Attack Lab (LAB/CUSTOM): seleccion de escenario, ejecucion (external/simulated/native) y consola de logs en vivo.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core"; // <--- IMPORTANTE
import type { DeviceDTO, HostIdentity, WifiNetworkDTO } from "../../../../shared/dtos/NetworkDTOs";
import { useAttackLabRuntime } from "../../../hooks/modules/attack_lab/useAttackLabRuntime";
import { getAttackLabScenarios } from "../catalog/attackLabScenarios";
import { AuditHeader } from "./AuditHeader";
import { AuditConsole } from "./AuditConsole";
import { LabModeView } from "./LabModeView"; 
import { CustomModeView } from "./CustomModeView"; 
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { CyberConfirmModal, type MacSecurityStatusDTO } from "../../../components/shared/CyberConfirmModal";
import { emitSystemLog } from "../../../utils/systemLogBus";
import { useI18n } from "../../../i18n/useI18n";
import type { ParsedWifiEvidence } from "../logic/parseWifiEvidence";
import { useWifiRadarSelection, setSelectedWifiBssid } from "../../radar/hooks/useWifiRadarSelection";

interface AttackLabPanelProps {
  onClose: () => void;
  targetDevice?: DeviceDTO | null;
  availableDevices?: DeviceDTO[];
  availableRouters?: DeviceDTO[];
  identity?: HostIdentity | null;
  defaultScenarioId?: string | null;
  // Token monotono: si cambia, se intenta ejecutar automaticamente el escenario actual.
  // Esto evita auto-run al montar/desmontar por simple visibilidad (TopBar).
  autoRunToken?: number;
  embedded?: boolean;
}

export const AttackLabPanel: React.FC<AttackLabPanelProps> = ({
  onClose,
  targetDevice: propTargetDevice,
  availableDevices = [],
  availableRouters = [],
  identity = null,
  defaultScenarioId = null,
  autoRunToken: propAutoRunToken = 0,
  embedded = false,
}) => {
  const { t, language } = useI18n();
  const runtime = useAttackLabRuntime();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const wifiRadarSel = useWifiRadarSelection();

  const UI_STATE_KEY = "netsentinel.attackLab.uiState.v1";
  const WIFI_EVIDENCE_KEY = "netsentinel.attackLab.wifiEvidence.v1";
  const loadUiState = (): { scenarioId?: string; mode?: "LAB" | "CUSTOM"; targetIp?: string } | null => {
    try {
      const raw = localStorage.getItem(UI_STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { scenarioId?: string; mode?: "LAB" | "CUSTOM"; targetIp?: string };
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const persisted = loadUiState();

  const [localTarget, setLocalTarget] = useState<DeviceDTO | null>(() => {
    if (propTargetDevice) return propTargetDevice;
    const ip = persisted?.targetIp;
    if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      // DTO minimo: se enriquecera cuando llegue inventory real (availableDevices/routers).
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

  const [mode, setMode] = useState<"LAB" | "CUSTOM">(() => persisted?.mode ?? (propTargetDevice || defaultScenarioId ? "LAB" : "CUSTOM"));
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

  // IMPORTANT: el selector TARGET debe estar sincronizado con el target actual (Radar/Scene/Detached),
  // incluso si la heuristica de "routers" no lo incluye aun.
  const routerTargetOptions = useMemo(
    () => mergeByIp(availableRouters, localTarget),
    [availableRouters, localTarget],
  );

  const deviceTargetOptions = useMemo(() => {
    // Lista completa de dispositivos para escenarios que apuntan a hosts (DEVICE/IOT/EDU).
    // Incluye el target actual aunque no venga en `availableDevices` (por latencia de scan).
    return mergeByIp(availableDevices, localTarget);
  }, [availableDevices, localTarget]);

  // Cache local de airwaves para selector rapido en escenarios WIFI.
  useEffect(() => {
    let cancelled = false;
    if (selectedScenario?.category !== "WIFI") return;

    void (async () => {
      try {
        const networks = await invoke<WifiNetworkDTO[]>("scan_airwaves");
        if (cancelled) return;
        // Ordenamos por señal descendente y filtramos duplicados por BSSID.
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
        // No rompemos el panel si el comando falla (por ejemplo sin permisos o sin backend).
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

  // Sync Radar(WiFi) -> Attack Lab (WiFi): si el operador selecciona un AP en Radar, reflejamos el TARGET
  // en Attack Lab sin cambiar el escenario (no forzamos dictionary).
  useEffect(() => {
    if (selectedScenario?.category !== "WIFI") return;
    const bssid = wifiRadarSel.selectedBssid;
    if (!bssid) return;
    if (localTarget?.mac?.toLowerCase() === bssid.toLowerCase()) return;

    const n = wifiTargets.find((x) => x.bssid?.toLowerCase() === bssid.toLowerCase()) || null;
    if (!n) return;

    const virtualTarget: DeviceDTO = {
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

    setLocalTarget(virtualTarget);
    void windowingAdapter.emitAttackLabContext({ targetDevice: virtualTarget, scenarioId: scenarioId || undefined, autoRun: false });
  }, [selectedScenario?.category, wifiRadarSel.selectedBssid, wifiTargets, localTarget?.mac, scenarioId]);

  useEffect(() => {
    if (propTargetDevice) {
        setLocalTarget(propTargetDevice);
        setMode("LAB");
        emitSystemLog({
          source: "ATTACK_LAB",
          level: "DEBUG",
          message: `target actualizado por props ip=${propTargetDevice.ip}`,
        });
    }
  }, [propTargetDevice]);

  // Persistimos UI state para que abrir/cerrar otros paneles no borre inputs.
  useEffect(() => {
    try {
      localStorage.setItem(UI_STATE_KEY, JSON.stringify({
        scenarioId: scenarioId || undefined,
        mode,
        targetIp: localTarget?.ip || undefined,
      }));
    } catch {
      // ignore
    }
  }, [scenarioId, mode, localTarget?.ip]);

  // Wifi evidence es opcional y se persiste en localStorage para que no se pierda al abrir/cerrar paneles.
  // Nota: el escenario `wifi_evidence_import` consume el RAW desde `WIFI_EVIDENCE_KEY`.
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

  useEffect(() => {
    const unlistenPromise = windowingAdapter.listenAttackLabContext((payload) => {
      if (payload.targetDevice) setLocalTarget(payload.targetDevice);
      if (payload.scenarioId) {
        setScenarioId(payload.scenarioId);
        setMode("LAB");
      }
      
      if (payload.autoRun === true) {
        setAutoRunToken((t) => t + 1);
      }
    });
    return () => { unlistenPromise.then((unlisten) => unlisten()); };
  }, []);

  useEffect(() => {
    // Auto-run explicitado por el contenedor (App/MainDockedLayout/DetachedPanelView).
    if (propAutoRunToken <= 0) return;
    if (lastSeenPropAutoRunToken.current === propAutoRunToken) return;
    lastSeenPropAutoRunToken.current = propAutoRunToken;
    setAutoRunToken((t) => t + 1);
  }, [propAutoRunToken]);

  const executeNativeAttack = async () => {
    if (!selectedScenario) return;
    const targetIp = localTarget?.ip || "unknown";

    emitSystemLog({
      source: "ATTACK_LAB",
      level: "INFO",
      message: `Inicio protocolo '${selectedScenario.id}' target=${targetIp}`,
    });

    try {
      if (!selectedScenario.executeNative) return;
      await runtime.actions.startNative(selectedScenario.title, targetIp, async ({ target, onLog, signal }) => {
        onLog("stdout", `🚀 ${t("attackLab.native.startingProtocolPrefix")}: ${selectedScenario.title}`);
        await selectedScenario.executeNative?.({
          target,
          signal,
          onLog: (stream, line) => {
            // Las trazas de diagnostico van a SYSTEM LOGS para no saturar la consola del panel.
            if (line.includes("🧪 TRACE")) {
              emitSystemLog({
                source: "WIFI_NATIVE",
                level: stream === "stderr" ? "ERROR" : "DEBUG",
                message: line,
              });
              return;
            }

            onLog(stream, line);

            // Duplicamos solo eventos de control importantes.
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

    // --- CHECK NATIVO (WIFI) ---
    if (
      selectedScenario.mode === "native" &&
      selectedScenario.category === "WIFI" &&
      selectedScenario.requiresOpsecConfirm !== false
    ) {
        // Mostramos el modal de inmediato y resolvemos el check OPSEC en segundo plano.
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
        await executeNativeAttack();
        return;
    }

    // LAB (simulated/external)
    if (selectedScenario.mode === "simulated") {
      const steps = selectedScenario.simulate?.({ device: localTarget!, identity }) || [];
      await runtime.actions.startSimulated(selectedScenario.title, steps);
    } else if (localTarget) {
        const support = selectedScenario.isSupported?.({ device: localTarget, identity }) || { supported: true };
        if (support.supported) {
            const req = selectedScenario.buildRequest?.({ device: localTarget, identity });
            if (req) {
              const baseEnv = req.env ?? [];
              const nextEnv = [
                ...baseEnv,
                { key: "NETSENTINEL_UI_LANG", value: language },
              ];
              await runtime.actions.startExternal({ ...req, env: nextEnv });
            }
        }
    }
  };

  useEffect(() => {
    if (autoRunToken === 0) return;
    if (autoRunToken === lastExecutedToken.current) return;
    if (!selectedScenario || runtime.state.isRunning || !localTarget) {
        return;
    }

    // Seguridad UX: los escenarios `native` (acciones reales) NO deben auto-ejecutarse al abrir/mostrar el panel.
    // Caso real: el operador "muestra" el Attack Lab (TopBar) y no espera un modal/ejecucion inmediata.
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
  }, [autoRunToken, selectedScenario, runtime.state.isRunning, localTarget]);

  const handleCancel = async () => {
      await runtime.actions.cancel();
  };

  const isAnyRunning = runtime.state.isRunning;
  const displayRows = runtime.state.rows;
  const canRunNext = !runtime.state.isRunning && Boolean(localTarget);

  const nextSteps = useMemo(() => {
    if (!selectedScenario?.nextScenarioIds || selectedScenario.nextScenarioIds.length === 0) return [];
    // Solo mostrar sugerencias cuando hay salida (para no distraer antes de ejecutar).
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
          // Dispara auto-run del nuevo escenario sin depender de clicks adicionales.
          setAutoRunToken((t) => t + 1);
          // Importante: NO emitimos `autoRun:true` porque este panel tambien escucha el evento y
          // dispararia un segundo auto-run (doble ejecucion). Sincronizamos solo contexto.
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

    return (
      <div ref={rootRef} style={{
        width: embedded ? "100%" : 780,
        maxWidth: embedded ? "none" : "95vw",
      height: embedded ? "100%" : "80vh",
      background: "#050607",
      border: "1px solid rgba(0,255,136,0.25)",
      boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
      display: "flex", flexDirection: "column", fontFamily: "'Consolas', 'Courier New', monospace",
      position: "relative",
      minWidth: 0,
      overflow: "hidden",
    }}>
      <AuditHeader 
        mode={mode} setMode={setMode} 
        status={isAnyRunning ? t("attackLab.status.inProgress") : statusText} 
        isAutoRun={false} 
        compact={isNarrow}
        onClose={onClose} 
      />

      {/*
        Layout con scroll parcial:
        - La vista (LAB/CUSTOM) puede scrollear cuando el panel es pequeno.
        - La consola mantiene su propio scroll y ocupa el resto del alto.
      */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Bloque superior (selector/target/acciones): debe ocupar solo lo necesario.
            Si crece (descripciones largas), scrollea dentro de un maxHeight para no robar espacio a la consola. */}
        <div style={{
          flex: "0 0 auto",
          maxHeight: isNarrow ? 340 : 260,
          overflowY: "auto",
          overflowX: "hidden",
        }}>
          {mode === "LAB" ? (
            <LabModeView 
              scenarios={scenarios}
              selectedId={scenarioId}
              onSelect={(id) => { setScenarioId(id); }} 
              targetDevice={localTarget}
              routerTargets={routerTargetOptions}
              onSelectRouterTarget={(ip) => {
                if (!ip) {
                  setLocalTarget(null);
                  void windowingAdapter.emitAttackLabContext({ targetDevice: null, scenarioId: scenarioId || undefined, autoRun: false });
                  return;
                }
                const next = routerTargetOptions.find((d) => d.ip === ip) || null;
                if (next) {
                  setLocalTarget(next);
                  void windowingAdapter.emitAttackLabContext({ targetDevice: next, scenarioId: scenarioId || undefined, autoRun: false });
                }
              }}
              deviceTargets={deviceTargetOptions}
              onSelectDeviceTarget={(ip) => {
                if (!ip) {
                  setLocalTarget(null);
                  void windowingAdapter.emitAttackLabContext({ targetDevice: null, scenarioId: scenarioId || undefined, autoRun: false });
                  return;
                }
                const next = deviceTargetOptions.find((d) => d.ip === ip) || null;
                if (next) {
                  setLocalTarget(next);
                  void windowingAdapter.emitAttackLabContext({ targetDevice: next, scenarioId: scenarioId || undefined, autoRun: false });
                }
              }}
              wifiTargets={wifiTargets}
              onSelectWifiTarget={(bssid) => {
                if (!bssid) {
                  setLocalTarget(null);
                  setSelectedWifiBssid(null);
                  void windowingAdapter.emitAttackLabContext({ targetDevice: null, scenarioId: scenarioId || undefined, autoRun: false });
                  return;
                }
                const n = wifiTargets.find((x) => x.bssid === bssid) || null;
                if (!n) return;
                const virtualTarget: DeviceDTO = {
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
                setLocalTarget(virtualTarget);
                setSelectedWifiBssid(n.bssid);
                // Importante: seleccionar TARGET no debe cambiar el escenario activo.
                void windowingAdapter.emitAttackLabContext({ targetDevice: virtualTarget, scenarioId: scenarioId || undefined, autoRun: false });
              }}
              selectedScenario={selectedScenario}
              isRunning={isAnyRunning} 
              onRun={handleRunLab}
              onCancel={handleCancel}
              layout={isNarrow ? "narrow" : "wide"}
              wifiEvidence={wifiEvidence}
              onWifiEvidenceImported={onWifiEvidenceImported}
              onWifiEvidenceCleared={onWifiEvidenceCleared}
            />
          ) : (
            <CustomModeView 
              isRunning={runtime.state.isRunning}
              onStart={runtime.actions.startExternal}
              onCancel={runtime.actions.cancel}
              layout={isNarrow ? "narrow" : "wide"}
            />
          )}
        </div>

        <AuditConsole rows={displayRows} error={runtime.state.error} nextSteps={nextSteps} />
      </div>

      {/* MODAL CON STATUS OPSEC */}
      <CyberConfirmModal 
        isOpen={showConfirm}
        title={
          macStatus?.risk_level === "HIGH"
            ? `⚠ ${t("attackLab.opsec.warningTitle")}`
            : `✅ ${t("attackLab.opsec.safeTitle")}`
        }
        macStatus={macStatus}
        isLoading={isCheckingOpsec}
        message={t("attackLab.opsec.wifiExclusiveMessage")}
        onConfirm={() => {
          setShowConfirm(false);
          emitSystemLog({ source: "OPSEC", level: "INFO", message: "Operador autorizo ejecucion nativa WiFi" });
          executeNativeAttack();
        }}
        onCancel={() => {
          setShowConfirm(false);
          emitSystemLog({ source: "OPSEC", level: "WARN", message: "Operador cancelo ejecucion nativa WiFi" });
        }}
      />
    </div>
  );
};
