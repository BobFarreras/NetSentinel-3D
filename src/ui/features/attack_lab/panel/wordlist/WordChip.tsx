// src/ui/features/attack_lab/panel/wordlist/WordChip.tsx
// Componente visual para una palabra individual del diccionario (seleccion, edicion inline y borrado).

import React, { useState } from "react";

interface WordChipProps {
  word: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (word: string) => void;
  onEditStart: (word: string) => void;
  onEditSave: (oldWord: string, newWord: string) => void;
  onDeleteRequest: (word: string) => void;
}

export const WordChip: React.FC<WordChipProps> = ({
  word, isSelected, isEditing, onSelect, onEditStart, onEditSave, onDeleteRequest
}) => {
  const [editValue, setEditValue] = useState(word);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onEditSave(word, editValue);
    if (e.key === "Escape") onEditSave(word, word); // Cancelar
  };

  return (
    <div 
      className={`word-chip ${isSelected ? 'selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); if(!isEditing) onSelect(word); }}
      style={{ 
        background: isEditing ? "#000" : (isSelected ? "#00ff88" : "#111"), 
        border: isEditing || isSelected ? "1px solid #00ff88" : "1px solid #333", 
        color: isEditing || isSelected ? (isEditing ? "#00ff88" : "#000") : "#ccc", 
        padding: "6px 10px", borderRadius: 2, fontSize: "0.85rem",
        display: "flex", alignItems: "center", gap: 8, cursor: 'pointer',
        transition: "all 0.1s", userSelect: "none"
      }}
    >
      {isEditing ? (
        <input 
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onEditSave(word, editValue)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{ background: "transparent", border: "none", color: "inherit", outline: "none", width: "100px", fontFamily: "inherit", fontWeight: "bold" }}
        />
      ) : (
        <>
          <span 
            onDoubleClick={(e) => { e.stopPropagation(); onEditStart(word); }} 
            title="Click to Select / Double-click to Edit"
          >
            {word}
          </span>
          {!isSelected && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteRequest(word); }}
              style={{ background: "transparent", border: "none", color: "#ff5555", cursor: "pointer", fontWeight: "bold", padding: 0, opacity: 0.6, lineHeight: 0.5 }}
            >
              ×
            </button>
          )}
        </>
      )}
    </div>
  );
};
