import { useEffect, useState } from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import { windowingAdapter } from "../../../../adapters/windowingAdapter";

export const useExternalDetachedSync = () => {
  const [detachedExternalTarget, setDetachedExternalTarget] = useState<DeviceDTO | null>(null);
  const [detachedExternalScenarioId, setDetachedExternalScenarioId] = useState<string | null>(null);
  const [detachedExternalAutoRunToken, setDetachedExternalAutoRunToken] = useState(0);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const boot = async () => {
      unlisten = await windowingAdapter.listenExternalAuditContext((payload) => {
        setDetachedExternalTarget(payload.targetDevice || null);
        setDetachedExternalScenarioId(payload.scenarioId || null);
        if (payload.autoRun) {
          setDetachedExternalAutoRunToken((prev) => prev + 1);
        }
      });
    };
    void boot();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const emitExternalContext = (payload: {
    targetDevice: DeviceDTO | null;
    scenarioId?: string;
    autoRun?: boolean;
  }) => windowingAdapter.emitExternalAuditContext(payload);

  return {
    detachedExternalTarget,
    detachedExternalScenarioId,
    detachedExternalAutoRunToken,
    emitExternalContext,
  };
};
