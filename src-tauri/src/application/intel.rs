use crate::domain::entities::Vulnerability;

pub fn enrich_port_data(port: u16) -> (String, String, String, Option<Vulnerability>) {
    match port {
        21 => ("FTP".to_string(), "HIGH".to_string(), "File Transfer Protocol".to_string(), Some(Vulnerability {
            id: "FTP-PLAIN".to_string(),
            description: "Traffic is not encrypted.".to_string(),
            severity: "HIGH".to_string(),
            recommendation: "Switch to SFTP (Port 22).".to_string()
        })),
        22 => ("SSH".to_string(), "SAFE".to_string(), "Secure Shell".to_string(), None),
        23 => ("TELNET".to_string(), "CRITICAL".to_string(), "Obsolete Protocol".to_string(), Some(Vulnerability {
            id: "TELNET-LEGACY".to_string(),
            description: "Insecure protocol. Easy to sniff.".to_string(),
            severity: "CRITICAL".to_string(),
            recommendation: "DISABLE IMMEDIATELY.".to_string()
        })),
        80 => ("HTTP".to_string(), "MEDIUM".to_string(), "Web Server".to_string(), Some(Vulnerability {
            id: "HTTP-NO-SSL".to_string(),
            description: "Unencrypted web traffic.".to_string(),
            severity: "MEDIUM".to_string(),
            recommendation: "Migrate to HTTPS.".to_string()
        })),
        443 => ("HTTPS".to_string(), "SAFE".to_string(), "Secure Web".to_string(), None),
        445 => ("SMB".to_string(), "HIGH".to_string(), "File Sharing".to_string(), Some(Vulnerability {
            id: "SMB-EXPOSED".to_string(),
            description: "Potential EternalBlue target.".to_string(),
            severity: "HIGH".to_string(),
            recommendation: "Block external access.".to_string()
        })),
        3389 => ("RDP".to_string(), "HIGH".to_string(), "Remote Desktop".to_string(), Some(Vulnerability {
            id: "RDP-PUBLIC".to_string(),
            description: "Exposed RDP.".to_string(),
            severity: "HIGH".to_string(),
            recommendation: "Use VPN.".to_string()
        })),
        _ => ("UNKNOWN".to_string(), "POTENTIAL".to_string(), "Unknown Service".to_string(), None),
    }
}