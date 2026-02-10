// src-tauri/src/infrastructure/network/port_scanner.rs

use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

pub struct PortScanner;

impl PortScanner {
    pub fn check_port(ip: &str, port: u16) -> bool {
        let target = format!("{}:{}", ip, port);
        // Timeout agresivo por velocidad.
        let timeout = Duration::from_millis(400);

        if let Ok(mut addrs) = target.to_socket_addrs() {
            if let Some(addr) = addrs.next() {
                return TcpStream::connect_timeout(&addr, timeout).is_ok();
            }
        }
        false
    }
}
