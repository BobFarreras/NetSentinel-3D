// src/ui/features/attack_lab/panel/wordlist/WordlistGrid.tsx
// Grid de wordlist: renderiza la lista y gestiona selecciones/edicion a nivel de item via callbacks.

import React from "react";
import { WordChip } from "./WordChip"; // El component que vam fer abans

interface GridProps {
  words: string[];
  loading: boolean;
  selectedWords: Set<string>;
  editingWord: string | null;
  listEndRef: React.RefObject<HTMLDivElement>;
  // Callbacks
  onSelect: (word: string) => void;
  onEditStart: (word: string) => void;
  onEditSave: (old: string, newW: string) => void;
  onDeleteRequest: (word: string) => void;
}

export const WordlistGrid: React.FC<GridProps> = ({ 
  words, loading, selectedWords, editingWord, listEndRef, 
  onSelect, onEditStart, onEditSave, onDeleteRequest 
}) => {
  return (
    <div className="cyber-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 15, background: "rgba(0,0,0,0.3)", minHeight: 0 }}>
      {loading ? (
        <div style={{ color: "#555", textAlign: "center", padding: 20, fontStyle: "italic" }}>LOADING PAYLOADS...</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: 'flex-start' }}>
          {words.map((w) => (
            <WordChip 
              key={w}
              word={w}
              isSelected={selectedWords.has(w)}
              isEditing={editingWord === w}
              onSelect={onSelect}
              onEditStart={onEditStart}
              onEditSave={onEditSave}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
          <div ref={listEndRef} />
        </div>
      )}
    </div>
  );
};
