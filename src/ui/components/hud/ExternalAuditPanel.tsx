import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceDTO, ExternalAuditRequestDTO, HostIdentity } from "../../../shared/dtos/NetworkDTOs";
import { useExternalAudit } from "../../hooks/modules/ui/useExternalAudit";
import { getExternalAuditScenarios } from "../../../core/logic/externalAuditScenarios";

interface ExternalAuditPanelProps {
  onClose: () => void;
  targetDevice?: DeviceDTO | null;
  identity?: HostIdentity | null;
  defaultScenarioId?: string | null;
  autoRun?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,255,136,0.18)",
  color: "#b7ffe2",
  padding: "6px 8px",
  fontSize: 12,
  outline: "none",
  fontFamily: "'Consolas', 'Courier New', monospace",
};

const btnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? "rgba(0,255,136,0.12)" : "transparent",
  border: `1px solid ${active ? "rgba(0,255,136,0.45)" : "rgba(0,255,136,0.18)"}`,
  color: active ? "#00ff88" : "rgba(183,255,226,0.85)",
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.4,
  fontFamily: "'Consolas', 'Courier New', monospace",
});

export const ExternalAuditPanel: React.FC<ExternalAuditPanelProps> = ({
  onClose,
  targetDevice = null,
  identity = null,
  defaultScenarioId = null,
  autoRun = false,
}) => {
  const audit = useExternalAudit();

  const [mode, setMode] = useState<"LAB" | "CUSTOM">(() => (targetDevice ? "LAB" : "CUSTOM"));
  const scenarios = useMemo(() => getExternalAuditScenarios(), []);
  const [scenarioId, setScenarioId] = useState<string>(() => defaultScenarioId || "");

  const [binaryPath, setBinaryPath] = useState("");
  const [cwd, setCwd] = useState("");
  const [timeoutMs, setTimeoutMs] = useState<string>("300000");
  const [argsText, setArgsText] = useState("");

  const logRef = useRef<HTMLDivElement>(null);
  const hasAutoRun = useRef(false);

  const request = useMemo<ExternalAuditRequestDTO>(() => {
    const args = argsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedTimeout = Number(timeoutMs);
    return {
      binaryPath: binaryPath.trim(),
      args,
      cwd: cwd.trim() ? cwd.trim() : undefined,
      timeoutMs: Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : undefined,
      env: undefined,
    };
  }, [binaryPath, argsText, cwd, timeoutMs]);

  const selectedScenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) || null, [scenarios, scenarioId]);

  useEffect(() => {
    // Si el panel se abre desde un dispositivo, preferimos LAB y aplicamos escenario por defecto.
    if (targetDevice) {
      setMode("LAB");
      if (defaultScenarioId) setScenarioId(defaultScenarioId);
    }
  }, [targetDevice, defaultScenarioId]);

  const scrollToBottom = () => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const runSelectedLabScenario = async () => {
    if (!selectedScenario || !targetDevice) return;

    if (selectedScenario.mode === "simulated") {
      const steps = selectedScenario.simulate?.({ device: targetDevice, identity }) || [];
      await audit.startSimulated(selectedScenario.title, steps);
      scrollToBottom();
      return;
    }

    const support = selectedScenario.isSupported?.({ device: targetDevice, identity }) || { supported: true };
    if (!support.supported) return;

    const req = selectedScenario.buildRequest?.({ device: targetDevice, identity });
    if (!req) return;

    await audit.start(req);
    scrollToBottom();
  };

  useEffect(() => {
    // UX: al abrir desde "LAB AUDIT" el usuario espera ver salida inmediata.
    // Auto-run solo una vez por montaje (evita ejecuciones repetidas en re-renders).
    if (!autoRun) return;
    if (mode !== "LAB") return;
    if (!targetDevice) return;
    if (!selectedScenario) return;
    if (audit.isRunning) return;
    if (hasAutoRun.current) return;

    hasAutoRun.current = true;
    void runSelectedLabScenario();
  }, [autoRun, mode, targetDevice, selectedScenario, audit.isRunning]);

  return (
    <div
      style={{
        width: 720,
        maxWidth: "92vw",
        height: "72vh",
        maxHeight: "92vh",
        background: "#050607",
        border: "1px solid rgba(0,255,136,0.25)",
        boxShadow: "0 0 0 1px rgba(0,255,136,0.12), 0 25px 80px rgba(0,0,0,0.65)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Consolas', 'Courier New', monospace",
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid rgba(0,255,136,0.25)",
          background: "linear-gradient(180deg, rgba(0,20,10,0.7), rgba(0,0,0,0.2))",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 1.2 }}>
            EXTERNAL AUDIT
          </div>
          <div style={{ color: "rgba(183,255,226,0.75)", fontSize: 12 }}>
            Wrapper CLI / Logs en tiempo real
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setMode("LAB")}
            style={btnStyle(mode === "LAB")}
            aria-label="EXT_AUDIT_TAB_LAB"
          >
            LAB
          </button>
          <button
            onClick={() => setMode("CUSTOM")}
            style={btnStyle(mode === "CUSTOM")}
            aria-label="EXT_AUDIT_TAB_CUSTOM"
          >
            CUSTOM
          </button>
          <div style={{ color: "rgba(183,255,226,0.75)", fontSize: 12 }}>
            {audit.summary}
          </div>
          {autoRun && mode === "LAB" && (
            <div style={{ color: "rgba(0,229,255,0.9)", fontSize: 12, fontWeight: 900, letterSpacing: 0.8 }}>
              AUTO
            </div>
          )}
          <button onClick={onClose} style={btnStyle(false)}>
            CLOSE
          </button>
        </div>
      </div>

      {mode === "LAB" ? (
        <div style={{ display: "flex", gap: 12, padding: 12, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>
              ESCENARIO (LAB)
            </div>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              style={inputStyle}
              aria-label="EXT_AUDIT_SCENARIO"
            >
              <option value="">Selecciona un escenario...</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            {selectedScenario && (
              <div style={{ marginTop: 8, color: "rgba(183,255,226,0.75)", fontSize: 12, lineHeight: 1.45 }}>
                <div style={{ color: "#00ff88", fontWeight: 900, marginBottom: 4 }}>
                  {selectedScenario.mode === "simulated" ? "SIMULADO" : "HERRAMIENTA EXTERNA"}
                </div>
                {selectedScenario.description}
              </div>
            )}
          </div>
          <div style={{ width: 260 }}>
            <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>
              TARGET
            </div>
            <div style={{ ...inputStyle, opacity: 0.9 }}>
              {`IP: ${targetDevice?.ip ?? "-"} | ${targetDevice?.vendor ?? "-"}`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={runSelectedLabScenario}
                disabled={audit.isRunning || !selectedScenario || !targetDevice}
                style={{ ...btnStyle(true), opacity: audit.isRunning || !selectedScenario || !targetDevice ? 0.5 : 1, cursor: audit.isRunning ? "not-allowed" : "pointer" }}
                aria-label="EXT_AUDIT_LAB_RUN"
              >
                RUN
              </button>
              <button
                onClick={audit.cancel}
                disabled={!audit.isRunning}
                style={{ ...btnStyle(false), border: "1px solid rgba(255,85,85,0.55)", color: "#ff7777", opacity: audit.isRunning ? 1 : 0.5, cursor: audit.isRunning ? "pointer" : "not-allowed" }}
                aria-label="EXT_AUDIT_CANCEL"
              >
                CANCEL
              </button>
              <button onClick={audit.clear} style={btnStyle(false)} aria-label="EXT_AUDIT_CLEAR">
                CLEAR
              </button>
            </div>
            {selectedScenario && targetDevice && selectedScenario.isSupported && (
              (() => {
                const support = selectedScenario.isSupported({ device: targetDevice, identity });
                if (support.supported) return null;
                return (
                  <div style={{ marginTop: 8, color: "#ff7777", fontSize: 12 }}>
                    {support.reason || "No soportado en este entorno"}
                  </div>
                );
              })()
            )}
            {selectedScenario && targetDevice && selectedScenario.mode === "external" && selectedScenario.buildRequest && (
              <div style={{ marginTop: 10, color: "rgba(183,255,226,0.75)", fontSize: 11, lineHeight: 1.4 }}>
                <div style={{ color: "rgba(183,255,226,0.55)" }}>COMANDO (preview):</div>
                <div style={{ color: "#00e5ff" }}>{selectedScenario.buildRequest({ device: targetDevice, identity }).binaryPath}</div>
                <div style={{ opacity: 0.9 }}>
                  {selectedScenario.buildRequest({ device: targetDevice, identity }).args.join(" ")}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      <>
      <div style={{ display: "flex", gap: 12, padding: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>
            BINARIO (ruta)
          </div>
          <input
            value={binaryPath}
            onChange={(e) => setBinaryPath(e.target.value)}
            placeholder="Ej: C:\\Program Files\\Tool\\tool.exe"
            style={inputStyle}
          />
        </div>
        <div style={{ width: 180 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>
            TIMEOUT (ms)
          </div>
          <input
            value={timeoutMs}
            onChange={(e) => setTimeoutMs(e.target.value)}
            placeholder="300000"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, padding: "0 12px 12px 12px", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>
            ARGUMENTOS (1 por linea)
          </div>
          <textarea
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            placeholder={"Ej:\n--help"}
            style={{ ...inputStyle, height: 90, resize: "vertical" }}
          />
        </div>
        <div style={{ width: 260 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>
            CWD (opcional)
          </div>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="Ej: C:\\temp"
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={async () => {
                await audit.start(request);
                scrollToBottom();
              }}
              disabled={audit.isRunning}
              style={{ ...btnStyle(true), opacity: audit.isRunning ? 0.5 : 1, cursor: audit.isRunning ? "not-allowed" : "pointer" }}
              aria-label="EXT_AUDIT_START"
            >
              START
            </button>
            <button
              onClick={audit.cancel}
              disabled={!audit.isRunning}
              style={{ ...btnStyle(false), border: "1px solid rgba(255,85,85,0.55)", color: "#ff7777", opacity: audit.isRunning ? 1 : 0.5, cursor: audit.isRunning ? "pointer" : "not-allowed" }}
              aria-label="EXT_AUDIT_CANCEL"
            >
              CANCEL
            </button>
            <button onClick={audit.clear} style={btnStyle(false)} aria-label="EXT_AUDIT_CLEAR">
              CLEAR
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      <div style={{ padding: "0 12px 10px 12px", color: audit.error ? "#ff7777" : "rgba(183,255,226,0.75)", fontSize: 12, flexShrink: 0 }}>
        {audit.error ? `ERROR: ${audit.error}` : "Consejo: evita usar shell. Usa argumentos tokenizados (1 por linea)."}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "0 12px 12px 12px" }}>
        <div
          ref={logRef}
          style={{
            height: "100%",
            overflowY: "auto",
            border: "1px solid rgba(0,255,136,0.14)",
            background: "rgba(0,0,0,0.35)",
            padding: 8,
            fontSize: 12,
            lineHeight: 1.45,
            color: "#a9f5c9",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {audit.rows.length === 0 ? (
            <div style={{ color: "rgba(183,255,226,0.55)" }}>
              Sin output. Pulsa START para ejecutar una herramienta externa.
            </div>
          ) : (
            audit.rows.map((r, i) => (
              <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "2px 0" }}>
                <span style={{ color: "rgba(183,255,226,0.55)", marginRight: 8 }}>
                  {new Date(r.ts).toLocaleTimeString()}
                </span>
                <span style={{ color: r.stream === "stderr" ? "#ff7777" : "#00ff88", fontWeight: 800, marginRight: 8 }}>
                  {r.stream.toUpperCase()}
                </span>
                {r.line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
