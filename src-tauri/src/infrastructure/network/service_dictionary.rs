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
                description: "File Transfer Protocol. Text pla. Molt insegur.",
                risk: "HIGH",
            },
            22 => ServiceInfo {
                name: "SSH",
                description: "Secure Shell. Accés remot xifrat.",
                risk: "LOW", // És segur si la contrasenya és bona
            },
            23 => ServiceInfo {
                name: "TELNET",
                description: "Accés remot ANTIC i sense xifrar. Crític.",
                risk: "CRITICAL",
            },
            25 => ServiceInfo {
                name: "SMTP",
                description: "Correu sortint. Sovint obert en impressores.",
                risk: "MEDIUM",
            },
            53 => ServiceInfo {
                name: "DNS",
                description: "Resolució de noms de domini.",
                risk: "LOW",
            },
            80 => ServiceInfo {
                name: "HTTP",
                description: "Web sense xifrar.",
                risk: "MEDIUM",
            },
            110 => ServiceInfo {
                name: "POP3",
                description: "Recepció de correu antic. Text pla.",
                risk: "MEDIUM",
            },
            139 | 445 => ServiceInfo {
                name: "SMB / NETBIOS",
                description: "Compartició de fitxers Windows. Objectiu de Ransomware.",
                risk: "HIGH",
            },
            443 => ServiceInfo {
                name: "HTTPS",
                description: "Web segura xifrada.",
                risk: "SAFE",
            },
            3389 => ServiceInfo {
                name: "RDP",
                description: "Escriptori Remot de Windows.",
                risk: "HIGH", // Molt atacat per força bruta
            },
            8080 => ServiceInfo {
                name: "HTTP-ALT",
                description: "Servidor web alternatiu (sovint panells d'admin).",
                risk: "MEDIUM",
            },
            _ => ServiceInfo {
                name: "UNKNOWN",
                description: "Servei no estàndard o desconegut.",
                risk: "UNKNOWN",
            },
        }
    }
}