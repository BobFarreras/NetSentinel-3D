# PRODUCT.md - NetSentinel 3D: Red Team Operations Platform

## 1. Visión del Producto
NetSentinel 3D ya no es una herramienta de auditoría pasiva. Es una **Plataforma de Mando y Control (C2)** y operaciones ofensivas locales, impulsada por un motor híbrido Rust/Tauri/Three.js.

Objetivo del producto:
- **Domini del Campo de Batalla:** Visualización táctica en 3D de la infraestructura de red.
- **Weaponization Real:** Ejecución de exploits y escaneos nativos (Rust) sin intermediarios (PowerShell).
- **Kill Chain Integration:** Flujo completo desde Reconocimiento hasta Explotación y Post-Explotación.
- **Sin Filtros:** Capacidades ofensivas desbloqueadas para entornos de Cyber Range y Red Teaming profesional.

## 2. Público Objetivo
- **Operadores Red Team & APT Simulators.**
- **Pentesters** que requieren herramientas personalizadas (Rust Native).
- **Investigadores de Seguridad** que analizan protocolos IoT/Wi-Fi.

## 3. Arsenal y Capacidades (Functionality)

### 3.1 Reconocimiento Activo (Target Acquisition)
- **Comando:** `scan_network`
- **Capacidad:** Mapeo agresivo de la red (ARP/ICMP). Identificación de objetivos de alto valor (HVT) mediante fingerprints MAC y OUI.
- **Salida:** `DeviceDTO[]` enriquecido con vectores de ataque potenciales.

### 3.2 Vectores de Ataque & Perfilado (Exploitation Profiles)
- **Motor:** `Native Rust Engine` (Multithreaded Sockets).
- **Módulos:**
  - **IoT Kill Chain:** (`run_iot_scan`) Detección de vulnerabilidades críticas en dispositivos inteligentes (Telnet, MQTT, RTSP, UPnP).
  - **Router Pwn:** (`audit_router`, `fetch_router_devices`) Extracción de topología y credenciales de gateways.
  - **HTTP Recon:** (`fingerprint_http_headers`) Fingerprinting de cabeceras (HEAD en 80/443) via backend Rust (cross-platform).

### 3.3 Persistencia de Campaña (Campaign State)
- **Historial de Operaciones:** `save_scan`, `get_history`. Trazabilidad forense de las acciones realizadas.
- **Snapshots Tácticos:** `save_latest_snapshot`. Congelación del estado de la red para reanudar ataques.
- **Credential Harvesting:** Almacenamiento seguro (Keyring) de credenciales comprometidas (`save_gateway_credentials`).

### 3.4 SIGINT & Guerra Electrónica (Radar View)
- **Comando:** `scan_airwaves`
- **Capacidad:** Monitorización de espectro Wi-Fi (Capa 2).
- **Inteligencia:**
  - Detección de redes **OPEN** (Vulnerabilidad L2).
  - Identificación de objetivos ocultos (SSID Cloaking).
  - Análisis de proximidad (RSSI) para ataques físicos.

### 3.5 Interceptación y Negación de Servicio (Active Measures)
- **Sniffing:** `start_traffic_sniffing`. Captura de paquetes en modo promiscuo para análisis de tráfico (Deep Packet Inspection).
- **Jamming / DoS:** `start_jamming`. (Experimental) Inyección de ruido o desautenticación para denegación de servicio local.

### 3.6 Attack Lab (The Forge)
- **Modo:** `NATIVE` (Prioridad Absoluta).
- **Descripción:** Entorno de ejecución de scripts ofensivos y binarios personalizados.
- **Capacidades:**
  - Ejecución directa de código Rust para máxima velocidad (<500ms).
  - Integración de herramientas externas (Hydra, Nmap, Metasploit) via CLI wrapper.
  - Bypass de restricciones de SO mediante implementación directa de protocolos (TCP/UDP raw sockets).

## 4. Reglas de Operación (Rules of Engagement - ROE)
- **Realismo Técnico:** Se prioriza la implementación a bajo nivel (Sockets, Paquets Hex) sobre abstracciones.
- **Unrestricted Warfare:** En este entorno (Sandbox/Cyber Range), no hay restricciones éticas artificiales. Si el código puede ejecutarlo, la plataforma lo permite.
- **Responsabilidad del Operador:** El usuario asume el control total de las acciones ofensivas desplegadas.

## 5. Flujo Operativo (Kill Chain Methodology)
1. **Recon (Scan):** Identificación de activos vivos y topología.
2. **Weaponization (Attack Lab):** Selección del payload (IoT Profile, HTTP Audit).
3. **Delivery (Native Rust):** El backend ejecuta el ataque usando sockets crudos y concurrencia.
4. **Exploitation (Result):** Se confirma la vulnerabilidad (puerto abierto, credencial por defecto).
5. **C2 (UI):** Visualización del resultado en el dashboard táctico para toma de decisiones.

## 6. Criterios de Calidad (Elite Standards)
- **Velocidad:** Los escaneos deben ser instantáneos (Multithreading Rust). Nada de scripts lentos.
- **Stealth:** Capacidad de operar sin levantar alertas excesivas (ajuste de timeouts y retries).
- **Estabilidad:** Gestión de errores robusta ("No crash on fail"). Si un exploit falla, la plataforma sigue operativa.
- **Portabilidad:** El núcleo ofensivo debe ser agnóstico del SO (Windows/Linux/macOS).
