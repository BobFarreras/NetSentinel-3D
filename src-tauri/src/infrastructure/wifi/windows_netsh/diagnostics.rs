// src-tauri/src/infrastructure/wifi/windows_netsh/diagnostics.rs

// Heuristicas para detectar bloqueos de WiFi en Windows (ubicacion/elevacion).

pub fn is_windows_wifi_blocked(text: &str) -> bool {
    let lower = text.to_lowercase();
    let mentions_location = lower.contains("permiso de ubic")
        || lower.contains("privacy-location")
        || lower.contains("ms-settings:privacy-location")
        || lower.contains("location permission");
    let mentions_elevation =
        lower.contains("requiere elev") || lower.contains("requires elevation") || lower.contains("error 5");
    mentions_location || mentions_elevation
}

pub fn blocked_message() -> String {
    "Windows esta bloqueando el escaneo WiFi. Activa los servicios de ubicacion (Configuracion > Privacidad y seguridad > Ubicacion) y, si aplica, ejecuta la app con permisos elevados. Luego reintenta SCAN AIRWAVES.".to_string()
}

pub fn diagnose_windows_wlan_block() -> Option<String> {
    // Diagnostico best-effort. No requiere exito del comando; precisamente queremos el texto de error.
    // Esto evita que el usuario piense que el radar "no detecta nada" cuando en realidad es un bloqueo del SO.
    if !cfg!(windows) {
        return None;
    }

    let output = std::process::Command::new("netsh")
        .args(["wlan", "show", "networks", "mode=bssid"])
        .output()
        .ok()?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));

    if !is_windows_wifi_blocked(&text) {
        return None;
    }

    Some(blocked_message())
}

