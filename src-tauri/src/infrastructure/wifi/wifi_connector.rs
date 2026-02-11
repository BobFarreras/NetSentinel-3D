// src-tauri/src/infrastructure/wifi/wifi_connector.rs

use std::process::Command;
use std::fs;
use std::thread;
use std::time::Duration;

pub struct WifiConnector;

impl WifiConnector {
    pub fn connect(ssid: &str, password: &str) -> bool {
        // 1. Limpieza preventiva
        let _ = Command::new("netsh")
            .args(&["wlan", "delete", "profile", &format!("name=\"{}\"", ssid)])
            .output();

        // 2. Crear XML del perfil
        let profile_xml = format!(
            r#"<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{0}</name>
    <SSIDConfig>
        <SSID>
            <name>{0}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>auto</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>{1}</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>"#,
            ssid, password
        );

        // Nombre de archivo seguro
        let safe_ssid = ssid.replace(|c: char| !c.is_alphanumeric(), "_");
        let profile_path = format!("temp_wifi_{}.xml", safe_ssid);
        
        // 3. Guardar y añadir perfil
        if fs::write(&profile_path, &profile_xml).is_err() { return false; }
        
        let _ = Command::new("netsh")
            .args(&["wlan", "add", "profile", &format!("filename=\"{}\"", profile_path)])
            .output();
        
        let _ = fs::remove_file(&profile_path); // Borrar fichero inmediatamente

        // 4. Conectar
        let connect_output = Command::new("netsh")
            .args(&["wlan", "connect", &format!("name=\"{}\"", ssid)])
            .output();

        if connect_output.is_err() { return false; }

        // 5. Verificar (Polling 8s)
        for _ in 0..4 {
            thread::sleep(Duration::from_secs(2));
            if Self::is_connected(ssid) { return true; }
        }

        false
    }

    fn is_connected(target_ssid: &str) -> bool {
        if let Ok(output) = Command::new("netsh").args(&["wlan", "show", "interfaces"]).output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            return stdout.contains(target_ssid) && stdout.contains(" connected");
        }
        false
    }
}