// src-tauri/src/application/jammer/service.rs
// Descripcion: caso de uso de jammer. Orquesta start/stop delegando en el puerto `JammerPort` (la implementacion real vive en infraestructura).

use std::sync::Arc;

use crate::domain::ports::JammerPort;

pub struct JammerService {
    engine: Arc<dyn JammerPort>,
}

impl JammerService {
    pub fn new(engine: Arc<dyn JammerPort>) -> Self {
        Self { engine }
    }

    pub fn start_jamming(&self, target_ip: String, target_mac: String, gateway_ip: String) {
        self.engine.start_jamming(target_ip, target_mac, gateway_ip);
    }

    pub fn stop_jamming(&self, target_ip: String) {
        self.engine.stop_jamming(target_ip);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    struct MockEngine {
        starts: Mutex<Vec<(String, String, String)>>,
        stops: Mutex<Vec<String>>,
    }

    impl MockEngine {
        fn new() -> Self {
            Self {
                starts: Mutex::new(vec![]),
                stops: Mutex::new(vec![]),
            }
        }
    }

    impl JammerPort for MockEngine {
        fn start_jamming(&self, target_ip: String, target_mac: String, gateway_ip: String) {
            self.starts
                .lock()
                .unwrap()
                .push((target_ip, target_mac, gateway_ip));
        }

        fn stop_jamming(&self, target_ip: String) {
            self.stops.lock().unwrap().push(target_ip);
        }
    }

    #[test]
    fn start_stop_delegan_al_puerto() {
        let engine = Arc::new(MockEngine::new());
        let service = JammerService::new(engine.clone());

        service.start_jamming(
            "192.168.1.20".to_string(),
            "AA:BB:CC:DD:EE:20".to_string(),
            "192.168.1.1".to_string(),
        );
        service.stop_jamming("192.168.1.20".to_string());

        assert_eq!(engine.starts.lock().unwrap().len(), 1);
        assert_eq!(engine.stops.lock().unwrap().len(), 1);
    }
}

