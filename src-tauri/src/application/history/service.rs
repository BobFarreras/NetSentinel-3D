// src-tauri/src/application/history/service.rs
// Servicio de historial: crea/guarda sesiones de scan y expone lectura de historial desde el repositorio.

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
        // Logica de negocio: crear el objeto sesion.
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

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use crate::domain::entities::Device;
    use std::sync::{Arc, Mutex};

    struct MockHistoryRepo {
        saved: Arc<Mutex<Vec<ScanSession>>>,
        fail_get: bool,
    }

    #[async_trait]
    impl HistoryRepositoryPort for MockHistoryRepo {
        async fn save_session(&self, session: ScanSession) -> Result<(), String> {
            self.saved.lock().unwrap().push(session);
            Ok(())
        }

        async fn get_all_sessions(&self) -> Result<Vec<ScanSession>, String> {
            if self.fail_get {
                Err("repo error".to_string())
            } else {
                Ok(self.saved.lock().unwrap().clone())
            }
        }
    }

    fn build_device(ip: &str) -> Device {
        Device {
            ip: ip.to_string(),
            mac: "AA:BB:CC".to_string(),
            vendor: "MockVendor".to_string(),
            hostname: None,
            name: None,
            is_gateway: false,
            ping: None,
            signal_strength: None,
            signal_rate: None,
            wifi_band: None,
            open_ports: None,
        }
    }

    #[tokio::test]
    async fn save_session_debe_crear_sesion_con_id_y_label() {
        let saved = Arc::new(Mutex::new(Vec::new()));
        let service = HistoryService::new(Arc::new(MockHistoryRepo {
            saved: saved.clone(),
            fail_get: false,
        }));

        let result = service.save_session(vec![build_device("192.168.1.10")]).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Session saved successfully");

        let sessions = saved.lock().unwrap();
        assert_eq!(sessions.len(), 1);
        assert!(sessions[0].id.starts_with("session_"));
        assert_eq!(sessions[0].label, "Scan (Items: 1)");
    }

    #[tokio::test]
    async fn get_history_debe_retornar_vacio_si_hay_error_del_repo() {
        let service = HistoryService::new(Arc::new(MockHistoryRepo {
            saved: Arc::new(Mutex::new(Vec::new())),
            fail_get: true,
        }));

        let history = service.get_history().await;
        assert!(history.is_empty());
    }
}
// src-tauri/src/application/history_service.rs
