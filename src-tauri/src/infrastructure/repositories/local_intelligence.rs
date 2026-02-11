// src-tauri/src/infrastructure/repositories/local_intelligence.rs

use crate::domain::entities::HostIdentity;
use std::net::UdpSocket;
use std::sync::OnceLock;
use std::time::{Duration, Instant};

// Submodulos para separar responsabilidades (SOLID) sin romper la API publica.
#[path = "local_intelligence/parse.rs"]
mod parse;
#[path = "local_intelligence/ps_script.rs"]
mod ps_script;
#[cfg(test)]
mod tests;

#[derive(Clone)]
struct Cache {
    value: HostIdentity,
    at: Instant,
}

static CACHE: OnceLock<std::sync::Mutex<Option<Cache>>> = OnceLock::new();

pub fn get_host_identity() -> Result<HostIdentity, String> {
    // Cache corto: esta funcion puede llamarse desde loops runtime (sniffer/jammer).
    if let Some(v) = cache_get(Duration::from_millis(2_000)) {
        return Ok(v);
    }

    println!("🚀 [CORE] Iniciando protocolo de identificacion...");

    // Paso 1: obtener IP via UDP (rapido y robusto). Si falla, hacemos fallback por OS.
    let my_ip = detect_ip_via_udp().or_else(|_| ps_script::fallback_detect_ipv4())?;
    println!("✅ [CORE] IP detectada: {}", my_ip);

    // Paso 2 (Windows): extraer detalles (MAC, interfaz, gateway, DNS, netmask).
    let intel = ps_script::probe_identity(&my_ip)
        .ok()
        .and_then(|text| parse::parse_identity_probe(&text).ok());

    let identity = HostIdentity {
        ip: my_ip.clone(),
        mac: intel.as_ref().and_then(|i| i.mac.clone()).unwrap_or_else(|| "UNKNOWN".to_string()),
        netmask: intel
            .as_ref()
            .and_then(|i| i.netmask.clone())
            .unwrap_or_else(|| "255.255.255.0".to_string()),
        gateway_ip: intel
            .as_ref()
            .and_then(|i| i.gateway_ip.clone())
            .unwrap_or_else(|| default_gateway_guess(&my_ip)),
        interface_name: intel
            .as_ref()
            .and_then(|i| i.interface_name.clone())
            .unwrap_or_else(|| "Unknown Interface".to_string()),
        dns_servers: intel
            .as_ref()
            .map(|i| i.dns_servers.clone())
            .unwrap_or_default(),
    };

    println!("✅ [CORE] Identidad confirmada: ip={} mac={} iface={}", identity.ip, identity.mac, identity.interface_name);

    cache_put(identity.clone());
    Ok(identity)
}

fn detect_ip_via_udp() -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Error bind UDP: {e}"))?;
    socket
        .connect("8.8.8.8:80")
        .map_err(|e| format!("Error connect UDP: {e}"))?;
    let local_addr = socket.local_addr().map_err(|e| format!("Error local_addr: {e}"))?;
    Ok(local_addr.ip().to_string())
}

fn default_gateway_guess(ip: &str) -> String {
    // Fallback pragmatica: si no hay intel, intentamos usar el mismo /24 con .1
    let parts: Vec<&str> = ip.split('.').collect();
    if parts.len() == 4 {
        return format!("{}.{}.{}.1", parts[0], parts[1], parts[2]);
    }
    "192.168.1.1".to_string()
}

fn cache_get(max_age: Duration) -> Option<HostIdentity> {
    let lock = CACHE.get_or_init(|| std::sync::Mutex::new(None));
    let guard = lock.lock().ok()?;
    let c = guard.as_ref()?;
    if c.at.elapsed() <= max_age {
        Some(c.value.clone())
    } else {
        None
    }
}

fn cache_put(value: HostIdentity) {
    let lock = CACHE.get_or_init(|| std::sync::Mutex::new(None));
    if let Ok(mut guard) = lock.lock() {
        *guard = Some(Cache { value, at: Instant::now() });
    }
}
