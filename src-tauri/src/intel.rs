// src-tauri/src/intel.rs
use crate::models::Vulnerability;
use std::process::Command;

// 👇 IMPORT NECESSARI PER AMAGAR FINESTRES (WINDOWS)
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

// 1. INTEL·LIGÈNCIA DE NOMS (NSLOOKUP) - ARA SILENCIÓS 🤫
pub fn resolve_hostname(ip: &str) -> Option<String> {
    let mut cmd = Command::new("nslookup");
    cmd.arg(ip);

    // 🛑 APLICAR SILENCIADOR
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output().ok()?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        // Busquem la línia que diu "Name:" (Windows)
        for line in stdout.lines() {
            if line.trim().starts_with("Name:") {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() > 1 {
                    return Some(parts[1].trim().to_string());
                }
            }
        }
    }
    None
}

// 2. INTEL·LIGÈNCIA DE FABRICANTS (MAC VENDOR)
pub fn resolve_vendor(mac: &str) -> String {
    if mac == "00:00:00:00:00:00" { return "Unknown".to_string(); }
    
    let clean_mac = mac.replace(":", "").replace("-", "").to_uppercase();

    // 🛑 DETECCIÓ DE PRIVACITAT
    let second_char = clean_mac.chars().nth(1).unwrap_or('0');
    if ['2', '6', 'A', 'E'].contains(&second_char) {
        return "Private / Randomized MAC".to_string();
    }

    // BASE DE DADES (Simplified)
    if clean_mac.starts_with("ACF7") || clean_mac.starts_with("646E") || clean_mac.starts_with("50EC") { return "Xiaomi / Redmi".to_string(); }
    if clean_mac.starts_with("BCD0") || clean_mac.starts_with("00E0") { return "Intel (PC)".to_string(); }
    if clean_mac.starts_with("D850") || clean_mac.starts_with("F4F5") { return "Google".to_string(); }
    if clean_mac.starts_with("7C04") || clean_mac.starts_with("80E6") { return "Samsung".to_string(); }
    if clean_mac.starts_with("F018") || clean_mac.starts_with("3C22") { return "Apple".to_string(); }
    
    "Generic Device".to_string()
}

// 3. INTEL·LIGÈNCIA DE PORTS
pub fn get_port_intel(port: u16) -> (String, String, String, Option<Vulnerability>) {
    match port {
        21 => ("FTP".to_string(), "HIGH".to_string(), "File Transfer Protocol".to_string(), Some(Vulnerability {
            id: "FTP-PLAIN".to_string(),
            description: "Traffic is not encrypted.".to_string(),
            severity: "HIGH".to_string(),
            recommendation: "Switch to SFTP (Port 22).".to_string()
        })),
        22 => ("SSH".to_string(), "SAFE".to_string(), "Secure Shell".to_string(), None),
        23 => ("TELNET".to_string(), "CRITICAL".to_string(), "Obsolete Protocol".to_string(), Some(Vulnerability {
            id: "TELNET-LEGACY".to_string(),
            description: "Insecure protocol. Easy to sniff.".to_string(),
            severity: "CRITICAL".to_string(),
            recommendation: "DISABLE IMMEDIATELY.".to_string()
        })),
        53 => ("DNS".to_string(), "SAFE".to_string(), "Domain Service".to_string(), None),
        80 => ("HTTP".to_string(), "MEDIUM".to_string(), "Web Server".to_string(), Some(Vulnerability {
            id: "HTTP-NO-SSL".to_string(),
            description: "Unencrypted web traffic.".to_string(),
            severity: "MEDIUM".to_string(),
            recommendation: "Migrate to HTTPS.".to_string()
        })),
        443 => ("HTTPS".to_string(), "SAFE".to_string(), "Secure Web".to_string(), None),
        445 => ("SMB".to_string(), "HIGH".to_string(), "File Sharing".to_string(), Some(Vulnerability {
            id: "SMB-EXPOSED".to_string(),
            description: "Potential EternalBlue target.".to_string(),
            severity: "HIGH".to_string(),
            recommendation: "Block external access.".to_string()
        })),
        3389 => ("RDP".to_string(), "HIGH".to_string(), "Remote Desktop".to_string(), Some(Vulnerability {
            id: "RDP-PUBLIC".to_string(),
            description: "Exposed RDP.".to_string(),
            severity: "HIGH".to_string(),
            recommendation: "Use VPN.".to_string()
        })),
        _ => ("UNKNOWN".to_string(), "POTENTIAL".to_string(), "Unknown Service".to_string(), None),
    }
}