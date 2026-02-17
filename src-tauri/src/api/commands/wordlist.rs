// src-tauri/src/api/commands/wordlist.rs

use crate::application::wordlist::WordlistService;
use tauri::State;

// Nota: estos comandos son entrypoints IPC; evitan exponer el repositorio directamente al frontend.

#[tauri::command]
pub fn get_dictionary(service: State<'_, WordlistService>) -> Result<Vec<String>, String> {
    Ok(service.get_wordlist())
}

#[tauri::command]
pub fn add_to_dictionary(service: State<'_, WordlistService>, word: String) -> Result<(), String> {
    service.add_target_word(word)
}

#[tauri::command]
pub async fn remove_from_dictionary(
    service: State<'_, WordlistService>,
    word: String,
) -> Result<Vec<String>, String> {
    service.remove_word(word)
}

#[tauri::command]
pub async fn update_in_dictionary(
    service: State<'_, WordlistService>,
    old_word: String,
    new_word: String,
) -> Result<Vec<String>, String> {
    service.update_word(old_word, new_word)
}
