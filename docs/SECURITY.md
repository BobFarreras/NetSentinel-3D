# /docs/SECURITY.md

# Política de Seguridad y Hacking Ético (Tauri Edition)

## 1. Principios Generales
NetSentinel 3D utiliza la arquitectura de **Tauri** para ofrecer un entorno más seguro por defecto que Electron. El backend en **Rust** garantiza seguridad de memoria (Memory Safety), eliminando clases enteras de vulnerabilidades como Buffer Overflows.

---

## 2. Cumplimiento OWASP (Adaptado a Rust/Desktop)

### A03:2021 – Injection
**Mejora con Rust:** A diferencia de Node.js, Rust no utiliza `eval()` ni permite inyección de JavaScript en el backend fácilmente.
**Mitigación:**
* El uso de `std::net::TcpStream` evita tener que llamar a comandos de shell del sistema (como `nmap` o `ping` externos), cerrando la puerta a la inyección de comandos OS.

### A06:2021 – Vulnerable Components
**Mitigación:**
* Uso de `cargo audit` para analizar vulnerabilidades en crates de Rust (dependencias del backend).
* Uso de `npm audit` para las dependencias de UI.

---

## 3. Hardening de Tauri (Blindaje del Runtime)

Tauri implementa medidas de seguridad por defecto que en Electron requerían configuración manual:

1.  **No Node.js en Runtime:** La UI es una página web estándar. Si un atacante compromete la UI (XSS), **NO** tiene acceso al sistema de archivos ni a la red. Solo puede llamar a los comandos expuestos explícitamente en `lib.rs`.
2.  **Capability System (`tauri.conf.json`):**
    Los permisos están denegados por defecto. Hemos habilitado explícitamente solo lo necesario:
    * `core:default`: Ventanas básicas.
    * `opener:default`: Abrir enlaces externos.
    * Comandos personalizados: `scan_network`, `audit_target`, `save_scan`.

3.  **Persistencia Segura:**
    Los archivos de historial se guardan en carpetas protegidas del usuario (`AppData`), evitando la manipulación accidental o el acceso entre usuarios en entornos compartidos.

---

## 4. Política de Hacking Ético

El uso de NetSentinel 3D está limitado a:
* Redes propias del usuario.
* Redes de terceros con autorización explícita.
* Fines educativos.

**Nota Técnica:** Aunque la herramienta utiliza primitivas de red reales (`TcpStream`), los timeouts y la concurrencia están ajustados para no causar Denegación de Servicio (DoS) en routers domésticos estándar.