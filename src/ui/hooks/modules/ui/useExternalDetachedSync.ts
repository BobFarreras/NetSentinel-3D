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
      // Aquest hook s'executa DINS de la finestra desacoblada
      unlisten = await windowingAdapter.listenExternalAuditContext((payload) => {
        console.log("📡 [DETACHED SYNC] Received context update:", payload);
        
        if (payload.targetDevice) {
            setDetachedExternalTarget(payload.targetDevice);
        }
        if (payload.scenarioId) {
            setDetachedExternalScenarioId(payload.scenarioId);
        }
        
        // Passem el token només si es demana autoRun
        if (payload.autoRun) {
          setDetachedExternalAutoRunToken(Date.now());
        }
      });
    };
    void boot();
    return () => { if (unlisten) unlisten(); };
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