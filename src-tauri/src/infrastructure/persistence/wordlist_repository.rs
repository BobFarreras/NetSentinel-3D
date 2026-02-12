use std::fs::{self, OpenOptions};
use std::io::{self, Write, BufRead, BufReader};
use std::path::PathBuf;
use tauri::Manager;

pub struct FileWordlistRepository {
    file_path: PathBuf,
}

impl FileWordlistRepository {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        let path = app_handle.path().app_config_dir().unwrap().join("wordlist.txt");
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        Self { file_path: path }
    }

    pub fn load(&self) -> Vec<String> {
        if !self.file_path.exists() {
            let defaults = self.get_defaults();
            let _ = self.save(&defaults); // Usamos save aquí también
            return defaults;
        }

        if let Ok(file) = fs::File::open(&self.file_path) {
            let reader = BufReader::new(file);
            return reader.lines()
                .filter_map(Result::ok)
                .map(|line| line.trim().to_string())
                .filter(|line| !line.is_empty())
                .collect();
        }
        self.get_defaults()
    }

    pub fn add_word(&self, word: &str) -> io::Result<()> {
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.file_path)?;
        writeln!(file, "{}", word)?;
        Ok(())
    }

    // CAMBIO: Renombrado a 'save' y hecho público (pub)
    pub fn save(&self, words: &[String]) -> io::Result<()> {
        let mut file = fs::File::create(&self.file_path)?;
        for word in words {
            writeln!(file, "{}", word)?;
        }
        Ok(())
    }

    fn get_defaults(&self) -> Vec<String> {
        vec![
            "12345678".to_string(), "123456789".to_string(), "1234567890".to_string(),
            "password".to_string(), "contraseña".to_string(), "admin1234".to_string(),
            "vodafone1234".to_string(), "movistar1234".to_string(), "orange1234".to_string(),
            "fibra1234".to_string(), "internet".to_string(), "qwertyuiop".to_string(),
            "admin".to_string(),
        ]
    }
}