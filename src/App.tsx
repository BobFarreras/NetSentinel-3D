import { useCallback, useMemo, useState } from "react";
import { windowingAdapter } from "./adapters/windowingAdapter";
import type { DeviceDTO } from "./shared/dtos/NetworkDTOs";
import { useNetworkManager } from "./ui/hooks/useNetworkManager";
import { useAppLayoutState } from "./ui/hooks/modules/ui/useAppLayoutState";
import { usePanelDockingState } from "./ui/hooks/modules/ui/usePanelDockingState";
import { useDetachedRuntime } from "./ui/hooks/modules/ui/useDetachedRuntime";
import { useExternalDetachedSync } from "./ui/hooks/modules/ui/useExternalDetachedSync";
import { DetachedPanelView } from "./ui/components/layout/DetachedPanelView";
import { MainDockedLayout } from "./ui/components/layout/MainDockedLayout";

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
  const [showExternalAudit, setShowExternalAudit] = useState(false);
  const [externalAuditTarget, setExternalAuditTarget] = useState<DeviceDTO | null>(null);
  const [externalAuditScenarioId, setExternalAuditScenarioId] = useState<string | null>(null);

  const layout = useAppLayoutState();
  const docking = usePanelDockingState({
    selectedDeviceIp: selectedDevice?.ip,
    externalAuditTargetIp: externalAuditTarget?.ip,
    externalAuditScenarioId,
    showRadar,
    showExternalAudit,
  });
  const externalSync = useExternalDetachedSync();
  const { detachedPanelReady } = useDetachedRuntime(detachedContext);

  const detachedTargetDevice = useMemo(
    () => (detachedContext?.targetIp ? devices.find((d) => d.ip === detachedContext.targetIp) || null : selectedDevice),
    [detachedContext?.targetIp, devices, selectedDevice]
  );

  const detachedExternalTargetDevice = externalSync.detachedExternalTarget || detachedTargetDevice;
  const detachedExternalScenario =
    externalSync.detachedExternalScenarioId || detachedContext?.scenarioId || externalAuditScenarioId;

  const openLabAuditForDevice = useCallback(
    (device: DeviceDTO) => {
      const scenarioId = device.isGateway ? "router_recon_ping_tracert" : "device_http_headers";
      setExternalAuditTarget(device);
      setExternalAuditScenarioId(scenarioId);
      setShowExternalAudit(true);

      if (docking.detachedPanels.external && docking.detachedModes.external === "tauri") {
        void externalSync.emitExternalContext({ targetDevice: device, scenarioId, autoRun: true });
      }
    },
    [docking.detachedModes.external, docking.detachedPanels.external, externalSync]
  );

  const toggleExternalAudit = useCallback(() => {
    const next = !showExternalAudit;
    setShowExternalAudit(next);
    if (next) {
      setExternalAuditTarget(null);
      setExternalAuditScenarioId(null);
    }
  }, [showExternalAudit]);

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
        toggleJammer={toggleJammer}
        checkRouterSecurity={checkRouterSecurity}
        onOpenLabAudit={openLabAuditForDevice}
        detachedExternalTargetDevice={detachedExternalTargetDevice}
        identity={identity}
        detachedExternalScenario={detachedExternalScenario}
        detachedExternalAutoRunToken={externalSync.detachedExternalAutoRunToken}
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
      showExternalAudit={showExternalAudit}
      onToggleExternalAudit={toggleExternalAudit}
      closeExternalAudit={() => setShowExternalAudit(false)}
      identity={identity}
      startScan={startScan}
      loadSession={loadSession}
      showDockRadar={docking.showDockRadar}
      showDockExternal={docking.showDockExternal}
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
      undockPanel={(panel) => void docking.undockPanel(panel)}
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
      toggleJammer={toggleJammer}
      checkRouterSecurity={checkRouterSecurity}
      externalAuditTarget={externalAuditTarget}
      externalAuditScenarioId={externalAuditScenarioId}
      onOpenLabAudit={openLabAuditForDevice}
      detachedPanels={docking.detachedPanels}
      detachedModes={docking.detachedModes}
      isResizing={layout.isResizing}
    />
  );
}

export default App;
