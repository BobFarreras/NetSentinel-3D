// src/ui/features/attack_lab/panel/wordlist/WordlistFooter.tsx
// Pie del gestor de wordlists: alta de palabra, acciones sobre seleccion y resumen de conteo.

import React, { useState } from "react";

interface FooterProps {
  selectionCount: number;
  totalCount: number;
  onAdd: (word: string) => void;
  onDeselect: () => void;
  onDeleteSelected: () => void;
}

export const WordlistFooter: React.FC<FooterProps> = ({ 
  selectionCount, totalCount, onAdd, onDeselect, onDeleteSelected 
}) => {
  const [newWord, setNewWord] = useState("");

  const handleAddSubmit = () => {
    onAdd(newWord);
    setNewWord("");
  };

  return (
    <div style={{ padding: 15, borderTop: "1px solid #333", background: "#080808", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        {selectionCount > 0 ? (
            // MODO SELECCIÓ
            <div style={{ display: 'flex', gap: 10, animation: 'fadeIn 0.2s' }}>
                <button onClick={onDeselect} style={{ flex: 1, background: '#222', color: '#888', border: '1px solid #444', padding: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                    DESELECT ({selectionCount})
                </button>
                <button onClick={onDeleteSelected} style={{ flex: 2, background: '#300', color: '#f55', border: '1px solid #f00', padding: 12, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 15px rgba(255,0,0,0.2)' }}>
                    DELETE SELECTED ({selectionCount})
                </button>
            </div>
        ) : (
            // MODO AFEGIR
            <div style={{ display: "flex", gap: 10 }}>
                <input 
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubmit()}
                    placeholder="Type new password..." 
                    style={{ flex: 1, background: "#000", border: "1px solid #333", color: "#fff", padding: "12px", fontFamily: "inherit", outline: "none", fontSize: "0.9rem" }}
                />
                <button onClick={handleAddSubmit} style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00ff88", color: "#00ff88", fontWeight: "bold", padding: "0 25px", cursor: "pointer", textTransform: "uppercase" }}>
                    Add
                </button>
            </div>
        )}
        
        <div style={{ fontSize: 10, color: "#444", textAlign: 'right', marginTop: 5 }}>
            {selectionCount > 0 ? "⚠️ MULTI-SELECT ACTIVE" : `TOTAL: ${totalCount} | CLICK TO SELECT | DBL-CLICK EDIT`}
        </div>
    </div>
  );
};
