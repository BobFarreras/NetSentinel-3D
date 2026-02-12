// src/ui/components/panels/external_audit/WordlistManagerModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useWordlistManager } from "../../../hooks/modules/wordlist/useWordlistManager";
import { CyberConfirmDialog } from "./wordlist/CyberConfirmDialog";

interface WordlistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0, 10, 5, 0.85)", backdropFilter: "blur(5px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 99999, padding: 20,
};

const modalContainerStyle: React.CSSProperties = {
  width: "100%", maxWidth: 600, height: "650px", maxHeight: "90vh",
  background: "#050505", border: "1px solid #00ff88",
  boxShadow: "0 0 50px rgba(0, 255, 136, 0.25)",
  display: "flex", flexDirection: "column", position: "relative",
  fontFamily: "'Consolas', monospace", overflow: "hidden", borderRadius: "4px",
  animation: "fadeIn 0.2s ease-out"
};

export const WordlistManagerModal: React.FC<WordlistManagerModalProps> = ({ isOpen, onClose }) => {
  const { state, actions } = useWordlistManager(isOpen);
  const [newWord, setNewWord] = useState("");
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
      actions.addWord(newWord);
      setNewWord("");
  };

  // Handlers locales para edición (input controlado)
  const startEditing = (word: string) => {
      actions.setEditingWord(word);
      setEditValue(word);
  };

  const saveEditing = (oldWord: string) => {
      actions.updateWord(oldWord, editValue);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div style={overlayStyle} onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .word-chip { transition: all 0.1s; user-select: none; }
        .word-chip.selected {
            background: #00ff88 !important; color: #000 !important; border-color: #00ff88 !important; font-weight: bold;
        }
        .word-chip:hover { border-color: #555; background: #161616; }
        .word-chip.selected:hover { background: #00cc6a !important; }
        .cyber-scrollbar::-webkit-scrollbar { width: 6px; }
        .cyber-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
      
      <div style={modalContainerStyle}>
        
        {state.isDeleting && (
          <CyberConfirmDialog 
            count={state.selectedWords.size} 
            word={state.selectedWords.size === 1 ? Array.from(state.selectedWords)[0] : undefined}
            onConfirm={actions.confirmDelete} 
            onCancel={() => actions.setIsDeleting(false)} 
          />
        )}

        {/* HEADER */}
        <div style={{ padding: "15px 20px", borderBottom: "1px solid #00ff88", background: "rgba(0, 255, 136, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <span style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 2, fontSize: "1.1rem" }}>AMMO BOX</span>
             {state.selectedWords.size > 0 && (
                 <span style={{ background: '#00ff88', color: '#000', padding: '2px 6px', fontSize: 10, fontWeight: 'bold', borderRadius: 2 }}>
                     {state.selectedWords.size} SELECTED
                 </span>
             )}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#00ff88", cursor: "pointer", fontWeight: "bold", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
        </div>

        {/* LISTA */}
        <div className="cyber-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 15, background: "rgba(0,0,0,0.3)", minHeight: 0 }}>
          {state.loading ? (
            <div style={{ color: "#555", textAlign: "center", padding: 20 }}>LOADING...</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: 'flex-start' }}>
              {state.words.map((w, i) => {
                const isSelected = state.selectedWords.has(w);
                const isEditing = state.editingWord === w;
                
                return (
                    <div 
                        key={i} 
                        className={`word-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => !isEditing && actions.toggleSelection(w)}
                        style={{ 
                            background: isEditing ? "#000" : "#111", 
                            border: isEditing ? "1px solid #00ff88" : (isSelected ? "1px solid #00ff88" : "1px solid #333"), 
                            color: isEditing ? "#00ff88" : (isSelected ? "#000" : "#ccc"), 
                            padding: "6px 10px", fontSize: "0.85rem", borderRadius: 2,
                            display: "flex", alignItems: "center", gap: 8, cursor: 'pointer'
                        }}
                    >
                    {isEditing ? (
                        <input 
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveEditing(w)}
                            onKeyDown={(e) => e.key === "Enter" ? saveEditing(w) : (e.key === "Escape" && actions.setEditingWord(null))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: "transparent", border: "none", color: "#00ff88", outline: "none", width: "100px", fontFamily: "inherit", fontWeight: "bold" }}
                        />
                    ) : (
                        <>
                            <span 
                                onDoubleClick={(e) => { e.stopPropagation(); startEditing(w); }} 
                                title="Double-click to Edit"
                            >
                                {w}
                            </span>
                            {!isSelected && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); actions.requestDelete(w); }} 
                                    style={{ background: "transparent", border: "none", color: "#ff5555", cursor: "pointer", fontWeight: "bold", padding: 0, opacity: 0.6, lineHeight: 0.5 }}
                                >×</button>
                            )}
                        </>
                    )}
                    </div>
                );
              })}
              <div ref={state.listEndRef} />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: 15, borderTop: "1px solid #333", background: "#080808", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {state.selectedWords.size > 0 ? (
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={actions.deselectAll} style={{ flex: 1, background: '#222', color: '#888', border: '1px solid #444', padding: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                        DESELECT ({state.selectedWords.size})
                    </button>
                    <button onClick={() => actions.requestDelete()} style={{ flex: 2, background: '#300', color: '#f55', border: '1px solid #f00', padding: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                        DELETE SELECTED
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", gap: 10 }}>
                    <input 
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder="Type new password..." 
                        style={{ flex: 1, background: "#000", border: "1px solid #333", color: "#fff", padding: "12px", fontFamily: "inherit", outline: "none", fontSize: "0.9rem" }}
                    />
                    <button onClick={handleAdd} style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00ff88", color: "#00ff88", fontWeight: "bold", padding: "0 25px", cursor: "pointer" }}>
                        ADD
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};