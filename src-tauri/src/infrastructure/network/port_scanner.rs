// src-tauri/src/infrastructure/network/port_scanner.rs

use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;
use std::io::{Read, Write};

pub struct PortScanner;

impl PortScanner {
    pub fn scan_service(ip: &str, port: u16) -> Option<String> {
        let target = format!("{}:{}", ip, port);
        // Timeout ajustat per ser ràpid però fiable
        let connect_timeout = Duration::from_millis(1500);
        let io_timeout = Duration::from_millis(1500);

        if let Ok(mut addrs) = target.to_socket_addrs() {
            if let Some(addr) = addrs.next() {
                if let Ok(mut stream) = TcpStream::connect_timeout(&addr, connect_timeout) {
                    let _ = stream.set_read_timeout(Some(io_timeout));
                    let _ = stream.set_write_timeout(Some(io_timeout));
                    
                    let mut buffer = [0; 1024]; // Buffer més gran per llegir errors sencers
                    
                    // 1. LECTURA PASSIVA
                    match stream.read(&mut buffer) {
                        Ok(n) if n > 0 => {
                            let raw = String::from_utf8_lossy(&buffer[..n]);
                            return validate_banner(raw.to_string());
                        },
                        _ => {
                            // 2. SONDA ACTIVA (Trigger)
                            let payload = match port {
                                80 | 8080 | 8081 => b"HEAD / HTTP/1.0\r\n\r\n".to_vec(),
                                25 | 587 => b"EHLO netsentinel\r\n".to_vec(),
                                110 => b"USER audit\r\n".to_vec(),
                                143 => b"A01 CAPABILITY\r\n".to_vec(),
                                3306 => b"\x01\x00\x00\x00".to_vec(), // Ping MySQL bàsic
                                _ => b"\r\n".to_vec(),
                            };

                            if stream.write_all(&payload).is_ok() {
                                if let Ok(n) = stream.read(&mut buffer) {
                                    if n > 0 {
                                        let raw = String::from_utf8_lossy(&buffer[..n]);
                                        return validate_banner(raw.to_string());
                                    }
                                }
                                return Some("Silent".to_string());
                            } else {
                                return None; // Error en write = Connexió tancada realment
                            }
                        }
                    }
                }
            }
        }
        None
    }
}

// Filtre intel·ligent: Descarta missatges d'error de l'Antivirus
fn validate_banner(raw: String) -> Option<String> {
    // Paraules clau que indiquen que l'Antivirus ha fallat en connectar
    let error_keywords = ["connect error", "10061", "refused", "cannot connect", "failure"];
    
    let raw_lower = raw.to_lowercase();
    for keyword in error_keywords.iter() {
        if raw_lower.contains(keyword) {
            return None; // ÉS UN FALS POSITIU -> Port Tancat
        }
    }

    // Neteja de caràcters
    let clean = raw.trim()
        .replace(|c: char| !c.is_ascii() || c.is_control(), " ")
        .chars()
        .take(150)
        .collect();
        
    Some(clean)
}