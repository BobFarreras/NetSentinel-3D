// src-tauri/src/infrastructure/wifi/windows_netsh/pseudo_bssid.rs

pub fn percent_to_rssi(percent: i32) -> i32 {
    // Aproximacion defensiva:
    // 0% ~ -100 dBm, 100% ~ -30 dBm
    let p = percent.clamp(0, 100);
    -100 + (p * 70 / 100)
}

pub fn stable_pseudo_bssid(ssid: &str, auth: &str) -> String {
    // Cuando Windows oculta BSSID, necesitamos un id estable para que el frontend pueda
    // posicionar nodos sin jitter y permitir seleccion/filtros.
    //
    // FNV-1a 64-bit (implementacion simple, sin crates).
    let mut h: u64 = 14695981039346656037;
    for b in ssid
        .as_bytes()
        .iter()
        .chain([0u8].iter())
        .chain(auth.as_bytes().iter())
    {
        h ^= *b as u64;
        h = h.wrapping_mul(1099511628211);
    }
    // Convertimos a un formato tipo MAC para reusar el pipeline actual.
    let v = h & 0x0000_FFFF_FFFF_FFFF;
    let bytes = [
        ((v >> 40) & 0xFF) as u8,
        ((v >> 32) & 0xFF) as u8,
        ((v >> 24) & 0xFF) as u8,
        ((v >> 16) & 0xFF) as u8,
        ((v >> 8) & 0xFF) as u8,
        (v & 0xFF) as u8,
    ];
    format!(
        "{:02x}:{:02x}:{:02x}:{:02x}:{:02x}:{:02x}",
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]
    )
}

