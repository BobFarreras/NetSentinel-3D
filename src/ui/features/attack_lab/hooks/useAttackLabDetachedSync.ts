// src/ui/features/attack_lab/hooks/useAttackLabDetachedSync.ts
// Hook de sincronizacion para ventana desacoplada del Attack Lab: recibe contexto (target/escenario/autorun) y expone emision de contexto.

import { useEffect, useState } from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";
import { windowingAdapter } from "../../../../adapters/windowingAdapter";
import { uiLogger } from "../../../utils/logger";

export const useAttackLabDetachedSync = () => {
  const [detachedAttackLabTarget, setDetachedAttackLabTarget] = useState<DeviceDTO | null>(null);
  const [detachedAttackLabScenarioId, setDetachedAttackLabScenarioId] = useState<string | null>(null);
  const [detachedAttackLabAutoRunToken, setDetachedAttackLabAutoRunToken] = useState(0);

  useEffect(() => {
    // Bootstrap inicial (evita perder contexto en el primer render de la ventana desacoplada).
    // Nota: se consume (y borra) para evitar usar un target stale en futuras aperturas.
    const bootstrap = windowingAdapter.consumeAttackLabDetachedBootstrap();
    if (bootstrap?.targetDevice) {
      setDetachedAttackLabTarget(bootstrap.targetDevice);
    }
    if (bootstrap?.scenarioId) {
      setDetachedAttackLabScenarioId(bootstrap.scenarioId);
    }

    let unlisten: (() => void) | null = null;
    const boot = async () => {
      // Este hook se ejecuta dentro de la ventana desacoplada.
      unlisten = await windowingAdapter.listenAttackLabContext((payload) => {
        uiLogger.info("[attack_lab] detached context update", payload);
        
        if (payload.targetDevice) {
            setDetachedAttackLabTarget(payload.targetDevice);
        }
        if (payload.scenarioId) {
            setDetachedAttackLabScenarioId(payload.scenarioId);
        }
        
        // Passem el token només si es demana autoRun
        if (payload.autoRun) {
          // Token monotono para disparar efectos sin depender de Date.now (mas estable en tests).
          setDetachedAttackLabAutoRunToken((t) => t + 1);
        }
      });
    };
    void boot();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const emitAttackLabContext = (payload: {
    targetDevice: DeviceDTO | null;
    scenarioId?: string;
    autoRun?: boolean;
  }) => windowingAdapter.emitAttackLabContext(payload);

  return {
    detachedAttackLabTarget,
    detachedAttackLabScenarioId,
    detachedAttackLabAutoRunToken,
    emitAttackLabContext,
  };
};
