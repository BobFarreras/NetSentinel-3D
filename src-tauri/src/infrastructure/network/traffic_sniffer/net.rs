// src-tauri/src/infrastructure/network/traffic_sniffer/net.rs

use pnet::datalink::{self, Channel, DataLinkReceiver, NetworkInterface};
use std::net::IpAddr;
use std::time::Duration;

pub fn select_interface(interface_hint: &str, target_ip: &str) -> Result<(NetworkInterface, String), String> {
    let interfaces = datalink::interfaces();

    // 1) Si hay hint explicito (no "auto"), intentamos por nombre.
    if !interface_hint.trim().is_empty() && interface_hint.trim().to_lowercase() != "auto" {
        if let Some(iface) = interfaces.iter().find(|i| i.name == interface_hint.trim()).cloned() {
            let my_ip = get_first_ipv4(&iface).ok_or_else(|| {
                format!(
                    "La interfaz '{}' no tiene IPv4 asignada (hint).",
                    iface.name
                )
            })?;
            return Ok((iface, my_ip));
        }
    }

    // 2) Fallback: buscar por IP (caso tipico).
    let iface = interfaces
        .into_iter()
        .find(|iface| iface.ips.iter().any(|ip_network| match ip_network.ip() {
            IpAddr::V4(ipv4) => ipv4.to_string() == target_ip,
            _ => false,
        }))
        .ok_or_else(|| format!("No se encontro ninguna interfaz con la IP {}.", target_ip))?;

    let my_ip = get_first_ipv4(&iface).ok_or_else(|| format!("La interfaz '{}' no tiene IPv4.", iface.name))?;
    Ok((iface, my_ip))
}

fn get_first_ipv4(interface: &NetworkInterface) -> Option<String> {
    interface
        .ips
        .iter()
        .find(|ip| ip.is_ipv4())
        .map(|ip| ip.ip().to_string())
}

pub fn open_ethernet_rx(interface: &NetworkInterface) -> Result<Box<dyn DataLinkReceiver>, String> {
    let mut config = datalink::Config::default();
    // Intentamos evitar bloqueos largos al parar el sniffer.
    config.read_timeout = Some(Duration::from_millis(250));

    match datalink::channel(interface, config) {
        Ok(Channel::Ethernet(_tx, rx)) => Ok(rx),
        Ok(_) => Err("Canal no soportado (no Ethernet).".to_string()),
        Err(e) => Err(format!("Error al abrir canal datalink (driver): {e}")),
    }
}

