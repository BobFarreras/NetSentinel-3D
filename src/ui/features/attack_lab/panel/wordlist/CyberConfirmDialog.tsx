// src/ui/features/attack_lab/panel/wordlist/CyberConfirmDialog.tsx
// Dialogo de confirmacion para acciones sensibles (p. ej. borrar/exportar wordlists) en el panel de gestion.

import React from "react";

interface Props {
  count: number;
  word?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CyberConfirmDialog: React.FC<Props> = ({ count, word, onConfirm, onCancel }) => {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.9)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 20, animation: "fadeIn 0.2s ease-out"
    }}>
      <div style={{
        background: "#1a0505", border: "1px solid #ff3333",
        padding: "20px", width: "80%", maxWidth: "300px",
        boxShadow: "0 0 30px rgba(255, 51, 51, 0.2)",
        textAlign: "center", fontFamily: "'Consolas', monospace"
      }}>
        <div style={{ color: "#ff3333", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "10px", letterSpacing: "2px" }}>
          ⚠️ WARNING
        </div>
        <div style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "15px" }}>
          PERMANENT DELETION
        </div>
        
        <div style={{ color: "#fff", background: "#300", padding: "10px", margin: "10px 0", border: "1px dashed #522", fontSize: "1.1rem", fontWeight: "bold" }}>
          {count > 1 ? `${count} ITEMS SELECTED` : `"${word}"`}
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onCancel} style={{ flex: 1, background: "transparent", border: "1px solid #666", color: "#888", padding: "8px", cursor: "pointer", fontWeight: "bold" }}>
            CANCEL
          </button>
          <button onClick={onConfirm} style={{ flex: 1, background: "rgba(255, 51, 51, 0.2)", border: "1px solid #ff3333", color: "#ff3333", padding: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 0 10px rgba(255, 51, 51, 0.1)" }}>
            DELETE ALL
          </button>
        </div>
      </div>
    </div>
  );
};
