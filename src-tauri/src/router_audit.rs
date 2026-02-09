use crate::models::{DeviceDTO, RouterAuditResult}; 
use headless_chrome::{Browser, LaunchOptions};
use std::ffi::OsStr;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Window};

const COMMON_CREDS: &[(&str, &str)] = &[
    ("1234", "1234"), 
    ("admin", "1234"),
    ("admin", "admin"),
    ("user", "user"),
    ("root", "admin"),
    ("admin", "password"),
];

fn log(window: &Window, msg: &str) {
    println!("{}", msg);
    let _ = window.emit("audit-log", msg);
}

// COMANDA 1: HACKEIG (BRUTE FORCE)
#[tauri::command]
pub async fn audit_router(window: Window, gateway_ip: String) -> RouterAuditResult {
    log(&window, &format!("⚔️ ROUTER AUDIT: Iniciant BRUTE-FORCE a {}...", gateway_ip));

    let found_creds = Arc::new(Mutex::new(None));
    let is_vulnerable = Arc::new(Mutex::new(false));

    let found_clone = Arc::clone(&found_creds);
    let vul_clone = Arc::clone(&is_vulnerable);
    let ip_target = gateway_ip.clone();
    let window_clone = window.clone();

    thread::spawn(move || {
        let mut successful_pair: Option<(String, String)> = None;

        let options = LaunchOptions {
            headless: true, // Aquest el deixem ocult per velocitat
            idle_browser_timeout: Duration::from_secs(60),
            args: vec![OsStr::new("--window-size=1920,1080")],
            ..Default::default()
        };

        if let Ok(browser) = Browser::new(options) {
            if let Ok(tab) = browser.new_tab() {
                let url = format!("http://{}/", ip_target);

                for (user, pass) in COMMON_CREDS {
                    if *vul_clone.lock().unwrap() { break; }

                    log(&window_clone, "------------------------------------------------");
                    log(&window_clone, &format!("👉 PROVANT: {} / {}", user, pass));

                    let _ = tab.navigate_to("about:blank");
                    let _ = tab.wait_until_navigated();
                    thread::sleep(Duration::from_millis(100));

                    if tab.navigate_to(&url).is_err() { let _ = tab.reload(true, None); }
                    let _ = tab.wait_until_navigated();
                    thread::sleep(Duration::from_millis(2000));

                    let js_fill = format!(r#"
                        (function() {{
                            var u = document.getElementById('name') || document.querySelector("input[ng-model='username']") || document.querySelector("input[id='user']");
                            if(u) {{ u.value = '{}'; u.dispatchEvent(new Event('input', {{bubbles:true}})); u.dispatchEvent(new Event('change', {{bubbles:true}})); }} 
                            else {{ return "NO_USER"; }}

                            var p = document.getElementById('password') || document.querySelector("input[type='password']");
                            if(p) {{ p.value = '{}'; p.dispatchEvent(new Event('input', {{bubbles:true}})); p.dispatchEvent(new Event('change', {{bubbles:true}})); }} 
                            else {{ return "NO_PASS"; }}
                            
                            return "OK";
                        }})()
                    "#, user, pass);

                    let fill_result = tab.evaluate(&js_fill, false);
                    if let Ok(res) = fill_result {
                        let val = res.value.as_ref().and_then(|v| v.as_str()).unwrap_or("ERR");
                        if val == "NO_USER" {
                             let check_url = tab.get_url();
                             if !check_url.contains("login") && check_url.len() > url.len() + 5 {
                                 log(&window_clone, "🔓 EUREKA! JA SOM A DINS!");
                                 successful_pair = Some(("UNKNOWN".to_string(), "UNKNOWN".to_string()));
                                 break;
                             }
                             continue;
                        }
                    }

                    log(&window_clone, "   ⚡ Injectant Clic...");
                    thread::sleep(Duration::from_millis(500));
                    let _ = tab.evaluate(r#"
                        var btn = document.querySelector(".submit button") || document.querySelector("button[type='submit']");
                        if(btn) btn.click();
                        else { var e = new KeyboardEvent('keydown', {bubbles:true, keyCode:13}); document.querySelector("input[type='password']").dispatchEvent(e); }
                    "#, false);

                    for _ in 0..6 {
                        thread::sleep(Duration::from_millis(500));
                        let post_url = tab.get_url();
                        if !post_url.contains("login") && post_url != url {
                            log(&window_clone, &format!("🔓 BOOM! ACCÉS CONFIRMAT: {}/{}", user, pass));
                            successful_pair = Some((user.to_string(), pass.to_string()));
                            break;
                        }
                    }
                    if successful_pair.is_some() { break; }
                }
            }
        }

        if let Some((user, pass)) = successful_pair {
            {
                let mut vul = vul_clone.lock().unwrap();
                let mut creds = found_clone.lock().unwrap();
                *vul = true;
                *creds = Some(format!("{}:{}", user, pass));
            }
            log(&window_clone, "🚀 CREDS VÀLIDES. TANCANT AUDITORIA PER INICIAR ESCÀNER...");
        } else {
            log(&window_clone, "❌ FINALITZAT: El router resisteix.");
        }

    }).join().unwrap();

    let vulnerable = *is_vulnerable.lock().unwrap();
    let credentials = found_creds.lock().unwrap().clone();

    if vulnerable {
        RouterAuditResult { vulnerable: true, credentials_found: credentials.clone(), message: format!("ACCÉS: {}", credentials.unwrap_or_default()) }
    } else {
        RouterAuditResult { vulnerable: false, credentials_found: None, message: "SEGUR.".to_string() }
    }
}

// COMANDA 2: LLEGIR DISPOSITIUS (ARA VISIBLE I PARLAIRE)
#[tauri::command]
pub async fn fetch_router_devices(window: Window, gateway_ip: String, user: String, pass: String) -> Vec<DeviceDTO> {
    log(&window, &format!("📡 SYNC: Obrint Chrome Visible a {}...", gateway_ip));
    
    let options = LaunchOptions {
        headless: false, // 👁️ ARA ÉS VISIBLE (El veuràs obrir-se)
        args: vec![OsStr::new("--window-size=1200,800")], // Mida còmoda
        ..Default::default()
    };

    if let Ok(browser) = Browser::new(options) {
        if let Ok(tab) = browser.new_tab() {
            let url = format!("http://{}/", gateway_ip);

            // LOGIN
            let _ = tab.navigate_to(&url);
            let _ = tab.wait_until_navigated();
            thread::sleep(Duration::from_secs(1));

            log(&window, "   🔑 Autenticant-se...");
            let js_login = format!(r#"
                document.getElementById('name').value = '{}'; document.getElementById('name').dispatchEvent(new Event('input'));
                document.getElementById('password').value = '{}'; document.getElementById('password').dispatchEvent(new Event('input'));
                setTimeout(() => document.querySelector('.submit button').click(), 500);
            "#, user, pass);
            let _ = tab.evaluate(&js_login, false);
            
            log(&window, "   ⏳ Esperant càrrega de llista (6s)...");
            thread::sleep(Duration::from_secs(6)); // Temps per veure-ho amb els teus ulls

            log(&window, "   📄 Extraient dades del DOM...");
            if let Ok(text_obj) = tab.evaluate("document.body.innerText", false) {
                let full_text = text_obj.value.as_ref().and_then(|v| v.as_str()).unwrap_or("");
                
                // Cridem al parser passant-li la finestra per fer logs
                let devices = parse_router_text(&window, full_text);
                
                log(&window, "   ✅ Dades capturades. Tancant navegador.");
                return devices;
            } else {
                log(&window, "❌ ERROR: No s'ha pogut llegir el text.");
            }
        }
    }
    Vec::new()
}

// PARSING AMB LOGS A LA CONSOLA
fn parse_router_text(window: &Window, text: &str) -> Vec<DeviceDTO> {
    let mut devices = Vec::new();
    let lines: Vec<&str> = text.split('\n').collect();
    let mut current_band = "2.4 GHz".to_string();
    
    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim();
        
        if line.contains("5 GHz") { current_band = "5 GHz".to_string(); }
        if line.contains("2.4 GHz") { current_band = "2.4 GHz".to_string(); }

        if line.starts_with("IP:") {
            let ip = line.replace("IP:", "").trim().to_string();
            
            let mut name_found = "Unknown".to_string();
            let mut k = 1;
            while i >= k {
                let candidate = lines[i-k].trim();
                if !candidate.is_empty() && !candidate.starts_with("Signal") && !candidate.contains("GHz") && candidate != "Radio:" && !candidate.contains("connected devices") {
                    name_found = candidate.to_string();
                    break;
                }
                k += 1;
                if k > 8 { break; }
            }

            let mut signal = "-".to_string();
            let mut rate = "-".to_string();
            
            for j in 1..6 {
                if i + j < lines.len() {
                    let next_line = lines[i+j].trim();
                    if next_line.starts_with("Signal strength:") {
                        signal = next_line.replace("Signal strength:", "").trim().to_string();
                    }
                    if next_line.starts_with("Signal rate:") {
                        rate = next_line.replace("Signal rate:", "").trim().to_string();
                    }
                }
            }

            // Aquest log sortirà a la pantalla negra!
            log(window, &format!("   ✨ DETECTAT: {} ({})", name_found, ip));

            devices.push(DeviceDTO {
                ip,
                mac: "ROUTER_AUTH".to_string(),
                vendor: name_found.clone(),
                hostname: Some(name_found.clone()),
                name: Some(name_found),
                is_gateway: false,
                ping: None,
                signal_strength: Some(signal),
                signal_rate: Some(rate),
                wifi_band: Some(current_band.clone()),
            });
        }
        i += 1;
    }
    devices
}