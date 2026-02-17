// src-tauri/src/api/commands/http_fingerprint.rs
// Comando HTTP fingerprint: delega en `HttpFingerprintService` y retorna DTO tipado.

use tauri::State;

use crate::api::dtos::{HttpFingerprintResultDTO, HttpProbeResultDTO};
use crate::api::validators::validate_usable_host_ipv4;
use crate::application::http_fingerprint::{HttpFingerprintResult, HttpFingerprintService, HttpProbeResult};

#[tauri::command]
pub async fn fingerprint_http_headers(
    service: State<'_, HttpFingerprintService>,
    target_ip: String,
) -> Result<HttpFingerprintResultDTO, String> {
    validate_usable_host_ipv4(&target_ip, "target_ip")?;

    let res = service.fingerprint(target_ip).await;
    Ok(HttpFingerprintResultDTO::from(res))
}

impl From<HttpProbeResult> for HttpProbeResultDTO {
    fn from(v: HttpProbeResult) -> Self {
        Self {
            url: v.url,
            status: v.status,
            server: v.server,
            www_authenticate: v.www_authenticate,
            location: v.location,
            set_cookie: v.set_cookie,
            strict_transport_security: v.strict_transport_security,
            x_frame_options: v.x_frame_options,
            content_security_policy: v.content_security_policy,
        }
    }
}

impl From<HttpFingerprintResult> for HttpFingerprintResultDTO {
    fn from(v: HttpFingerprintResult) -> Self {
        Self {
            target_ip: v.target_ip,
            http: v.http.map(HttpProbeResultDTO::from),
            https: v.https.map(HttpProbeResultDTO::from),
            verdict: v.verdict,
            why: v.why,
            next: v.next,
        }
    }
}

