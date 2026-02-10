// src-tauri/src/infrastructure/network/traffic_sniffer.rs

use crate::domain::entities::TrafficPacket;
use pnet::packet::ethernet::{EtherTypes, EthernetPacket};
use pnet::packet::ipv4::Ipv4Packet;
use pnet::packet::Packet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

// Submodulos para separar responsabilidades (SOLID) sin cambiar la API publica del modulo.
#[path = "traffic_sniffer/net.rs"]
mod net;
#[path = "traffic_sniffer/protocol.rs"]
mod protocol;

pub struct TrafficSniffer;

impl TrafficSniffer {
    pub fn start_capture<F>(
        interface_hint: String,
        target_ip: String,
        running: Arc<AtomicBool>,
        callback: F,
    ) where
        F: Fn(TrafficPacket) + Send + Sync + 'static,
    {
        thread::spawn(move || {
            println!(
                "🎧 [SNIFFER] Iniciando captura. hint='{}' target_ip={}",
                interface_hint, target_ip
            );

            let (interface, my_ip) = match net::select_interface(&interface_hint, &target_ip) {
                Ok(v) => v,
                Err(msg) => {
                    eprintln!("❌ [SNIFFER] {msg}");
                    return;
                }
            };

            println!("✅ [SNIFFER] Interfaz='{}' mi_ip={} objetivo={}", interface.name, my_ip, target_ip);

            let mut rx = match net::open_ethernet_rx(&interface) {
                Ok(rx) => rx,
                Err(msg) => {
                    eprintln!("❌ [SNIFFER] {msg}");
                    return;
                }
            };

            // Bucle de captura (thread dedicado). Si el driver no soporta timeout, el stop puede tardar en reflejarse.
            let mut packet_id: usize = 0;

            while running.load(Ordering::Relaxed) {
                let packet = match rx.next() {
                    Ok(p) => p,
                    Err(_) => continue,
                };

                if let Some(dto) = map_packet(packet, &my_ip, &target_ip, packet_id) {
                    callback(dto);
                    packet_id = packet_id.saturating_add(1);
                }
            }

            println!("🛑 [SNIFFER] Detenido.");
        });
    }
}

fn map_packet(packet: &[u8], my_ip: &str, target_ip: &str, packet_id: usize) -> Option<TrafficPacket> {
    let now = protocol::unix_ms();

    let eth = EthernetPacket::new(packet)?;
    if eth.get_ethertype() != EtherTypes::Ipv4 {
        return None;
    }

    let ipv4 = Ipv4Packet::new(eth.payload())?;

    let src = ipv4.get_source().to_string();
    let dst = ipv4.get_destination().to_string();

    let is_intercepted = protocol::is_intercepted(my_ip, &src, &dst);

    // Filtro maestro: mostramos si me implica a mi (target) o si es un paquete interceptado.
    // Nota: `target_ip` es la IP que pasa la UI (normalmente, mi IP local).
    if src != target_ip && dst != target_ip && !is_intercepted {
        return None;
    }

    let (proto, info) = protocol::analyze_ipv4(&ipv4);

    Some(TrafficPacket {
        id: packet_id,
        timestamp: now,
        source_ip: src,
        destination_ip: dst,
        protocol: proto,
        length: ipv4.get_total_length() as usize,
        info,
        is_intercepted,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn intercepted_detection_is_reasonable() {
        assert!(!protocol::is_intercepted("192.168.1.10", "192.168.1.10", "192.168.1.20"));
        assert!(!protocol::is_intercepted("192.168.1.10", "192.168.1.20", "192.168.1.10"));
        assert!(!protocol::is_intercepted("192.168.1.10", "192.168.1.20", "255.255.255.255"));
        assert!(protocol::is_intercepted("192.168.1.10", "192.168.1.20", "192.168.1.30"));
    }

    #[test]
    fn protocol_classifier_basics() {
        let (p, i) = protocol::classify("255.255.255.255", protocol::ProtoKind::Other, 0, 0);
        assert_eq!(p, "BCAST");
        assert!(i.to_lowercase().contains("broadcast"));

        let (p, _) = protocol::classify("239.255.255.250", protocol::ProtoKind::Udp, 1234, 1900);
        assert_eq!(p, "SSDP");
    }
}
