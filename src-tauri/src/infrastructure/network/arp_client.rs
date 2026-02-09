use std::collections::HashMap;
use std::process::Command;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;


#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

pub struct ArpClient;

impl ArpClient {
    pub fn get_table() -> HashMap<String, String> {
        let mut map = HashMap::new();
        let mut cmd = Command::new("arp");
        cmd.arg("-a");
        
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(result) = cmd.output() {
            let stdout = String::from_utf8_lossy(&result.stdout);
            for line in stdout.lines() {
                // Lògica de parsing aïllada aquí
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let ip = parts[0];
                    let mac = parts[1].replace("-", ":").to_uppercase();
                    // Filtem IPs locals bàsiques
                    if ip.starts_with("192.168.") || ip.starts_with("10.") {
                        map.insert(ip.to_string(), mac);
                    }
                }
            }
        }
        map
    }
}