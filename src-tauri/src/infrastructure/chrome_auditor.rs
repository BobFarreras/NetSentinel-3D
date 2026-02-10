use crate::domain::{ports::RouterAuditorPort, entities::{RouterAuditResult, Device}};
use async_trait::async_trait;
use headless_chrome::{Browser, LaunchOptions, Tab};
use std::ffi::OsStr;
use std::time::Duration;
use std::thread;
use std::sync::Arc;
use std::env;
use regex::Regex;
use crate::infrastructure::network::vendor_resolver::VendorResolver;
use crate::infrastructure::network::arp_client::ArpClient;

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

    fn should_run_chrome_headless() -> bool {
        // Por defecto: headless (sin ventana). Para debug local:
        // `NETSENTINEL_CHROME_VISIBLE=1` => headless = false
        match env::var("NETSENTINEL_CHROME_VISIBLE") {
            Ok(v) if v.trim() == "1" => false,
            _ => true,
        }
    }

    fn audit_gateway_blocking(&self, ip: &str) -> RouterAuditResult {
        self.log(&format!("⚔️ ROUTER AUDIT: Iniciant BRUTE-FORCE a {}...", ip));

        // Config: HEADLESS = TRUE per defecte (com legacy). Canvia a false si vols debug.
        let headless_mode = Self::should_run_chrome_headless();

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

    fn fetch_connected_devices_blocking(&self, ip: &str, user: &str, pass: &str, headless: bool) -> Vec<Device> {
        self.log(&format!("📡 SYNC: Abriendo Chrome ({}) a {}...", if headless { "headless" } else { "visible" }, ip));

        // Config: HEADLESS = TRUE por defecto para no mostrar UI.
        // Si necesitas debug en local, cambia a false o cablea una preferencia explícita.
        if let Ok(browser) = BrowserDriver::launch(headless) {
            if let Ok(tab) = browser.new_tab() {
                let url = format!("http://{}/", ip);

                // Login especifico para fetch (simplificado porque ya tenemos creds).
                let _ = BrowserDriver::navigate_and_wait(&tab, &url);
                thread::sleep(Duration::from_secs(1));

                self.log("   🔑 Autenticandose...");
                let _ = tab.evaluate(&ScriptArsenal::injection_login(user, pass), false);
                thread::sleep(Duration::from_millis(500));
                let _ = tab.evaluate(ScriptArsenal::injection_click_submit(), false);

                self.log("   ⏳ Esperando carga de lista (6s)...");
                thread::sleep(Duration::from_secs(6));

                self.log("   📄 Extrayendo datos del DOM...");
                if let Ok(res) = tab.evaluate(ScriptArsenal::injection_extract_text(), false) {
                    let text = res.value.as_ref().and_then(|v| v.as_str()).unwrap_or("");
                    let mut devices = self.parse_router_text(text);

                    // Enriquecimiento local: muchos routers no exponen la MAC en la vista web.
                    // Si tenemos IPs, intentamos resolver MAC via tabla ARP local y recalculamos vendor.
                    let arp_table = ArpClient::get_table();
                    for d in devices.iter_mut() {
                        if d.mac == "00:00:00:00:00:00" {
                            if let Some(mac) = arp_table.get(&d.ip) {
                                d.mac = mac.replace('-', ":").to_uppercase();
                            }
                        }
                        d.vendor = VendorResolver::resolve(&d.mac);
                        // Logging post-enriquecimiento: aqui el MAC/vendor ya es el "final" (si ARP lo resolvio).
                        let name = d
                            .name
                            .clone()
                            .or_else(|| d.hostname.clone())
                            .unwrap_or_else(|| "Unknown".to_string());
                        self.log(&format!("   ✨ DETECTADO: {} ({}) MAC={} VENDOR={}", name, d.ip, d.mac, d.vendor));
                    }

                    return devices;
                }
            }
        }
        Vec::new()
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
        // Parsing defensivo: el texto del DOM puede variar segun firmware/idioma del router.
        // Reglas:
        // - Nunca emitimos MAC placeholders como "ROUTER_AUTH". Si no hay MAC valida => 00:00:00:00:00:00.
        // - No usamos la IP como "vendor" o "name". Si no hay nombre legible => "Unknown".
        let mut devices = Vec::new();
        let lines: Vec<&str> = text.split('\n').collect();
        let mut current_band = "2.4 GHz".to_string();

        let re_ip = Regex::new(r"^(?:\\d{1,3}\\.){3}\\d{1,3}$").unwrap();
        let re_mac = Regex::new(r"(?i)([0-9a-f]{2}[:-]){5}[0-9a-f]{2}").unwrap();
        
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i].trim();
            if line.contains("5 GHz") { current_band = "5 GHz".to_string(); }
            if line.contains("2.4 GHz") { current_band = "2.4 GHz".to_string(); }

            if line.starts_with("IP:") {
                let ip = line.replace("IP:", "").trim().to_string();

                // --- Nombre/alias del dispositivo (si existe) ---
                let mut name_found = "Unknown".to_string();
                let mut k = 1;
                while i >= k {
                    let candidate = lines[i-k].trim();
                    if candidate.is_empty()
                        || candidate.starts_with("Signal")
                        || candidate.contains("GHz")
                        || candidate.contains("connected devices")
                        || re_ip.is_match(candidate)
                    {
                        k += 1;
                        if k > 10 { break; }
                        continue;
                    }
                    if !candidate.is_empty() {
                        name_found = candidate.to_string();
                        break;
                    }
                    k += 1; if k > 10 { break; }
                }

                // --- MAC (si aparece en el bloque del dispositivo) ---
                let mut mac_found: Option<String> = None;
                // ventana alrededor del "IP:"
                let start = i.saturating_sub(8);
                let end = (i + 12).min(lines.len().saturating_sub(1));
                for idx in start..=end {
                    let txt = lines[idx];
                    if let Some(m) = re_mac.find(txt) {
                        mac_found = Some(m.as_str().replace('-', ":").to_uppercase());
                        break;
                    }
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

                // Si el "nombre" acaba siendo la IP, lo descartamos.
                if name_found.trim() == ip {
                    name_found = "Unknown".to_string();
                }

                let mac = mac_found.unwrap_or_else(|| "00:00:00:00:00:00".to_string());
                let vendor = VendorResolver::resolve(&mac);
                devices.push(Device {
                    ip,
                    mac,
                    vendor,
                    hostname: if name_found != "Unknown" { Some(name_found.clone()) } else { None },
                    name: if name_found != "Unknown" { Some(name_found) } else { None },
                    is_gateway: false,
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
        // Importante: headless_chrome + sleeps es bloqueante. Lo movemos a un hilo dedicado.
        let ip_for_task = ip.to_string();
        let ip_for_err = ip_for_task.clone();
        let log_callback = self.log_callback.clone();
        tauri::async_runtime::spawn_blocking(move || {
            let auditor = ChromeAuditor { log_callback };
            auditor.audit_gateway_blocking(&ip_for_task)
        })
        .await
        .unwrap_or_else(|_| RouterAuditResult { target_ip: ip_for_err, vulnerable: false, credentials_found: None, message: "JoinError".to_string() })
    }

    async fn fetch_connected_devices(&self, ip: &str, creds: &str) -> Vec<Device> {
        let parts: Vec<&str> = creds.split(':').collect();
        let (user, pass) = if parts.len() == 2 { (parts[0], parts[1]) } else { ("admin", "admin") };

        // Importante: el scraping via Chrome es bloqueante. Lo ejecutamos en paralelo/headless.
        let ip = ip.to_string();
        let user = user.to_string();
        let pass = pass.to_string();
        let log_callback = self.log_callback.clone();

        let headless = ChromeAuditor::should_run_chrome_headless();

        tauri::async_runtime::spawn_blocking(move || {
            let auditor = ChromeAuditor { log_callback };
            auditor.fetch_connected_devices_blocking(&ip, &user, &pass, headless)
        })
        .await
        .unwrap_or_default()
    }
}
