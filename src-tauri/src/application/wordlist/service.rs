// src-tauri/src/application/wordlist/service.rs
// Servicio de wordlist: lee y muta el diccionario local persistido en disco (repo file-backed).

use std::sync::{Arc, Mutex};

use crate::domain::ports::WordlistRepositoryPort;

pub struct WordlistService {
    repo: Arc<dyn WordlistRepositoryPort>,
    // Guard de concurrencia: evita interleaving de operaciones load->save.
    io_guard: Mutex<()>,
}

impl WordlistService {
    pub fn new(repo: Arc<dyn WordlistRepositoryPort>) -> Self {
        Self {
            repo,
            io_guard: Mutex::new(()),
        }
    }

    pub fn get_wordlist(&self) -> Vec<String> {
        let _guard = self.io_guard.lock().unwrap();
        let mut list = self.repo.load().unwrap_or_default();
        list.sort();
        list.dedup();
        list
    }

    pub fn add_target_word(&self, word: String) -> Result<(), String> {
        let _guard = self.io_guard.lock().unwrap();
        self.repo.append(&word)
    }

    pub fn remove_word(&self, word: String) -> Result<Vec<String>, String> {
        let _guard = self.io_guard.lock().unwrap();

        let mut list = self.repo.load()?;
        if let Some(index) = list.iter().position(|x| *x == word) {
            list.remove(index);
            self.repo.save(&list)?;
        }
        Ok(list)
    }

    pub fn update_word(&self, old_word: String, new_word: String) -> Result<Vec<String>, String> {
        let _guard = self.io_guard.lock().unwrap();

        let mut list = self.repo.load()?;
        if let Some(index) = list.iter().position(|x| *x == old_word) {
            list[index] = new_word;
            self.repo.save(&list)?;
        }
        Ok(list)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockWordlistRepo {
        words: Mutex<Vec<String>>,
    }

    impl MockWordlistRepo {
        fn new(words: Vec<String>) -> Self {
            Self { words: Mutex::new(words) }
        }
    }

    impl WordlistRepositoryPort for MockWordlistRepo {
        fn load(&self) -> Result<Vec<String>, String> {
            Ok(self.words.lock().unwrap().clone())
        }

        fn save(&self, words: &[String]) -> Result<(), String> {
            *self.words.lock().unwrap() = words.to_vec();
            Ok(())
        }

        fn append(&self, word: &str) -> Result<(), String> {
            self.words.lock().unwrap().push(word.to_string());
            Ok(())
        }
    }

    #[test]
    fn get_wordlist_debe_ordenar_y_deduplicar() {
        let repo = Arc::new(MockWordlistRepo::new(vec![
            "b".to_string(),
            "a".to_string(),
            "a".to_string(),
        ]));
        let service = WordlistService::new(repo);

        let list = service.get_wordlist();
        assert_eq!(list, vec!["a".to_string(), "b".to_string()]);
    }

    #[test]
    fn add_target_word_debe_append() {
        let repo = Arc::new(MockWordlistRepo::new(vec![]));
        let service = WordlistService::new(repo.clone());

        service.add_target_word("x".to_string()).unwrap();
        assert_eq!(repo.load().unwrap(), vec!["x".to_string()]);
    }

    #[test]
    fn update_word_debe_persistir_si_existe() {
        let repo = Arc::new(MockWordlistRepo::new(vec!["a".to_string(), "b".to_string()]));
        let service = WordlistService::new(repo.clone());

        let list = service.update_word("a".to_string(), "z".to_string()).unwrap();
        assert_eq!(list, vec!["z".to_string(), "b".to_string()]);
        assert_eq!(repo.load().unwrap(), vec!["z".to_string(), "b".to_string()]);
    }

    #[test]
    fn remove_word_debe_eliminar_si_existe() {
        let repo = Arc::new(MockWordlistRepo::new(vec!["a".to_string(), "b".to_string()]));
        let service = WordlistService::new(repo.clone());

        let list = service.remove_word("b".to_string()).unwrap();
        assert_eq!(list, vec!["a".to_string()]);
        assert_eq!(repo.load().unwrap(), vec!["a".to_string()]);
    }
}
