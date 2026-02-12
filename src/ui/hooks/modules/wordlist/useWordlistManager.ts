import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export const useWordlistManager = (isOpen: boolean) => {
  // Dades
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estats UI
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Refs
  const listEndRef = useRef<HTMLDivElement>(null);

  // --- CÀRREGA ---
  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      const list = await invoke<string[]>("get_dictionary");
      setWords(list);
    } catch (e) {
      console.error("Error loading dictionary:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadWords();
      setSelectedWords(new Set());
      setEditingWord(null);
      setIsDeleting(false);
    }
  }, [isOpen, loadWords]);

  // --- ACCIONS API ---
  const addWord = async (word: string) => {
    if (!word.trim()) return;
    await invoke("add_to_dictionary", { word: word.trim() });
    await loadWords();
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const updateWord = async (oldWord: string, newWord: string) => {
    if (!newWord.trim() || oldWord === newWord) {
        setEditingWord(null);
        return;
    }
    await invoke("update_in_dictionary", { oldWord, newWord });
    await loadWords();
    setEditingWord(null);
  };

  const confirmDelete = async () => {
    setIsDeleting(false);
    const itemsToDelete = Array.from(selectedWords);
    
    // Optimistic UI update (opcional)
    setWords(prev => prev.filter(w => !selectedWords.has(w)));
    setSelectedWords(new Set());

    try {
        await Promise.all(itemsToDelete.map(word => invoke("remove_from_dictionary", { word })));
        await loadWords(); // Sincronització final
    } catch (e) {
        console.error("Error deleting:", e);
        await loadWords(); // Rollback
    }
  };

  // --- HANDLERS UI ---
  const toggleSelection = (word: string) => {
    const newSet = new Set(selectedWords);
    newSet.has(word) ? newSet.delete(word) : newSet.add(word);
    setSelectedWords(newSet);
  };

  const requestDelete = (word?: string) => {
    if (word) setSelectedWords(new Set([word]));
    if (selectedWords.size > 0 || word) setIsDeleting(true);
  };

  const deselectAll = () => setSelectedWords(new Set());

  return {
    state: { words, loading, selectedWords, editingWord, isDeleting, listEndRef },
    actions: { addWord, updateWord, toggleSelection, requestDelete, confirmDelete, deselectAll, setEditingWord, setIsDeleting }
  };
};