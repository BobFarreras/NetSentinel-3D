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
                risk: "LOW", // Es seguro si la contrasena es buena.
            },
            23 => ServiceInfo {
                name: "TELNET",
                description: "Acceso remoto antiguo y sin cifrar. Critico.",
                risk: "CRITICAL",
            },
            25 => ServiceInfo {
                name: "SMTP",
                description: "Correo saliente. A menudo abierto en impresoras.",
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
                description: "Recepcion de correo antiguo. Texto plano.",
                risk: "MEDIUM",
            },
            139 | 445 => ServiceInfo {
                name: "SMB / NETBIOS",
                description: "Comparticion de archivos Windows. Objetivo de ransomware.",
                risk: "HIGH",
            },
            443 => ServiceInfo {
                name: "HTTPS",
                description: "Web segura cifrada.",
                risk: "SAFE",
            },
            3389 => ServiceInfo {
                name: "RDP",
                description: "Escritorio remoto de Windows.",
                risk: "HIGH", // Muy atacado por fuerza bruta.
            },
            8080 => ServiceInfo {
                name: "HTTP-ALT",
                description: "Servidor web alternativo (a menudo paneles de admin).",
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
