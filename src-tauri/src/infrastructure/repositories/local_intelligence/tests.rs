// src-tauri/src/infrastructure/repositories/local_intelligence/tests.rs

use super::parse::{parse_identity_probe, prefix_to_netmask};

#[test]
fn parse_fixture_identity_probe_ok() {
    let txt = include_str!("fixtures/identity_probe_ok.txt");
    let out = parse_identity_probe(txt).unwrap();
    assert_eq!(out.mac.as_deref(), Some("DE-AD-BE-EF-00-01"));
    assert_eq!(out.interface_name.as_deref(), Some("Wi-Fi"));
    assert_eq!(out.netmask.as_deref(), Some("255.255.255.0"));
    assert_eq!(out.gateway_ip.as_deref(), Some("192.168.1.1"));
    assert_eq!(out.dns_servers.len(), 2);
}

#[test]
fn prefix_to_netmask_more_cases() {
    assert_eq!(prefix_to_netmask(16), "255.255.0.0");
    assert_eq!(prefix_to_netmask(8), "255.0.0.0");
}

