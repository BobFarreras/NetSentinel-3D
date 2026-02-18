// src-tauri/src/infrastructure/dependencies/npcap.rs
// Descripcion: deteccion best-effort de Npcap/WinPcap (Packet.dll/wpcap.dll) para Windows.

use std::path::{Path, PathBuf};

pub fn require_npcap(feature_name: &str) -> Result<(), String> {
    if is_available() {
        return Ok(());
    }

    Err(format!(
        "{feature_name}: falta Npcap (Packet.dll / wpcap.dll).\n\
Instala Npcap para habilitar captura/inyeccion de red.\n\
Ruta esperada (tipica): C:\\\\Windows\\\\System32\\\\Npcap\\\\Packet.dll\n\
Nota: la aplicacion puede funcionar sin Npcap, pero esta feature no.",
    ))
}

pub fn is_available() -> bool {
    // En no-Windows no aplicamos este check (la dependencia real cambia por OS).
    // El objetivo de esta funcion es evitar que Windows crashee por DLL faltante.
    if !cfg!(target_os = "windows") {
        return true;
    }

    candidate_paths().iter().any(|p| p.exists())
        // Si existe Packet.dll pero no wpcap.dll (o viceversa) es mejor fallar igual.
        && candidate_paths_wpcap().iter().any(|p| p.exists())
}

fn candidate_paths() -> Vec<PathBuf> {
    // Npcap tipico:
    // - %WINDIR%\System32\Npcap\Packet.dll
    // - %WINDIR%\SysWOW64\Npcap\Packet.dll
    let mut out = vec![];
    if let Ok(windir) = std::env::var("WINDIR") {
        out.push(Path::new(&windir).join("System32").join("Npcap").join("Packet.dll"));
        out.push(Path::new(&windir).join("SysWOW64").join("Npcap").join("Packet.dll"));
        // WinPcap legacy (menos comun): Packet.dll directo en System32.
        out.push(Path::new(&windir).join("System32").join("Packet.dll"));
        out.push(Path::new(&windir).join("SysWOW64").join("Packet.dll"));
    }
    // Fallback (por si WINDIR no esta definido).
    out.push(PathBuf::from(r"C:\Windows\System32\Npcap\Packet.dll"));
    out.push(PathBuf::from(r"C:\Windows\SysWOW64\Npcap\Packet.dll"));
    out.push(PathBuf::from(r"C:\Windows\System32\Packet.dll"));
    out.push(PathBuf::from(r"C:\Windows\SysWOW64\Packet.dll"));
    out
}

fn candidate_paths_wpcap() -> Vec<PathBuf> {
    let mut out = vec![];
    if let Ok(windir) = std::env::var("WINDIR") {
        out.push(Path::new(&windir).join("System32").join("Npcap").join("wpcap.dll"));
        out.push(Path::new(&windir).join("SysWOW64").join("Npcap").join("wpcap.dll"));
        out.push(Path::new(&windir).join("System32").join("wpcap.dll"));
        out.push(Path::new(&windir).join("SysWOW64").join("wpcap.dll"));
    }
    out.push(PathBuf::from(r"C:\Windows\System32\Npcap\wpcap.dll"));
    out.push(PathBuf::from(r"C:\Windows\SysWOW64\Npcap\wpcap.dll"));
    out.push(PathBuf::from(r"C:\Windows\System32\wpcap.dll"));
    out.push(PathBuf::from(r"C:\Windows\SysWOW64\wpcap.dll"));
    out
}

