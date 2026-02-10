// src-tauri/src/infrastructure/wifi/windows_netsh/netsh_exec.rs

use std::process::Command;

pub async fn netsh_show_networks_mode_bssid() -> Result<String, String> {
    let output = tokio::task::spawn_blocking(|| {
        Command::new("netsh")
            .args(["wlan", "show", "networks", "mode=bssid"])
            .output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(text)
}

pub async fn netsh_show_interfaces() -> Result<String, String> {
    let output = tokio::task::spawn_blocking(|| {
        Command::new("netsh")
            .args(["wlan", "show", "interfaces"])
            .output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(text)
}

