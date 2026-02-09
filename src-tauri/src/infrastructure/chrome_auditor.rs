use crate::domain::{ports::RouterAuditorPort, entities::{RouterAuditResult, Device}};
use async_trait::async_trait;
use headless_chrome::{Browser, LaunchOptions, Tab};
use std::ffi::OsStr;
use std::time::Duration;
use std::thread;
use std::sync::Arc;

// --- 1. ARSENAL D'SCRIPTS (Separem el JS brut de la lògica Rust) ---
struct ScriptArsenal;

impl ScriptArsenal {
    fn injection_login(user: &str, pass: &str) -> String {
        format!(r#"
            (function() {{
                var u = document.getElementById('name') || document.querySelector("input[ng-model='username']") || document.querySelector("input[id='user']");
                if(u) {{ u.value = '{}'; u.dispatchEvent(new Event('input', {{bubbles:true}})); u.dispatchEvent(new Event('change', {{bubbles:true}})); }} 
                else {{ return "NO_USER"; }}

                var p = document.getElementById('password') || document.querySelector("input[type='password']");
                if(p) {{ p.value = '{}'; p.dispatchEvent(new Event('input', {{bubbles:true}})); p.dispatchEvent(new Event('change', {{bubbles:true}})); }} 
                else {{ return "NO_PASS"; }}
                
                return "OK";
            }})()
        "#, user, pass)
    }

    fn injection_click_submit() -> &'static str {
        r#"
        var btn = document.querySelector(".submit button") || document.querySelector("button[type='submit']");
        if(btn) btn.click();
        else { var e = new KeyboardEvent('keydown', {bubbles:true, keyCode:13}); document.querySelector("input[type='password']").dispatchEvent(e); }
        "#
    }

    fn injection_extract_text() -> &'static str {
        "document.body.innerText"
    }
}

// --- 2. DRIVER DEL NAVEGADOR (Gestiona Tabs i Launch) ---
struct BrowserDriver;

impl BrowserDriver {
    fn launch(headless: bool) -> Result<Browser, String> {
        let options = LaunchOptions {
            headless, 
            idle_browser_timeout: Duration::from_secs(60),
            args: vec![OsStr::new("--window-size=1920,1080"), OsStr::new("--disable-gpu")],
            ..Default::default()
        };
        Browser::new(options).map_err(|e| e.to_string())
    }

    fn navigate_and_wait(tab: &Tab, url: &str) -> Result<(), String> {
        tab.navigate_to(url).map_err(|e| e.to_string())?;
        tab.wait_until_navigated().map_err(|e| e.to_string())?;
        Ok(())
    }
}

// --- 3. AUDITOR PRINCIPAL (La lògica neta) ---
pub struct ChromeAuditor {
    log_callback: Arc<dyn Fn(String) + Send + Sync>,
}

impl ChromeAuditor {
    pub fn new(logger: Arc<dyn Fn(String) + Send + Sync>) -> Self {
        Self { log_callback: logger }
    }

    fn log(&self, msg: &str) {
        (self.log_callback)(msg.to_string());
    }

    // Helper intern per provar un parell d'usuaris
    fn try_credentials(&self, tab: &Arc<Tab>, url: &str, user: &str, pass: &str) -> bool {
        self.log(&format!("👉 PROVANT: {} / {}", user, pass));

        // Neteja prèvia
        let _ = tab.navigate_to("about:blank");
        thread::sleep(Duration::from_millis(100));

        // Navegació
        if BrowserDriver::navigate_and_wait(tab, url).is_err() { return false; }
        thread::sleep(Duration::from_millis(1500)); // Espera càrrega DOM real

        // Injecció de credencials
        let js_fill = ScriptArsenal::injection_login(user, pass);
        
        match tab.evaluate(&js_fill, false) {
            Ok(res) => {
                let val = res.value.as_ref().and_then(|v| v.as_str()).unwrap_or("ERR");
                if val == "NO_USER" {
                    // Check ràpid si ja estem dins sense login
                    let current = tab.get_url();
                    if !current.contains("login") && current.len() > url.len() + 5 {
                        return true; // Ja estem dins
                    }
                    return false;
                }
            },
            Err(_) => return false,
        }

        // Click Submit
        self.log("   ⚡ Injectant Clic...");
        thread::sleep(Duration::from_millis(500));
        let _ = tab.evaluate(ScriptArsenal::injection_click_submit(), false);

        // Verificació d'èxit (URL canvia?)
        for _ in 0..6 {
            thread::sleep(Duration::from_millis(500));
            let post_url = tab.get_url();
            if !post_url.contains("login") && post_url != url {
                return true;
            }
        }
        false
    }

    fn parse_router_text(&self, text: &str) -> Vec<Device> {
        // ... (La mateixa lògica de parsing que teniem abans, sense canvis)
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
                    if !candidate.is_empty() && !candidate.starts_with("Signal") && !candidate.contains("GHz") && !candidate.contains("connected devices") {
                        name_found = candidate.to_string();
                        break;
                    }
                    k += 1; if k > 8 { break; }
                }
                
                let mut signal = "-".to_string();
                let mut rate = "-".to_string();
                for j in 1..6 {
                    if i + j < lines.len() {
                        let next = lines[i+j].trim();
                        if next.starts_with("Signal strength:") { signal = next.replace("Signal strength:", "").trim().to_string(); }
                        if next.starts_with("Signal rate:") { rate = next.replace("Signal rate:", "").trim().to_string(); }
                    }
                }

                self.log(&format!("   ✨ DETECTAT: {} ({})", name_found, ip));
                devices.push(Device {
                    ip, mac: "ROUTER_AUTH".to_string(), vendor: name_found.clone(),
                    hostname: Some(name_found.clone()), name: Some(name_found), is_gateway: false,
                    ping: None, signal_strength: Some(signal), signal_rate: Some(rate), wifi_band: Some(current_band.clone()),open_ports: None,
                });
            }
            i += 1;
        }
        devices
    }
}

#[async_trait]
impl RouterAuditorPort for ChromeAuditor {
    async fn audit_gateway(&self, ip: &str) -> RouterAuditResult {
        self.log(&format!("⚔️ ROUTER AUDIT: Iniciant BRUTE-FORCE a {}...", ip));
        
        // Config: HEADLESS = TRUE per defecte (com legacy). Canvia a false si vols debug.
        let headless_mode = true; 

        match BrowserDriver::launch(headless_mode) {
            Ok(browser) => {
                if let Ok(tab) = browser.new_tab() {
                    let url = format!("http://{}/", ip);
                    let credentials = vec![("admin", "admin"), ("admin", "1234"), ("user", "user"), ("1234", "1234")];

                    for (user, pass) in credentials {
                        if self.try_credentials(&tab, &url, user, pass) {
                            self.log(&format!("🔓 BOOM! ACCÉS CONFIRMAT: {}/{}", user, pass));
                            self.log("🚀 CREDS VÀLIDES. TANCANT AUDITORIA PER INICIAR ESCÀNER...");
                            return RouterAuditResult {
                                target_ip: ip.to_string(),
                                vulnerable: true,
                                credentials_found: Some(format!("{}:{}", user, pass)),
                                message: format!("Success: {}:{}", user, pass),
                            };
                        }
                    }
                }
            },
            Err(e) => self.log(&format!("❌ ERROR CHROME: {}", e)),
        }

        self.log("❌ FINALITZAT: El router resisteix.");
        RouterAuditResult { target_ip: ip.to_string(), vulnerable: false, credentials_found: None, message: "Failed".to_string() }
    }

    async fn fetch_connected_devices(&self, ip: &str, creds: &str) -> Vec<Device> {
        self.log(&format!("📡 SYNC: Obrint Chrome Visible a {}...", ip));
        let parts: Vec<&str> = creds.split(':').collect();
        let (user, pass) = if parts.len() == 2 { (parts[0], parts[1]) } else { ("admin", "admin") };

        // Config: HEADLESS = FALSE (Visible) perquè l'usuari vegi l'extracció
        if let Ok(browser) = BrowserDriver::launch(false) {
            if let Ok(tab) = browser.new_tab() {
                let url = format!("http://{}/", ip);
                
                // Login específic per fetch (simplificat perquè ja tenim creds)
                let _ = BrowserDriver::navigate_and_wait(&tab, &url);
                thread::sleep(Duration::from_secs(1));

                self.log("   🔑 Autenticant-se...");
                let _ = tab.evaluate(&ScriptArsenal::injection_login(user, pass), false);
                thread::sleep(Duration::from_millis(500));
                let _ = tab.evaluate(ScriptArsenal::injection_click_submit(), false);
                
                self.log("   ⏳ Esperant càrrega de llista (6s)...");
                thread::sleep(Duration::from_secs(6)); 

                self.log("   📄 Extraient dades del DOM...");
                if let Ok(res) = tab.evaluate(ScriptArsenal::injection_extract_text(), false) {
                    let text = res.value.as_ref().and_then(|v| v.as_str()).unwrap_or("");
                    return self.parse_router_text(text);
                }
            }
        }
        Vec::new()
    }
}