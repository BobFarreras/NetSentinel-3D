use crate::domain::entities::TrafficPacket;
use pnet::datalink::{self, Channel};
use pnet::packet::ethernet::{EtherTypes, EthernetPacket};
use pnet::packet::ipv4::Ipv4Packet;
use pnet::packet::tcp::TcpPacket;
use pnet::packet::udp::UdpPacket;
use pnet::packet::Packet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use std::net::IpAddr;

pub struct TrafficSniffer;

impl TrafficSniffer {
    // Ara acceptem 'target_ip' per saber on connectar-nos
    pub fn start_capture<F>(_interface_name: String, target_ip: String, running: Arc<AtomicBool>, callback: F)
    where
        F: Fn(TrafficPacket) + Send + Sync + 'static,
    {
        thread::spawn(move || {
            println!("🎧 [SNIFFER] Buscant interfície amb IP: {}...", target_ip);

            // 1. BUSCAR INTERFÍCIE PER IP (Mètode infal·lible)
            let interfaces = datalink::interfaces();
            
            let interface = interfaces.into_iter()
                .find(|iface| {
                    iface.ips.iter().any(|ip_network| {
                        match ip_network.ip() {
                            IpAddr::V4(ipv4) => ipv4.to_string() == target_ip,
                            _ => false
                        }
                    })
                });

            if interface.is_none() {
                eprintln!("❌ [SNIFFER] No s'ha trobat cap interfície amb la IP {}.", target_ip);
                return;
            }
            let interface = interface.unwrap();
            println!("✅ [SNIFFER] CONNECTAT A: {} ({})", interface.name, interface.description);

            // 2. OBRIR CANAL
            let (_, mut rx) = match datalink::channel(&interface, Default::default()) {
                Ok(Channel::Ethernet(tx, rx)) => (tx, rx),
                Ok(_) => { eprintln!("❌ [SNIFFER] Canal no suportat."); return; },
                Err(e) => {
                    eprintln!("❌ [SNIFFER] ERROR DRIVER: {}", e);
                    return;
                }
            };

            // 3. BUCLE DE CAPTURA
            let mut packet_id = 0;
            
            while running.load(Ordering::Relaxed) {
                match rx.next() {
                    Ok(packet) => {
                        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
                        
                        if let Some(eth) = EthernetPacket::new(packet) {
                            if eth.get_ethertype() == EtherTypes::Ipv4 {
                                if let Some(ipv4) = Ipv4Packet::new(eth.payload()) {
                                    
                                    let (proto, info) = analyze_protocol(&ipv4);

                                    // FILTRE VISUAL: Només mostrem trànsit cap a/des de nosaltres
                                    // Això redueix el soroll de broadcast
                                    let src = ipv4.get_source().to_string();
                                    let dst = ipv4.get_destination().to_string();

                                    if src == target_ip || dst == target_ip {
                                        println!("📡 [{} - {}B] {} -> {}", proto, ipv4.get_total_length(), src, dst);

                                        let packet_dto = TrafficPacket {
                                            id: packet_id,
                                            timestamp: now,
                                            source_ip: src,
                                            destination_ip: dst,
                                            protocol: proto,
                                            length: ipv4.get_total_length() as usize,
                                            info,
                                        };

                                        callback(packet_dto);
                                        packet_id += 1;
                                    }
                                }
                            }
                        }
                    },
                    Err(_) => {}
                }
            }
            println!("🛑 [SNIFFER] Aturat.");
        });
    }
}

// Afegeix aquesta lògica dins de analyze_protocol o substitueix la funció existent
fn analyze_protocol(ipv4: &Ipv4Packet) -> (String, String) {
    let dst_ip = ipv4.get_destination().to_string();
    
    // 1. DETECTAR TRÀNSIT DE XARXA LOCAL (BROADCAST/MULTICAST)
    if dst_ip == "255.255.255.255" { return ("BCAST".to_string(), "Broadcast (Tots)".to_string()); }
    if dst_ip.starts_with("224.0.0") { return ("MDNS".to_string(), "Local Discovery (Bonjour/Avahi)".to_string()); }
    if dst_ip.starts_with("239.255") { return ("SSDP".to_string(), "UPnP / Smart Device Shout".to_string()); }
    if dst_ip == "8.8.8.8" || dst_ip == "1.1.1.1" { return ("DNS".to_string(), "Google/Cloudflare DNS".to_string()); }

    // 2. DETECTAR PROTOCOLS PER PORT
    match ipv4.get_next_level_protocol() {
        pnet::packet::ip::IpNextHeaderProtocols::Tcp => {
            if let Some(tcp) = TcpPacket::new(ipv4.payload()) {
                let dest = tcp.get_destination();
                let src = tcp.get_source();
                
                // Mirem tant origen com destí per saber què és
                let port = if dest < 1024 { dest } else { src };

                let info = match port {
                    80 => "🌐 HTTP (Web Insegura)",
                    443 => "🔒 HTTPS (Web / YouTube / Gmail)",
                    22 => "💻 SSH (Terminal Remota)",
                    25 | 110 | 143 | 587 => "📧 EMAIL (SMTP/IMAP)",
                    53 => "🔍 DNS (Cerca de Dominis)",
                    8080 | 8000 => "⚙️ WEB ADMIN / DEV",
                    3389 => "🖥️ RDP (Escriptori Remot)",
                    _ => "Dades TCP"
                };
                return ("TCP".to_string(), info.to_string());
            }
            ("TCP".to_string(), "TCP Raw".to_string())
        },
        pnet::packet::ip::IpNextHeaderProtocols::Udp => {
            if let Some(udp) = UdpPacket::new(ipv4.payload()) {
                let dest = udp.get_destination();
                let info = match dest {
                    53 => "🔍 DNS (Nom de Domini)",
                    67 | 68 => "DHCP (Assignació IP)",
                    123 => "🕒 NTP (Sincronització Hora)",
                    1900 => "📺 SSDP (Smart TV / IoT)",
                    443 => "🚀 QUIC (Protocol Google ràpid)",
                    _ => "Dades UDP"
                };
                return ("UDP".to_string(), info.to_string());
            }
            ("UDP".to_string(), "UDP Raw".to_string())
        },
        _ => ("OTHER".to_string(), "Protocol Desconegut".to_string())
    }
}