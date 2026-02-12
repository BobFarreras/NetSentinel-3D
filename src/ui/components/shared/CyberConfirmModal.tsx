// src/ui/components/shared/CyberConfirmModal.tsx

import React from "react";

// Definición del DTO localmente para UI
export interface MacSecurityStatusDTO {
  current_mac: string;
  is_spoofed: boolean;
  risk_level: "HIGH" | "LOW";
}

interface CyberConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  macStatus?: MacSecurityStatusDTO | null; // <--- NUEVO PROP
  onConfirm: () => void;
  onCancel: () => void;
}

export const CyberConfirmModal: React.FC<CyberConfirmModalProps> = ({ 
    isOpen, title, message, macStatus, onConfirm, onCancel 
}) => {
  if (!isOpen) return null;

  // Determinar colores según riesgo (Si no hay status, asumimos neutro/rojo por seguridad)
  const isHighRisk = macStatus?.risk_level === "HIGH";
  // Si es Spoofed (LOW RISK) -> Verde. Si es Real (HIGH RISK) -> Rojo.
  const themeColor = isHighRisk ? "#ff4444" : "#00ff88"; 
  const themeBg = isHighRisk ? "rgba(255, 68, 68, 0.15)" : "rgba(0, 255, 136, 0.15)";

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 5, 2, 0.90)", // Un poco más oscuro para resaltar
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        width: 420, // Un poco más ancho para la info de MAC
        background: "#0a0a0a",
        border: `1px solid ${themeColor}`, // Borde dinámico
        boxShadow: `0 0 30px ${isHighRisk ? "rgba(255, 68, 68, 0.2)" : "rgba(0, 255, 136, 0.1)"}`,
        padding: 2,
        position: "relative",
      }}>
        {/* Header de peligro */}
        <div style={{
          background: themeColor,
          color: "#000",
          fontWeight: 900,
          padding: "4px 8px",
          fontSize: 12,
          letterSpacing: 1,
          display: "flex",
          justifyContent: "space-between"
        }}>
          <span>{isHighRisk ? "⚠ CRITICAL ALERT" : "🛡 SECURE OPERATION"}</span>
          <span>NET_INTERRUPT_REQ</span>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ 
            color: "#fff", 
            fontSize: 16, 
            fontWeight: 800, 
            marginBottom: 12, 
            fontFamily: "'Consolas', monospace",
            textShadow: "0 0 10px rgba(255,255,255,0.3)"
          }}>
            {title}
          </div>

          {/* --- BLOQUE DE IDENTIDAD OPSEC --- */}
          {macStatus && (
              <div style={{ 
                  marginBottom: 15, padding: 10, 
                  border: `1px dashed ${themeColor}`, 
                  background: "rgba(0,0,0,0.4)" 
              }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>INTERFACE IDENTITY:</div>
                  <div style={{ fontFamily: "monospace", fontSize: 14, color: themeColor, fontWeight: "bold", letterSpacing: 1 }}>
                      {macStatus.current_mac.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 6, fontWeight: 700, color: isHighRisk ? "#ff8888" : "#88ffaa" }}>
                      {isHighRisk 
                        ? "⚠ WARNING: USING REAL HARDWARE ADDRESS. TRACEABLE." 
                        : "✓ SAFE: LOCALLY ADMINISTERED ADDRESS (SPOOFED)."}
                  </div>
              </div>
          )}
          {/* ---------------------------------- */}
          
          <div style={{ 
            color: "#bbb", 
            fontSize: 13, 
            lineHeight: 1.5, 
            marginBottom: 20, 
            fontFamily: "'Consolas', monospace",
            whiteSpace: "pre-line"
          }}>
            {message}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={onCancel}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid #666",
                color: "#888",
                padding: "10px",
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "monospace"
              }}
            >
              ABORT
            </button>
            <button 
              onClick={onConfirm}
              style={{
                flex: 1,
                background: themeBg,
                border: `1px solid ${themeColor}`,
                color: isHighRisk ? "#ffaaaa" : "#ccffdd",
                padding: "10px",
                cursor: "pointer",
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: 1
              }}
            >
              {isHighRisk ? "AUTHORIZE (UNSAFE)" : "AUTHORIZE"}
            </button>
          </div>
        </div>
        
        {/* Decoración esquinas */}
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: `2px solid ${themeColor}`, borderRight: `2px solid ${themeColor}` }} />
        <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: `2px solid ${themeColor}`, borderLeft: `2px solid ${themeColor}` }} />
      </div>
    </div>
  );
};