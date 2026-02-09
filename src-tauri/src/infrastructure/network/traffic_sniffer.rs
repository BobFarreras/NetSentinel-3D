use crate::domain::entities::TrafficPacket;
use pnet::datalink::{self, Channel};
use pnet::packet::ethernet::{EtherTypes, EthernetPacket};
use pnet::packet::ipv4::Ipv4Packet;
use pnet::packet::tcp::TcpPacket;
use pnet::packet::udp::UdpPacket;
use pnet::packet::Packet;
use std::net::IpAddr;
use std::str;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH}; 

pub struct TrafficSniffer;

impl TrafficSniffer {
    pub fn start_capture<F>(
        _interface_name: String,
        target_ip: String,
        running: Arc<AtomicBool>,
        callback: F,
    ) where
        F: Fn(TrafficPacket) + Send + Sync + 'static,
    {
        thread::spawn(move || {
            println!("🎧 [SNIFFER] Buscant interfície amb IP: {}...", target_ip);

            // 1. BUSCAR INTERFÍCIE PER IP
            let interfaces = datalink::interfaces();
            let interface = interfaces.into_iter().find(|iface| {
                iface.ips.iter().any(|ip_network| match ip_network.ip() {
                    IpAddr::V4(ipv4) => ipv4.to_string() == target_ip,
                    _ => false,
                })
            });

            if interface.is_none() {
                eprintln!("❌ [SNIFFER] No s'ha trobat cap interfície amb la IP {}.", target_ip);
                return;
            }
            let interface = interface.unwrap();
            
            // 2. OBTENIR LA NOSTRA IP (Per saber si estem robant paquets)
            let my_ip_network = interface.ips.iter().find(|ip| ip.is_ipv4()).unwrap();
            let my_ip = my_ip_network.ip().to_string();

            println!("✅ [SNIFFER] La meva IP és: {} | Objectiu: {}", my_ip, target_ip);

            // 3. OBRIR CANAL
            let (_, mut rx) = match datalink::channel(&interface, Default::default()) {
                Ok(Channel::Ethernet(tx, rx)) => (tx, rx),
                Ok(_) => { eprintln!("❌ [SNIFFER] Canal no suportat."); return; }
                Err(e) => { eprintln!("❌ [SNIFFER] ERROR DRIVER: {}", e); return; }
            };

            // 4. BUCLE DE CAPTURA
            let mut packet_id = 0;

            while running.load(Ordering::Relaxed) {
                match rx.next() {
                    Ok(packet) => {
                        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;

                        if let Some(eth) = EthernetPacket::new(packet) {
                            if eth.get_ethertype() == EtherTypes::Ipv4 {
                                if let Some(ipv4) = Ipv4Packet::new(eth.payload()) {
                                    
                                    let src = ipv4.get_source().to_string();
                                    let dst = ipv4.get_destination().to_string();

                                    // 🕵️ LÒGICA DE DETECCIÓ DE ROBATORI (INTERCEPTACIÓ)
                                    // Si el paquet NO ve de mi, i NO va per a mi, i NO és Broadcast/Multicast...
                                    // ...llavors és un paquet que he interceptat (ARP Spoofing)
                                    let is_intercepted = src != my_ip 
                                        && dst != my_ip 
                                        && dst != "255.255.255.255" 
                                        && !dst.starts_with("224.0") 
                                        && !dst.starts_with("239.");

                                    // FILTRE MESTRE: Mostrem si soc jo O si és un paquet interceptat
                                    // (target_ip aquí és la IP que hem passat com a paràmetre, que és la meva IP local)
                                    if src == target_ip || dst == target_ip || is_intercepted {
                                        
                                        // Fingerprinting (Opcional, només per consola)
                                        if ipv4.get_next_level_protocol() == pnet::packet::ip::IpNextHeaderProtocols::Tcp {
                                            if let Some(tcp) = TcpPacket::new(ipv4.payload()) {
                                                let payload = tcp.payload();
                                                if payload.len() > 10 {
                                                    if let Ok(text) = str::from_utf8(payload) {
                                                        if let Some(idx) = text.find("User-Agent: ") {
                                                            let start = idx + 12;
                                                            if let Some(end) = text[start..].find("\r\n") {
                                                                let ua = &text[start..start + end];
                                                                println!("🕵️ [FINGERPRINT] IP {} -> {}", ipv4.get_source(), ua);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        let (proto, info) = analyze_protocol(&ipv4);

                                        // DEBUG VISUAL AL LOG DE LA TERMINAL SI INTERCEPTEM
                                        if is_intercepted {
                                            // println!("💀 INTERCEPTED: {} -> {}", src, dst);
                                        }

                                        let packet_dto = TrafficPacket {
                                            id: packet_id,
                                            timestamp: now,
                                            source_ip: src,
                                            destination_ip: dst,
                                            protocol: proto,
                                            length: ipv4.get_total_length() as usize,
                                            info,
                                            is_intercepted, // 👈 Això marcarà la línia vermella al frontend
                                        };

                                        callback(packet_dto);
                                        packet_id += 1;
                                    }
                                }
                            }
                        }
                    }
                    Err(_) => {}
                }
            }
            println!("🛑 [SNIFFER] Aturat.");
        });
    }
}

fn analyze_protocol(ipv4: &Ipv4Packet) -> (String, String) {
    let dst_ip = ipv4.get_destination().to_string();

    if dst_ip == "255.255.255.255" { return ("BCAST".to_string(), "Broadcast".to_string()); }
    if dst_ip.starts_with("224.0.0") { return ("MDNS".to_string(), "Bonjour/Avahi".to_string()); }
    if dst_ip.starts_with("239.255") { return ("SSDP".to_string(), "UPnP / IoT".to_string()); }
    if dst_ip == "8.8.8.8" || dst_ip == "1.1.1.1" { return ("DNS".to_string(), "Google DNS".to_string()); }

    match ipv4.get_next_level_protocol() {
        pnet::packet::ip::IpNextHeaderProtocols::Tcp => {
            if let Some(tcp) = TcpPacket::new(ipv4.payload()) {
                let dest = tcp.get_destination();
                let src = tcp.get_source();
                let port = if dest < 1024 { dest } else { src };
                let info = match port {
                    80 => "🌐 HTTP (Web)",
                    443 => "🔒 HTTPS (Web Segura)",
                    22 => "💻 SSH",
                    53 => "🔍 DNS",
                    _ => "Dades TCP",
                };
                return ("TCP".to_string(), info.to_string());
            }
            ("TCP".to_string(), "TCP Raw".to_string())
        }
        pnet::packet::ip::IpNextHeaderProtocols::Udp => {
            if let Some(udp) = UdpPacket::new(ipv4.payload()) {
                let dest = udp.get_destination();
                let info = match dest {
                    53 => "🔍 DNS",
                    67 | 68 => "DHCP",
                    123 => "🕒 NTP",
                    1900 => "📺 SSDP",
                    443 => "🚀 QUIC",
                    _ => "Dades UDP",
                };
                return ("UDP".to_string(), info.to_string());
            }
            ("UDP".to_string(), "UDP Raw".to_string())
        }
        _ => ("OTHER".to_string(), "Protocol Desconegut".to_string()),
    }
}