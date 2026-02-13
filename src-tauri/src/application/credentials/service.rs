// src-tauri/src/application/credentials/service.rs
// Servicio de credenciales: gestiona credenciales del gateway (save/get/delete) a traves del puerto `CredentialStorePort`.

use crate::domain::entities::GatewayCredentials;
use crate::domain::ports::CredentialStorePort;
use std::sync::Arc;

pub struct CredentialService {
    store: Arc<dyn CredentialStorePort>,
}

impl CredentialService {
    pub fn new(store: Arc<dyn CredentialStorePort>) -> Self {
        Self { store }
    }

    pub async fn save_gateway_credentials(&self, creds: GatewayCredentials) -> Result<(), String> {
        self.store.save_gateway_credentials(creds).await
    }

    pub async fn get_gateway_credentials(&self, gateway_ip: &str) -> Result<Option<GatewayCredentials>, String> {
        self.store.get_gateway_credentials(gateway_ip).await
    }

    pub async fn delete_gateway_credentials(&self, gateway_ip: &str) -> Result<(), String> {
        self.store.delete_gateway_credentials(gateway_ip).await
    }
}
