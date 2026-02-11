import React, { useEffect, useRef } from "react";
import type { ExternalAuditLogEvent } from "../../../../shared/dtos/NetworkDTOs"; // Ajusta ruta si necesario

interface AuditConsoleProps {
  rows: { ts: number; stream: "stdout" | "stderr"; line: string }[];
  error?: string | null;
}

export const AuditConsole: React.FC<AuditConsoleProps> = ({ rows, error }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [rows]);

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "0 12px 12px 12px", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingBottom: 6, color: error ? "#ff7777" : "rgba(183,255,226,0.75)", fontSize: 12 }}>
        {error ? `ERROR: ${error}` : "Console Output:"}
      </div>
      <div ref={logRef} style={{
        flex: 1,
        overflowY: "auto",
        border: "1px solid rgba(0,255,136,0.14)",
        background: "rgba(0,0,0,0.35)",
        padding: 8,
        fontSize: 12,
        lineHeight: 1.45,
        color: "#a9f5c9",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        fontFamily: "'Consolas', 'Courier New', monospace",
      }}>
        {rows.length === 0 ? (
          <div style={{ color: "rgba(183,255,226,0.55)" }}>Waiting for command execution...</div>
        ) : (
          rows.map((r, i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "2px 0" }}>
              <span style={{ color: "rgba(183,255,226,0.55)", marginRight: 8 }}>{new Date(r.ts).toLocaleTimeString()}</span>
              <span style={{ color: r.stream === "stderr" ? "#ff7777" : "#00ff88", fontWeight: 800, marginRight: 8 }}>
                {r.stream.toUpperCase()}
              </span>
              {r.line}
            </div>
          ))
        )}
      </div>
    </div>
  );
};