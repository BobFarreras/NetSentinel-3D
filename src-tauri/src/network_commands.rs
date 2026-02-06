use crate::models::{Device, SecurityReport, OpenPort, Vulnerability};
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::thread;

// Llista de ports que volem comprovar (Els més habituals)
const COMMON_PORTS: [u16; 12] = [
    21,   // FTP
    22,   // SSH
    23,   // Telnet (Molt perillós)
    25,   // SMTP
    53,   // DNS
    80,   // HTTP
    110,  // POP3
    139,  // NetBIOS
    443,  // HTTPS
    445,  // SMB (WannaCry)
    3389, // RDP (Escriptori Remot)
    8080  // Web Alternatiu
];

// --- COMANDA 1: SCAN NETWORK (Simulat per estabilitat inicial) ---
#[tauri::command]
pub async fn scan_network(range: Option<String>) -> Vec<Device> {
    println!("🦀 RUST: Scan requested. Range: {:?}", range);
    
    // Simulem retard de xarxa per realisme
    thread::sleep(Duration::from_millis(500));

    // Dades Mock (simulades) per veure el mapa 3D
    let router = Device {
        ip: "192.168.1.1".to_string(),
        mac: "AA:BB:CC:DD:EE:FF".to_string(),
        vendor: "Gateway Router".to_string(),
        name: Some("Router".to_string()),
        is_gateway: true,
        ping: Some(2),
    };

    let my_pc = Device {
        ip: "192.168.1.33".to_string(),
        mac: "11:22:33:44:55:66".to_string(),
        vendor: "NetSentinel Host".to_string(),
        name: Some("My Workstation".to_string()),
        is_gateway: false,
        ping: Some(0),
    };
    
    let smart_tv = Device {
        ip: "192.168.1.50".to_string(),
        mac: "AA:11:BB:22:CC:33".to_string(),
        vendor: "Smart TV Samsung".to_string(),
        name: Some("Living Room".to_string()),
        is_gateway: false,
        ping: Some(45),
    };

    vec![router, my_pc, smart_tv]
}

// --- COMANDA 2: AUDIT TARGET (REAL TCP CONNECT + INTEL) ---
#[tauri::command]
pub async fn audit_target(ip: String) -> SecurityReport {
    println!("🦀 RUST: Iniciant auditoria real a {}...", ip);
    
    // Vector segur per compartir entre fils (Threads)
    let open_ports = Arc::new(Mutex::new(Vec::new()));
    let mut handles = vec![];

    // Per cada port, llancem un fil paral·lel
    for &port in COMMON_PORTS.iter() {
        let ip_clone = ip.clone();
        let results_clone = Arc::clone(&open_ports);

        let handle = thread::spawn(move || {
            let address = format!("{}:{}", ip_clone, port);
            
            // Intentem resoldre l'adreça
            if let Ok(socket_addrs) = address.to_socket_addrs() {
                for addr in socket_addrs {
                    // Intent de connexió real (Timeout 400ms)
                    if let Ok(_stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(400)) {
                        
                        println!("🔓 PORT OBERT: {}", port);

                        // 🧠 CIBER-INTEL·LIGÈNCIA: Assignem vulnerabilitats segons el port
                        let (service, risk, desc, vuln) = match port {
                            21 => ("FTP", "HIGH", "File Transfer Protocol", Some(Vulnerability {
                                id: "FTP-PLAIN".to_string(),
                                description: "Traffic is not encrypted. Passwords sent in cleartext.".to_string(),
                                severity: "HIGH".to_string(),
                                recommendation: "Switch to SFTP (Port 22).".to_string()
                            })),
                            22 => ("SSH", "SAFE", "Secure Shell", None),
                            23 => ("TELNET", "CRITICAL", "Obsolete Remote Access", Some(Vulnerability {
                                id: "TELNET-LEGACY".to_string(),
                                description: "Completely insecure protocol. Easy to sniff.".to_string(),
                                severity: "CRITICAL".to_string(),
                                recommendation: "DISABLE IMMEDIATELY. Use SSH.".to_string()
                            })),
                            53 => ("DNS", "SAFE", "Domain Name Service", None),
                            80 => ("HTTP", "MEDIUM", "World Wide Web HTTP", Some(Vulnerability {
                                id: "HTTP-NO-SSL".to_string(),
                                description: "Web traffic is unencrypted.".to_string(),
                                severity: "MEDIUM".to_string(),
                                recommendation: "Migrate to HTTPS (Port 443).".to_string()
                            })),
                            443 => ("HTTPS", "SAFE", "Secure HTTP", None),
                            445 => ("SMB", "HIGH", "Windows File Sharing", Some(Vulnerability {
                                id: "SMB-EXPOSED".to_string(),
                                description: "Potential EternalBlue vulnerability target.".to_string(),
                                severity: "HIGH".to_string(),
                                recommendation: "Block external access. Update Windows.".to_string()
                            })),
                            3389 => ("RDP", "HIGH", "Remote Desktop", Some(Vulnerability {
                                id: "RDP-PUBLIC".to_string(),
                                description: "Exposed RDP is a prime target for brute-force.".to_string(),
                                severity: "HIGH".to_string(),
                                recommendation: "Use VPN access only.".to_string()
                            })),
                            _ => ("UNKNOWN", "POTENTIAL", "Unknown TCP Service", None),
                        };

                        let port_info = OpenPort {
                            port,
                            status: "Open".to_string(),
                            service: service.to_string(),
                            risk_level: risk.to_string(),
                            description: Some(desc.to_string()),
                            vulnerability: vuln, 
                        };

                        // Guardem el resultat de forma segura
                        let mut ports = results_clone.lock().unwrap();
                        ports.push(port_info);
                        break; // Si connecta, sortim del bucle d'aquest port
                    }
                }
            }
        });
        handles.push(handle);
    }

    // Esperem que acabin tots els escàners
    for handle in handles { let _ = handle.join(); }

    // Extraiem els resultats finals
    let final_ports = Arc::try_unwrap(open_ports).unwrap().into_inner().unwrap();
    
    // Calculem el risc global basat en el pitjor port trobat
    let mut risk_level = "LOW";
    if final_ports.is_empty() {
        risk_level = "SAFE"; // Mode Stealth
    } else {
        for p in &final_ports {
            if p.risk_level == "CRITICAL" { risk_level = "CRITICAL"; break; }
            if p.risk_level == "HIGH" { risk_level = "HIGH"; }
            if risk_level != "HIGH" && p.risk_level == "MEDIUM" { risk_level = "MEDIUM"; }
        }
    }

    SecurityReport {
        target_ip: ip,
        open_ports: final_ports,
        risk_level: risk_level.to_string(),
    }
}