// src-tauri/src/infrastructure/wifi/windows_netsh/netsh_exec.rs

use std::process::Command;

async fn run_netsh(args: &[&str]) -> Result<String, String> {
    let args_vec: Vec<String> = args.iter().map(|s| s.to_string()).collect();

    // `netsh` en Windows suele devolver texto en la codepage activa. Si el sistema esta en ES,
    // aparecen caracteres como "Señal" que pueden romper el parseo si se decodifica como UTF-8.
    // Forzamos UTF-8 (chcp 65001) dentro del proceso `cmd` para que el output sea consistente.
    //
    // Nota: los args son constantes internas (no vienen del usuario), asi que el join es seguro aqui.
    let output = tokio::task::spawn_blocking(move || {
        #[cfg(windows)]
        {
            let joined = args_vec.join(" ");
            Command::new("cmd")
                .args(["/C", &format!("chcp 65001>nul & netsh {joined}")])
                .output()
        }

        #[cfg(not(windows))]
        {
            Command::new("netsh").args(&args_vec).output()
        }
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    let mut text = String::new();
    text.push_str(&String::from_utf8_lossy(&output.stdout));
    text.push_str(&String::from_utf8_lossy(&output.stderr));

    if !output.status.success() {
        return Err(format!(
            "netsh fallo (exit={:?}). Output: {}",
            output.status.code(),
            text.trim()
        ));
    }

    Ok(text)
}

pub async fn netsh_show_networks_mode_bssid() -> Result<String, String> {
    run_netsh(&["wlan", "show", "networks", "mode=bssid"]).await
}

pub async fn netsh_show_interfaces() -> Result<String, String> {
    run_netsh(&["wlan", "show", "interfaces"]).await
}
