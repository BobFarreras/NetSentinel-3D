use crate::domain::{ports::HistoryRepositoryPort, entities::ScanSession};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct HistoryService {
    repo: Arc<dyn HistoryRepositoryPort>,
}

impl HistoryService {
    pub fn new(repo: Arc<dyn HistoryRepositoryPort>) -> Self {
        Self { repo }
    }

    pub async fn save_session(&self, devices: Vec<crate::domain::entities::Device>) -> Result<String, String> {
        // Lògica de negoci: Crear l'objecte sessió
        let start = SystemTime::now();
        let timestamp = start.duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        let id = format!("session_{}", timestamp);
        let label = format!("Scan (Items: {})", devices.len());

        let session = ScanSession {
            id,
            timestamp,
            devices, // Assumint que ScanSession usa entities::Device
            label,
        };

        self.repo.save_session(session).await?;
        Ok("Session saved successfully".to_string())
    }

    pub async fn get_history(&self) -> Vec<ScanSession> {
        match self.repo.get_all_sessions().await {
            Ok(sessions) => sessions,
            Err(_) => Vec::new(),
        }
    }
}