// src-tauri/src/application/gateway_credential_presets/service.rs
// Servicio de presets gateway: gestiona lista local de credenciales (user/pass) para sugerencia y batch-ops en UI.

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
        Self { repo, io_guard: Mutex::new(()) }
    }

    pub fn list(&self, gateway_ip: &str) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let mut all = self.repo.load().unwrap_or_default();
        // Normaliza: limpia entradas vacias para evitar ruido en UI.
        all.retain(|p| !p.gateway_ip.trim().is_empty() && !p.user.trim().is_empty() && !p.pass.trim().is_empty());

        // Listado global: solo "*" (usado internamente como defaults base).
        if gateway_ip == "*" {
            let mut globals: Vec<GatewayCredentialPreset> = all
                .into_iter()
                .filter(|p| p.gateway_ip == "*" && !(p.user == SEED_MARK_USER && p.pass == SEED_MARK_PASS))
                .collect();
            globals.sort_by(|a, b| a.user.cmp(&b.user).then(a.pass.cmp(&b.pass)));
            globals.dedup();
            return Ok(globals);
        }

        // Listado por gateway: SOLO presets de ese gateway.
        // Si el gateway no tiene presets aun, sembramos desde los defaults globales ("*") copiandolos a ese gateway.
        //
        // Importante: si el operador ha borrado TODOS los presets del gateway, no debemos re-sembrar
        // en cada `list()`. Para eso usamos un marcador invisible persistido por gateway.
        let marker_present = all.iter().any(|p| p.gateway_ip == gateway_ip && p.user == SEED_MARK_USER && p.pass == SEED_MARK_PASS);
        let mut specific: Vec<GatewayCredentialPreset> = all
            .iter()
            .cloned()
            .filter(|p| p.gateway_ip == gateway_ip && !(p.user == SEED_MARK_USER && p.pass == SEED_MARK_PASS))
            .collect();

        // Migracion silenciosa: si ya existen presets del gateway pero falta el marcador, lo añadimos.
        // Sin esto, si el operador borra TODOS los presets, el sistema podria re-sembrar desde globals.
        if !specific.is_empty() && !marker_present {
            all.push(GatewayCredentialPreset { gateway_ip: gateway_ip.to_string(), user: SEED_MARK_USER.to_string(), pass: SEED_MARK_PASS.to_string() });
            all.sort_by(|a, b| a.gateway_ip.cmp(&b.gateway_ip).then(a.user.cmp(&b.user)).then(a.pass.cmp(&b.pass)));
            all.dedup();
            self.repo.save(&all)?;
        }

        if specific.is_empty() && !marker_present {
            let globals: Vec<GatewayCredentialPreset> = all
                .iter()
                .cloned()
                .filter(|p| p.gateway_ip == "*" && !(p.user == SEED_MARK_USER && p.pass == SEED_MARK_PASS))
                .collect();

            if !globals.is_empty() {
                let clones: Vec<GatewayCredentialPreset> = globals
                    .into_iter()
                    .map(|p| GatewayCredentialPreset { gateway_ip: gateway_ip.to_string(), user: p.user, pass: p.pass })
                    .collect();

                // Persistimos el sembrado para que el operador pueda borrar/editar sin afectar al global.
                all.push(GatewayCredentialPreset { gateway_ip: gateway_ip.to_string(), user: SEED_MARK_USER.to_string(), pass: SEED_MARK_PASS.to_string() });
                all.extend(clones.clone());
                all.sort_by(|a, b| a.gateway_ip.cmp(&b.gateway_ip).then(a.user.cmp(&b.user)).then(a.pass.cmp(&b.pass)));
                all.dedup();
                self.repo.save(&all)?;
                specific = clones;
            }
        }

        specific.sort_by(|a, b| a.user.cmp(&b.user).then(a.pass.cmp(&b.pass)));
        specific.dedup();
        Ok(specific)
    }

    pub fn add(&self, gateway_ip: &str, user: String, pass: String) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let u = user.trim().to_string();
        let p = pass.trim().to_string();
        if u.is_empty() || p.is_empty() {
            return Err("user/pass vacios".to_string());
        }
        let mut list = self.repo.load().unwrap_or_default();

        // Asegura marcador por gateway (para no re-sembrar si el operador borra todo).
        if gateway_ip != "*" && !list.iter().any(|x| x.gateway_ip == gateway_ip && x.user == SEED_MARK_USER && x.pass == SEED_MARK_PASS) {
            list.push(GatewayCredentialPreset { gateway_ip: gateway_ip.to_string(), user: SEED_MARK_USER.to_string(), pass: SEED_MARK_PASS.to_string() });
        }
        list.push(GatewayCredentialPreset { gateway_ip: gateway_ip.to_string(), user: u, pass: p });
        // Normaliza
        list.retain(|x| !x.gateway_ip.trim().is_empty() && !x.user.trim().is_empty() && !x.pass.trim().is_empty());
        list.sort_by(|a, b| a.gateway_ip.cmp(&b.gateway_ip).then(a.user.cmp(&b.user)).then(a.pass.cmp(&b.pass)));
        list.dedup();
        self.repo.save(&list)?;
        // Retornamos la vista filtrada para ese gateway (incluye global).
        drop(_guard);
        self.list(gateway_ip)
    }

    pub fn remove(&self, gateway_ip: &str, user: String, pass: String) -> Result<Vec<GatewayCredentialPreset>, String> {
        let _guard = self.io_guard.lock().unwrap();
        let u = user.trim();
        let p = pass.trim();
        let mut list = self.repo.load().unwrap_or_default();
        list.retain(|x| !(x.gateway_ip == gateway_ip && x.user == u && x.pass == p));
        self.repo.save(&list)?;
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
        if let Some(idx) = list.iter().position(|x| x.gateway_ip == gateway_ip && x.user == ou && x.pass == op) {
            list[idx] = GatewayCredentialPreset { gateway_ip: gateway_ip.to_string(), user: nu, pass: np };
        }
        list.sort_by(|a, b| a.gateway_ip.cmp(&b.gateway_ip).then(a.user.cmp(&b.user)).then(a.pass.cmp(&b.pass)));
        list.dedup();
        self.repo.save(&list)?;
        drop(_guard);
        self.list(gateway_ip)
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
            Self { items: Mutex::new(items) }
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
    fn list_no_mezcla_global_con_especificos() {
        let repo = Arc::new(MockRepo::new(vec![
            GatewayCredentialPreset { gateway_ip: "*".into(), user: "admin".into(), pass: "1234".into() },
            GatewayCredentialPreset { gateway_ip: "*".into(), user: "admin".into(), pass: "1234".into() },
            GatewayCredentialPreset { gateway_ip: "192.168.1.1".into(), user: "a".into(), pass: "b".into() },
        ]));
        let svc = GatewayCredentialPresetService::new(repo);
        let list = svc.list("192.168.1.1").unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].gateway_ip, "192.168.1.1");
    }

    #[test]
    fn list_siembra_desde_global_si_no_hay_especificos() {
        let repo = Arc::new(MockRepo::new(vec![
            GatewayCredentialPreset { gateway_ip: "*".into(), user: "admin".into(), pass: "1234".into() },
            GatewayCredentialPreset { gateway_ip: "*".into(), user: "user".into(), pass: "user".into() },
        ]));
        let svc = GatewayCredentialPresetService::new(repo.clone());
        let list = svc.list("192.168.50.1").unwrap();
        assert_eq!(list.len(), 2);
        assert!(list.iter().all(|p| p.gateway_ip == "192.168.50.1"));
        // Debe persistir clones en repo.
        assert!(repo.load().unwrap().iter().any(|p| p.gateway_ip == "192.168.50.1" && p.user == "admin"));
    }

    #[test]
    fn list_no_re_siembra_si_operador_borra_todo() {
        let repo = Arc::new(MockRepo::new(vec![
            GatewayCredentialPreset { gateway_ip: "*".into(), user: "admin".into(), pass: "1234".into() },
            GatewayCredentialPreset { gateway_ip: "*".into(), user: "user".into(), pass: "user".into() },
        ]));
        let svc = GatewayCredentialPresetService::new(repo.clone());

        // Primera vez: siembra y devuelve 2.
        let first = svc.list("192.168.99.1").unwrap();
        assert_eq!(first.len(), 2);

        // Simula que el operador borra todos los presets del gateway (pero NO el marcador).
        let mut stored = repo.load().unwrap();
        stored.retain(|p| !(p.gateway_ip == "192.168.99.1" && p.user != SEED_MARK_USER));
        repo.save(&stored).unwrap();

        // Segunda vez: no debe re-sembrar, debe devolver lista vacia.
        let second = svc.list("192.168.99.1").unwrap();
        assert_eq!(second.len(), 0);
    }

    #[test]
    fn add_debe_guardar() {
        let repo = Arc::new(MockRepo::new(vec![]));
        let svc = GatewayCredentialPresetService::new(repo.clone());
        let list = svc.add("192.168.1.1", "u".into(), "p".into()).unwrap();
        assert_eq!(list, vec![GatewayCredentialPreset { gateway_ip: "192.168.1.1".into(), user: "u".into(), pass: "p".into() }]);
        // Internamente persiste tambien el marcador invisible por gateway.
        assert_eq!(repo.load().unwrap().len(), 2);
    }
}
