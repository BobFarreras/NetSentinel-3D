<!-- src-tauri/src/application/traffic/README.md -->
<!-- Descripcion: modulo Traffic (backend). Controla el sniffer y expone eventos de trafico en tiempo real. -->

# Backend: Traffic (Live Traffic)

## Que hace (en 3 lineas)
- Arranca y detiene un sniffer de red (captura Ethernet/IPv4).
- Emite paquetes como eventos a la UI para pintar la tabla de `LIVE TRAFFIC`.
- Mantiene el runtime estable (preflight + flag de stop) para no dejar el sniffer a medias.

## Donde vive (rutas)
- Application: `src-tauri/src/application/traffic/service.rs`
- Estado Tauri: `src-tauri/src/api/state.rs` (`TrafficState`)
- Comandos Tauri: `src-tauri/src/api/commands/system.rs`
- Infra (sniffer pnet): `src-tauri/src/infrastructure/network/traffic_sniffer.rs`
- DTO/event payload:
  - Rust: `src-tauri/src/domain/entities.rs` (`TrafficPacket`)
  - TS: `src/shared/dtos/NetworkDTOs.ts` (mirror del tipo si aplica)

## Comandos y eventos
Comandos:
- `start_traffic_sniffing() -> ()`
- `stop_traffic_sniffing() -> ()`

Evento:
- `traffic-event` (streaming)
  - Payload: `TrafficPacket`
  - Emitido desde: `src-tauri/src/api/commands/system.rs`
  - Consumido en UI: `src/ui/features/traffic/*`

## Puertos de dominio (dependencias)
- `TrafficSnifferPort` (`src-tauri/src/domain/ports.rs`)
  - `preflight(...)`, `start_capture(...)`
- `NetworkScannerPort` (se usa para `get_host_identity()` antes de capturar)

## Flujo (receta)
1. UI llama `start_traffic_sniffing`.
2. `system.rs` obtiene `TrafficService` desde `TrafficState(Mutex<...>)`.
3. `TrafficService.start_monitoring`:
  - resuelve identidad local (IP real),
  - hace `preflight` del sniffer,
  - arranca captura en thread y marca `is_running=true`.
4. Por cada paquete, el comando emite `traffic-event` a la UI.
5. UI llama `stop_traffic_sniffing` y `TrafficService` baja el flag `is_running`.

## Tests
- `src-tauri/src/application/traffic/service.rs` incluye tests con `MockScanner` y `MockSniffer`.

