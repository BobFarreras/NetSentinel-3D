// src-tauri/src/application/external_audit/validation.rs

use super::types::ExternalAuditRequest;

// Validacion defensiva para requests de auditoria externa.
// Nota DevSecOps:
// - No usamos shell (Command::new + args tokenizados) para evitar injection.
// - Aunque el usuario sea admin, validamos limites basicos para evitar cuelgues (args enormes, null bytes, etc.).
pub fn validate_request(req: &ExternalAuditRequest) -> Result<(), String> {
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

    if req.args.len() > 128 {
        return Err("demasiados argumentos (max 128)".to_string());
    }
    for (i, a) in req.args.iter().enumerate() {
        if a.contains('\0') {
            return Err(format!("argumento #{i} contiene un byte nulo"));
        }
        if a.len() > 4096 {
            return Err(format!("argumento #{i} demasiado largo (max 4096)"));
        }
    }

    if req.env.len() > 64 {
        return Err("demasiadas variables de entorno (max 64)".to_string());
    }
    for (k, v) in req.env.iter() {
        if k.is_empty() {
            return Err("env key vacia".to_string());
        }
        if k.contains('\0') || v.contains('\0') {
            return Err("env contiene byte nulo".to_string());
        }
        if k.len() > 128 || v.len() > 4096 {
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
        let r = ExternalAuditRequest {
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
        let r = ExternalAuditRequest {
            binary_path: "tool".to_string(),
            args: (0..129).map(|_| "x".to_string()).collect(),
            cwd: None,
            timeout_ms: None,
            env: vec![],
        };
        assert!(validate_request(&r).is_err());
    }
}

