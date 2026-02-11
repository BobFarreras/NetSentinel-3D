// src/ui/hooks/modules/ui/useConsoleLogsState.ts
import { useState } from "react";
import { useRadarLogs } from "../radar/useRadarLogs";
import { useTrafficMonitor } from "../traffic/useTrafficMonitor";
import { useWifiRadarSelection } from "../radar/useWifiRadarSelection";

export type ConsoleTab = "SYSTEM" | "TRAFFIC" | "RADAR";

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

export const useConsoleLogsState = (): UseConsoleLogsState => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("SYSTEM");
  const [isLoading, setIsLoading] = useState(false);
  const traffic = useTrafficMonitor();
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
