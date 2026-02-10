// src-tauri/src/infrastructure/router_audit/browser_driver.rs

use headless_chrome::{Browser, LaunchOptions, Tab};
use std::ffi::OsStr;
use std::time::Duration;

// Driver minimo del navegador para:
// - inicializar Chrome (headless o visible)
// - navegar y esperar carga basica
//
// Esto aísla dependencias de `headless_chrome` y reduce ruido en el auditor principal.
pub struct BrowserDriver;

impl BrowserDriver {
    pub fn launch(headless: bool) -> Result<Browser, String> {
        let options = LaunchOptions {
            headless,
            idle_browser_timeout: Duration::from_secs(60),
            args: vec![
                OsStr::new("--window-size=1920,1080"),
                OsStr::new("--disable-gpu"),
            ],
            ..Default::default()
        };
        Browser::new(options).map_err(|e| e.to_string())
    }

    pub fn navigate_and_wait(tab: &Tab, url: &str) -> Result<(), String> {
        tab.navigate_to(url).map_err(|e| e.to_string())?;
        tab.wait_until_navigated().map_err(|e| e.to_string())?;
        Ok(())
    }
}

