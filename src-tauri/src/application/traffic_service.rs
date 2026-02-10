// src-tauri/src/application/traffic_service.rs

use crate::infrastructure::network::traffic_sniffer::TrafficSniffer;

use crate::infrastructure::repositories::local_intelligence;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

pub struct TrafficService {
    is_running: Arc<AtomicBool>,
}

impl TrafficService {
    pub fn new() -> Self {
        Self { is_running: Arc::new(AtomicBool::new(false)) }
    }

    pub fn start_monitoring(&self, app_handle: AppHandle) {
        if self.is_running.load(Ordering::Relaxed) {
            println!("⚠️ [APP] El monitor ya esta en marcha.");
            return;
        }

        // 1) Obtener la IP real (para no conectarnos a Hyper-V).
        let identity: Result<crate::domain::entities::HostIdentity, String> = local_intelligence::get_host_identity();
        let target_ip = match identity {
            Ok(id) => id.ip,
            Err(_) => {
                eprintln!("❌ [APP] No puedo iniciar Sniffer sin identidad.");
                return;
            }
        };

        println!("🚀 [APP] Iniciando monitor de trafico sobre IP: {}...", target_ip);
        
        self.is_running.store(true, Ordering::Relaxed);
        let running_clone = self.is_running.clone();

        let callback = move |packet| {
            let _ = app_handle.emit("traffic-event", packet);
        };

        // Passem la IP al Sniffer
        TrafficSniffer::start_capture("auto".to_string(), target_ip, running_clone, callback);
    }

    pub fn stop_monitoring(&self) {
        println!("🛑 [APP] Deteniendo monitor...");
        self.is_running.store(false, Ordering::Relaxed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stop_monitoring_sets_running_false() {
        let service = TrafficService::new();
        service.is_running.store(true, Ordering::Relaxed);

        service.stop_monitoring();

        assert!(!service.is_running.load(Ordering::Relaxed));
    }

    #[test]
    fn service_starts_in_stopped_state() {
        let service = TrafficService::new();
        assert!(!service.is_running.load(Ordering::Relaxed));
    }
}
