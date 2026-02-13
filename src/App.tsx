// src/App.tsx
// Orquestador de alto nivel: compone layouts, coordina estado global y sincroniza docking/ventanas + contexto entre paneles.

import { useCallback, useEffect, useMemo, useState } from "react";
import { windowingAdapter } from "./adapters/windowingAdapter";
import type { DeviceDTO } from "./shared/dtos/NetworkDTOs";
import { useNetworkManager } from "./ui/hooks/useNetworkManager";
import { useAppLayoutState } from "./ui/hooks/modules/ui/useAppLayoutState";
import { usePanelDockingState } from "./ui/hooks/modules/ui/usePanelDockingState";
import { useDetachedRuntime } from "./ui/hooks/modules/ui/useDetachedRuntime";
import { DetachedPanelView } from "./ui/components/layout/DetachedPanelView";
import { MainDockedLayout } from "./ui/components/layout/MainDockedLayout";
import { useAttackLabDetachedSync } from "./ui/features/attack_lab/hooks/useAttackLabDetachedSync";
import { uiLogger } from "./ui/utils/logger";

function App() {
  const detachedContext = windowingAdapter.parseDetachedContextFromLocation();

  const {
    devices,
    selectedDevice,
    scanning,
    auditing,
    auditResults,
    consoleLogs,
    startScan,
    startAudit,
    selectDevice,
    loadSession,
    jammedDevices,
    jamPendingDevices,
    toggleJammer,
    checkRouterSecurity,
    systemLogs,
    clearSystemLogs,
    intruders,
    identity,
  } = useNetworkManager({
    enableAutoBootstrap: !detachedContext,
    enableScannerHydration: !detachedContext || detachedContext.panel === "device" || detachedContext.panel === "scene3d",
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [showAttackLab, setShowAttackLab] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [attackLabTarget, setAttackLabTarget] = useState<DeviceDTO | null>(null);
  const [attackLabScenarioId, setAttackLabScenarioId] = useState<string | null>(null);
  const [attackLabAutoRunToken, setAttackLabAutoRunToken] = useState<number>(0);

  // [NUEVO] ESCUCHAR PETICIONES DE CAMBIO DE PANEL (DESDE RADAR, ETC)
  useEffect(() => {
    uiLogger.info("[app] Listening for Dock Panel events...");
    const unlistenPromise = windowingAdapter.listenDockPanel((panelName) => {
        uiLogger.info("[app] Request to open panel", panelName);
        if (panelName === "attack_lab") {
            setShowAttackLab(true);
            // Opcional: Cerrar otros si es política de UI
            // setShowRadar(false); 
        } else if (panelName === "radar") {
            setShowRadar(true);
        }
    });

    // TAMBIÉN ESCUCHAR CONTEXTO PARA ACTUALIZAR OBJETIVO
    const unlistenContext = windowingAdapter.listenAttackLabContext((payload) => {
        uiLogger.info("[app] Attack Lab Context Update", payload);
        if (payload.targetDevice) {
            setAttackLabTarget(payload.targetDevice);
        }
        if (payload.scenarioId) {
            setAttackLabScenarioId(payload.scenarioId);
        }
        if (payload.autoRun) {
            setAttackLabAutoRunToken((t) => t + 1);
        }
        // Aseguramos que se abra
        setShowAttackLab(true);
    });

    return () => {
        unlistenPromise.then(u => u());
        unlistenContext.then(u => u());
    };
  }, []);

  const layout = useAppLayoutState();
  const docking = usePanelDockingState({
    selectedDeviceIp: selectedDevice?.ip,
    attackLabTargetIp: attackLabTarget?.ip,
    attackLabScenarioId,
    showRadar,
    showAttackLab,
    showSettings,
  });
  const attackLabSync = useAttackLabDetachedSync();
  const { detachedPanelReady } = useDetachedRuntime(detachedContext);

  const detachedTargetDevice = useMemo(
    () => (detachedContext?.targetIp ? devices.find((d) => d.ip === detachedContext.targetIp) || null : selectedDevice),
    [detachedContext?.targetIp, devices, selectedDevice]
  );

  const detachedAttackLabTargetDevice = attackLabSync.detachedAttackLabTarget || detachedTargetDevice;
  const detachedAttackLabScenario =
    attackLabSync.detachedAttackLabScenarioId || detachedContext?.scenarioId || attackLabScenarioId;

  const openLabAuditForDevice = useCallback(
    (device: DeviceDTO) => {
      const scenarioId = device.isGateway ? "router_recon_ping_tracert" : "device_http_headers";
      setAttackLabTarget(device);
      setAttackLabScenarioId(scenarioId);
      setShowAttackLab(true);
      setAttackLabAutoRunToken((t) => t + 1);

      if (docking.detachedPanels.attack_lab && docking.detachedModes.attack_lab === "tauri") {
        void attackLabSync.emitAttackLabContext({ targetDevice: device, scenarioId, autoRun: true });
      }
    },
    [attackLabSync, docking.detachedModes.attack_lab, docking.detachedPanels.attack_lab]
  );

  const undockPanel = useCallback(
    async (panel: Parameters<typeof docking.undockPanel>[0]) => {
      // Si vamos a abrir Attack Lab en una ventana nueva, persistimos bootstrap para que la ventana
      // pueda pintar target/escenario aunque aun no haya recibido eventos o no tenga lista de devices.
      if (panel === "attack_lab") {
        windowingAdapter.setAttackLabDetachedBootstrap({ targetDevice: attackLabTarget, scenarioId: attackLabScenarioId });

        // Redundancia: emitimos el contexto despues de iniciar la apertura (puede llegar si la ventana ya esta escuchando).
        window.setTimeout(() => {
          void windowingAdapter.emitAttackLabContext({ targetDevice: attackLabTarget, scenarioId: attackLabScenarioId ?? undefined, autoRun: false });
        }, 350);
      }

      await docking.undockPanel(panel);
    },
    [attackLabScenarioId, attackLabTarget, docking.undockPanel]
  );

  const toggleAttackLab = useCallback(() => {
    const next = !showAttackLab;
    setShowAttackLab(next);
    if (next) {
      // Si se abre manualmente, quizás queramos limpiar o mantener el último
    }
  }, [showAttackLab]);

  if (detachedContext) {
    return (
      <DetachedPanelView
        panel={detachedContext.panel}
        detachedPanelReady={detachedPanelReady}
        systemLogs={systemLogs}
        devices={devices}
        selectedDevice={selectedDevice}
        clearSystemLogs={clearSystemLogs}
        detachedTargetDevice={detachedTargetDevice}
        auditResults={auditResults}
        consoleLogs={consoleLogs}
        auditing={auditing}
        startAudit={startAudit}
        jammedDevices={jammedDevices}
        jamPendingDevices={jamPendingDevices}
        toggleJammer={toggleJammer}
        checkRouterSecurity={checkRouterSecurity}
        onOpenLabAudit={openLabAuditForDevice}
        detachedAttackLabTargetDevice={detachedAttackLabTargetDevice}
        identity={identity}
        detachedAttackLabScenario={detachedAttackLabScenario}
        detachedAttackLabAutoRunToken={attackLabSync.detachedAttackLabAutoRunToken}
        intruders={intruders}
        selectDevice={selectDevice}
      />
    );
  }

  return (
    <MainDockedLayout
      scanning={scanning}
      devices={devices}
      showHistory={showHistory}
      setShowHistory={setShowHistory}
      showRadar={showRadar}
      setShowRadar={setShowRadar}
      showAttackLab={showAttackLab}
      onToggleAttackLab={toggleAttackLab}
      closeAttackLab={() => setShowAttackLab(false)}
      showSettings={showSettings}
      setShowSettings={setShowSettings}
      identity={identity}
      startScan={startScan}
      loadSession={loadSession}
      showDockRadar={docking.showDockRadar}
      showDockAttackLab={docking.showDockAttackLab}
      showDockSettings={docking.showDockSettings}
      showDockScene={docking.showDockScene}
      showDockConsole={docking.showDockConsole}
      showDockDevice={docking.showDockDevice}
      radarWidth={layout.radarWidth}
      dockSplitRatio={layout.dockSplitRatio}
      consoleHeight={layout.consoleHeight}
      sidebarWidth={layout.sidebarWidth}
      startResizingDockSplit={layout.startResizingDockSplit}
      startResizingRadar={layout.startResizingRadar}
      startResizingConsole={layout.startResizingConsole}
      startResizingSidebar={layout.startResizingSidebar}
      undockPanel={(panel) => void undockPanel(panel)}
      dockPanel={(panel) => void docking.dockPanel(panel)}
      selectedDevice={selectedDevice}
      selectDevice={selectDevice}
      intruders={intruders}
      systemLogs={systemLogs}
      clearSystemLogs={clearSystemLogs}
      auditResults={auditResults}
      consoleLogs={consoleLogs}
      auditing={auditing}
      startAudit={startAudit}
      jammedDevices={jammedDevices}
      jamPendingDevices={jamPendingDevices}
      toggleJammer={toggleJammer}
      checkRouterSecurity={checkRouterSecurity}
      attackLabTarget={attackLabTarget}
      attackLabScenarioId={attackLabScenarioId}
      attackLabAutoRunToken={attackLabAutoRunToken}
      onOpenLabAudit={openLabAuditForDevice}
      detachedPanels={docking.detachedPanels}
      detachedModes={docking.detachedModes}
      isResizing={layout.isResizing}
    />
  );
}

export default App;
