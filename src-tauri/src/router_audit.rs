use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use headless_chrome::{Browser, LaunchOptions};
use std::time::Duration;
use std::thread;
use tauri::{Emitter, Window}; 
use std::ffi::OsStr;

#[derive(Serialize, Deserialize)]
pub struct RouterAuditResult {
    pub vulnerable: bool,
    pub credentials_found: Option<String>,
    pub message: String,
}

const COMMON_CREDS: &[(&str, &str)] = &[

    ("admin", "1234"),
    ("admin", "admin"),
    ("1234", "1234"), 
    ("user", "user"),
    ("root", "admin"),
    ("admin", "password"),
];

fn log(window: &Window, msg: &str) {
    println!("{}", msg); 
    let _ = window.emit("audit-log", msg); 
}

#[tauri::command]
pub async fn audit_router(window: Window, gateway_ip: String) -> RouterAuditResult {
    log(&window, &format!("⚔️ ROUTER AUDIT: Iniciant INJECCIÓ QUIRÚRGICA a {}...", gateway_ip));

    let found_creds = Arc::new(Mutex::new(None));
    let is_vulnerable = Arc::new(Mutex::new(false));

    let found_clone = Arc::clone(&found_creds);
    let vul_clone = Arc::clone(&is_vulnerable);
    let ip_target = gateway_ip.clone();
    let window_clone = window.clone();

    thread::spawn(move || {
        let mut successful_pair: Option<(String, String)> = None;

        // FASE 1: ESCANEIG (HEADLESS)
        { 
            let args: Vec<&OsStr> = vec![
                OsStr::new("--window-size=1920,1080"),
                OsStr::new("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            ];
            
            let options = LaunchOptions {
                headless: true, // 👻 FANTASMA
                idle_browser_timeout: Duration::from_secs(60),
                args: args, 
                ..Default::default()
            };

            if let Ok(browser) = Browser::new(options) {
                if let Ok(tab) = browser.new_tab() {
                    let url = format!("http://{}/", ip_target);

                    for (user, pass) in COMMON_CREDS {
                        if *vul_clone.lock().unwrap() { break; }

                        log(&window_clone, "------------------------------------------------");
                        log(&window_clone, &format!("👉 PROVANT: {} / {}", user, pass));

                        // 1. HARD RESET (about:blank) per netejar l'Angular
                        let _ = tab.navigate_to("about:blank");
                        let _ = tab.wait_until_navigated();
                        thread::sleep(Duration::from_millis(100));

                        // 2. CARREGAR ROUTER
                        if tab.navigate_to(&url).is_err() {
                            let _ = tab.reload(true, None);
                        }
                        let _ = tab.wait_until_navigated();
                        thread::sleep(Duration::from_millis(2000)); 

                        // 3. INJECCIÓ DE CREDENCIALS (JS PUR)
                        let js_fill = format!(r#"
                            (function() {{
                                var u = document.getElementById('name') || document.querySelector("input[ng-model='username']") || document.querySelector("input[id='user']");
                                if(u) {{
                                    u.value = '{}';
                                    u.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                    u.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                }} else {{ return "NO_USER"; }}

                                var p = document.getElementById('password') || document.querySelector("input[type='password']");
                                if(p) {{
                                    p.value = '{}';
                                    p.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                    p.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                }} else {{ return "NO_PASS"; }}
                                
                                return "OK";
                            }})()
                        "#, user, pass);

                        let fill_result = tab.evaluate(&js_fill, false);
                        
                        // 🛑 CORRECCIÓ DE L'ERROR DE COMPILACIÓ AQUÍ:
                        if let Ok(res) = fill_result {
                            // Utilitzem .as_ref().and_then() per accedir al valor opcional de forma segura
                            let val = res.value.as_ref().and_then(|v| v.as_str()).unwrap_or("ERR");
                            
                            if val == "NO_USER" {
                                log(&window_clone, "   ⚠️ JS: No trobo camp Usuari. Possiblement ja dins?");
                                let check_url = tab.get_url();
                                if !check_url.contains("login") && check_url.len() > url.len() + 5 {
                                    log(&window_clone, "🔓 EUREKA! JA SOM A DINS!");
                                    successful_pair = Some(("UNKNOWN".to_string(), "UNKNOWN".to_string()));
                                    break;
                                }
                                continue;
                            }
                        }

                        // 4. DISPARAR (JS CLICK)
                        log(&window_clone, "   ⚡ Injectant Clic...");
                        thread::sleep(Duration::from_millis(500)); 
                        let _ = tab.evaluate(r#"
                            var btn = document.querySelector(".submit button") || document.querySelector("button[type='submit']");
                            if(btn) btn.click();
                            else {
                                var e = new KeyboardEvent('keydown', {bubbles:true, keyCode:13});
                                document.querySelector("input[type='password']").dispatchEvent(e);
                            }
                        "#, false);

                        // 5. VALIDACIÓ DE L'ÈXIT
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
        } 

        // FASE 2: VICTORY MODE (OBRIR NAVEGADOR VISIBLE)
        if let Some((user, pass)) = successful_pair {
            {
                let mut vul = vul_clone.lock().unwrap();
                let mut creds = found_clone.lock().unwrap();
                *vul = true;
                *creds = Some(format!("{}:{}", user, pass));
            }

            log(&window_clone, "🚀 ACCÉS ACONSEGUIT. OBRINT CONTROL TOTAL...");
            
            let options_visible = LaunchOptions {
                headless: false,
                idle_browser_timeout: Duration::from_secs(3600), 
                ..Default::default()
            };

            if let Ok(browser_viz) = Browser::new(options_visible) {
                if let Ok(tab_viz) = browser_viz.new_tab() {
                    let url = format!("http://{}/", ip_target);
                    let _ = tab_viz.navigate_to(&url);
                    let _ = tab_viz.wait_until_navigated();
                    thread::sleep(Duration::from_secs(2));

                    let js_login = format!(r#"
                        document.getElementById('name').value = '{}';
                        document.getElementById('name').dispatchEvent(new Event('input'));
                        document.getElementById('password').value = '{}';
                        document.getElementById('password').dispatchEvent(new Event('input'));
                        setTimeout(() => document.querySelector('.submit button').click(), 500);
                    "#, user, pass);
                    let _ = tab_viz.evaluate(&js_login, false);

                    log(&window_clone, "✅ SESSIÓ OBERTA.");
                    loop { thread::sleep(Duration::from_secs(1)); }
                }
            }
        } else {
            log(&window_clone, "❌ FINALITZAT: El router resisteix.");
        }

    }).join().unwrap(); 

    let vulnerable = *is_vulnerable.lock().unwrap();
    let credentials = found_creds.lock().unwrap().clone();

    if vulnerable {
        RouterAuditResult {
            vulnerable: true,
            credentials_found: credentials.clone(),
            message: format!("⚠️ CRITICAL: ACCÉS ACONSEGUIT: {}", credentials.unwrap_or_default()),
        }
    } else {
        RouterAuditResult {
            vulnerable: false,
            credentials_found: None,
            message: "✅ SEGUR: No s'han trobat credencials vàlides.".to_string(),
        }
    }
}