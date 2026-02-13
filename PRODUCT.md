<!-- PRODUCT.md -->
<!-- Descripcion: especificacion funcional del producto (skills, comandos, flujos y reglas de uso). -->

# PRODUCT.md - Especificacion Funcional de NetSentinel 3D

## 1. Vision del producto
NetSentinel 3D es una aplicacion de auditoria de red defensiva para laboratorio educativo, con backend Rust (Tauri) y frontend React/Three.js.

Objetivo de producto:
- visualizar infraestructura de red en 3D,
- detectar riesgos de forma comprensible para juniors,
- mantener operaciones locales, trazables y reproducibles.

## 2. Publico objetivo
- Estudiantes de ciberseguridad y redes.
- Profesores/labs que necesitan una herramienta visual para explicar ataque/defensa.
- Equipos tecnicos que quieren telemetria local sin cloud.

## 3. Funcionalidades actuales
### 3.1 Descubrimiento de red (ScanSkill)
- Comando: `scan_network`
- Resultado: inventario de nodos (`DeviceDTO[]`) con IP, MAC, vendor y metadatos.
- Soporte de auto-scan al arranque (configurable por `localStorage`).

### 3.2 Auditoria de objetivo y gateway (AuditSkill)
- Comandos: `audit_target`, `audit_router`, `fetch_router_devices`
- Incluye auditoria de puertos y sincronizacion de dispositivos desde gateway cuando hay credenciales.

### 3.3 Persistencia y arranque rapido
- Historial: `save_scan`, `get_history`
- Snapshot rapido: `save_latest_snapshot`, `load_latest_snapshot`
- Credenciales de gateway en keyring local:
  - `save_gateway_credentials`
  - `get_gateway_credentials`
  - `delete_gateway_credentials`

### 3.4 Radar WiFi (Radar View)
- Comando: `scan_airwaves`
- Vista de espectro con filtros por riesgo/banda/canal.
- Riesgo inferido didactico (`HARDENED`, `STANDARD`, `LEGACY`, `OPEN`).

### 3.5 Live Traffic y contramedidas controladas
- Trafico en vivo:
  - `start_traffic_sniffing`
  - `stop_traffic_sniffing`
- Contramedida controlada:
  - `start_jamming`
  - `stop_jamming`

### 3.6 Attack Lab (wrapper CLI + LAB didactico)
- Comandos:
  - `start_attack_lab`
  - `cancel_attack_lab`
- Objetivo:
  - modo `CUSTOM`: orquestar herramientas CLI externas instaladas por el administrador (sin usar shell) con logs en tiempo real,
  - modo `LAB`: escenarios didacticos (`external` o `simulated`) para explicar tecnicas y defensas de forma trazable.

## 4. Reglas de producto (seguridad y uso)
- Uso exclusivo en redes autorizadas y entorno de laboratorio.
- No se incorporan automatizaciones ofensivas reales contra terceros.
- Simulaciones avanzadas (PMKID/IoT/MLO) se mantienen en modo inferencia didactica.

## 5. Flujo funcional resumido
1. UI ejecuta comando Tauri via adapter.
2. Backend Rust valida entrada y ejecuta caso de uso.
3. Infrastructure resuelve red/FS/keyring/proceso externo.
4. Resultado tipado vuelve a UI y se renderiza en paneles 2D/3D.

## 6. Criterios de calidad del producto
- Contratos Rust/TS coherentes.
- Build y tests en verde en cada cambio relevante.
- Changelog actualizado para cambios funcionales o de arquitectura.
- Rendimiento frontend controlado con carga diferida y chunks separados para 3D.
