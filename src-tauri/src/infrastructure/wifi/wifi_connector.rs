// src-tauri/src/infrastructure/wifi/wifi_connector.rs

use std::process::Command;
use std::fs;
use std::thread;
use std::time::Duration;

use crate::infrastructure::wifi::windows_netsh::parse_netsh_interfaces;

pub struct WifiConnector;

impl WifiConnector {
    pub fn connect(ssid: &str, password: &str) -> bool {
        println!(
            "[wifi_connector] connect start ssid='{}' pass_len={}",
            ssid,
            password.len()
        );

        // 1. Desconectar para evitar falsos positivos por sesion previa activa.
        match Command::new("netsh").args(["wlan", "disconnect"]).output() {
            Ok(output) => {
                println!(
                    "[wifi_connector] disconnect exit={:?}",
                    output.status.code()
                );
            }
            Err(err) => {
                eprintln!("[wifi_connector] disconnect error={}", err);
            }
        }
        thread::sleep(Duration::from_millis(750));

        // 2. Limpieza preventiva
        let _ = Command::new("netsh")
            .args(["wlan", "delete", "profile", &format!("name={ssid}")])
            .output();

        // 3. Crear XML del perfil
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
        
        // 4. Guardar y añadir perfil
        if fs::write(&profile_path, &profile_xml).is_err() {
            eprintln!("[wifi_connector] profile write failed path={}", profile_path);
            return false;
        }
        
        let _ = Command::new("netsh")
            .args(["wlan", "add", "profile", &format!("filename={profile_path}")])
            .output();
        
        let _ = fs::remove_file(&profile_path); // Borrar fichero inmediatamente

        // 5. Conectar
        let connect_output = Command::new("netsh")
            .args(["wlan", "connect", &format!("name={ssid}")])
            .output();

        let connect_output = match connect_output {
            Ok(output) => output,
            Err(err) => {
                eprintln!("[wifi_connector] connect command error={}", err);
                return false;
            }
        };
        println!(
            "[wifi_connector] connect command exit={:?}",
            connect_output.status.code()
        );
        let connect_stdout = String::from_utf8_lossy(&connect_output.stdout);
        let connect_stderr = String::from_utf8_lossy(&connect_output.stderr);
        if !connect_stdout.trim().is_empty() {
            println!("[wifi_connector] connect stdout={}", connect_stdout.trim());
        }
        if !connect_stderr.trim().is_empty() {
            eprintln!("[wifi_connector] connect stderr={}", connect_stderr.trim());
        }

        // 6. Verificar estado real de enlace (estado + SSID + IP local)
        for attempt in 0..6 {
            thread::sleep(Duration::from_millis(1500));
            let connected = Self::is_connected(ssid);
            println!(
                "[wifi_connector] poll {}/6 ssid='{}' connected={}",
                attempt + 1,
                ssid,
                connected
            );
            if connected {
                println!("[wifi_connector] connect success ssid='{}'", ssid);
                return true;
            }
        }

        eprintln!("[wifi_connector] connect failed ssid='{}'", ssid);
        false
    }

    fn is_connected(target_ssid: &str) -> bool {
        if let Ok(output) = Command::new("netsh").args(["wlan", "show", "interfaces"]).output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Some(interface) = parse_netsh_interfaces(&stdout) {
                let same_ssid = interface.ssid.eq_ignore_ascii_case(target_ssid);
                println!(
                    "[wifi_connector] state snapshot ssid='{}' bssid='{}' connected={} target_match={}",
                    interface.ssid,
                    interface.ap_bssid,
                    interface.is_connected,
                    same_ssid
                );
                if !(interface.is_connected && same_ssid) {
                    return false;
                }

                // Estado real de enlace: conectado + SSID objetivo.
                // No exigimos IPv4 aqui porque DHCP puede tardar mas que la ventana de polling.
                return true;
            }
            eprintln!("[wifi_connector] state snapshot parse failed");
        } else {
            eprintln!("[wifi_connector] state snapshot command failed");
        }
        false
    }
}
