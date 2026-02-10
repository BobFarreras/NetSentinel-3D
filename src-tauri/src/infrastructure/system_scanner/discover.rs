// src-tauri/src/infrastructure/system_scanner/discover.rs

use crate::infrastructure::network::ping_executor::PingExecutor;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

const DEFAULT_MAX_HOSTS: usize = 254; // 1..254 (evitamos .0 y .255)

pub fn discover_active_ips(subnet_base: &str) -> Vec<String> {
    // Evitamos crear 254 threads. Usamos un pool simple de workers con indice atomico.
    let worker_count = std::thread::available_parallelism()
        .map(|n| n.get().saturating_mul(4))
        .unwrap_or(32)
        .clamp(8, 96);

    let results = Arc::new(Mutex::new(Vec::<String>::new()));
    let idx = Arc::new(AtomicUsize::new(1));

    let base = subnet_base.to_string();
    let mut handles = Vec::with_capacity(worker_count);

    for _ in 0..worker_count {
        let results = Arc::clone(&results);
        let idx = Arc::clone(&idx);
        let base = base.clone();

        handles.push(thread::spawn(move || loop {
            let i = idx.fetch_add(1, Ordering::Relaxed);
            if i > DEFAULT_MAX_HOSTS {
                break;
            }
            let ip_target = format!("{}.{}", base, i);
            if PingExecutor::is_alive(&ip_target) {
                results.lock().unwrap().push(ip_target);
            }
        }));
    }

    for h in handles {
        let _ = h.join();
    }

    let mut ips = results.lock().unwrap().clone();
    ips.sort();
    ips
}

