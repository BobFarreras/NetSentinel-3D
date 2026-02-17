// src-tauri/src/application/http_fingerprint/service.rs
// Servicio HTTP fingerprint: ejecuta probes HEAD (80/443) y genera un veredicto simple.

use std::time::Duration;

use reqwest::{header::HeaderMap, redirect::Policy, Client, StatusCode};

#[derive(Debug, Clone)]
pub struct HttpProbeResult {
    pub url: String,
    pub status: Option<u16>,
    pub server: Option<String>,
    pub www_authenticate: Option<String>,
    pub location: Option<String>,
    pub set_cookie: Option<String>, // multiples cookies concatenadas
    pub strict_transport_security: Option<String>,
    pub x_frame_options: Option<String>,
    pub content_security_policy: Option<String>,
}

#[derive(Debug, Clone)]
pub struct HttpFingerprintResult {
    pub target_ip: String,
    pub http: Option<HttpProbeResult>,
    pub https: Option<HttpProbeResult>,
    pub verdict: String, // OK/WARN/ERROR
    pub why: Vec<String>,
    pub next: Vec<String>,
}

pub struct HttpFingerprintService {
    client_http: Client,
    client_https_insecure: Client,
}

impl HttpFingerprintService {
    pub fn new() -> Result<Self, String> {
        let client_http = Client::builder()
            .redirect(Policy::none())
            .timeout(Duration::from_secs(5))
            .user_agent("NetSentinel/HttpFingerprint")
            .build()
            .map_err(|e| format!("http client build error: {e}"))?;

        // Para IPs, HTTPS suele fallar por cert/hostname mismatch. En auditoria necesitamos ver headers igualmente.
        let client_https_insecure = Client::builder()
            .redirect(Policy::none())
            .timeout(Duration::from_secs(5))
            .user_agent("NetSentinel/HttpFingerprint")
            .danger_accept_invalid_certs(true)
            .danger_accept_invalid_hostnames(true)
            .build()
            .map_err(|e| format!("https client build error: {e}"))?;

        Ok(Self {
            client_http,
            client_https_insecure,
        })
    }

    pub async fn fingerprint(&self, target_ip: String) -> HttpFingerprintResult {
        let http_url = format!("http://{}/", target_ip);
        let https_url = format!("https://{}/", target_ip);

        let http = probe_head(&self.client_http, &http_url).await;
        let https = probe_head(&self.client_https_insecure, &https_url).await;

        // Veredicto (muy similar al escenario PowerShell original).
        let mut verdict = "OK".to_string();
        let mut why: Vec<String> = vec![];
        let mut next: Vec<String> = vec![];

        if http.is_none() && https.is_none() {
            verdict = "WARN".to_string();
            why.push("No hay respuesta HTTP/HTTPS en 80/443 (puede existir web UI en otro puerto).".to_string());
            next.push("- Ejecuta Deep Audit (puertos) para descubrir servicios web en puertos alternativos.".to_string());
        }

        if let Some(h) = &http {
            if let Some(auth) = &h.www_authenticate {
                if auth.to_lowercase().contains("basic") {
                    let redirects_to_https = h
                        .location
                        .as_deref()
                        .unwrap_or("")
                        .to_lowercase()
                        .starts_with("https://");
                    if !redirects_to_https {
                        verdict = "WARN".to_string();
                        why.push(
                            "Auth Basic detectada sobre HTTP sin redirect claro a HTTPS (riesgo de credenciales en claro)."
                                .to_string(),
                        );
                    }
                }
            }
            if let Some(loc) = &h.location {
                if loc.to_lowercase().starts_with("https://") {
                    why.push("HTTP redirige a HTTPS (bien).".to_string());
                }
            }
        }

        if let Some(h) = &https {
            if h.status.is_some() && h.strict_transport_security.is_none() {
                verdict = "WARN".to_string();
                why.push("Falta HSTS (Strict-Transport-Security) en HTTPS.".to_string());
            }
        }

        // Cookies: buscamos Secure/HttpOnly si hay cookies en http/https.
        let cookie_any = http
            .as_ref()
            .and_then(|p| p.set_cookie.clone())
            .or_else(|| https.as_ref().and_then(|p| p.set_cookie.clone()));
        if let Some(cookie) = cookie_any {
            let cookie_lc = cookie.to_lowercase();
            let secure = cookie_lc.contains(" secure");
            let http_only = cookie_lc.contains(" httponly");
            if !secure || !http_only {
                verdict = "WARN".to_string();
                why.push(format!(
                    "Cookies potencialmente debiles: Secure={} HttpOnly={}",
                    secure, http_only
                ));
            }
        }

        if why.is_empty() {
            why.push("Superficie web detectada sin senales obvias de misconfig basica.".to_string());
        }
        next.push("- Si hay panel web: limitar acceso a LAN/VPN, hardening TLS/headers y credenciales fuertes.".to_string());

        HttpFingerprintResult {
            target_ip,
            http,
            https,
            verdict,
            why,
            next,
        }
    }
}

async fn probe_head(client: &Client, url: &str) -> Option<HttpProbeResult> {
    let resp = client.head(url).send().await.ok()?;
    let status = resp.status();
    let headers = resp.headers().clone();

    Some(HttpProbeResult {
        url: url.to_string(),
        status: status_to_u16(status),
        server: header_str(&headers, "server"),
        www_authenticate: header_str(&headers, "www-authenticate"),
        location: header_str(&headers, "location"),
        set_cookie: header_all_str(&headers, "set-cookie"),
        strict_transport_security: header_str(&headers, "strict-transport-security"),
        x_frame_options: header_str(&headers, "x-frame-options"),
        content_security_policy: header_str(&headers, "content-security-policy"),
    })
}

fn status_to_u16(status: StatusCode) -> Option<u16> {
    Some(status.as_u16())
}

fn header_str(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

fn header_all_str(headers: &HeaderMap, name: &str) -> Option<String> {
    let mut out: Vec<String> = vec![];
    for v in headers.get_all(name).iter() {
        if let Ok(s) = v.to_str() {
            out.push(s.to_string());
        }
    }
    if out.is_empty() {
        None
    } else {
        Some(out.join("; "))
    }
}

