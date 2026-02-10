// src-tauri/src/infrastructure/repositories/local_intelligence/parse.rs

use std::collections::HashMap;

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct IdentityIntel {
    pub mac: Option<String>,
    pub interface_name: Option<String>,
    pub interface_desc: Option<String>,
    pub netmask: Option<String>,
    pub gateway_ip: Option<String>,
    pub dns_servers: Vec<String>,
}

pub fn parse_identity_probe(text: &str) -> Result<IdentityIntel, String> {
    let kv = parse_kv_lines(text);

    let mac = kv.get("MAC").cloned().filter(|s| !s.trim().is_empty());
    let ifname = kv.get("IFNAME").cloned().filter(|s| !s.trim().is_empty());
    let ifdesc = kv.get("IFDESC").cloned().filter(|s| !s.trim().is_empty());

    let netmask = match kv.get("PREFIX").and_then(|s| s.trim().parse::<u8>().ok()) {
        Some(prefix) => Some(prefix_to_netmask(prefix)),
        None => kv.get("NETMASK").cloned(),
    };

    let gateway_ip = kv.get("GATEWAY").cloned().filter(|s| !s.trim().is_empty());

    let dns_servers = kv
        .get("DNS")
        .map(|s| {
            s.split(',')
                .map(|p| p.trim())
                .filter(|p| !p.is_empty())
                .map(|p| p.to_string())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    Ok(IdentityIntel {
        mac,
        interface_name: ifname,
        interface_desc: ifdesc,
        netmask,
        gateway_ip,
        dns_servers,
    })
}

fn parse_kv_lines(text: &str) -> HashMap<String, String> {
    let mut out = HashMap::new();
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let Some((k, v)) = line.split_once('=') else {
            continue;
        };
        let key = k.trim().to_uppercase();
        let val = v.trim().to_string();
        out.insert(key, val);
    }
    out
}

pub fn prefix_to_netmask(prefix: u8) -> String {
    let p = prefix.min(32);
    let mask: u32 = if p == 0 { 0 } else { (!0u32) << (32 - p) };
    let a = ((mask >> 24) & 0xff) as u8;
    let b = ((mask >> 16) & 0xff) as u8;
    let c = ((mask >> 8) & 0xff) as u8;
    let d = (mask & 0xff) as u8;
    format!("{a}.{b}.{c}.{d}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefix_to_netmask_basics() {
        assert_eq!(prefix_to_netmask(24), "255.255.255.0");
        assert_eq!(prefix_to_netmask(32), "255.255.255.255");
        assert_eq!(prefix_to_netmask(0), "0.0.0.0");
    }

    #[test]
    fn parse_identity_probe_reads_kv_and_dns_list() {
        let txt = "MAC=AA-BB-CC-DD-EE-FF\nIFNAME=Wi-Fi\nIFDESC=Intel\nPREFIX=24\nGATEWAY=192.168.1.1\nDNS=1.1.1.1, 8.8.8.8\n";
        let out = parse_identity_probe(txt).unwrap();
        assert_eq!(out.mac.as_deref(), Some("AA-BB-CC-DD-EE-FF"));
        assert_eq!(out.interface_name.as_deref(), Some("Wi-Fi"));
        assert_eq!(out.netmask.as_deref(), Some("255.255.255.0"));
        assert_eq!(out.gateway_ip.as_deref(), Some("192.168.1.1"));
        assert_eq!(out.dns_servers, vec!["1.1.1.1".to_string(), "8.8.8.8".to_string()]);
    }
}

