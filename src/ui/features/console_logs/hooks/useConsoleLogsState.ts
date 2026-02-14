// src/ui/features/console_logs/hooks/useConsoleLogsState.ts
// Estado del Console Logs: gestiona pestaña activa, loading temporal y coordinacion Traffic/Radar stores.
import { useState } from "react";
import { useTrafficMonitor } from "../../traffic/hooks/useTrafficMonitor";
import { useRadarLogs } from "../../radar/hooks/useRadarLogs";
import { useWifiRadarSelection } from "../../radar/hooks/useWifiRadarSelection";

export type ConsoleTab = "SYSTEM" | "TRAFFIC" | "RADAR";

type UseConsoleLogsStateOptions = {
  jammedIps?: string[];
};

type UseConsoleLogsState = {
  activeTab: ConsoleTab;
  isLoading: boolean;
  traffic: ReturnType<typeof useTrafficMonitor>;
  radar: ReturnType<typeof useRadarLogs>;
  wifiSel: ReturnType<typeof useWifiRadarSelection>;
  setActiveTab: (tab: ConsoleTab) => void;
  handleToggleTraffic: () => Promise<void>;
  handleClearByTab: (onClearSystemLogs: () => void) => void;
};

export const useConsoleLogsState = (opts?: UseConsoleLogsStateOptions): UseConsoleLogsState => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("SYSTEM");
  const [isLoading, setIsLoading] = useState(false);
  const traffic = useTrafficMonitor(opts?.jammedIps ?? []);
  const radar = useRadarLogs();
  const wifiSel = useWifiRadarSelection();

  const handleToggleTraffic = async () => {
    setIsLoading(true);
    await traffic.toggleMonitoring();
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleClearByTab = (onClearSystemLogs: () => void) => {
    if (activeTab === "SYSTEM") onClearSystemLogs();
    else if (activeTab === "TRAFFIC") traffic.clearPackets();
    else radar.clear();
  };

  return {
    activeTab,
    isLoading,
    traffic,
    radar,
    wifiSel,
    setActiveTab,
    handleToggleTraffic,
    handleClearByTab,
  };
};
