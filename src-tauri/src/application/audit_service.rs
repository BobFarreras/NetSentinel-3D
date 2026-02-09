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