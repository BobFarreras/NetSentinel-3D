use std::net::Ipv4Addr;
use std::str::FromStr;

pub fn calculate_subnet_range(ip: &str, netmask: &str) -> Vec<String> {
    let ip_addr = Ipv4Addr::from_str(ip).unwrap_or(Ipv4Addr::new(127, 0, 0, 1));
    let mask_addr = Ipv4Addr::from_str(netmask).unwrap_or(Ipv4Addr::new(255, 255, 255, 0));

    let ip_u32 = u32::from(ip_addr);
    let mask_u32 = u32::from(mask_addr);

    // Lògica bitwise per trobar la xarxa base
    let network_u32 = ip_u32 & mask_u32;
    
    // Calcular el rang (sense la xarxa 0 i sense el broadcast 255)
    // Invertim la màscara per saber quants hosts hi ha
    let broadcast_u32 = network_u32 | (!mask_u32);

    let mut ips = Vec::new();
    
    // Iterem des de Network+1 fins a Broadcast-1
    for i in (network_u32 + 1)..broadcast_u32 {
        let new_ip = Ipv4Addr::from(i);
        ips.push(new_ip.to_string());
    }

    ips
}