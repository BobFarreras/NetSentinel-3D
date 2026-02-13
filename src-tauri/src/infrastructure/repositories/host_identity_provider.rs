// src-tauri/src/infrastructure/repositories/host_identity_provider.rs
// Descripcion: proveedor de identidad local basado en `local_intelligence` (PowerShell + parsing + cache corto).

use crate::domain::entities::HostIdentity;
use crate::domain::ports::HostIdentityPort;
use crate::infrastructure::repositories::local_intelligence;

pub struct LocalIntelligenceHostIdentityProvider;

impl HostIdentityPort for LocalIntelligenceHostIdentityProvider {
    fn get_host_identity(&self) -> Result<HostIdentity, String> {
        local_intelligence::get_host_identity()
    }
}

