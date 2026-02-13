// src-tauri/src/api/commands/wordlist.rs

use tauri::State;
use crate::application::wordlist::WordlistService;

// Nota: SIN #[tauri::command] aquí. Se pone en el padre (commands.rs).

pub fn get_dictionary(service: State<'_, WordlistService>) -> Result<Vec<String>, String> {
    Ok(service.get_wordlist())
}

pub fn add_to_dictionary(service: State<'_, WordlistService>, word: String) -> Result<(), String> {
    service.add_target_word(word)
}
