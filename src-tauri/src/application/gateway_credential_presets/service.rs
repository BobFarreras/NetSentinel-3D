// src-tauri/src/application/gateway_credential_presets/service.rs
// Servicio de presets gateway: gestiona lista local de credenciales (user/pass) para sugerencia y batch-ops en UI.

use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use crate::domain::entities::GatewayCredentialPreset;
use crate::domain::ports::GatewayCredentialPresetRepositoryPort;

const SEED_MARK_USER: &str = "__seeded__";
const SEED_MARK_PASS: &str = "__seeded__";

pub struct GatewayCredentialPresetService {
    repo: Arc<dyn GatewayCredentialPresetRepositoryPort>,
    io_guard: Mutex<()>,
}

impl GatewayCredentialPresetService {
    pub fn new(repo: Arc<dyn GatewayCredentialPresetRepositoryPort>) -> Self {
        Self {
            repo,
            io_guard: Mutex::new(()),
        }
    }

    pub fn list(&self, gateway_ip: &str) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let raw = self.repo.load().unwrap_or_default();
        let (normalized, changed) = Self::normalize_and_prune(raw);

        // Auto-limpieza: eliminamos marcadores legacy y duplicados redundantes en disco.
        if changed {
            self.repo.save(&normalized)?;
        }

        let mut view: Vec<GatewayCredentialPreset> = if gateway_ip == "*" {
            normalized
                .iter()
                .filter(|p| p.gateway_ip == "*")
                .cloned()
                .collect()
        } else {
            // Para un gateway concreto, devolvemos:
            // - presets globales ("*") como base reutilizable
            // - presets especificos (gateway_ip) como overrides/añadidos
            normalized
                .iter()
                .filter(|p| p.gateway_ip == "*" || p.gateway_ip == gateway_ip)
                .cloned()
                .collect()
        };

        // Orden: primero los especificos, luego los globales; dentro, por user/pass.
        view.sort_by(|a, b| {
            let a_is_global = a.gateway_ip == "*";
            let b_is_global = b.gateway_ip == "*";
            a_is_global
                .cmp(&b_is_global)
                .then(a.user.cmp(&b.user))
                .then(a.pass.cmp(&b.pass))
        });
        view.dedup();
        Ok(view)
    }

    pub fn add(
        &self,
        gateway_ip: &str,
        user: String,
        pass: String,
    ) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let u = user.trim().to_string();
        let p = pass.trim().to_string();
        if u.is_empty() || p.is_empty() {
            return Err("user/pass vacios".to_string());
        }
        let mut list = self.repo.load().unwrap_or_default();
        list.push(GatewayCredentialPreset {
            gateway_ip: gateway_ip.to_string(),
            user: u,
            pass: p,
        });
        let (normalized, _changed) = Self::normalize_and_prune(list);
        self.repo.save(&normalized)?;
        // Retornamos la vista filtrada para ese gateway (incluye global).
        drop(_guard);
        self.list(gateway_ip)
    }

    pub fn remove(
        &self,
        gateway_ip: &str,
        user: String,
        pass: String,
    ) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let u = user.trim();
        let p = pass.trim();
        let list = self.repo.load().unwrap_or_default();
        let filtered: Vec<GatewayCredentialPreset> = list
            .into_iter()
            .filter(|x| !(x.gateway_ip == gateway_ip && x.user == u && x.pass == p))
            .collect();
        let (normalized, _changed) = Self::normalize_and_prune(filtered);
        self.repo.save(&normalized)?;
        drop(_guard);
        self.list(gateway_ip)
    }

    pub fn update(
        &self,
        gateway_ip: &str,
        old_user: String,
        old_pass: String,
        new_user: String,
        new_pass: String,
    ) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let ou = old_user.trim();
        let op = old_pass.trim();
        let nu = new_user.trim().to_string();
        let np = new_pass.trim().to_string();
        if nu.is_empty() || np.is_empty() {
            return Err("user/pass vacios".to_string());
        }
        let mut list = self.repo.load().unwrap_or_default();
        if let Some(idx) = list
            .iter()
            .position(|x| x.gateway_ip == gateway_ip && x.user == ou && x.pass == op)
        {
            list[idx] = GatewayCredentialPreset {
                gateway_ip: gateway_ip.to_string(),
                user: nu,
                pass: np,
            };
        }
        let (normalized, _changed) = Self::normalize_and_prune(list);
        self.repo.save(&normalized)?;
        drop(_guard);
        self.list(gateway_ip)
    }

    // Normaliza y compacta presets para evitar bloat en disco.
    //
    // Reglas:
    // - Trim de campos, eliminar vacios.
    // - Eliminar marcadores legacy `__seeded__` (ya no se usan).
    // - Eliminar duplicados exactos.
    // - Eliminar entradas especificas redundantes que duplican un preset global ("*") con el mismo user/pass.
    fn normalize_and_prune(
        presets: Vec<GatewayCredentialPreset>,
    ) -> (Vec<GatewayCredentialPreset>, bool) {
        let before_len = presets.len();

        let mut normalized: Vec<GatewayCredentialPreset> = presets
            .into_iter()
            .filter_map(|p| {
                let gateway_ip = p.gateway_ip.trim().to_string();
                let user = p.user.trim().to_string();
                let pass = p.pass.trim().to_string();
                if gateway_ip.is_empty() || user.is_empty() || pass.is_empty() {
                    return None;
                }
                // Marker legacy: se elimina del almacenamiento.
                if user == SEED_MARK_USER && pass == SEED_MARK_PASS {
                    return None;
                }
                Some(GatewayCredentialPreset {
                    gateway_ip,
                    user,
                    pass,
                })
            })
            .collect();

        // Dedupe exacto por (gateway_ip,user,pass)
        normalized.sort_by(|a, b| {
            a.gateway_ip
                .cmp(&b.gateway_ip)
                .then(a.user.cmp(&b.user))
                .then(a.pass.cmp(&b.pass))
        });
        normalized.dedup();

        // Prune: si un preset especifico es identico a un global ("*"), es redundante.
        let global_set: HashSet<(String, String)> = normalized
            .iter()
            .filter(|p| p.gateway_ip == "*")
            .map(|p| (p.user.clone(), p.pass.clone()))
            .collect();

        let pruned: Vec<GatewayCredentialPreset> = normalized
            .into_iter()
            .filter(|p| p.gateway_ip == "*" || !global_set.contains(&(p.user.clone(), p.pass.clone())))
            .collect();

        let changed = pruned.len() != before_len;
        (pruned, changed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockRepo {
        items: Mutex<Vec<GatewayCredentialPreset>>,
    }

    impl MockRepo {
        fn new(items: Vec<GatewayCredentialPreset>) -> Self {
            Self {
                items: Mutex::new(items),
            }
        }
    }

    impl GatewayCredentialPresetRepositoryPort for MockRepo {
        fn load(&self) -> Result<Vec<GatewayCredentialPreset>, String> {
            Ok(self.items.lock().unwrap().clone())
        }
        fn save(&self, presets: &[GatewayCredentialPreset]) -> Result<(), String> {
            *self.items.lock().unwrap() = presets.to_vec();
            Ok(())
        }
    }

    #[test]
    fn list_incluye_global_y_especificos_en_gateway() {
        let repo = Arc::new(MockRepo::new(vec![
            GatewayCredentialPreset {
                gateway_ip: "*".into(),
                user: "admin".into(),
                pass: "1234".into(),
            },
            GatewayCredentialPreset {
                gateway_ip: "*".into(),
                user: "admin".into(),
                pass: "1234".into(),
            },
            GatewayCredentialPreset {
                gateway_ip: "192.168.1.1".into(),
                user: "a".into(),
                pass: "b".into(),
            },
        ]));
        let svc = GatewayCredentialPresetService::new(repo);
        let list = svc.list("192.168.1.1").unwrap();
        // Debe incluir 1 global (dedup) + 1 especifico.
        assert_eq!(list.len(), 2);
        assert!(list.iter().any(|p| p.gateway_ip == "*" && p.user == "admin"));
        assert!(list.iter().any(|p| p.gateway_ip == "192.168.1.1" && p.user == "a"));
    }

    #[test]
    fn list_global_solo_devuelve_globales() {
        let repo = Arc::new(MockRepo::new(vec![
            GatewayCredentialPreset {
                gateway_ip: "*".into(),
                user: "admin".into(),
                pass: "1234".into(),
            },
            GatewayCredentialPreset {
                gateway_ip: "*".into(),
                user: "user".into(),
                pass: "user".into(),
            },
            GatewayCredentialPreset {
                gateway_ip: "192.168.50.1".into(),
                user: "x".into(),
                pass: "y".into(),
            },
        ]));
        let svc = GatewayCredentialPresetService::new(repo);
        let list = svc.list("*").unwrap();
        assert_eq!(list.len(), 2);
        assert!(list.iter().all(|p| p.gateway_ip == "*"));
    }

    #[test]
    fn list_prunea_especificos_redundantes_igual_a_global() {
        let repo = Arc::new(MockRepo::new(vec![
            GatewayCredentialPreset {
                gateway_ip: "*".into(),
                user: "admin".into(),
                pass: "1234".into(),
            },
            GatewayCredentialPreset {
                // Copia redundante del global para el mismo gateway: debe eliminarse del storage.
                gateway_ip: "192.168.99.1".into(),
                user: "admin".into(),
                pass: "1234".into(),
            },
        ]));
        let svc = GatewayCredentialPresetService::new(repo.clone());

        let list = svc.list("192.168.99.1").unwrap();
        // Vista: solo un preset global (el especifico era redundante).
        assert_eq!(list.len(), 1);
        assert!(list.iter().all(|p| p.gateway_ip == "*"));

        // Y en disco, el redundante debe haber sido eliminado por auto-clean.
        let stored = repo.load().unwrap();
        assert_eq!(stored.len(), 1);
        assert!(stored.iter().all(|p| p.gateway_ip == "*"));
    }

    #[test]
    fn add_debe_guardar() {
        let repo = Arc::new(MockRepo::new(vec![]));
        let svc = GatewayCredentialPresetService::new(repo.clone());
        let list = svc.add("192.168.1.1", "u".into(), "p".into()).unwrap();
        assert_eq!(
            list,
            vec![GatewayCredentialPreset { gateway_ip: "192.168.1.1".into(), user: "u".into(), pass: "p".into() }]
        );
        assert_eq!(repo.load().unwrap().len(), 1);
    }
}
