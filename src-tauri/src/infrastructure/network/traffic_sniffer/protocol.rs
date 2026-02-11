// src-tauri/src/infrastructure/network/traffic_sniffer/protocol.rs

use pnet::packet::ipv4::Ipv4Packet;
use pnet::packet::tcp::TcpPacket;
use pnet::packet::udp::UdpPacket;
use pnet::packet::Packet;

use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ProtoKind {
    Tcp,
    Udp,
    Other,
}

pub fn unix_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub fn is_intercepted(my_ip: &str, src: &str, dst: &str) -> bool {
    // Si el paquete NO viene de mi, y NO va para mi, y NO es broadcast/multicast,
    // entonces es probable que sea un paquete interceptado (p. ej. por ARP spoofing).
    src != my_ip
        && dst != my_ip
        && dst != "255.255.255.255"
        && !dst.starts_with("224.0")
        && !dst.starts_with("239.")
}

pub fn analyze_ipv4(ipv4: &Ipv4Packet) -> (String, String) {
    // Primero: heuristicas por destino (broadcast/multicast/dns publico, etc.).
    let dst_ip = ipv4.get_destination().to_string();

    match ipv4.get_next_level_protocol() {
        pnet::packet::ip::IpNextHeaderProtocols::Tcp => {
            if let Some(tcp) = TcpPacket::new(ipv4.payload()) {
                let (proto, info) = classify(&dst_ip, ProtoKind::Tcp, tcp.get_source(), tcp.get_destination());

                // Fingerprinting best-effort solo en debug.
                #[cfg(debug_assertions)]
                {
                    if let Some(ua) = try_extract_user_agent(tcp.payload()) {
                        println!("🕵️ [FINGERPRINT] {} -> {}", ipv4.get_source(), ua);
                    }
                }

                return (proto, info);
            }
            classify(&dst_ip, ProtoKind::Tcp, 0, 0)
        }
        pnet::packet::ip::IpNextHeaderProtocols::Udp => {
            if let Some(udp) = UdpPacket::new(ipv4.payload()) {
                return classify(&dst_ip, ProtoKind::Udp, udp.get_source(), udp.get_destination());
            }
            classify(&dst_ip, ProtoKind::Udp, 0, 0)
        }
        _ => classify(&dst_ip, ProtoKind::Other, 0, 0),
    }
}

pub fn classify(dst_ip: &str, kind: ProtoKind, src_port: u16, dst_port: u16) -> (String, String) {
    if dst_ip == "255.255.255.255" {
        return ("BCAST".to_string(), "Broadcast".to_string());
    }
    if dst_ip.starts_with("224.0.0") {
        return ("MDNS".to_string(), "Bonjour/Avahi".to_string());
    }
    if dst_ip.starts_with("239.255") {
        return ("SSDP".to_string(), "UPnP / IoT".to_string());
    }
    if dst_ip == "8.8.8.8" || dst_ip == "1.1.1.1" {
        return ("DNS".to_string(), "DNS publico".to_string());
    }

    match kind {
        ProtoKind::Tcp => {
            // Heuristica: si el destino es un puerto "alto", pero el source es un puerto conocido, usamos el conocido.
            let port = if dst_port < 1024 { dst_port } else { src_port };
            let info = match port {
                80 => "HTTP (Web)",
                443 => "HTTPS (Web segura)",
                22 => "SSH",
                53 => "DNS",
                _ => "Datos TCP",
            };
            ("TCP".to_string(), info.to_string())
        }
        ProtoKind::Udp => {
            let info = match dst_port {
                53 => "DNS",
                67 | 68 => "DHCP",
                123 => "NTP",
                1900 => "SSDP",
                443 => "QUIC",
                _ => "Datos UDP",
            };
            ("UDP".to_string(), info.to_string())
        }
        ProtoKind::Other => ("OTHER".to_string(), "Protocolo desconocido".to_string()),
    }
}

fn try_extract_user_agent(payload: &[u8]) -> Option<String> {
    if payload.len() <= 10 {
        return None;
    }
    let text = std::str::from_utf8(payload).ok()?;
    let idx = text.find("User-Agent: ")?;
    let start = idx + "User-Agent: ".len();
    let end = text[start..].find("\r\n")?;
    Some(text[start..start + end].to_string())
}

