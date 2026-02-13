// src-tauri/src/infrastructure/persistence/credential_store.rs
// Descripcion: implementacion de `CredentialStorePort` basada en Keyring del SO (almacenamiento seguro local).

use async_trait::async_trait;
use keyring::Entry;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::domain::entities::GatewayCredentials;
use crate::domain::ports::CredentialStorePort;

pub struct KeyringCredentialStore {
    service: String,
}

impl KeyringCredentialStore {
    pub fn new(service: impl Into<String>) -> Self {
        Self {
            service: service.into(),
        }
    }

    fn entry(&self, gateway_ip: &str) -> Result<Entry, String> {
        let account = format!("gateway:{}", gateway_ip.trim());
        Entry::new(&self.service, &account).map_err(|e| e.to_string())
    }

    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }
}

#[async_trait]
impl CredentialStorePort for KeyringCredentialStore {
    async fn save_gateway_credentials(&self, creds: GatewayCredentials) -> Result<(), String> {
        // Guardamos como JSON para evolucionar el formato sin romper.
        let entry = self.entry(&creds.gateway_ip)?;
        let json = serde_json::to_string(&GatewayCredentials {
            saved_at: Self::now_ms(),
            ..creds
        })
        .map_err(|e| e.to_string())?;
        entry.set_password(&json).map_err(|e| e.to_string())?;
        Ok(())
    }

    async fn get_gateway_credentials(&self, gateway_ip: &str) -> Result<Option<GatewayCredentials>, String> {
        let entry = self.entry(gateway_ip)?;
        match entry.get_password() {
            Ok(json) => {
                let parsed: GatewayCredentials = serde_json::from_str(&json).map_err(|e| e.to_string())?;
                Ok(Some(parsed))
            }
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    async fn delete_gateway_credentials(&self, gateway_ip: &str) -> Result<(), String> {
        let entry = self.entry(gateway_ip)?;
        match entry.delete_password() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }
}
