// src-tauri/src/infrastructure/router_audit/credentials.rs

// Credenciales por defecto (laboratorio) para auditoria de gateway.
// Importante:
// - Esto NO intenta cubrir diccionarios ni fuerza bruta real.
// - Es una lista pequeña y controlada para entornos educativos autorizados.
// - Si se necesita ampliar, hacerlo de forma configurable (AppData) y documentar en `docs/SECURITY.md`.

pub const DEFAULT_GATEWAY_CREDENTIALS: &[(&str, &str)] = &[
    ("admin", "admin"),
    ("admin", "1234"),
    ("user", "user"),
    ("1234", "1234"),
];

