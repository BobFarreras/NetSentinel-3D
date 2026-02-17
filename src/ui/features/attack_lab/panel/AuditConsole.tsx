// src/ui/features/attack_lab/panel/AuditConsole.tsx
// Consola de salida del Attack Lab: renderiza filas (stdout/stderr) con "teletype" (efecto terminal) y autoscroll.

import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "../../../i18n";

interface AuditConsoleProps {
  rows: { ts: number; stream: "stdout" | "stderr"; line: string }[];
  error?: string | null;
  nextSteps?: { id: string; title: string; onRun: () => void; disabled?: boolean }[];
}

export const AuditConsole: React.FC<AuditConsoleProps> = ({ rows, error, nextSteps = [] }) => {
  const { t } = useI18n();
  const logRef = useRef<HTMLDivElement>(null);
  const [animatingIndex, setAnimatingIndex] = useState(0);

  // Evita re-animar logs persistidos al reabrir el panel.
  useEffect(() => {
    setAnimatingIndex(rows.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (animatingIndex > rows.length) setAnimatingIndex(rows.length);
  }, [rows.length, animatingIndex]);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [animatingIndex, rows.length, error]);

  const classifyLine = (line: string): React.CSSProperties => {
    const l = (line || "").trim();
    if (l.startsWith("===")) {
      return { color: "rgba(0,229,255,0.92)", fontWeight: 900, letterSpacing: 0.6 };
    }
    if (l.startsWith("==")) {
      return { color: "rgba(183,255,226,0.95)", fontWeight: 900 };
    }
    if (l.startsWith("VERDICT:")) {
      const v = l.slice("VERDICT:".length).trim().toUpperCase();
      if (v === "OK") return { color: "#00ff88", fontWeight: 900 };
      if (v === "WARN") return { color: "#ffd65a", fontWeight: 900 };
      if (v === "FAIL") return { color: "#ff5555", fontWeight: 900 };
      return { color: "rgba(183,255,226,0.9)", fontWeight: 900 };
    }
    if (l === "WHY:" || l.startsWith("WHY:") || l === "NEXT:" || l.startsWith("NEXT:")) {
      return { color: "rgba(183,255,226,0.9)", fontWeight: 900 };
    }
    if (l.startsWith("-")) {
      return { color: "rgba(169,245,201,0.92)", paddingLeft: 14 };
    }
    if (/^[A-Za-z0-9._-]{2,32}:\s+/.test(l)) {
      return { color: "rgba(169,245,201,0.95)" };
    }
    if (l.startsWith("STATUS:")) {
      return { color: "rgba(169,245,201,0.95)" };
    }
    return { color: "rgba(169,245,201,0.88)" };
  };

  const RowText: React.FC<{ text: string; active: boolean; onDone?: () => void; style?: React.CSSProperties }> = ({
    text,
    active,
    onDone,
    style,
  }) => {
    const [displayed, setDisplayed] = useState("");

    useEffect(() => {
      // Si es muy largo, pintamos de golpe (evita jank).
      if (text.length > 220) {
        setDisplayed(text);
        onDone?.();
        return;
      }

      let idx = 0;
      const id = window.setInterval(() => {
        idx++;
        setDisplayed(text.slice(0, idx));
        if (idx >= text.length) {
          window.clearInterval(id);
          onDone?.();
        }
      }, 8);

      return () => window.clearInterval(id);
    }, [text, onDone]);

    return (
      <span style={style}>
        {displayed}
        {active && <span className="cursor-block">█</span>}
      </span>
    );
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "0 12px 12px 12px", display: "flex", flexDirection: "column" }}>
      <style>{`
        .attack-lab-console::-webkit-scrollbar { width: 10px; }
        .attack-lab-console::-webkit-scrollbar-track { background: rgba(0,0,0,0.25); border-left: 1px solid rgba(0,255,136,0.18); }
        .attack-lab-console::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.18); border: 1px solid rgba(0,255,136,0.45); }
        .attack-lab-console::-webkit-scrollbar-thumb:hover { background: rgba(0,255,136,0.35); }
        @keyframes blink-block { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-block { display: inline-block; width: 8px; height: 14px; background-color: rgba(0,255,136,0.85); animation: blink-block 1s step-end infinite; vertical-align: middle; margin-left: 2px; box-shadow: 0 0 6px rgba(0,255,136,0.55); }
      `}</style>

      <div style={{ paddingBottom: 6, color: error ? "#ff7777" : "rgba(183,255,226,0.75)", fontSize: 12 }}>
        {error ? `${t("attackLab.console.errorPrefix")}: ${error}` : t("attackLab.console.output")}
      </div>

      {nextSteps.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingBottom: 8 }}>
          <div style={{ color: "rgba(183,255,226,0.7)", fontSize: 11, letterSpacing: 0.6, fontWeight: 900 }}>
            {t("attackLab.console.nextSteps")}:
          </div>
          {nextSteps.map((s) => (
            <button
              key={s.id}
              onClick={s.onRun}
              disabled={s.disabled}
              style={{
                background: s.disabled ? "transparent" : "rgba(0,255,136,0.10)",
                border: `1px solid ${s.disabled ? "rgba(0,255,136,0.12)" : "rgba(0,255,136,0.45)"}`,
                color: s.disabled ? "rgba(183,255,226,0.35)" : "#00ff88",
                padding: "6px 10px",
                cursor: s.disabled ? "not-allowed" : "pointer",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.4,
                fontFamily: "'Consolas', 'Courier New', monospace",
              }}
              title={s.title}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div ref={logRef} style={{
        flex: 1,
        overflowY: "auto",
        border: "1px solid rgba(0,255,136,0.14)",
        background: "rgba(0,0,0,0.35)",
        padding: 8,
        paddingRight: 16, // margen para que el scrollbar no tape texto
        fontSize: 12,
        lineHeight: 1.45,
        color: "#a9f5c9",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        fontFamily: "'Consolas', 'Courier New', monospace",
      }} className="attack-lab-console">
        {rows.length === 0 ? (
          <div style={{ color: "rgba(183,255,226,0.55)" }}>{t("attackLab.console.waiting")}</div>
        ) : (
          rows.map((r, i) => {
            // Pintamos de golpe lo ya "confirmado". Solo la siguiente fila se anima como terminal.
            if (i < animatingIndex) {
              return (
                <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "2px 0" }}>
                  <span style={{ color: "rgba(183,255,226,0.55)", marginRight: 8 }}>{new Date(r.ts).toLocaleTimeString()}</span>
                  <span style={{ color: r.stream === "stderr" ? "#ff7777" : "#00ff88", fontWeight: 900, marginRight: 8 }}>
                    {r.stream.toUpperCase()}
                  </span>
                  <span style={classifyLine(r.line)}>{r.line}</span>
                </div>
              );
            }

            if (i === animatingIndex) {
              return (
                <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "2px 0" }}>
                  <span style={{ color: "rgba(183,255,226,0.55)", marginRight: 8 }}>{new Date(r.ts).toLocaleTimeString()}</span>
                  <span style={{ color: r.stream === "stderr" ? "#ff7777" : "#00ff88", fontWeight: 900, marginRight: 8 }}>
                    {r.stream.toUpperCase()}
                  </span>
                  <RowText
                    text={r.line}
                    active={true}
                    style={classifyLine(r.line)}
                    onDone={() => setAnimatingIndex((p) => Math.min(rows.length, p + 1))}
                  />
                </div>
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
};
