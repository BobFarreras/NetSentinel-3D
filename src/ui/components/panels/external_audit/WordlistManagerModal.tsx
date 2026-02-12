import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface WordlistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalStyle: React.CSSProperties = {
  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0, 10, 5, 0.95)", backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000,
};

const contentStyle: React.CSSProperties = {
  width: 400, height: 500, background: "#050505", border: "1px solid #00ff88",
  boxShadow: "0 0 20px rgba(0, 255, 136, 0.15)", display: "flex", flexDirection: "column",
  fontFamily: "'Consolas', monospace",
};

export const WordlistManagerModal: React.FC<WordlistManagerModalProps> = ({ isOpen, onClose }) => {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar diccionario al abrir
  useEffect(() => {
    if (isOpen) loadWords();
  }, [isOpen]);

  const loadWords = async () => {
    try {
      setLoading(true);
      const list = await invoke<string[]>("get_dictionary");
      setWords(list);
    } catch (e) {
      console.error("Error loading wordlist:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    try {
      await invoke("add_to_dictionary", { word: newWord.trim() });
      setNewWord("");
      await loadWords(); // Recargar lista
    } catch (e) {
      console.error("Error adding word:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        {/* HEADER */}
        <div style={{ padding: 10, borderBottom: "1px solid #00ff88", background: "rgba(0,255,136,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 1 }}>AMMO BOX // WORDLIST</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#00ff88", cursor: "pointer", fontWeight: "bold" }}>X</button>
        </div>

        {/* LISTA DE PALABRAS */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {loading ? (
            <div style={{ color: "#555", textAlign: "center", padding: 20 }}>LOADING AMMO...</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {words.map((w, i) => (
                <div key={i} style={{ 
                    background: "#111", border: "1px solid #333", color: "#ccc", 
                    padding: "2px 6px", fontSize: 11, borderRadius: 2 
                }}>
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div style={{ padding: 10, borderTop: "1px solid #333", display: "flex", gap: 8 }}>
          <input 
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add new password..." 
            style={{ 
                flex: 1, background: "#000", border: "1px solid #444", 
                color: "#fff", padding: "6px", fontFamily: "inherit", outline: "none" 
            }}
          />
          <button 
            onClick={handleAdd}
            style={{ 
                background: "#00ff88", border: "none", color: "#000", 
                fontWeight: "bold", padding: "0 12px", cursor: "pointer" 
            }}
          >
            ADD
          </button>
        </div>
        
        <div style={{ padding: "4px 10px", fontSize: 10, color: "#555", borderTop: "1px solid #222" }}>
            Total: {words.length} payloads loaded.
        </div>
      </div>
    </div>
  );
};