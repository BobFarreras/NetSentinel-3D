use crate::domain::{ports::HistoryRepositoryPort, entities::ScanSession};
use async_trait::async_trait;
use std::fs;
use std::path::PathBuf;
use directories::ProjectDirs;

pub struct FileHistoryRepository;

impl FileHistoryRepository {
    // Helper privat per obtenir la ruta (Lògica portada de history_commands.rs)
    fn get_history_path() -> PathBuf {
        if let Some(proj_dirs) = ProjectDirs::from("com", "netsentinel", "app") {
            let data_dir = proj_dirs.data_dir();
            
            // Creem directori si no existeix
            if !data_dir.exists() {
                let _ = fs::create_dir_all(data_dir);
            }
            return data_dir.join("history.json");
        }
        // Fallback
        PathBuf::from("netsentinel_history.json")
    }
}

#[async_trait]
impl HistoryRepositoryPort for FileHistoryRepository {
    async fn save_session(&self, session: ScanSession) -> Result<(), String> {
        println!("💾 INFRA: Guardant sessió al disc...");
        
        // 1. Recuperem l'historial actual per no matxacar-lo
        let mut history = self.get_all_sessions().await?;
        
        // 2. Afegim la nova sessió al principi
        history.insert(0, session);
        
        // 3. Guardem el fitxer actualitzat
        let path = Self::get_history_path();
        let json = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;
        
        fs::write(&path, json).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    async fn get_all_sessions(&self) -> Result<Vec<ScanSession>, String> {
        let path = Self::get_history_path();
        
        if path.exists() {
            let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
            // Deserialitzem JSON -> Entitats de Domini
            let history: Vec<ScanSession> = serde_json::from_str(&content).unwrap_or(Vec::new());
            Ok(history)
        } else {
            Ok(Vec::new())
        }
    }
}