// src-tauri/src/infrastructure/system_scanner/sort.rs

// Helper para ordenar IPs por ultimo octeto (suficiente para /24).
pub fn human_sort(ip_a: &str, ip_b: &str) -> std::cmp::Ordering {
    let a_last: u8 = ip_a.split('.').last().unwrap_or("0").parse().unwrap_or(0);
    let b_last: u8 = ip_b.split('.').last().unwrap_or("0").parse().unwrap_or(0);
    a_last.cmp(&b_last)
}

