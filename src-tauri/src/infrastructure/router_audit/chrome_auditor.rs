// src-tauri/src/infrastructure/router_audit/chrome_auditor.rs
// Auditor de gateway via headless Chrome: intenta credenciales preset (configurables) y sincroniza dispositivos desde el DOM del router.

use crate::domain::{
    entities::{Device, RouterAuditResult},
    ports::RouterAuditorPort,
};
use async_trait::async_trait;
use headless_chrome::Tab;
use std::env;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use super::browser_driver::BrowserDriver;
use super::dom_parser::parse_router_text;
use super::enrichment::enrich_router_devices;
use super::scripts::ScriptArsenal;

type CredentialProvider = Arc<dyn Fn(&str) -> Vec<(String, String)> + Send + Sync>;

// Auditor de router basado en automatizacion de Chrome.
//
// Nota:
// - Este componente es infraestructura (IO + automatizacion).
// - Se ejecuta en `spawn_blocking` porque `headless_chrome` y `sleep` bloquean.
pub struct ChromeAuditor {
    log_callback: Arc<dyn Fn(String) + Send + Sync>,
    // Provider de credenciales candidato (user/pass) por gateway_ip.
    // Se inyecta desde `lib.rs` para:
    // - usar presets persistidos (no hardcodeados)
    // - permitir que el operador borre/edite el diccionario desde UI
    credential_provider: CredentialProvider,
}

impl ChromeAuditor {
    pub fn new(
        logger: Arc<dyn Fn(String) + Send + Sync>,
        credential_provider: CredentialProvider,
    ) -> Self {
        Self {
            log_callback: logger,
            credential_provider,
        }
    }

    fn log(&self, msg: &str) {
        (self.log_callback)(msg.to_string());
    }

    fn should_run_chrome_headless() -> bool {
        // Por defecto: headless (sin ventana). Para debug local:
        // `NETSENTINEL_CHROME_VISIBLE=1` => headless = false
        !matches!(env::var("NETSENTINEL_CHROME_VISIBLE"), Ok(v) if v.trim() == "1")
    }

    fn audit_gateway_blocking(&self, ip: &str) -> RouterAuditResult {
        self.log(&format!(
            "⚔️ ROUTER AUDIT: Iniciando brute-force a {}...",
            ip
        ));

        let headless = Self::should_run_chrome_headless();
        match BrowserDriver::launch(headless) {
            Ok(browser) => {
                if let Ok(tab) = browser.new_tab() {
                    let url = format!("http://{}/", ip);

                    let candidates = (self.credential_provider)(ip);
                    if candidates.is_empty() {
                        self.log(
                            "⚠️ Sin presets de credenciales para este gateway. Aborta brute-force.",
                        );
                        return RouterAuditResult {
                            target_ip: ip.to_string(),
                            vulnerable: false,
                            credentials_found: None,
                            message: "No credential presets configured".to_string(),
                        };
                    }

                    for (user, pass) in candidates.iter() {
                        if self.try_credentials(&tab, &url, user, pass) {
                            self.log(&format!("🔓 ACCESO CONFIRMADO: {}/{}", user, pass));
                            self.log(
                                "🚀 Credenciales validas. Cerrando auditoria para iniciar sync...",
                            );
                            return RouterAuditResult {
                                target_ip: ip.to_string(),
                                vulnerable: true,
                                credentials_found: Some(format!("{}:{}", user, pass)),
                                message: format!("Success: {}:{}", user, pass),
                            };
                        }
                    }
                }
            }
            Err(e) => self.log(&format!("❌ ERROR CHROME: {}", e)),
        }

        self.log("❌ FINALIZADO: el router resiste.");
        RouterAuditResult {
            target_ip: ip.to_string(),
            vulnerable: false,
            credentials_found: None,
            message: "Failed".to_string(),
        }
    }

    fn fetch_connected_devices_blocking(
        &self,
        ip: &str,
        user: &str,
        pass: &str,
        headless: bool,
    ) -> Vec<Device> {
        self.log(&format!(
            "📡 SYNC: Abriendo Chrome ({}) a {}...",
            if headless { "headless" } else { "visible" },
            ip
        ));

        if let Ok(browser) = BrowserDriver::launch(headless) {
            if let Ok(tab) = browser.new_tab() {
                let url = format!("http://{}/", ip);

                // Login especifico para fetch (ya tenemos creds).
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

                    // 1) Parseo puro (sin ARP/vendor).
                    let parsed = parse_router_text(text);
                    if parsed.is_empty() {
                        // Esto suele indicar:
                        // - login fallido (seguimos en pantalla de login)
                        // - firmware/idioma distinto (el DOM no contiene bloques con IP)
                        // - el router requiere navegar a otra ruta para ver la lista
                        //
                        // La UI puede hacer fallback (brute-force o reintento con otras credenciales).
                        self.log(&format!(
                            "   ⚠️ SYNC: 0 dispositivos parseados. URL={}",
                            tab.get_url()
                        ));
                    }

                    // 2) Enriquecimiento local (ARP + vendor).
                    let devices = enrich_router_devices(parsed);

                    // 3) Logging post-enriquecimiento: aqui el MAC/vendor ya es el "final".
                    for d in devices.iter() {
                        let name = d
                            .name
                            .clone()
                            .or_else(|| d.hostname.clone())
                            .unwrap_or_else(|| "Unknown".to_string());
                        self.log(&format!(
                            "   ✨ DETECTADO: {} ({}) MAC={} VENDOR={}",
                            name, d.ip, d.mac, d.vendor
                        ));
                    }

                    return devices;
                }
            }
        }

        Vec::new()
    }

    fn try_credentials(&self, tab: &Arc<Tab>, url: &str, user: &str, pass: &str) -> bool {
        self.log(&format!("👉 Probando: {} / {}", user, pass));

        // Limpieza previa.
        let _ = tab.navigate_to("about:blank");
        thread::sleep(Duration::from_millis(100));

        // Navegacion.
        if BrowserDriver::navigate_and_wait(tab, url).is_err() {
            return false;
        }
        thread::sleep(Duration::from_millis(1500));

        // Inyeccion de credenciales.
        let js_fill = ScriptArsenal::injection_login(user, pass);
        match tab.evaluate(&js_fill, false) {
            Ok(res) => {
                let val = res.value.as_ref().and_then(|v| v.as_str()).unwrap_or("ERR");
                if val == "NO_USER" {
                    // Check rapido: si no estamos en login, puede que ya haya sesion.
                    let current = tab.get_url();
                    if !current.contains("login") && current.len() > url.len() + 5 {
                        return true;
                    }
                    return false;
                }
            }
            Err(_) => return false,
        }

        // Click submit.
        self.log("   ⚡ Enviando submit...");
        thread::sleep(Duration::from_millis(500));
        let _ = tab.evaluate(ScriptArsenal::injection_click_submit(), false);

        // Verificacion de exito: URL cambia?
        for _ in 0..6 {
            thread::sleep(Duration::from_millis(500));
            let post_url = tab.get_url();
            if !post_url.contains("login") && post_url != url {
                return true;
            }
        }
        false
    }
}

#[async_trait]
impl RouterAuditorPort for ChromeAuditor {
    async fn audit_gateway(&self, ip: &str) -> RouterAuditResult {
        // Importante: headless_chrome + sleeps es bloqueante. Lo movemos a un hilo dedicado.
        let ip_for_task = ip.to_string();
        let ip_for_err = ip_for_task.clone();
        let log_callback = self.log_callback.clone();
        let credential_provider = self.credential_provider.clone();

        tauri::async_runtime::spawn_blocking(move || {
            let auditor = ChromeAuditor {
                log_callback,
                credential_provider,
            };
            auditor.audit_gateway_blocking(&ip_for_task)
        })
        .await
        .unwrap_or_else(|_| RouterAuditResult {
            target_ip: ip_for_err,
            vulnerable: false,
            credentials_found: None,
            message: "JoinError".to_string(),
        })
    }

    async fn fetch_connected_devices(&self, ip: &str, creds: &str) -> Vec<Device> {
        let parts: Vec<&str> = creds.split(':').collect();
        let (user, pass) = if parts.len() == 2 {
            (parts[0], parts[1])
        } else {
            // Fallback defensivo: si el formato no es user:pass, usamos admin/admin.
            ("admin", "admin")
        };

        // Importante: el scraping via Chrome es bloqueante. Lo ejecutamos en paralelo.
        let ip = ip.to_string();
        let user = user.to_string();
        let pass = pass.to_string();
        let log_callback = self.log_callback.clone();
        let credential_provider = self.credential_provider.clone();

        let headless = ChromeAuditor::should_run_chrome_headless();

        tauri::async_runtime::spawn_blocking(move || {
            let auditor = ChromeAuditor {
                log_callback,
                credential_provider,
            };
            auditor.fetch_connected_devices_blocking(&ip, &user, &pass, headless)
        })
        .await
        .unwrap_or_default()
    }
}
