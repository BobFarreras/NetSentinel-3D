import { useEffect, useMemo, useRef, useState } from "react";
import type { ExternalAuditExitEvent, ExternalAuditLogEvent, ExternalAuditRequestDTO } from "../../../../shared/dtos/NetworkDTOs";
import { externalAuditAdapter } from "../../../../adapters/externalAuditAdapter";
import type { SimStep } from "../../../../core/logic/externalAuditScenarios";

type LogRow = {
  ts: number;
  stream: "stdout" | "stderr";
  line: string;
};

const clampLines = (rows: LogRow[], max: number) => {
  if (rows.length <= max) return rows;
  return rows.slice(rows.length - max);
};

export const useExternalAudit = () => {
  const [auditId, setAuditId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [lastExit, setLastExit] = useState<ExternalAuditExitEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const simTimers = useRef<number[]>([]);
  const simActive = useRef(false);

  const auditIdRef = useRef<string | null>(null);
  useEffect(() => {
    auditIdRef.current = auditId;
  }, [auditId]);

  useEffect(() => {
    let active = true;
    let unlistenLog: (() => void) | undefined;
    let unlistenExit: (() => void) | undefined;

    const boot = async () => {
      unlistenLog = await externalAuditAdapter.onLog((evt: ExternalAuditLogEvent) => {
        if (!active) return;
        if (!auditIdRef.current) return;
        if (evt.auditId !== auditIdRef.current) return;

        setRows((prev) =>
          clampLines(
            [...prev, { ts: Date.now(), stream: evt.stream, line: evt.line }],
            2000
          )
        );
      });

      unlistenExit = await externalAuditAdapter.onExit((evt: ExternalAuditExitEvent) => {
        if (!active) return;
        if (!auditIdRef.current) return;
        if (evt.auditId !== auditIdRef.current) return;

        simActive.current = false;
        setIsRunning(false);
        setLastExit(evt);
        if (!evt.success) setError(evt.error || "La auditoria finalizo con error");
      });
    };

    boot();
    return () => {
      active = false;
      if (unlistenLog) unlistenLog();
      if (unlistenExit) unlistenExit();
    };
  }, []);

  const start = async (request: ExternalAuditRequestDTO) => {
    // Cancelar simulaciones pendientes.
    simTimers.current.forEach((t) => window.clearTimeout(t));
    simTimers.current = [];
    simActive.current = false;

    setError(null);
    setRows([]);
    setLastExit(null);
    setIsRunning(true);
    try {
      const id = await externalAuditAdapter.start(request);
      setAuditId(id);
      setRows([{ ts: Date.now(), stream: "stdout", line: `START auditId=${id}` }]);
    } catch (e) {
      setIsRunning(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const startSimulated = async (label: string, steps: SimStep[]) => {
    // Cancelar cualquier run previo.
    simTimers.current.forEach((t) => window.clearTimeout(t));
    simTimers.current = [];
    simActive.current = true;

    const id = `sim_${Date.now()}`;
    setAuditId(id);
    setError(null);
    setRows([{ ts: Date.now(), stream: "stdout", line: `SIM START: ${label}` }]);
    setLastExit(null);
    setIsRunning(true);

    steps.forEach((s) => {
      const timer = window.setTimeout(() => {
        if (!simActive.current) return;
        setRows((prev) => clampLines([...prev, { ts: Date.now(), stream: s.stream, line: s.line }], 2000));
      }, s.delayMs);
      simTimers.current.push(timer);
    });

    const lastDelay = Math.max(0, ...steps.map((s) => s.delayMs));
    const exitTimer = window.setTimeout(() => {
      if (!simActive.current) return;
      simActive.current = false;
      setIsRunning(false);
      const exitEvt: ExternalAuditExitEvent = {
        auditId: id,
        success: true,
        exitCode: 0,
        durationMs: lastDelay,
      };
      setLastExit(exitEvt);
    }, lastDelay + 150);
    simTimers.current.push(exitTimer);
  };

  const cancel = async () => {
    if (!auditId) return;
    if (simActive.current) {
      simActive.current = false;
      simTimers.current.forEach((t) => window.clearTimeout(t));
      simTimers.current = [];
      setIsRunning(false);
      setLastExit({
        auditId,
        success: false,
        exitCode: 130,
        durationMs: 0,
        error: "cancelado",
      });
      return;
    }
    try {
      await externalAuditAdapter.cancel(auditId);
      setRows((prev) => clampLines([...prev, { ts: Date.now(), stream: "stderr", line: "CANCEL solicitado" }], 2000));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const clear = () => {
    setRows([]);
    setLastExit(null);
    setError(null);
  };

  const summary = useMemo(() => {
    if (!auditId) return "Sin auditoria activa";
    if (isRunning) return `En ejecucion: ${auditId}`;
    if (lastExit) return `Finalizado: ${auditId} (exit=${lastExit.exitCode ?? "?"}, ok=${lastExit.success})`;
    return `Preparado: ${auditId}`;
  }, [auditId, isRunning, lastExit]);

  return { auditId, isRunning, rows, lastExit, error, start, startSimulated, cancel, clear, summary };
};
