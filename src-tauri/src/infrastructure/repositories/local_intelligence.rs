use crate::domain::entities::HostIdentity;
use std::net::UdpSocket;
use std::process::Command;

pub fn get_host_identity() -> Result<HostIdentity, String> {
    println!("🚀 [CORE] INICIANT PROTOCOL D'IDENTIFICACIÓ...");

    // PAS 1: OBTENIR IP VIA UDP (INFAL·LIBLE)
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Error binding socket: {}", e))?;
    socket.connect("8.8.8.8:80")
        .map_err(|e| format!("Error connecting to Google DNS: {}", e))?;
    let local_addr = socket.local_addr()
        .map_err(|e| format!("Error getting local address: {}", e))?;
    
    let my_ip = local_addr.ip().to_string();
    println!("✅ [CORE] IP DETECTADA (ROUTING TABLE): {}", my_ip);

    // PAS 2: EXTREURE DETALLS AMB POWERSHELL (ROBUST)
    // Buscamos el adaptador que tiene esta IP. Esto evita leer memoria corrupta.
    // Comanda: Get-NetIPAddress -IPAddress {IP} | Get-NetAdapter | Select Name, MacAddress, InterfaceDescription
    
    let (mac, interface_name, interface_desc) = get_details_via_powershell(&my_ip);

    println!("✅ [CORE] IDENTITAT CONFIRMADA:");
    println!("   > IP: {}", my_ip);
    println!("   > MAC: {}", mac);
    println!("   > INTERFACE: {} ({})", interface_name, interface_desc);

    Ok(HostIdentity {
        ip: my_ip,
        mac,
        netmask: "255.255.255.0".to_string(), // Calcular-ho amb PS és lent, el 99% és /24
        gateway_ip: "192.168.1.1".to_string(), // TODO: Millorar en futur
        interface_name,
        dns_servers: vec![],
    })
}

// --- HELPER POWERSHELL ---
fn get_details_via_powershell(ip: &str) -> (String, String, String) {
    // Valores por defecto por si falla.
    let mut mac = "UNKNOWN".to_string();
    let mut name = "Unknown Interface".to_string();
    let mut desc = "".to_string();

    #[cfg(target_os = "windows")]
    {
        // Script: busca el adaptador por IP y devuelve un formato de texto simple.
        let ps_script = format!(
            "Get-NetIPAddress -IPAddress {} | Get-NetAdapter | Select-Object -Property MacAddress, Name, InterfaceDescription | Format-List",
            ip
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps_script])
            .output();

        if let Ok(o) = output {
            let stdout = String::from_utf8_lossy(&o.stdout);
            
            // Parseamos el texto (parsing manual simple por robustez).
            for line in stdout.lines() {
                let line = line.trim();
                if line.starts_with("MacAddress") {
                    if let Some(val) = line.split(':').nth(1) {
                        mac = val.trim().to_string();
                    }
                }
                if line.starts_with("Name") {
                    if let Some(val) = line.split(':').nth(1) {
                        name = val.trim().to_string();
                    }
                }
                if line.starts_with("InterfaceDescription") {
                    if let Some(val) = line.split(':').nth(1) {
                        desc = val.trim().to_string();
                    }
                }
            }
        }
    }

    (mac, name, desc)
}
// src-tauri/src/infrastructure/repositories/local_intelligence.rs
