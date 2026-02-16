// src-tauri/src/application/attack_lab/validation.rs
// Validacion defensiva del request de Attack Lab (paths, limites de args/env, rango de timeout).

use super::types::AttackLabRequest;

const MAX_ARGS: usize = 128;
// PowerShell `-Command` para auditorias puede superar 4096 facilmente si incluye salida estructurada
// (VERDICT/WHY/NEXT) y parsing de headers. Mantener limite para evitar DoS por payloads absurdos.
const MAX_ARG_LEN: usize = 16 * 1024;

const MAX_ENV: usize = 64;
const MAX_ENV_KEY_LEN: usize = 128;
const MAX_ENV_VALUE_LEN: usize = 4096;

// Validacion defensiva para requests de auditoria externa.
// Nota DevSecOps:
// - No usamos shell (Command::new + args tokenizados) para evitar injection.
// - Aunque el usuario sea admin, validamos limites basicos para evitar cuelgues (args enormes, null bytes, etc.).
pub fn validate_request(req: &AttackLabRequest) -> Result<(), String> {
    let bin = req.binary_path.trim();
    if bin.is_empty() {
        return Err("binary_path no puede estar vacio".to_string());
    }
    if bin.contains('\0') {
        return Err("binary_path contiene un byte nulo".to_string());
    }

    // CWD si existe debe ser ruta valida (no imponemos absoluta para permitir AppData, etc.).
    if let Some(cwd) = &req.cwd {
        if cwd.contains('\0') {
            return Err("cwd contiene un byte nulo".to_string());
        }
    }

    if req.args.len() > MAX_ARGS {
        return Err(format!("demasiados argumentos (max {MAX_ARGS})"));
    }
    for (i, a) in req.args.iter().enumerate() {
        if a.contains('\0') {
            return Err(format!("argumento #{i} contiene un byte nulo"));
        }
        if a.len() > MAX_ARG_LEN {
            return Err(format!("argumento #{i} demasiado largo (max {MAX_ARG_LEN})"));
        }
    }

    if req.env.len() > MAX_ENV {
        return Err(format!("demasiadas variables de entorno (max {MAX_ENV})"));
    }
    for (k, v) in req.env.iter() {
        if k.is_empty() {
            return Err("env key vacia".to_string());
        }
        if k.contains('\0') || v.contains('\0') {
            return Err("env contiene byte nulo".to_string());
        }
        if k.len() > MAX_ENV_KEY_LEN || v.len() > MAX_ENV_VALUE_LEN {
            return Err("env demasiado largo".to_string());
        }
    }

    if let Some(ms) = req.timeout_ms {
        if ms < 100 {
            return Err("timeout_ms demasiado bajo (min 100ms)".to_string());
        }
        if ms > 60 * 60 * 1000 {
            return Err("timeout_ms demasiado alto (max 1h)".to_string());
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_request_rejects_empty_binary() {
        let r = AttackLabRequest {
            binary_path: "   ".to_string(),
            args: vec![],
            cwd: None,
            timeout_ms: None,
            env: vec![],
        };
        assert!(validate_request(&r).is_err());
    }

    #[test]
    fn validate_request_rejects_too_many_args() {
        let r = AttackLabRequest {
            binary_path: "tool".to_string(),
            args: (0..129).map(|_| "x".to_string()).collect(),
            cwd: None,
            timeout_ms: None,
            env: vec![],
        };
        assert!(validate_request(&r).is_err());
    }
}
