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
        // CORRECCIÓN: lock().unwrap() antes de usar
        let repo = self.repo.lock().unwrap();
        let mut list = repo.load();
        list.sort();
        list.dedup();
        list
    }

    pub fn add_target_word(&self, word: String) -> Result<(), String> {
        // CORRECCIÓN: lock().unwrap() antes de usar
        let repo = self.repo.lock().unwrap();
        repo.add_word(&word).map_err(|e| e.to_string())
    }

    pub fn remove_word(&self, word: String) -> Result<Vec<String>, String> {
        // CORRECCIÓN: lock().unwrap() UNA SOLA VEZ para toda la operación
        let repo = self.repo.lock().unwrap();
        
        let mut list = repo.load();
        if let Some(index) = list.iter().position(|x| *x == word) {
            list.remove(index);
            // Ahora repo.save funcionará porque es público
            repo.save(&list).map_err(|e| e.to_string())?;
        }
        Ok(list)
    }

    pub fn update_word(&self, old_word: String, new_word: String) -> Result<Vec<String>, String> {
        // CORRECCIÓN: lock().unwrap() UNA SOLA VEZ
        let repo = self.repo.lock().unwrap();
        
        let mut list = repo.load();
        if let Some(index) = list.iter().position(|x| *x == old_word) {
            list[index] = new_word;
            repo.save(&list).map_err(|e| e.to_string())?;
        }
        Ok(list)
    }
}