// src/ui/features/console_logs/components/SystemLogsView.tsx
// Vista SYSTEM LOGS: render simple de logs del sistema con resaltado basico de severidad.
import React from "react";
import { CONSOLE_COLORS } from "./consoleLogsStyles";

type SystemLogsViewProps = {
  logs: string[];
};

export const SystemLogsView: React.FC<SystemLogsViewProps> = ({ logs }) => {
  return (
    <div style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {logs
        .slice(0)
        .reverse()
        .map((log, i) => (
          <div
            key={i}
            style={{
              borderBottom: "1px solid #111",
              fontSize: "0.8rem",
              color:
                log.includes("ERROR") || log.includes("CRITICAL") || log.includes("💀")
                  ? CONSOLE_COLORS.textErr
                  : CONSOLE_COLORS.textMain,
              padding: "2px 0",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            <span style={{ color: CONSOLE_COLORS.textDim, marginRight: "8px" }}>{new Date().toLocaleTimeString()}</span>
            {log}
          </div>
        ))}
    </div>
  );
};
