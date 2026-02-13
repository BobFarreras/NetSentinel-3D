// src/ui/features/attack_lab/panel/CustomModeView.tsx
// Vista CUSTOM del Attack Lab: construye un request (binario/args/cwd/timeout) y delega ejecucion/cancelacion al hook.

import React, { useMemo, useState } from "react";
import type { AttackLabRequestDTO } from "../../../../shared/dtos/NetworkDTOs";

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
  cursor: active ? "pointer" : "not-allowed",
  opacity: active ? 1 : 0.5,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.4,
  fontFamily: "'Consolas', 'Courier New', monospace",
});

interface CustomModeViewProps {
  isRunning: boolean;
  onStart: (req: AttackLabRequestDTO) => Promise<void>;
  onCancel: () => Promise<void>;
  onClear: () => void;
}

export const CustomModeView: React.FC<CustomModeViewProps> = ({ isRunning, onStart, onCancel, onClear }) => {
  const [binaryPath, setBinaryPath] = useState("");
  const [cwd, setCwd] = useState("");
  const [timeoutMs, setTimeoutMs] = useState<string>("300000");
  const [argsText, setArgsText] = useState("");

  const request = useMemo<AttackLabRequestDTO>(() => {
    const args = argsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const parsedTimeout = Number(timeoutMs);
    return {
      binaryPath: binaryPath.trim(),
      args,
      cwd: cwd.trim() ? cwd.trim() : undefined,
      timeoutMs: Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : undefined,
      env: undefined,
    };
  }, [binaryPath, argsText, cwd, timeoutMs]);

  const handleStart = () => {
    if (!binaryPath.trim()) return;
    onStart(request);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, padding: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>BINARIO (ruta absoluta)</div>
          <input
            value={binaryPath}
            onChange={(e) => setBinaryPath(e.target.value)}
            placeholder="Ej: C:\Windows\System32\ping.exe"
            style={inputStyle}
          />
        </div>
        <div style={{ width: 180 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>TIMEOUT (ms)</div>
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
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>ARGUMENTOS (1 por linea)</div>
          <textarea
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            placeholder={"Ej:\n-n\n4\n8.8.8.8"}
            style={{ ...inputStyle, height: 90, resize: "vertical" }}
          />
        </div>
        <div style={{ width: 260 }}>
          <div style={{ color: "rgba(183,255,226,0.65)", fontSize: 11, marginBottom: 4 }}>CWD (opcional)</div>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="Ej: C:\temp"
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={handleStart}
              disabled={isRunning || !binaryPath}
              style={btnStyle(!isRunning && !!binaryPath)}
            >
              START
            </button>
            <button
              onClick={onCancel}
              disabled={!isRunning}
              style={{ ...btnStyle(isRunning), borderColor: "#f55", color: "#f55" }}
            >
              CANCEL
            </button>
            <button onClick={onClear} style={btnStyle(true)}>
              CLEAR
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
