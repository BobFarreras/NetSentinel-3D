<!-- src-tauri/src/application/scan/README.md -->
<!-- Descripcion: modulo Scan (backend). Descubre dispositivos y audita puertos desde Rust. -->

# Backend: Scan

## Que hace (en 3 lineas)
- Descubre dispositivos en la LAN (inventario base).
- Audita puertos de un objetivo (riesgo + lista de puertos).
- Ofrece un perfil IoT (scan de puertos tacticos) para priorizar riesgo.

## Donde vive (rutas)
- Application: `src-tauri/src/application/scan/service.rs`
- Comandos Tauri:
  - `src-tauri/src/api/commands/scanner.rs`
  - (validacion) `src-tauri/src/api/commands/internal_validation.rs`
- DTOs:
  - Rust: `src-tauri/src/api/dtos.rs` (`DeviceDTO`, `SecurityReportDTO`)
  - TS: `src/shared/dtos/NetworkDTOs.ts`

## Comandos Tauri (IPC)
- `scan_network(range?: string) -> DeviceDTO[]`
  - `range` se valida y se normaliza a una base tipo `192.168.1` (best-effort).
- `audit_target(ip: string) -> SecurityReportDTO`
- `run_iot_scan(target_ip: string) -> SecurityReportDTO`

## Puertos de dominio (dependencias)
- `NetworkScannerPort` (`src-tauri/src/domain/ports.rs`)
  - `scan_network`, `scan_ports`, `probe_tcp_banner`, `get_host_identity`

## Infraestructura usada (I/O real)
- Escaner de red (implementacion del puerto):
  - `src-tauri/src/infrastructure/system_scanner/*`
- Perfil IoT usa un scan de puertos especificos (helper infra):
  - `src-tauri/src/infrastructure/system_scanner/ports.rs`
- Diccionario de servicios (enriquecimiento):
  - `src-tauri/src/domain/knowledge/service_dictionary.rs`

## Flujo (receta)
1. UI llama `scan_network`.
2. `scanner.rs` valida `range` y llama a `ScannerService.run_network_scan`.
3. El puerto `NetworkScannerPort` ejecuta el descubrimiento y devuelve `Device[]`.
4. Se convierte a `DeviceDTO[]` y se pinta en UI.

## Tests
- Actualmente: sin tests dedicados del modulo `scan` (recomendado: tests para normalizacion de `range` y heuristicas de filtrado).

