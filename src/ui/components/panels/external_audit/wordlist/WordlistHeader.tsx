import React from "react";

export const WordlistHeader: React.FC<{ onClose: () => void, count: number }> = ({ onClose, count }) => (
  <div style={{ 
    padding: "15px 20px", borderBottom: "1px solid #00ff88", 
    background: "rgba(0, 255, 136, 0.05)", display: "flex", 
    justifyContent: "space-between", alignItems: "center", flexShrink: 0 
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
       <span style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 2, fontSize: "1.1rem" }}>AMMO BOX</span>
       <span style={{ background: '#111', color: '#666', padding: '2px 6px', fontSize: 10, fontWeight: 'bold', borderRadius: 2 }}>
           {count} PAYLOADS
       </span>
    </div>
    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#00ff88", cursor: "pointer", fontWeight: "bold", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
  </div>
);