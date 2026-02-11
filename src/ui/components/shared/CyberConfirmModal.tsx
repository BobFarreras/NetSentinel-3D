// src/ui/components/shared/CyberConfirmModal.tsx

import React from "react";

interface CyberConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CyberConfirmModal: React.FC<CyberConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 5, 2, 0.85)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        width: 400,
        background: "#0a0a0a",
        border: "1px solid #ff4444",
        boxShadow: "0 0 30px rgba(255, 68, 68, 0.2)",
        padding: 2,
        position: "relative",
      }}>
        {/* Header de peligro */}
        <div style={{
          background: "#ff4444",
          color: "#000",
          fontWeight: 900,
          padding: "4px 8px",
          fontSize: 12,
          letterSpacing: 1,
          display: "flex",
          justifyContent: "space-between"
        }}>
          <span>⚠ SYSTEM ALERT</span>
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
          
          <div style={{ 
            color: "#bbb", 
            fontSize: 13, 
            lineHeight: 1.5, 
            marginBottom: 20, 
            fontFamily: "'Consolas', monospace",
            whiteSpace: "pre-line" // Permite saltos de línea \n
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
                background: "rgba(255, 68, 68, 0.15)",
                border: "1px solid #ff4444",
                color: "#ffaaaa",
                padding: "10px",
                cursor: "pointer",
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: 1
              }}
            >
              AUTHORIZE
            </button>
          </div>
        </div>
        
        {/* Decoración esquinas */}
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: "2px solid #ff4444", borderRight: "2px solid #ff4444" }} />
        <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "2px solid #ff4444", borderLeft: "2px solid #ff4444" }} />
      </div>
    </div>
  );
};