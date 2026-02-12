// src-tauri/src/application/wordlist_service.rs

use std::sync::Mutex;
use crate::infrastructure::persistence::wordlist_repository::FileWordlistRepository;

pub struct WordlistService {
    repo: Mutex<FileWordlistRepository>,
}

impl WordlistService {
    pub fn new(repo: FileWordlistRepository) -> Self {
        Self {
            repo: Mutex::new(repo),
        }
    }

    pub fn get_wordlist(&self) -> Vec<String> {
        let repo = self.repo.lock().unwrap();
        let mut list = repo.load();
        // Eliminamos duplicados por si acaso
        list.sort();
        list.dedup();
        list
    }

    pub fn add_target_word(&self, word: String) -> Result<(), String> {
        let repo = self.repo.lock().unwrap();
        repo.add_word(&word).map_err(|e| e.to_string())
    }
}