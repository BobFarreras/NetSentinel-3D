// src-tauri/src/infrastructure/network/service_dictionary.rs

pub struct ServiceInfo {
    pub name: &'static str,
    pub description: &'static str,
    pub risk: &'static str, // LOW, MEDIUM, HIGH, CRITICAL
}

pub struct ServiceDictionary;

impl ServiceDictionary {
    pub fn lookup(port: u16) -> ServiceInfo {
        match port {
            21 => ServiceInfo {
                name: "FTP",
                description: "File Transfer Protocol. Texto plano. Muy inseguro.",
                risk: "HIGH",
            },
            22 => ServiceInfo {
                name: "SSH",
                description: "Secure Shell. Acceso remoto cifrado.",
                risk: "LOW",
            },
            23 => ServiceInfo {
                name: "TELNET",
                description: "Acceso remoto antiguo y sin cifrar. Critico.",
                risk: "CRITICAL",
            },
            25 => ServiceInfo {
                name: "SMTP",
                description: "Envio de correo (Postfix/Exim).",
                risk: "MEDIUM",
            },
            53 => ServiceInfo {
                name: "DNS",
                description: "Resolucion de nombres de dominio.",
                risk: "LOW",
            },
            80 => ServiceInfo {
                name: "HTTP",
                description: "Web sin cifrar.",
                risk: "MEDIUM",
            },
            110 => ServiceInfo {
                name: "POP3",
                description: "Correo entrante antiguo (Texto plano).",
                risk: "MEDIUM",
            },
            143 => ServiceInfo { // <--- AÑADIDO NUEVO
                name: "IMAP",
                description: "Correo entrante moderno (Texto plano si no es IMAPS).",
                risk: "MEDIUM",
            },
            139 | 445 => ServiceInfo {
                name: "SMB",
                description: "Comparticion de archivos Windows. Objetivo de ransomware.",
                risk: "HIGH",
            },
            443 => ServiceInfo {
                name: "HTTPS",
                description: "Web segura cifrada.",
                risk: "SAFE",
            },
            1433 => ServiceInfo { // <--- AÑADIDO SQL
                name: "MSSQL",
                description: "Microsoft SQL Server.",
                risk: "HIGH",
            },
            3306 => ServiceInfo { // <--- AÑADIDO SQL
                name: "MYSQL",
                description: "Base de datos MySQL/MariaDB.",
                risk: "MEDIUM",
            },
            3389 => ServiceInfo {
                name: "RDP",
                description: "Escritorio remoto de Windows.",
                risk: "HIGH",
            },
            5432 => ServiceInfo { // <--- AÑADIDO SQL
                name: "POSTGRES",
                description: "Base de datos PostgreSQL.",
                risk: "MEDIUM",
            },
            8080 | 8000 | 8081 => ServiceInfo {
                name: "HTTP-ALT",
                description: "Servidor web alternativo (paneles admin/dev).",
                risk: "MEDIUM",
            },
            _ => ServiceInfo {
                name: "UNKNOWN",
                description: "Servicio no estandar o desconocido.",
                risk: "UNKNOWN",
            },
        }
    }
}