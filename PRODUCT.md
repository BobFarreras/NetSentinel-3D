# PRODUCT.md - NetSentinel 3D (descripcion de producto)

## 1. Vision del producto
NetSentinel 3D es una aplicacion desktop (Rust + Tauri + React) para **visualizar** y **auditar** redes en un **entorno educativo** (Cyber Range/Lab) o redes con **autorizacion explicita**.

Objetivo:
- Aprender fundamentos de red (dispositivos, puertos, servicios, topologia) con una UI 3D + paneles HUD.
- Ejecutar auditorias controladas desde un backend fuerte (Rust) sin acoplar la UI a comandos del sistema.
- Mantener trazabilidad: historial, snapshots y logs de ejecucion.

## 2. Publico objetivo
- Alumnos/juniors que aprenden networking + auditoria.
- Profesores o formadores que necesitan una demo reproducible.
- Developers que quieren un ejemplo real de Tauri con arquitectura hexagonal.

## 3. Funcionalidades principales

### 3.1 Descubrimiento y visualizacion (Network Scan + 3D)
- `scan_network`: descubre dispositivos en la red local y los pinta en la escena.
- `audit_target`: auditoria de puertos del objetivo (resultado visible en Device Detail).

### 3.2 Auditoria de gateway (Router Audit)
- `audit_router` / `fetch_router_devices`: sincroniza el inventario desde el gateway cuando es posible.
- Soporta credenciales guardadas (keyring del SO) y presets (JSON en directorio de configuracion).

### 3.3 Persistencia de sesiones (History + Snapshot)
- `save_scan`, `get_history`: sesiones auditables para reproducir demos.
- `save_latest_snapshot`, `load_latest_snapshot`: arranque rapido con el ultimo estado.

### 3.4 Radar WiFi (reconocimiento)
- `scan_airwaves`: escanea redes WiFi visibles y expone señal/canal/cifrado (segun SO/driver).

### 3.5 Live Traffic (monitor)
- `start_traffic_sniffing` / `stop_traffic_sniffing`: captura y renderiza eventos de trafico en tiempo real.

### 3.6 Attack Lab (laboratorio de escenarios)
- Panel para ejecutar escenarios reproducibles:
  - `LAB`: ejecucion local/pasiva o presets controlados.
  - `CUSTOM`: wrapper de herramientas ya instaladas por el administrador (sin shell por defecto).

## 4. Criterios de calidad
- Estabilidad: si una auditoria falla, la UI no se rompe.
- Mantenibilidad: arquitectura hexagonal y contratos Rust/TS tipados.
- Portabilidad: el core prioriza Rust; cuando hay dependencias de Windows, se documentan y se aislan.
