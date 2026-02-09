use crate::domain::{ports::RouterAuditorPort, entities::{RouterAuditResult, Device}};
use std::sync::Arc;

pub struct AuditService {
    auditor_port: Arc<dyn RouterAuditorPort>,
}

impl AuditService {
    pub fn new(auditor_port: Arc<dyn RouterAuditorPort>) -> Self {
        Self { auditor_port }
    }

    pub async fn brute_force_gateway(&self, ip: String) -> RouterAuditResult {
        println!("🧠 APP: Iniciant protocol d'intrusió a {}", ip);
        self.auditor_port.audit_gateway(&ip).await
    }

    pub async fn extract_router_data(&self, ip: String, user: String, pass: String) -> Vec<Device> {
        let creds = format!("{}:{}", user, pass); // Formatem segons necessita el port
        self.auditor_port.fetch_connected_devices(&ip, &creds).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use std::sync::{Arc, Mutex};

    struct MockRouterAuditor {
        last_ip: Arc<Mutex<Option<String>>>,
        last_creds: Arc<Mutex<Option<String>>>,
    }

    #[async_trait]
    impl RouterAuditorPort for MockRouterAuditor {
        async fn audit_gateway(&self, ip: &str) -> RouterAuditResult {
            *self.last_ip.lock().unwrap() = Some(ip.to_string());
            RouterAuditResult {
                target_ip: ip.to_string(),
                vulnerable: true,
                credentials_found: Some("admin:1234".to_string()),
                message: "ok".to_string(),
            }
        }

        async fn fetch_connected_devices(&self, ip: &str, creds: &str) -> Vec<Device> {
            *self.last_ip.lock().unwrap() = Some(ip.to_string());
            *self.last_creds.lock().unwrap() = Some(creds.to_string());
            vec![Device {
                ip: "192.168.1.50".to_string(),
                mac: "AA:BB:CC".to_string(),
                vendor: "Mock".to_string(),
                hostname: None,
                name: None,
                is_gateway: false,
                ping: None,
                signal_strength: None,
                signal_rate: None,
                wifi_band: None,
                open_ports: None,
            }]
        }
    }

    #[tokio::test]
    async fn brute_force_gateway_debe_delegar_al_puerto() {
        let last_ip = Arc::new(Mutex::new(None));
        let last_creds = Arc::new(Mutex::new(None));
        let service = AuditService::new(Arc::new(MockRouterAuditor {
            last_ip: last_ip.clone(),
            last_creds,
        }));

        let result = service.brute_force_gateway("192.168.1.1".to_string()).await;

        assert!(result.vulnerable);
        assert_eq!(result.credentials_found.as_deref(), Some("admin:1234"));
        assert_eq!(last_ip.lock().unwrap().as_deref(), Some("192.168.1.1"));
    }

    #[tokio::test]
    async fn extract_router_data_debe_formatear_credenciales() {
        let last_ip = Arc::new(Mutex::new(None));
        let last_creds = Arc::new(Mutex::new(None));
        let service = AuditService::new(Arc::new(MockRouterAuditor {
            last_ip: last_ip.clone(),
            last_creds: last_creds.clone(),
        }));

        let devices = service
            .extract_router_data(
                "192.168.1.1".to_string(),
                "admin".to_string(),
                "1234".to_string(),
            )
            .await;

        assert_eq!(devices.len(), 1);
        assert_eq!(last_ip.lock().unwrap().as_deref(), Some("192.168.1.1"));
        assert_eq!(last_creds.lock().unwrap().as_deref(), Some("admin:1234"));
    }
}
