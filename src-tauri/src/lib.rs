// src-tauri/src/lib.rs

// 1. Declarem els mòduls (els fitxers .rs que tenim al costat)
mod models;
mod network_commands;
mod history_commands; // 👈 AQUESTA LÍNIA ÉS LA QUE ET FALTAVA O FALLAVA
mod intel;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // 2. Registrem les funcions perquè el Frontend les pugui cridar
            network_commands::scan_network,
            network_commands::audit_target,
            history_commands::save_scan,
            history_commands::get_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}