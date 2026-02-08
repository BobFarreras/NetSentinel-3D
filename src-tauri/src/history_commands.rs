use crate::models::{ScanSession, DeviceDTO};
use std::fs;
use std::path::PathBuf; // Necessari per gestionar rutes de fitxers
use std::time::{SystemTime, UNIX_EPOCH};
use directories::ProjectDirs; // La llibreria nova

// Helper privat: Ens retorna la ruta completa al fitxer de l'historial
// Ex: C:\Users\Boby\AppData\Roaming\com.netsentinel.app\history.json
fn get_history_path() -> PathBuf {
    if let Some(proj_dirs) = ProjectDirs::from("com", "netsentinel", "app") {
        let data_dir = proj_dirs.data_dir();
        
        // 1. Assegurem que la carpeta existeix (si no, la creem)
        if !data_dir.exists() {
            let _ = fs::create_dir_all(data_dir);
        }
        
        // 2. Retornem la ruta + el nom del fitxer
        return data_dir.join("history.json");
    }
    // Fallback d'emergència (només si falla l'anterior, molt rar)
    PathBuf::from("netsentinel_history.json")
}

// Helper per llegir
fn read_history_file() -> Vec<ScanSession> {
    let path = get_history_path();
    
    if path.exists() {
        // Llegim del path correcte
        let content = fs::read_to_string(path).unwrap_or("[]".to_string());
        serde_json::from_str(&content).unwrap_or(Vec::new())
    } else {
        Vec::new()
    }
}

// --- COMANDA 1: GUARDAR SESSIÓ ---
#[tauri::command]
pub async fn save_scan(devices: Vec<DeviceDTO>) -> Result<String, String> {
    // 1. Creem la sessió
    let start = SystemTime::now();
    let timestamp = start.duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    let id = format!("session_{}", timestamp);
    let label = format!("Scan (Items: {})", devices.len());

    let session = ScanSession {
        id,
        timestamp,
        devices,
        label,
    };

    // 2. Llegim l'historial existent
    let mut history = read_history_file();
    history.insert(0, session);

    // 3. Guardem a la ruta PRO (AppData)
    let path = get_history_path();
    let json = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;
    
    fs::write(&path, json).map_err(|e| e.to_string())?;

    println!("💾 RUST: Saved to {:?}", path); // Log per saber on ha anat a parar
    Ok("Saved successfully".to_string())
}

// --- COMANDA 2: LLEGIR HISTORIAL ---
#[tauri::command]
pub async fn get_history() -> Vec<ScanSession> {
    read_history_file()
}