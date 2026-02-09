use crate::infrastructure::network::traffic_sniffer::TrafficSniffer;
// 👇 IMPORT NOU
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
            println!("⚠️ [APP] El monitor ja està en marxa.");
            return;
        }

        // 1. OBTENIR LA IP REAL (Per no connectar-nos a Hyper-V)
        let identity: Result<crate::domain::entities::HostIdentity, String> = local_intelligence::get_host_identity();
        let target_ip = match identity {
            Ok(id) => id.ip,
            Err(_) => {
                eprintln!("❌ [APP] No puc iniciar Sniffer sense identitat.");
                return;
            }
        };

        println!("🚀 [APP] Iniciant Monitor de Trànsit sobre IP: {}...", target_ip);
        
        self.is_running.store(true, Ordering::Relaxed);
        let running_clone = self.is_running.clone();

        let callback = move |packet| {
            let _ = app_handle.emit("traffic-event", packet);
        };

        // Passem la IP al Sniffer
        TrafficSniffer::start_capture("auto".to_string(), target_ip, running_clone, callback);
    }

    pub fn stop_monitoring(&self) {
        println!("🛑 [APP] Aturant Monitor...");
        self.is_running.store(false, Ordering::Relaxed);
    }
}